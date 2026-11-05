import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp, setField, submit } from '../helpers/hr.js';

describe('HU6 - asistencia y horas extras', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('la jefatura registra una jornada y calcula horas extras', async () => {
    const { app, storage } = await bootApp('jefatura');
    app.navigate('asistencia');
    const form = document.querySelector('#attendance-form');
    setField(form, 'empleado_id', '10');
    setField(form, 'fecha_laboral', '2026-10-08');
    setField(form, 'hora_entrada', '09:00');
    setField(form, 'hora_salida', '19:00');
    submit(form);

    const record = storage
      .loadCollection('asistencia')
      .find((item) => item.empleado_id === 10 && item.fecha_laboral === '2026-10-08');
    expect(record).toMatchObject({
      horas_trabajadas: 10,
      horas_extras: 2,
      estado_aprobacion: 'Pendiente'
    });
    expect(document.querySelector('#attendance-feedback').textContent).toBe('');
  });

  test('rechaza jornadas duplicadas para el mismo colaborador y fecha', async () => {
    const { app, storage } = await bootApp('jefatura');
    app.navigate('asistencia');
    const before = storage.loadCollection('asistencia').length;
    const form = document.querySelector('#attendance-form');
    setField(form, 'empleado_id', '10');
    setField(form, 'fecha_laboral', '2026-10-01');
    setField(form, 'hora_entrada', '09:00');
    setField(form, 'hora_salida', '18:00');
    submit(form);
    expect(storage.loadCollection('asistencia')).toHaveLength(before);
    expect(document.querySelector('#attendance-feedback').textContent).toContain('ya esta registrada');
  });

  test('aprueba horas extras y las deja disponibles para nomina', async () => {
    const { app, storage } = await bootApp('jefatura');
    app.navigate('asistencia');
    const pending = storage
      .loadCollection('asistencia')
      .find(
        (record) =>
          record.empleado_id === 10 &&
          record.estado_aprobacion === 'Pendiente' &&
          Number(record.horas_extras) > 0
      );
    expect(pending).toBeTruthy();
    document.querySelector(`[data-approve-overtime="${pending.asistencia_id}"]`).click();
    const updated = storage
      .loadCollection('asistencia')
      .find((record) => record.asistencia_id === pending.asistencia_id);
    expect(updated.estado_aprobacion).toBe('Aprobada');
    expect(updated.aprobado_por).toBe(7);
  });

  test('no permite registrar asistencia de colaboradores desvinculados', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    storage.updateItem('empleados', 10, { estado_laboral: 'Desvinculado' });
    app.navigate('asistencia');
    const before = storage.loadCollection('asistencia').length;
    const form = document.querySelector('#attendance-form');
    // El colaborador desvinculado no aparece en el selector; se fuerza el envio para probar la regla.
    const option = document.createElement('option');
    option.value = '10';
    option.textContent = 'Javiera Nunez';
    form.querySelector('[name="empleado_id"]').appendChild(option);
    setField(form, 'empleado_id', '10');
    setField(form, 'fecha_laboral', '2026-10-09');
    setField(form, 'hora_entrada', '09:00');
    setField(form, 'hora_salida', '18:00');
    submit(form);
    expect(storage.loadCollection('asistencia')).toHaveLength(before);
    expect(document.querySelector('#attendance-feedback').textContent).toContain('desvinculado');
  });
});
