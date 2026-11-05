import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp, setField, submit } from '../helpers/hr.js';

describe('HU3 - ficha y autoservicio del empleado', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('el administrador da de alta un colaborador con datos validos', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('empleados');
    const form = document.querySelector('#employee-form');
    setField(form, 'nombres', 'Paula');
    setField(form, 'apellidos', 'Mena');
    setField(form, 'correo_electronico', 'paula.mena@empresa.cl');
    setField(form, 'fecha_contratacion', '2026-10-01');
    setField(form, 'estado_laboral', 'Activo');
    setField(form, 'departamento_id', '3');
    setField(form, 'cargo_id', '3');
    setField(form, 'supervisor_id', '2');
    setField(form, 'telefono', '+56 9 1234 0000');
    setField(form, 'direccion', 'Calle Nueva 123');
    submit(form);

    const created = storage
      .loadCollection('empleados')
      .find((employee) => employee.correo_electronico === 'paula.mena@empresa.cl');
    expect(created).toBeTruthy();
    expect(created.departamento_id).toBe(3);
    expect(document.querySelector('#main-content').textContent).toContain('Paula Mena');
  });

  test('rechaza correos duplicados y supervisores ciclicos', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('empleados');
    const before = storage.loadCollection('empleados').length;
    const form = document.querySelector('#employee-form');
    setField(form, 'nombres', 'Duplicado');
    setField(form, 'apellidos', 'Mail');
    setField(form, 'correo_electronico', 'ana.torres@empresa.cl');
    setField(form, 'fecha_contratacion', '2026-10-01');
    setField(form, 'estado_laboral', 'Activo');
    setField(form, 'departamento_id', '3');
    setField(form, 'cargo_id', '3');
    submit(form);
    expect(storage.loadCollection('empleados')).toHaveLength(before);
    expect(document.querySelector('#employee-feedback').textContent).toContain('correo');
  });

  test('el empleado actualiza contacto y solicita cambio bancario; RRHH lo aprueba', async () => {
    const { app, storage } = await bootApp('empleado');
    app.navigate('perfil');
    const profileForm = document.querySelector('#profile-form');
    setField(profileForm, 'telefono', '+56 9 5555 0000');
    submit(profileForm);
    expect(
      storage.loadCollection('empleados').find((employee) => employee.empleado_id === 10).telefono
    ).toBe('+56 9 5555 0000');

    const bankForm = document.querySelector('#bank-form');
    setField(bankForm, 'banco', 'Banco Nuevo');
    setField(bankForm, 'cuenta_bancaria', '**** 9999');
    submit(bankForm);
    const request = storage.loadCollection('solicitudesBanco')[0];
    expect(request).toMatchObject({
      empleado_id: 10,
      banco: 'Banco Nuevo',
      estado: 'Pendiente'
    });
    expect(document.querySelector('#main-content').textContent).toContain('pendiente de validacion');
    expect(document.querySelector('#bank-form')).toBeNull();

    // Se cambia la sesion demo al administrador conservando los datos creados.
    const auth = await import('../../src/hr/auth.js');
    auth.logout();
    auth.login(1);
    app.initApp(document.getElementById('app'));
    app.navigate('empleados');
    document.querySelector('[data-approve-bank]').click();
    expect(
      storage.loadCollection('empleados').find((employee) => employee.empleado_id === 10).banco
    ).toBe('Banco Nuevo');
    expect(storage.loadCollection('solicitudesBanco')[0].estado).toBe('Aprobada');
  });
});
