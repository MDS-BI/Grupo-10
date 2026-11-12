import {
  addItem,
  findById,
  loadCollection,
  updateItem
} from './storage.js';
import { activeContractFor, isContractActiveOn } from './rules.js';
import { todayISO } from './utils.js';
import { audit } from './audit.js';

export const AFP_RATE = 0.1;
export const SALUD_RATE = 0.07;
export const OVERTIME_FACTOR = 1.5;
export const MONTHLY_HOURS = 160;

function round(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function contractForPeriod(contracts, employeeId, start, end) {
  return (
    contracts
      .filter(
        (contract) =>
          String(contract.empleado_id) === String(employeeId) &&
          contract.fecha_inicio <= end &&
          (!contract.fecha_fin || contract.fecha_fin >= start)
      )
      .sort((a, b) => (a.fecha_inicio < b.fecha_inicio ? 1 : -1))[0] || null
  );
}

export function approvedOvertimeHours(employeeId, start, end, records = loadCollection('asistencia')) {
  return round(
    records
      .filter(
        (record) =>
          String(record.empleado_id) === String(employeeId) &&
          (record.estado_validacion === 'aprobado' || record.estado_aprobacion === 'Aprobada') &&
          record.fecha_laboral >= start &&
          record.fecha_laboral <= end
      )
      .reduce(
        (total, record) =>
          total + Number(record.horas_extras_aprobadas ?? record.horas_extras ?? 0),
        0
      )
  );
}

function conceptBy(benefits, name) {
  const normalized = String(name).toLowerCase();
  return benefits.find((concept) => String(concept.nombre_concepto).toLowerCase() === normalized) || null;
}

export function calculateLiquidation({
  contract,
  period,
  concepts = loadCollection('conceptosNomina'),
  overtimeHours = 0
}) {
  const baseSalary = Number(contract?.salario_base || 0);
  const hourlyRate = baseSalary / MONTHLY_HOURS;
  const overtimeAmount = round(overtimeHours * hourlyRate * OVERTIME_FACTOR);
  const details = [];

  const baseConcept = conceptBy(concepts, 'Sueldo base');
  if (baseConcept && baseSalary > 0) {
    details.push({ concepto_id: baseConcept.concepto_id, monto: round(baseSalary) });
  }

  const overtimeConcept = conceptBy(concepts, 'Horas extras');
  if (overtimeConcept && overtimeAmount > 0) {
    details.push({ concepto_id: overtimeConcept.concepto_id, monto: overtimeAmount });
  }

  const taxable = baseSalary + overtimeAmount;
  const afpConcept = conceptBy(concepts, 'AFP');
  const afpAmount = round(taxable * AFP_RATE);
  if (afpConcept) details.push({ concepto_id: afpConcept.concepto_id, monto: afpAmount });

  const healthConcept = conceptBy(concepts, 'Salud');
  const healthAmount = round(taxable * SALUD_RATE);
  if (healthConcept) details.push({ concepto_id: healthConcept.concepto_id, monto: healthAmount });

  const conceptTypes = new Map(concepts.map((concept) => [String(concept.concepto_id), concept.tipo_concepto]));
  const totalHaberes = round(
    details
      .filter((detail) => conceptTypes.get(String(detail.concepto_id)) === 'haber')
      .reduce((total, detail) => total + detail.monto, 0)
  );
  const totalDeducciones = round(
    details
      .filter((detail) => conceptTypes.get(String(detail.concepto_id)) === 'deduccion')
      .reduce((total, detail) => total + detail.monto, 0)
  );

  return {
    periodo_nomina_id: period?.periodo_nomina_id,
    total_haberes: totalHaberes,
    total_deducciones: totalDeducciones,
    sueldo_liquido: round(totalHaberes - totalDeducciones),
    detalles: details
  };
}

export function eligibleEmployees(period, options = {}) {
  const employees = options.employees || loadCollection('empleados');
  const contracts = options.contracts || loadCollection('contratos');
  return employees
    .filter((employee) => employee.estado_laboral !== 'Desvinculado')
    .map((employee) => ({
      employee,
      contract: contractForPeriod(
        contracts,
        employee.empleado_id,
        period.inicio_periodo,
        period.fin_periodo
      )
    }))
    .filter((entry) => entry.contract !== null);
}

export function runPayroll(periodoId, actor) {
  const period = findById('periodosNomina', periodoId);
  if (!period) return { ok: false, reason: 'El periodo de nomina no existe.', created: 0, skipped: 0, errors: [] };
  if (period.estado === 'Cerrado') {
    return { ok: false, reason: 'El periodo esta cerrado. Reabralo antes de calcular.', created: 0, skipped: 0, errors: [] };
  }

  const concepts = loadCollection('conceptosNomina');
  const contracts = loadCollection('contratos');
  const records = loadCollection('asistencia');
  const employees = loadCollection('empleados');
  const existing = loadCollection('liquidaciones').filter(
    (liquidation) => String(liquidation.periodo_nomina_id) === String(periodoId)
  );
  const existingEmployeeIds = new Set(existing.map((item) => String(item.empleado_id)));

  const eligible = eligibleEmployees(period, { employees, contracts });
  const errors = [];
  let created = 0;
  let skipped = 0;

  eligible.forEach(({ employee, contract }) => {
    if (existingEmployeeIds.has(String(employee.empleado_id))) {
      skipped += 1;
      return;
    }
    const overtimeHours = approvedOvertimeHours(
      employee.empleado_id,
      period.inicio_periodo,
      period.fin_periodo,
      records
    );
    const calculation = calculateLiquidation({ contract, period, concepts, overtimeHours });
    const liquidation = addItem('liquidaciones', {
      periodo_nomina_id: period.periodo_nomina_id,
      empleado_id: employee.empleado_id,
      total_haberes: calculation.total_haberes,
      total_deducciones: calculation.total_deducciones,
      sueldo_liquido: calculation.sueldo_liquido,
      fecha_calculo: new Date().toISOString()
    });
    calculation.detalles.forEach((detail) => {
      addItem('detallesLiquidacion', {
        liquidacion_id: liquidation.liquidacion_id,
        concepto_id: detail.concepto_id,
        monto: detail.monto
      });
    });
    created += 1;
  });

  eligible.forEach(({ employee, contract }) => {
    if (!isContractActiveOn(contract, period.fin_periodo)) {
      errors.push(`${employee.nombres} ${employee.apellidos}: contrato no vigente al cierre del periodo.`);
    }
  });

  if (created > 0) {
    audit(
      'Ejecucion de nomina',
      'periodosNomina',
      `Periodo ${period.inicio_periodo} a ${period.fin_periodo}: ${created} liquidacion(es).`,
      actor
    );
  }

  return {
    ok: true,
    created,
    skipped,
    errors,
    empty: eligible.length === 0,
    period
  };
}

export function liquidationDetails(liquidacionId, options = {}) {
  const details = options.details || loadCollection('detallesLiquidacion');
  const concepts = options.concepts || loadCollection('conceptosNomina');
  return details
    .filter((detail) => String(detail.liquidacion_id) === String(liquidacionId))
    .map((detail) => {
      const concept = concepts.find(
        (item) => String(item.concepto_id) === String(detail.concepto_id)
      );
      return {
        ...detail,
        nombre_concepto: concept?.nombre_concepto || 'Concepto',
        tipo_concepto: concept?.tipo_concepto || 'haber'
      };
    });
}

export function liquidationsForPeriod(periodoId) {
  return loadCollection('liquidaciones').filter(
    (liquidation) => String(liquidation.periodo_nomina_id) === String(periodoId)
  );
}

export function payrollSummary(periodoId) {
  const liquidations = liquidationsForPeriod(periodoId);
  return {
    count: liquidations.length,
    total_haberes: round(liquidations.reduce((total, item) => total + Number(item.total_haberes || 0), 0)),
    total_deducciones: round(
      liquidations.reduce((total, item) => total + Number(item.total_deducciones || 0), 0)
    ),
    total_liquido: round(liquidations.reduce((total, item) => total + Number(item.sueldo_liquido || 0), 0))
  };
}

export function closePeriod(periodoId, actor) {
  const period = findById('periodosNomina', periodoId);
  if (!period) return { ok: false, reason: 'El periodo no existe.' };
  if (period.estado === 'Cerrado') return { ok: false, reason: 'El periodo ya esta cerrado.' };
  updateItem('periodosNomina', periodoId, {
    estado: 'Cerrado',
    fecha_ejecucion: todayISO()
  });
  audit(
    'Cierre de periodo',
    'periodosNomina',
    `Periodo ${period.inicio_periodo} a ${period.fin_periodo} cerrado.`,
    actor
  );
  return { ok: true };
}

export function reopenPeriod(periodoId, actor) {
  const period = findById('periodosNomina', periodoId);
  if (!period) return { ok: false, reason: 'El periodo no existe.' };
  updateItem('periodosNomina', periodoId, {
    estado: 'Borrador',
    fecha_ejecucion: null
  });
  audit(
    'Reapertura de periodo',
    'periodosNomina',
    `Periodo ${period.inicio_periodo} a ${period.fin_periodo} reabierto.`,
    actor
  );
  return { ok: true };
}

export function payrollCostByDepartment(periodoId, options = {}) {
  const liquidations = liquidationsForPeriod(periodoId);
  const employees = options.employees || loadCollection('empleados');
  const departments = options.departments || loadCollection('departamentos');
  const map = new Map();
  liquidations.forEach((liquidation) => {
    const employee = employees.find(
      (item) => String(item.empleado_id) === String(liquidation.empleado_id)
    );
    const department = departments.find(
      (item) => String(item.departamento_id) === String(employee?.departamento_id)
    );
    const key = department?.nombre_departamento || 'Sin departamento';
    map.set(key, round((map.get(key) || 0) + Number(liquidation.sueldo_liquido || 0)));
  });
  return [...map.entries()].map(([departamento, monto]) => ({ departamento, monto }));
}

export function employeeLiquidations(empleadoId) {
  return loadCollection('liquidaciones')
    .filter((liquidation) => String(liquidation.empleado_id) === String(empleadoId))
    .sort((a, b) => (a.fecha_calculo < b.fecha_calculo ? 1 : -1));
}
