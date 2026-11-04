// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { loadBenefits, resetStorage } from '../../src/hr/storage.js';
import * as benefits from '../../src/hr/components/benefits.js';
import { contextFor, mount, sessionFor, submit } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('vista de beneficios', () => {
  it('crea un beneficio en el catálogo', () => {
    const context = contextFor(sessionFor('admin'), { route: 'beneficios' });
    const root = mount(benefits.render(context));
    expect(root.textContent).toContain('Beneficios');
    benefits.bind(root, context);
    const form = root.querySelector('#benefit-form');
    form.elements.nombre_beneficio.value = 'Bono de prueba';
    form.elements.proveedor.value = 'Proveedor Demo';
    form.elements.costo.value = '25000';
    submit(form);
    expect(
      loadBenefits().some((benefit) => benefit.nombre_beneficio === 'Bono de prueba')
    ).toBe(true);
  });
});
