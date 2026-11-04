// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { login } from '../../src/hr/auth.js';
import {
  createAttendance,
  resetStorage
} from '../../src/hr/storage.js';
import { calculatePayrollForEmployee } from '../../src/hr/payroll.js';
import * as attendance from '../../src/hr/components/attendance.js';
import { contextFor, mount, sessionFor } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('aprobación de horas extras', () => {
  it('solo consolida horas extras aprobadas y evita doble aprobación', () => {
    login('ana.torres@empresa.cl', 'super123');
    const record = createAttendance(
      {
        empleado_id: 2,
        fecha_laboral: '2026-10-15',
        hora_entrada: '09:00',
        hora_salida: '20:00'
      },
      'ana.torres@empresa.cl'
    );
    const context = contextFor(sessionFor('supervisor'), {
      route: 'asistencia',
      params: new URLSearchParams('tab=validacion')
    });
    const root = mount(attendance.render(context));
    attendance.bind(root, context);
    root
      .querySelector(`[data-validate="${record.asistencia_id}"][data-state="Aprobado"]`)
      .click();
    const afterApproval = mount(attendance.render(context));
    expect(afterApproval.querySelector(`[data-validate="${record.asistencia_id}"]`)).toBeNull();

    const payroll = calculatePayrollForEmployee(2, 2);
    expect(payroll.overtimeHours).toBe(3.5);
    expect(payroll.overtimeAmount).toBeCloseTo(23333.33, 2);
  });
});
