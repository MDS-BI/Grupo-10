import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp, byText, setField, submit } from '../helpers/hr.js';

describe('HU1 - departamentos', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('el administrador crea un departamento y aparece en la tabla', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('departamentos');
    const form = document.querySelector('#department-form');
    setField(form, 'nombre_departamento', 'Operaciones');
    setField(form, 'codigo_departamento', 'ope');
    setField(form, 'empresa_id', '1');
    submit(form);

    const created = storage
      .loadCollection('departamentos')
      .find((department) => department.nombre_departamento === 'Operaciones');
    expect(created).toBeTruthy();
    expect(created.codigo_departamento).toBe('OPE');
    expect(document.querySelector('#main-content').textContent).toContain('Operaciones');
  });

  test('rechaza codigos duplicados sin escribir en almacenamiento', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('departamentos');
    const before = storage.loadCollection('departamentos').length;
    const form = document.querySelector('#department-form');
    setField(form, 'nombre_departamento', 'Otra area');
    setField(form, 'codigo_departamento', 'RRHH');
    setField(form, 'empresa_id', '1');
    submit(form);

    expect(storage.loadCollection('departamentos')).toHaveLength(before);
    expect(document.querySelector('#department-feedback').textContent).toContain('codigo');
  });

  test('filtra la tabla por nombre o codigo sin recargar la pagina', async () => {
    const { app } = await bootApp('admin_rrhh');
    app.navigate('departamentos');
    const filter = document.querySelector('#department-filter');
    setField(filter, 'q', 'ventas');
    filter.dispatchEvent(new Event('input', { bubbles: true }));

    const visible = [...document.querySelectorAll('tbody tr[data-filter]')].filter(
      (row) => !row.hidden
    );
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain('Ventas');

    setField(filter, 'q', '');
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    expect(
      [...document.querySelectorAll('tbody tr[data-filter]')].filter((row) => !row.hidden)
    ).toHaveLength(5);
  });

  test('bloquea eliminar un departamento con empleados activos y ofrece reasignar', async () => {    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('departamentos');
    const button = document.querySelector('[data-delete="4"]');
    button.click();

    expect(document.querySelector('#reassign-panel').textContent).toContain('Reasignar');
    expect(storage.loadCollection('departamentos').some((item) => item.departamento_id === 4)).toBe(
      true
    );

    const select = document.querySelector('#reassign-target');
    select.value = '1';
    document.querySelector('#reassign-confirm').click();

    expect(storage.loadCollection('departamentos').some((item) => item.departamento_id === 4)).toBe(
      false
    );
    const moved = storage
      .loadCollection('empleados')
      .filter((employee) => [3, 7, 10].includes(employee.empleado_id));
    expect(moved.every((employee) => employee.departamento_id === 1)).toBe(true);
    expect(byText('#main-content', 'Ventas')).toBeUndefined();
  });
});
