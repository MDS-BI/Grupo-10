import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp } from '../helpers/hr.js';

describe('panel de inicio por rol', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('el panel muestra indicadores y acciones del administrador', async () => {
    await bootApp('admin_rrhh');
    const content = document.querySelector('#main-content').textContent;
    expect(content).toContain('Dotacion activa');
    expect(content).toContain('Departamentos');
    expect(content).toContain('Costo de nomina');
    expect(content).toContain('Nuevo empleado');
    expect(document.querySelectorAll('.stat-card').length).toBe(4);
  });

  test('el panel del empleado se enfoca en autoservicio', async () => {
    await bootApp('empleado');
    const content = document.querySelector('#main-content').textContent;
    expect(content).toContain('Solicitar permiso');
    expect(content).toContain('Mis papeletas');
    expect(content).toContain('Mi perfil');
    expect(content).not.toContain('Nuevo empleado');
  });

  test('la jefatura ve solo acciones de su equipo', async () => {
    await bootApp('jefatura');
    const content = document.querySelector('#main-content').textContent;
    expect(content).toContain('Aprobar permisos');
    expect(content).toContain('Validar asistencia');
    expect(content).toContain('Evaluar desempeno');
    expect(content).not.toContain('Ejecutar nomina');
  });
});
