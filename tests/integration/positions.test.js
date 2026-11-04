// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { loadPositions, resetStorage } from '../../src/hr/storage.js';
import * as positions from '../../src/hr/components/positions.js';
import { contextFor, mount, sessionFor, submit } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('vista de cargos', () => {
  it('renderiza y crea un cargo', () => {
    const context = contextFor(sessionFor('admin'));
    const root = mount(positions.render(context));
    expect(root.textContent).toContain('Cargos');
    expect(root.textContent).toContain('Nuevo cargo');
    positions.bind(root, context);
    const form = root.querySelector('#position-form');
    form.elements.nombre_cargo.value = 'Business Partner';
    form.elements.nivel_jerarquia.value = 'Operativo';
    form.elements.departamento_id.value = '4';
    submit(form);
    expect(
      loadPositions().some((position) => position.nombre_cargo === 'Business Partner')
    ).toBe(true);
  });
});
