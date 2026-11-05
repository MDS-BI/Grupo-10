import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp, setField, submit } from '../helpers/hr.js';

describe('HU11 - evaluaciones de desempeno', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('la jefatura evalua a un subordinado directo', async () => {
    const { app, storage } = await bootApp('jefatura');
    app.navigate('evaluaciones');
    const form = document.querySelector('#evaluation-form');
    setField(form, 'empleado_id', '10');
    setField(form, 'fecha_evaluacion', '2026-10-30');
    setField(form, 'calificacion', '4.8');
    setField(form, 'comentarios', 'Excelente cierre de trimestre.');
    submit(form);

    const created = storage
      .loadCollection('evaluaciones')
      .find((evaluation) => evaluation.fecha_evaluacion === '2026-10-30');
    expect(created).toMatchObject({
      empleado_id: 10,
      evaluador_id: 7,
      calificacion: 4.8
    });
    expect(document.querySelector('#main-content').textContent).toContain('Excelente cierre');
  });

  test('rechaza evaluar a un colaborador que no es subordinado directo', async () => {
    const { app, storage } = await bootApp('jefatura');
    app.navigate('evaluaciones');
    const before = storage.loadCollection('evaluaciones').length;
    const form = document.querySelector('#evaluation-form');
    const select = form.querySelector('[name="empleado_id"]');
    const option = document.createElement('option');
    option.value = '6';
    option.textContent = 'Felipe Vera';
    select.appendChild(option);
    setField(form, 'empleado_id', '6');
    setField(form, 'fecha_evaluacion', '2026-10-30');
    setField(form, 'calificacion', '4');
    submit(form);
    expect(storage.loadCollection('evaluaciones')).toHaveLength(before);
    expect(document.querySelector('#evaluation-feedback').textContent).toContain('subordinados directos');
  });

  test('valida el rango de calificacion entre 1 y 5', async () => {
    const { app, storage } = await bootApp('jefatura');
    app.navigate('evaluaciones');
    const before = storage.loadCollection('evaluaciones').length;
    const form = document.querySelector('#evaluation-form');
    setField(form, 'empleado_id', '10');
    setField(form, 'fecha_evaluacion', '2026-10-30');
    setField(form, 'calificacion', '6');
    submit(form);
    expect(storage.loadCollection('evaluaciones')).toHaveLength(before);
    expect(document.querySelector('#evaluation-feedback').textContent).toContain('entre 1.00 y 5.00');
  });

  test('el empleado solo ve sus propias evaluaciones', async () => {
    const { app } = await bootApp('empleado');
    app.navigate('evaluaciones');
    const content = document.querySelector('#main-content').textContent;
    expect(content).toContain('Javiera Nunez');
    expect(content).not.toContain('Felipe Vera');
  });
});
