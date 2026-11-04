// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  getLiquidationsForPeriod,
  getPayrollPeriod,
  resetStorage
} from '../../src/hr/storage.js';
import * as payrollView from '../../src/hr/components/payroll-view.js';
import { contextFor, mount, sessionFor } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('vista de nómina', () => {
  it('calcula un período desde la interfaz', () => {
    const context = contextFor(sessionFor('admin'), { route: 'nomina' });
    const root = mount(payrollView.render(context));
    expect(root.textContent).toContain('Períodos de nómina');
    payrollView.bind(root, context);
    root.querySelector('[data-run-period="2"]').click();
    expect(getPayrollPeriod(2).estado).toBe('Calculado');
    expect(getLiquidationsForPeriod(2)).toHaveLength(6);
  });

  it('muestra la acción de reapertura solo para administradores', () => {
    const context = contextFor(sessionFor('admin'), { route: 'nomina' });
    const root = mount(payrollView.render(context));
    payrollView.bind(root, context);
    const reopen = root.querySelector(
      '[data-period-state="3"][data-state="Aprobado"]'
    );
    expect(reopen).not.toBeNull();
    reopen.click();
    expect(getPayrollPeriod(3).estado).toBe('Aprobado');
  });

  it('muestra las liquidaciones del empleado', () => {
    const context = contextFor(sessionFor('employee'), { route: 'nomina' });
    const root = mount(payrollView.render(context));
    expect(root.textContent).toContain('Mis liquidaciones');
    expect(root.textContent).toContain('Liquidación de');
  });
});
