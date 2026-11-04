// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createEmployee,
  loadContracts,
  resetStorage
} from '../../src/hr/storage.js';
import * as contracts from '../../src/hr/components/contracts.js';
import { contextFor, mount, sessionFor, submit } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('vista de contratos', () => {
  it('genera el texto y crea un contrato', () => {
    const employee = createEmployee({
      rut: '19.999.999-9',
      nombres: 'Laura',
      apellidos: 'Pérez',
      email: 'laura.perez@empresa.cl',
      fecha_contratacion: '2026-01-01',
      estado: 'Activo',
      departamento_id: 3,
      cargo_id: 5,
      dias_vacaciones_disponibles: 15
    });
    const context = contextFor(sessionFor('admin'), { route: 'contratos' });
    const root = mount(contracts.render(context));
    expect(root.textContent).toContain('Contratos');
    contracts.bind(root, context);
    const form = root.querySelector('#contract-form');
    form.elements.empleado_id.value = String(employee.empleado_id);
    form.elements.tipo_contrato.value = 'Indefinido';
    form.elements.fecha_inicio.value = '2026-02-01';
    form.elements.salario_base.value = '1500000';
    root.querySelector('#generate-contract-text').click();
    expect(form.elements.texto_contrato.value).toContain('Laura Pérez');
    submit(form);
    expect(loadContracts().some((contract) => contract.empleado_id === employee.empleado_id)).toBe(true);
  });
});
