// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { loadPermissionRequests, resetStorage } from '../../src/hr/storage.js';
import * as permissions from '../../src/hr/components/permissions.js';
import { contextFor, mount, sessionFor, submit } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('vista de permisos', () => {
  it('renderiza y crea una solicitud', () => {
    const context = contextFor(sessionFor('admin'), { route: 'permisos' });
    const root = mount(permissions.render(context));
    expect(root.textContent).toContain('Permisos y vacaciones');
    expect(root.textContent).toContain('Nueva solicitud');
    permissions.bind(root, context);
    const form = root.querySelector('#permission-request-form');
    form.elements.empleado_id.value = '2';
    form.elements.tipo_permiso_id.value = '3';
    form.elements.fecha_inicio.value = '2026-12-20';
    form.elements.fecha_fin.value = '2026-12-20';
    submit(form);
    expect(
      loadPermissionRequests().some(
        (request) =>
          request.empleado_id === 2 &&
          request.fecha_inicio === '2026-12-20' &&
          request.estado === 'Pendiente'
      )
    ).toBe(true);
  });

  it('muestra las aprobaciones pendientes de la jefatura', () => {
    const context = contextFor(sessionFor('supervisor', 3), {
      route: 'permisos',
      params: new URLSearchParams('tab=aprobaciones')
    });
    const root = mount(permissions.render(context));
    expect(root.textContent).toContain('Solicitudes por resolver');
    expect(root.textContent).toContain('Diego Soto');
    expect(root.querySelector('[data-approve]')).not.toBeNull();
  });
});
