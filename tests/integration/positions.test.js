import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp, setField, submit } from '../helpers/hr.js';

describe('HU2 - cargos', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('crea un cargo nuevo y permite eliminarlo si no tiene contratos', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('cargos');
    const form = document.querySelector('#position-form');
    setField(form, 'nombre_cargo', 'Disenador UX');
    setField(form, 'nivel_grado', 'Senior');
    submit(form);

    const created = storage
      .loadCollection('cargos')
      .find((position) => position.nombre_cargo === 'Disenador UX');
    expect(created).toBeTruthy();
    const deleteButton = document.querySelector(`[data-delete="${created.cargo_id}"]`);
    deleteButton.click();
    expect(storage.loadCollection('cargos').some((item) => item.cargo_id === created.cargo_id)).toBe(
      false
    );
  });

  test('rechaza nombres duplicados', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('cargos');
    const form = document.querySelector('#position-form');
    setField(form, 'nombre_cargo', 'Vendedor');
    setField(form, 'nivel_grado', 'Junior');
    submit(form);
    expect(storage.loadCollection('cargos').filter((item) => item.nombre_cargo === 'Vendedor')).toHaveLength(1);
    expect(document.querySelector('#position-feedback').textContent).toContain('Ya existe');
  });

  test('bloquea eliminar un cargo con contrato vigente', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('cargos');
    document.querySelector('[data-delete="2"]').click();
    expect(storage.loadCollection('cargos').some((item) => item.cargo_id === 2)).toBe(true);
    expect(document.querySelector('#position-delete-note').textContent).toContain('contratos vigentes');
  });
});
