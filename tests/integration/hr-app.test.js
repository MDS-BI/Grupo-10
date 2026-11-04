// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '../../src/app.js';
import { login, logout } from '../../src/hr/auth.js';
import { resetStorage } from '../../src/hr/storage.js';

beforeEach(() => {
  resetStorage();
  logout();
  document.body.innerHTML = '<div id="app"></div><div id="toast"></div>';
  window.location.hash = '#/';
});

describe('aplicación completa', () => {
  it('muestra el acceso y luego el shell autenticado', () => {
    render();
    expect(document.querySelector('#login-form')).not.toBeNull();
    login('admin@empresa.cl', 'admin123');
    render();
    expect(document.querySelector('#main-content')).not.toBeNull();
    expect(document.body.textContent).toContain('Hola, Administrador');
  });

  it('renderiza todas las rutas del rol administrador sin errores', () => {
    login('admin@empresa.cl', 'admin123');
    const routes = [
      'panel',
      'departamentos',
      'cargos',
      'empleados',
      'contratos',
      'permisos',
      'asistencia',
      'nomina',
      'beneficios',
      'evaluaciones',
      'auditoria',
      'usuarios',
      'busqueda'
    ];
    routes.forEach((route) => {
      window.location.hash = `#/${route}`;
      expect(() => render()).not.toThrow();
      expect(document.querySelector('#main-content').textContent.length).toBeGreaterThan(0);
    });
  });

  it('restringe las rutas no autorizadas del empleado', () => {
    login('bruno.diaz@empresa.cl', 'empleado123');
    window.location.hash = '#/auditoria';
    render();
    expect(document.body.textContent).toContain('No tienes permisos');
  });
});
