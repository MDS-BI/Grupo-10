import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp, setField, submit } from '../helpers/hr.js';

describe('HU5 - permisos y ausencias', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('el empleado solicita vacaciones y se registran como pendientes', async () => {
    const { app, storage } = await bootApp('empleado');
    app.navigate('permisos');
    const form = document.querySelector('#permission-form');
    setField(form, 'tipo_permiso_id', '1');
    setField(form, 'fecha_inicio', '2026-12-01');
    setField(form, 'fecha_fin', '2026-12-03');
    setField(form, 'comentario', 'Vacaciones de fin de ano');
    submit(form);

    const created = storage
      .loadCollection('solicitudesPermiso')
      .find((request) => request.fecha_inicio === '2026-12-01');
    expect(created).toMatchObject({
      empleado_id: 10,
      estado: 'Pendiente',
      tipo_permiso_id: 1
    });
    expect(document.querySelector('#main-content').textContent).toContain('Vacaciones de fin de ano');
  });

  test('rechaza solicitudes superpuestas y con saldo insuficiente', async () => {
    const { app, storage } = await bootApp('empleado');
    app.navigate('permisos');
    const before = storage.loadCollection('solicitudesPermiso').length;

    let form = document.querySelector('#permission-form');
    setField(form, 'tipo_permiso_id', '1');
    setField(form, 'fecha_inicio', '2026-11-11');
    setField(form, 'fecha_fin', '2026-11-13');
    submit(form);
    expect(storage.loadCollection('solicitudesPermiso')).toHaveLength(before);
    expect(document.querySelector('#permission-feedback').textContent).toContain('periodo');

    form = document.querySelector('#permission-form');
    setField(form, 'tipo_permiso_id', '1');
    setField(form, 'fecha_inicio', '2026-12-01');
    setField(form, 'fecha_fin', '2026-12-20');
    submit(form);
    expect(storage.loadCollection('solicitudesPermiso')).toHaveLength(before);
    expect(document.querySelector('#permission-feedback').textContent).toContain('Saldo insuficiente');
  });

  test('la jefatura aprueba solo solicitudes de sus subordinados', async () => {
    const { app, storage } = await bootApp('jefatura');
    app.navigate('permisos');
    expect(document.querySelector('#main-content').textContent).toContain('Javiera Nunez');
    expect(document.querySelector('#main-content').textContent).not.toContain('Felipe Vera');

    document.querySelector('[data-approve="1"]').click();
    const approved = storage
      .loadCollection('solicitudesPermiso')
      .find((request) => request.solicitud_permiso_id === 1);
    expect(approved.estado).toBe('Aprobada');
    expect(approved.aprobado_por).toBe(7);
    expect(document.querySelector('#main-content').textContent).toContain('Aprobada');
  });

  test('bloquea aprobaciones que dejan el area sin dotacion minima', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    const created = storage.addItem('solicitudesPermiso', {
      empleado_id: 5,
      tipo_permiso_id: 1,
      aprobado_por: null,
      fecha_inicio: '2026-12-01',
      fecha_fin: '2026-12-02',
      estado: 'Pendiente',
      comentario: 'Prueba de dotacion',
      fecha_solicitud: '2026-11-04'
    });
    app.navigate('permisos');
    document.querySelector(`[data-approve="${created.solicitud_permiso_id}"]`).click();
    const request = storage
      .loadCollection('solicitudesPermiso')
      .find((item) => item.solicitud_permiso_id === created.solicitud_permiso_id);
    expect(request.estado).toBe('Pendiente');
    expect(document.querySelector('#permission-feedback').textContent).toContain('colaborador(es) activo(s)');
  });

  test('respeta la dotacion_minima configurada del departamento', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    storage.updateItem('departamentos', 4, { dotacion_minima: 5 });
    app.navigate('permisos');
    document.querySelector('[data-approve="1"]').click();
    const request = storage
      .loadCollection('solicitudesPermiso')
      .find((item) => item.solicitud_permiso_id === 1);
    expect(request.estado).toBe('Pendiente');
    expect(document.querySelector('#permission-feedback').textContent).toContain('se requieren al menos 5');
  });

  test('rechaza solicitudes que superan el derecho anual configurado de un tipo', async () => {
    const { app, storage } = await bootApp('empleado');
    const type = storage.addItem('tiposPermiso', {
      nombre_tipo_permiso: 'Vacaciones especiales',
      es_remunerado: true,
      dias_anuales: 2
    });
    app.navigate('permisos');
    const form = document.querySelector('#permission-form');
    setField(form, 'tipo_permiso_id', String(type.tipo_permiso_id));
    setField(form, 'fecha_inicio', '2026-12-01');
    setField(form, 'fecha_fin', '2026-12-03');
    submit(form);

    expect(
      storage
        .loadCollection('solicitudesPermiso')
        .some((request) => request.tipo_permiso_id === type.tipo_permiso_id)
    ).toBe(false);
    expect(document.querySelector('#permission-feedback').textContent).toContain('Saldo insuficiente');
  });
});
