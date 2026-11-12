import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  approvedOvertimeHours,
  calculateLiquidation,
  liquidationDetails,
  liquidationsForPeriod,
  runPayroll
} from '../../src/hr/payroll.js';
import { clearAll, loadCollection, resetSeed, updateItem } from '../../src/hr/storage.js';

const actor = { nombre: 'Diego Soto', rol: 'nomina' };

describe('HU9 - horas extras aprobadas', () => {
  beforeEach(() => {
    clearAll();
    resetSeed();
  });

  test('convierte horas extras aprobadas en un haber de la liquidacion', () => {
    const result = calculateLiquidation({
      contract: { salario_base: 2400000 },
      period: { periodo_nomina_id: 2 },
      concepts: loadCollection('conceptosNomina'),
      overtimeHours: 10
    });
    const overtime = result.detalles.find((detail) => detail.concepto_id === 2);
    const expected = Math.round(((2400000 / 160) * 1.5 * 10 + Number.EPSILON) * 100) / 100;
    expect(overtime.monto).toBe(expected);
    expect(result.total_haberes).toBe(2400000 + expected);
  });

  test('la nomina ignora horas extras pendientes y usa solo las aprobadas', () => {
    expect(approvedOvertimeHours(10, '2026-10-01', '2026-10-31')).toBe(0);
    runPayroll(2, actor);
    const liquidations = liquidationsForPeriod(2);
    const ana = liquidations.find((item) => item.empleado_id === 1);
    const javiera = liquidations.find((item) => item.empleado_id === 10);
    const anaDetails = liquidationDetails(ana.liquidacion_id);
    const javieraDetails = liquidationDetails(javiera.liquidacion_id);
    expect(anaDetails.some((detail) => detail.nombre_concepto === 'Horas extras')).toBe(true);
    expect(javieraDetails.some((detail) => detail.nombre_concepto === 'Horas extras')).toBe(false);
  });

  test('al aprobar las horas pendientes se incorporan en una nueva ejecucion', () => {
    const pending = loadCollection('asistencia').filter(
      (record) => record.empleado_id === 10 && record.estado_validacion === 'pendiente'
    );
    pending.forEach((record) =>
      updateItem('asistencia', record.asistencia_id, {
        estado_validacion: 'aprobado',
        horas_extras_aprobadas: record.horas_extras,
        aprobado_por: 7,
        fecha_aprobacion: record.fecha_laboral
      })
    );
    expect(approvedOvertimeHours(10, '2026-10-01', '2026-10-31')).toBeGreaterThan(0);
    runPayroll(2, actor);
    const javiera = liquidationsForPeriod(2).find((item) => item.empleado_id === 10);
    expect(
      liquidationDetails(javiera.liquidacion_id).some(
        (detail) => detail.nombre_concepto === 'Horas extras'
      )
    ).toBe(true);
  });
});
