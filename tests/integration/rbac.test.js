import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp } from '../helpers/hr.js';

describe('HU8 - control de acceso basado en roles', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('el menu solo muestra los modulos permitidos por rol', async () => {
    const { app } = await bootApp('empleado');
    expect(document.querySelector('#nav-papeletas')).toBeTruthy();
    expect(document.querySelector('#nav-perfil')).toBeTruthy();
    expect(document.querySelector('#nav-nomina')).toBeNull();
    expect(document.querySelector('#nav-empleados')).toBeNull();
    expect(document.querySelector('#nav-departamentos')).toBeNull();

    document.querySelector('#logout-button').click();
    const { app: app2 } = { app };
    app2.navigate('dashboard');
    expect(document.querySelector('#login-feedback')).toBeTruthy();
  });

  test('bloquea el acceso directo por hash a un modulo no autorizado', async () => {
    const { app } = await bootApp('empleado');
    window.location.hash = '#/nomina';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.querySelector('#main-content').textContent).toContain('Acceso denegado');
    expect(document.querySelector('#main-content').textContent).not.toContain('Conceptos de nomina');
    app.navigate('dashboard');
    expect(document.querySelector('#main-content').textContent).toContain('Hola');
  });

  test('el administrador y nomina acceden a nomina; jefatura no', async () => {
    const admin = await bootApp('admin_rrhh');
    expect(document.querySelector('#nav-nomina')).toBeTruthy();
    admin.auth.logout();

    const payroll = await bootApp('nomina');
    expect(document.querySelector('#nav-nomina')).toBeTruthy();
    expect(document.querySelector('#nav-contratos')).toBeNull();
    payroll.auth.logout();

    const supervisor = await bootApp('jefatura');
    expect(document.querySelector('#nav-nomina')).toBeNull();
    expect(document.querySelector('#nav-permisos')).toBeTruthy();
    expect(document.querySelector('#nav-evaluaciones')).toBeTruthy();
  });

  test('oculta datos salariales a jefatura en la ficha de personal', async () => {
    const { app } = await bootApp('jefatura');
    app.navigate('empleados');
    const content = document.querySelector('#main-content').textContent;
    expect(content).toContain('Javiera Nunez');
    expect(content).toContain('Confidencial');
    expect(content).not.toContain('$1.150.000');
  });
});
