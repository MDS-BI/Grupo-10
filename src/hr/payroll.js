import {
  getApprovedOvertime,
  getBenefitCostByDepartment,
  getConcept,
  getEmployee,
  getEmployeeName,
  getLiquidationDetails,
  getLiquidationsForEmployee,
  getLiquidationsForPeriod,
  getPayrollCostByDepartment,
  getPayrollPeriod,
  loadConcepts,
  loadContracts,
  loadEmployees,
  loadLiquidations,
  loadPayrollPeriods,
  saveLiquidationWithDetails,
  setPayrollPeriodState
} from './storage.js';
import {
  daysBetweenInclusive,
  rangesOverlap,
  toISODate,
  toNumber,
  todayISO
} from './utils.js';

const MONTHLY_DAYS = 30;
const DAILY_HOURS = 9;
const OVERTIME_FACTOR = 1.5;

function round(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function findConceptByName(name) {
  return loadConcepts().find(
    (concept) => concept.nombre_concepto.toLowerCase() === String(name).toLowerCase()
  );
}

export function calculateOvertimeAmount(salary, overtimeHours) {
  if (toNumber(overtimeHours) <= 0) return 0;
  const hourlyRate = toNumber(salary) / MONTHLY_DAYS / DAILY_HOURS;
  return round(hourlyRate * toNumber(overtimeHours) * OVERTIME_FACTOR);
}

export function getPayrollEmployees(periodStart, periodEnd) {
  const start = toISODate(periodStart);
  const end = toISODate(periodEnd);
  return loadEmployees().filter((employee) => {
    const contracts = loadContracts().filter(
      (contract) =>
        Number(contract.empleado_id) === Number(employee.empleado_id) &&
        rangesOverlap(start, end, contract.fecha_inicio, contract.fecha_fin)
    );
    return contracts.length > 0;
  });
}

export function calculatePayrollForEmployee(employeeId, periodId) {
  const employee = getEmployee(employeeId);
  if (!employee) throw new Error('Empleado no encontrado.');
  const period = getPayrollPeriod(periodId);
  if (!period) throw new Error('Período de nómina no encontrado.');
  const totalPeriodDays = daysBetweenInclusive(period.fecha_inicio, period.fecha_fin);
  const contracts = loadContracts()
    .filter(
      (contract) =>
        Number(contract.empleado_id) === Number(employeeId) &&
        rangesOverlap(
          period.fecha_inicio,
          period.fecha_fin,
          contract.fecha_inicio,
          contract.fecha_fin
        )
    )
    .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
  const contract = contracts[0];
  if (!contract) return null;

  const overlapStart =
    contract.fecha_inicio > period.fecha_inicio
      ? contract.fecha_inicio
      : period.fecha_inicio;
  const overlapEnd =
    !contract.fecha_fin || contract.fecha_fin > period.fecha_fin
      ? period.fecha_fin
      : contract.fecha_fin;
  const overlapDays = daysBetweenInclusive(overlapStart, overlapEnd);
  const baseSalary = round(
    (toNumber(contract.salario_base) * overlapDays) / Math.max(totalPeriodDays, 1)
  );
  const overtimeHours = getApprovedOvertime(
    employeeId,
    period.fecha_inicio,
    period.fecha_fin
  );
  const overtimeAmount = calculateOvertimeAmount(baseSalary, overtimeHours);
  const details = [];
  const baseConcept = findConceptByName('Sueldo base') || loadConcepts().find(
    (concept) => concept.tipo_concepto === 'Haber' && !concept.porcentaje && !concept.monto_fijo
  );
  const overtimeConcept = findConceptByName('Horas extras') || loadConcepts().find(
    (concept) => concept.tipo_concepto === 'Haber' && concept !== baseConcept
  );

  if (baseConcept) {
    details.push({ concepto_id: baseConcept.concepto_id, monto: baseSalary });
  }
  if (overtimeConcept && overtimeAmount > 0) {
    details.push({ concepto_id: overtimeConcept.concepto_id, monto: overtimeAmount });
  }

  const totalHaberes = details.reduce((total, item) => total + item.monto, 0);
  let remaining = totalHaberes;
  const deductionConcepts = loadConcepts().filter(
    (concept) => concept.tipo_concepto === 'Deducción'
  );
  deductionConcepts.forEach((concept) => {
    if (remaining <= 0) return;
    let amount = 0;
    if (concept.porcentaje !== null && concept.porcentaje !== undefined) {
      amount = round((totalHaberes * toNumber(concept.porcentaje)) / 100);
    } else if (concept.monto_fijo !== null && concept.monto_fijo !== undefined) {
      amount = round(toNumber(concept.monto_fijo));
    }
    amount = Math.min(amount, remaining);
    if (amount > 0) {
      details.push({ concepto_id: concept.concepto_id, monto: amount });
      remaining -= amount;
    }
  });

  const totalDeducciones = details
    .filter((detail) => getConcept(detail.concepto_id)?.tipo_concepto === 'Deducción')
    .reduce((total, detail) => total + detail.monto, 0);
  const totalHaberesFinal = details
    .filter((detail) => getConcept(detail.concepto_id)?.tipo_concepto === 'Haber')
    .reduce((total, detail) => total + detail.monto, 0);

  return {
    liquidation: {
      periodo_id: Number(periodId),
      empleado_id: Number(employeeId),
      salario_base: baseSalary,
      total_haberes: round(totalHaberesFinal),
      total_deducciones: round(totalDeducciones),
      salario_neto: round(totalHaberesFinal - totalDeducciones),
      fecha_generacion: todayISO(),
      estado: period.estado === 'Borrador' ? 'Calculado' : period.estado
    },
    details,
    employee,
    period,
    overtimeHours,
    overtimeAmount
  };
}

export function calculatePayrollPeriod(periodId) {
  const period = getPayrollPeriod(periodId);
  if (!period) throw new Error('Período de nómina no encontrado.');
  if (period.estado === 'Cerrado') {
    throw new Error('El período está cerrado y no se puede recalcular.');
  }
  return getPayrollEmployees(period.fecha_inicio, period.fecha_fin)
    .map((employee) => calculatePayrollForEmployee(employee.empleado_id, periodId))
    .filter(Boolean);
}

export function runPayroll(periodId, usuario = 'sistema') {
  const period = getPayrollPeriod(periodId);
  if (!period) throw new Error('Período de nómina no encontrado.');
  if (period.estado === 'Cerrado') {
    throw new Error('El período está cerrado.');
  }
  const calculations = calculatePayrollPeriod(periodId);
  const saved = calculations.map((calculation) =>
    saveLiquidationWithDetails(calculation.liquidation, calculation.details, usuario)
  );
  if (period.estado === 'Borrador') {
    setPayrollPeriodState(periodId, 'Calculado', usuario);
  }
  return saved;
}

export function getPayslip(periodId, employeeId) {
  const liquidation = getLiquidationsForPeriod(periodId).find(
    (item) => Number(item.empleado_id) === Number(employeeId)
  );
  if (!liquidation) return null;
  return {
    ...liquidation,
    empleado: getEmployee(employeeId),
    periodo: getPayrollPeriod(periodId),
    detalles: getLiquidationDetails(liquidation.liquidacion_id).map((detail) => {
      const concept = getConcept(detail.concepto_id);
      return {
        ...detail,
        nombre_concepto: concept?.nombre_concepto || 'Concepto eliminado',
        tipo_concepto: concept?.tipo_concepto || '—'
      };
    })
  };
}

export function getPayrollCostSummary(periodId) {
  const period = getPayrollPeriod(periodId);
  if (!period) throw new Error('Período de nómina no encontrado.');
  const liquidations = getLiquidationsForPeriod(periodId);
  const byDepartment = getPayrollCostByDepartment(periodId);
  const benefitByDepartment = getBenefitCostByDepartment(
    period.fecha_inicio,
    period.fecha_fin
  );
  const benefitMap = new Map(
    benefitByDepartment.map((item) => [item.departamento_id, item.costo])
  );
  const departments = byDepartment.map((item) => ({
    ...item,
    costo_beneficios: benefitMap.get(item.departamento_id) || 0,
    costo_total: item.total_neto + (benefitMap.get(item.departamento_id) || 0)
  }));
  return {
    periodo: period,
    empleados: liquidations.length,
    total_haberes: liquidations.reduce(
      (total, item) => total + toNumber(item.total_haberes),
      0
    ),
    total_deducciones: liquidations.reduce(
      (total, item) => total + toNumber(item.total_deducciones),
      0
    ),
    total_neto: liquidations.reduce(
      (total, item) => total + toNumber(item.salario_neto),
      0
    ),
    costo_beneficios: departments.reduce(
      (total, item) => total + item.costo_beneficios,
      0
    ),
    costo_total: departments.reduce((total, item) => total + item.costo_total, 0),
    departamentos: departments
  };
}

export function getPayrollTrend() {
  return loadPayrollPeriods()
    .filter((period) => period.estado !== 'Borrador')
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
    .map((period) => {
      const liquidations = getLiquidationsForPeriod(period.periodo_id);
      return {
        periodo_id: period.periodo_id,
        etiqueta: period.fecha_inicio.slice(0, 7),
        total_neto: liquidations.reduce(
          (total, item) => total + toNumber(item.salario_neto),
          0
        ),
        empleados: liquidations.length
      };
    });
}

export function getEmployeePayslips(employeeId) {
  return getLiquidationsForEmployee(employeeId).map((liquidation) => ({
    ...liquidation,
    periodo: getPayrollPeriod(liquidation.periodo_id),
    empleado: getEmployeeName(employeeId)
  }));
}

export function validatePayrollTotals() {
  return loadLiquidations().map((liquidation) => {
    const details = getLiquidationDetails(liquidation.liquidacion_id);
    const haberes = details
      .filter((detail) => getConcept(detail.concepto_id)?.tipo_concepto === 'Haber')
      .reduce((total, detail) => total + toNumber(detail.monto), 0);
    const deducciones = details
      .filter((detail) => getConcept(detail.concepto_id)?.tipo_concepto === 'Deducción')
      .reduce((total, detail) => total + toNumber(detail.monto), 0);
    return {
      liquidacion_id: liquidation.liquidacion_id,
      valida:
        Math.abs(haberes - toNumber(liquidation.total_haberes)) < 0.01 &&
        Math.abs(deducciones - toNumber(liquidation.total_deducciones)) < 0.01 &&
        Math.abs(haberes - deducciones - toNumber(liquidation.salario_neto)) < 0.01
    };
  });
}
