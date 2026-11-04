// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { loadAttendance, resetStorage } from '../../src/hr/storage.js';
import * as attendance from '../../src/hr/components/attendance.js';
import { contextFor, mount, sessionFor, submit } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('vista de asistencia', () => {
  it('registra una jornada con horas extras', () => {
    const context = contextFor(sessionFor('supervisor'), {
      route: 'asistencia',
      params: new URLSearchParams('tab=registro')
    });
    const root = mount(attendance.render(context));
    expect(root.textContent).toContain('Asistencia y horas extras');
    expect(root.textContent).toContain('Registrar jornada');
    attendance.bind(root, context);
    const form = root.querySelector('#attendance-form');
    form.elements.empleado_id.value = '2';
    form.elements.fecha_laboral.value = '2026-01-20';
    form.elements.hora_entrada.value = '09:00';
    form.elements.hora_salida.value = '19:00';
    submit(form);
    const record = loadAttendance().find(
      (item) => item.empleado_id === 2 && item.fecha_laboral === '2026-01-20'
    );
    expect(record.horas_extras).toBe(1);
    expect(record.estado_validacion).toBe('Pendiente');
  });

  it('permite al encargado de nómina registrar y consultar asistencia', () => {
    const context = contextFor(sessionFor('payroll', 6), {
      route: 'asistencia',
      params: new URLSearchParams('tab=registro')
    });
    const root = mount(attendance.render(context));
    expect(root.textContent).toContain('Registrar jornada');
    expect(root.textContent).toContain('Últimos registros');
    expect(root.querySelector('#attendance-form')).not.toBeNull();
  });
});
