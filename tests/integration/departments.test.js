// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { loadDepartments, resetStorage } from '../../src/hr/storage.js';
import * as departments from '../../src/hr/components/departments.js';
import { contextFor, mount, sessionFor, submit } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('vista de departamentos', () => {
  it('renderiza la estructura y crea un departamento', () => {
    const context = contextFor(sessionFor('admin'));
    const root = mount(departments.render(context));
    expect(root.textContent).toContain('Departamentos');
    expect(root.textContent).toContain('Nuevo departamento');
    departments.bind(root, context);
    const form = root.querySelector('#department-form');
    form.elements.codigo_departamento.value = 'OPS';
    form.elements.nombre_departamento.value = 'Operaciones';
    submit(form);
    expect(
      loadDepartments().some((department) => department.codigo_departamento === 'OPS')
    ).toBe(true);
  });
});
