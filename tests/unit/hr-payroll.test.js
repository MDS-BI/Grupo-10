import { beforeEach, describe, expect, test } from 'vitest';
import {
  AFP_RATE,
  SALUD_RATE,
  approvedOvertimeHours,
  calculateLiquidation,
  closePeriod,
  employeeLiquidations,
  liquidationDetails,
  liquidationsForPeriod,
  payrollSummary,
  reopenPeriod,
  runPayroll
} from '../../src/hr/payroll.js';
import {
  addItem,
  clearAll,
  loadCollection,
  resetSeed
} from '../../src/hr/storage.js';
import { loadAudit } from '../../src/hr/audit.js';

const actor = { nombre: 'Diego Soto', rol: 'nomina' };

describe('motor de nomina', () => {
  beforeEach(() => {
    clearAll();
    resetSeed();
  });

  test('calcula haberes, deducciones y liquido sin horas extras', () => {
    const result = calculateLiquidation({
      contract: { salario_base: 1000000 },
      period: { periodo_nomina_id: 2 },
      concepts: loadCollection('conceptosNomina'),
      overtimeHours: 0
    });
    expect(result.total_haberes).toBe(1000000);
    expect(result.total_deducciones).toBe(170000);
    expect(result.sueldo_liquido).toBe(830000);
    expect(result.detalles).toHaveLength(3);
    expect(result.detalles.every((detail) => detail.monto > 0)).toBe(true);
  });

  test('calcula horas extras al 1.5x y las incluye en la base imponible', () => {
    const result = calculateLiquidation({
      contract: { salario_base: 1000000 },
      period: { periodo_nomina_id: 2 },
      concepts: loadCollection('conceptosNomina'),
      overtimeHours: 8
    });
    const overtime = result.detalles.find((detail) => detail.concepto_id === 2);
    expect(overtime.monto).toBe(75000);
    expect(result.total_haberes).toBe(1075000);
    expect(result.total_deducciones).toBe(1000000 * (AFP_RATE + SALUD_RATE) + 75000 * (AFP_RATE + SALUD_RATE));
    expect(result.sueldo_liquido).toBe(1075000 - result.total_deducciones);
  });

  test('solo consume horas extras aprobadas', () => {
    expect(approvedOvertimeHours(10, '2026-10-01', '2026-10-31')).toBe(0);
    expect(approvedOvertimeHours(1, '2026-10-01', '2026-10-31')).toBeGreaterThan(0);
  });

  test('ejecuta la nomina del periodo borrador y es idempotente', () => {
    const first = runPayroll(2, actor);
    expect(first.ok).toBe(true);
    expect(first.created).toBe(10);
    expect(first.skipped).toBe(0);
    const liquidations = liquidationsForPeriod(2);
    expect(liquidations).toHaveLength(10);
    const summary = payrollSummary(2);
    expect(summary.count).toBe(10);
    expect(summary.total_haberes).toBeGreaterThan(summary.total_deducciones);
    expect(summary.total_liquido).toBe(summary.total_haberes - summary.total_deducciones);
    expect(liquidationDetails(liquidations[0].liquidacion_id).length).toBeGreaterThanOrEqual(3);

    const second = runPayroll(2, actor);
    expect(second.ok).toBe(true);
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(10);
    expect(liquidationsForPeriod(2)).toHaveLength(10);
  });

  test('excluye colaboradores sin contrato vigente en el periodo', () => {
    addItem('empleados', {
      departamento_id: 3,
      cargo_id: 3,
      supervisor_id: null,
      nombres: 'Sin',
      apellidos: 'Contrato',
      correo_electronico: 'sin.contrato@empresa.cl',
      fecha_contratacion: '2026-10-01',
      estado_laboral: 'Activo',
      telefono: '',
      direccion: '',
      banco: '',
      cuenta_bancaria: ''
    });
    const result = runPayroll(2, actor);
    expect(result.created).toBe(10);
    expect(liquidationsForPeriod(2)).toHaveLength(10);
  });

  test('bloquea ejecucion y edicion en periodos cerrados y audita la reapertura', () => {
    const closed = closePeriod(2, actor);
    expect(closed.ok).toBe(true);
    expect(loadCollection('periodosNomina').find((period) => period.periodo_nomina_id === 2).estado).toBe(
      'Cerrado'
    );
    expect(runPayroll(2, actor).ok).toBe(false);

    const reopened = reopenPeriod(2, actor);
    expect(reopened.ok).toBe(true);
    expect(runPayroll(2, actor).created).toBe(10);
    const audit = loadAudit();
    expect(audit.some((entry) => entry.accion === 'Cierre de periodo')).toBe(true);
    expect(audit.some((entry) => entry.accion === 'Reapertura de periodo')).toBe(true);
  });

  test('permite consultar las liquidaciones historicas de un colaborador', () => {
    runPayroll(2, actor);
    const own = employeeLiquidations(1);
    expect(own).toHaveLength(1);
    expect(own[0]).toMatchObject({
      periodo_nomina_id: 2,
      empleado_id: 1
    });
    expect(own[0].sueldo_liquido).toBeGreaterThan(0);
  });
});
