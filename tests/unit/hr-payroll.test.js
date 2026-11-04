import { beforeEach, describe, expect, it } from 'vitest';
import {
  getLiquidationsForPeriod,
  getPayrollPeriod,
  resetStorage,
  setPayrollPeriodState
} from '../../src/hr/storage.js';
import { loadAudit } from '../../src/hr/audit.js';
import {
  calculateOvertimeAmount,
  calculatePayrollForEmployee,
  getEmployeePayslips,
  getPayrollCostSummary,
  getPayrollTrend,
  getPayslip,
  runPayroll,
  validatePayrollTotals
} from '../../src/hr/payroll.js';

beforeEach(() => {
  resetStorage();
});

describe('motor de nómina', () => {
  it('calcula sueldo, horas extras y descuentos del período', () => {
    const result = calculatePayrollForEmployee(2, 2);
    expect(result.liquidation.salario_base).toBe(1200000);
    expect(result.overtimeHours).toBe(1.5);
    expect(result.overtimeAmount).toBe(10000);
    expect(result.liquidation.total_haberes).toBe(1210000);
    expect(result.liquidation.total_deducciones).toBe(266200);
    expect(result.liquidation.salario_neto).toBe(943800);
  });

  it('calcula el valor de una hora extra al 1,5', () => {
    expect(calculateOvertimeAmount(1200000, 1.5)).toBe(10000);
  });

  it('genera liquidaciones y deja el período calculado', () => {
    const liquidations = runPayroll(2);
    expect(liquidations).toHaveLength(6);
    expect(getLiquidationsForPeriod(2)).toHaveLength(6);
    expect(getPayrollPeriod(2).estado).toBe('Calculado');
    expect(validatePayrollTotals().every((item) => item.valida)).toBe(true);
  });

  it('entrega el detalle de la liquidación y el costo consolidado', () => {
    runPayroll(2);
    const payslip = getPayslip(2, 2);
    expect(payslip.detalles).toHaveLength(5);
    expect(payslip.detalles.some((detail) => detail.nombre_concepto === 'Horas extras')).toBe(true);
    expect(payslip.total_haberes - payslip.total_deducciones).toBe(payslip.salario_neto);
    const cost = getPayrollCostSummary(2);
    expect(cost.empleados).toBe(6);
    expect(cost.total_neto).toBeGreaterThan(0);
    expect(cost.costo_beneficios).toBeGreaterThan(0);
    expect(cost.costo_total).toBe(cost.total_neto + cost.costo_beneficios);
  });

  it('bloquea el cálculo de períodos cerrados', () => {
    expect(() => runPayroll(3)).toThrow(/cerrado/i);
  });

  it('permite reabrir un período cerrado solo a un administrador', () => {
    expect(() =>
      setPayrollPeriodState(3, 'Aprobado', 'ana.torres@empresa.cl', 'supervisor')
    ).toThrow(/administrador/i);
    const reopened = setPayrollPeriodState(
      3,
      'Aprobado',
      'admin@empresa.cl',
      'admin'
    );
    expect(reopened.estado).toBe('Aprobado');
    expect(
      loadAudit().some(
        (entry) => entry.accion === 'reabrir' && entry.entidad_id === 3
      )
    ).toBe(true);
    expect(() =>
      setPayrollPeriodState(3, 'Borrador', 'admin@empresa.cl', 'admin')
    ).toThrow(/reabrir/i);
  });

  it('expone el historial de liquidaciones y la tendencia', () => {
    expect(getEmployeePayslips(2).length).toBeGreaterThan(0);
    expect(getPayrollTrend().length).toBeGreaterThan(0);
  });
});
