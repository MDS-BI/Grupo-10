// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { resetStorage } from '../../src/hr/storage.js';
import * as dashboard from '../../src/hr/components/dashboard.js';
import * as auditView from '../../src/hr/components/audit-view.js';
import * as searchView from '../../src/hr/components/search-view.js';
import { contextFor, mount, sessionFor } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('panel y vistas de consulta', () => {
  it('renderiza el panel de administración con métricas', () => {
    const root = mount(dashboard.render(contextFor(sessionFor('admin'))));
    expect(root.textContent).toContain('Personas activas');
    expect(root.textContent).toContain('Ausentismo del mes');
    expect(root.textContent).toContain('Dotación por departamento');
    expect(root.textContent).toContain('Costo de nómina por período');
  });

  it('renderiza el panel de empleado con su información personal', () => {
    const root = mount(dashboard.render(contextFor(sessionFor('employee'))));
    expect(root.textContent).toContain('Saldo de vacaciones');
    expect(root.textContent).toContain('Mi ficha');
    expect(root.textContent).toContain('Bruno Díaz');
  });

  it('renderiza la bitácora y la búsqueda global', () => {
    const auditRoot = mount(auditView.render(contextFor(sessionFor('admin'))));
    expect(auditRoot.textContent).toContain('Bitácora de eventos');
    expect(auditRoot.textContent).toContain('Auditoría');

    const searchContext = contextFor(sessionFor('admin'), {
      route: 'busqueda',
      params: new URLSearchParams('q=Bruno')
    });
    const searchRoot = mount(searchView.render(searchContext));
    expect(searchRoot.textContent).toContain('Búsqueda global');
    expect(searchRoot.textContent).toContain('Bruno Díaz');
  });
});
