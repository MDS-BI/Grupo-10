import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp, setField, submit } from '../helpers/hr.js';

describe('HU10 - beneficios', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('crea un beneficio e inscribe a un colaborador', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('beneficios');
    const form = document.querySelector('#benefit-form');
    setField(form, 'nombre_beneficio', 'Seguro dental');
    setField(form, 'proveedor', 'Dental Uno');
    setField(form, 'costo', '30000');
    submit(form);

    const benefit = storage
      .loadCollection('beneficios')
      .find((item) => item.nombre_beneficio === 'Seguro dental');
    expect(benefit).toBeTruthy();

    const enrollmentForm = document.querySelector('#enrollment-form');
    setField(enrollmentForm, 'empleado_id', '8');
    setField(enrollmentForm, 'beneficio_id', String(benefit.beneficio_id));
    setField(enrollmentForm, 'fecha_inscripcion', '2026-11-01');
    submit(enrollmentForm);

    const enrollment = storage
      .loadCollection('beneficiosEmpleado')
      .find(
        (item) => item.empleado_id === 8 && item.beneficio_id === benefit.beneficio_id
      );
    expect(enrollment).toBeTruthy();
    expect(document.querySelector('#main-content').textContent).toContain('Seguro dental');
  });

  test('impide inscribir dos veces el mismo beneficio activo', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('beneficios');
    const before = storage.loadCollection('beneficiosEmpleado').length;
    const enrollmentForm = document.querySelector('#enrollment-form');
    setField(enrollmentForm, 'empleado_id', '10');
    setField(enrollmentForm, 'beneficio_id', '2');
    setField(enrollmentForm, 'fecha_inscripcion', '2026-11-01');
    submit(enrollmentForm);
    expect(storage.loadCollection('beneficiosEmpleado')).toHaveLength(before);
    expect(document.querySelector('#benefit-feedback').textContent).toContain('inscripcion activa');
  });

  test('finaliza una inscripcion y luego permite eliminar un beneficio sin inscripciones activas', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('beneficios');
    document.querySelector('[data-finish-enrollment="5"]').click();
    expect(
      storage
        .loadCollection('beneficiosEmpleado')
        .find((item) => item.beneficio_empleado_id === 5).estado
    ).toBe('finalizada');

    document.querySelector('[data-delete-benefit="3"]').click();
    expect(storage.loadCollection('beneficios').some((item) => item.beneficio_id === 3)).toBe(false);
  });

  test('no elimina un beneficio con inscripciones activas', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('beneficios');
    document.querySelector('[data-delete-benefit="1"]').click();
    expect(storage.loadCollection('beneficios').some((item) => item.beneficio_id === 1)).toBe(true);
    expect(document.querySelector('#benefit-feedback').textContent).toContain('inscripciones activas');
  });
});
