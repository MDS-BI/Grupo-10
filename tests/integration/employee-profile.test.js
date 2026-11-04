// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { getEmployee, resetStorage, resolveBankRequest } from '../../src/hr/storage.js';
import * as employees from '../../src/hr/components/employees.js';
import { contextFor, mount, sessionFor, submit } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('ficha de empleado', () => {
  it('muestra el perfil y permite actualizar datos de contacto propios', () => {
    const context = contextFor(sessionFor('employee'), { route: 'empleados' });
    const root = mount(employees.render(context));
    expect(root.textContent).toContain('Bruno Díaz');
    expect(root.textContent).toContain('Actualizar mis datos');
    employees.bind(root, context);
    const form = root.querySelector('#employee-form');
    form.elements.telefono.value = '+56 9 7777 7777';
    submit(form);
    expect(getEmployee(2).telefono).toBe('+56 9 7777 7777');
  });

  it('deja el cambio bancario pendiente y permite aprobarlo desde RRHH', () => {
    resolveBankRequest(2, 'Rechazada', 'admin@empresa.cl');
    const employeeContext = contextFor(sessionFor('employee'), { route: 'empleados' });
    const employeeRoot = mount(employees.render(employeeContext));
    employees.bind(employeeRoot, employeeContext);
    const form = employeeRoot.querySelector('#employee-form');
    form.elements.nuevo_datos_bancarios.value = 'Banco Nuevo · Cuenta corriente 000111222';
    form.elements.certificado.value = 'certificado-banco-nuevo.pdf';
    submit(form);
    expect(getEmployee(2).datos_bancarios).toBe('Banco de Chile · Cuenta vista 87654321');
    expect(getEmployee(2).solicitud_bancaria.estado).toBe('Pendiente');
    expect(getEmployee(2).solicitud_bancaria.datos_propuestos).toContain('Banco Nuevo');
    expect(getEmployee(2).solicitud_bancaria.certificado).toBe('certificado-banco-nuevo.pdf');

    const adminContext = contextFor(sessionFor('admin'), { id: '2' });
    const adminRoot = mount(employees.render(adminContext));
    employees.bind(adminRoot, adminContext);
    expect(adminRoot.textContent).toContain('Solicitud bancaria pendiente');
    adminRoot.querySelector('[data-bank-decision="Aprobada"]').click();
    expect(getEmployee(2).datos_bancarios).toContain('Banco Nuevo');
    expect(getEmployee(2).solicitud_bancaria.estado).toBe('Aprobada');
  });

  it('muestra la ficha completa a administración', () => {
    const context = contextFor(sessionFor('admin'), { id: '2' });
    const root = mount(employees.render(context));
    expect(root.textContent).toContain('Información personal');
    expect(root.textContent).toContain('Datos bancarios');
  });
});
