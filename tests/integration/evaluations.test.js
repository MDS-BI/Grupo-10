// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { loadEvaluations, resetStorage } from '../../src/hr/storage.js';
import * as evaluations from '../../src/hr/components/evaluations.js';
import { contextFor, mount, sessionFor, submit } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('vista de evaluaciones', () => {
  it('registra la evaluación de una persona del equipo', () => {
    const context = contextFor(sessionFor('supervisor'), { route: 'evaluaciones' });
    const root = mount(evaluations.render(context));
    expect(root.textContent).toContain('Desempeño, retroalimentación y objetivos');
    expect(root.textContent).toContain('Equipo directo');
    evaluations.bind(root, context);
    const form = root.querySelector('#evaluation-form');
    form.elements.empleado_id.value = '2';
    form.elements.fecha_evaluacion.value = '2026-01-21';
    form.elements.calificacion.value = '5';
    form.elements.comentarios.value = 'Buen desempeño';
    form.elements.objetivos.value = 'Consolidar procesos';
    submit(form);
    expect(
      loadEvaluations().some(
        (evaluation) =>
          evaluation.empleado_id === 2 &&
          evaluation.evaluador_id === 1 &&
          evaluation.fecha_evaluacion === '2026-01-21'
      )
    ).toBe(true);
  });
});
