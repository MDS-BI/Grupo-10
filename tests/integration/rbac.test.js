// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from '../../src/app.js';
import { login, logout } from '../../src/hr/auth.js';
import { resetStorage } from '../../src/hr/storage.js';

beforeEach(() => {
  resetStorage();
  logout();
  document.body.innerHTML = '<div id="app"></div><div id="toast"></div>';
  window.location.hash = '#/panel';
});

function visit(hash) {
  window.location.hash = hash;
  render();
}

describe('control de acceso por rol y URL', () => {
  it('bloquea rutas de administración para nómina y supervisor', () => {
    login('felipe.vera@empresa.cl', 'nomina123');
    visit('#/cargos');
    expect(document.body.textContent).toContain('No tienes permisos');

    logout();
    login('ana.torres@empresa.cl', 'super123');
    visit('#/contratos');
    expect(document.body.textContent).toContain('No tienes permisos');
  });

  it('oculta la navegación no autorizada y permite las rutas propias', () => {
    login('ana.torres@empresa.cl', 'super123');
    visit('#/permisos');
    expect(document.body.textContent).toContain('Permisos y vacaciones');
    expect(document.querySelector('a[href="#/cargos"]')).toBeNull();
    expect(document.querySelector('a[href="#/usuarios"]')).toBeNull();
  });

  it('restringe a los empleados a sus propios datos', () => {
    login('bruno.diaz@empresa.cl', 'empleado123');
    visit('#/nomina');
    expect(document.body.textContent).toContain('Mis liquidaciones');
    visit('#/auditoria');
    expect(document.body.textContent).toContain('No tienes permisos');
  });

  it('permite la gestión de usuarios solo al administrador', () => {
    login('admin@empresa.cl', 'admin123');
    visit('#/usuarios');
    expect(document.body.textContent).toContain('Usuarios y roles');
    expect(document.querySelector('a[href="#/usuarios"]')).not.toBeNull();
  });
});
