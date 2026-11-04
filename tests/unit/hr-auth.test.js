import { beforeEach, describe, expect, it } from 'vitest';
import { resetStorage } from '../../src/hr/storage.js';
import { loadAudit } from '../../src/hr/audit.js';
import {
  can,
  canAccessRoute,
  getDemoUsers,
  getSession,
  isAuthenticated,
  login,
  logout,
  requireAction,
  updateUserRole
} from '../../src/hr/auth.js';

beforeEach(() => {
  resetStorage();
  logout();
});

describe('autenticación y roles', () => {
  it('inicia y cierra sesión con credenciales válidas', () => {
    const session = login('admin@empresa.cl', 'admin123');
    expect(session.rol).toBe('admin');
    expect(isAuthenticated()).toBe(true);
    expect(getSession().email).toBe('admin@empresa.cl');
    logout();
    expect(isAuthenticated()).toBe(false);
  });

  it('rechaza credenciales inválidas', () => {
    expect(() => login('admin@empresa.cl', 'incorrecta')).toThrow(/credenciales/i);
  });

  it('aplica la matriz RBAC por rol', () => {
    login('ana.torres@empresa.cl', 'super123');
    expect(can('permissions.approve')).toBe(true);
    expect(can('departments.manage')).toBe(false);
    expect(canAccessRoute('asistencia')).toBe(true);
    expect(canAccessRoute('contratos')).toBe(false);
    logout();

    login('bruno.diaz@empresa.cl', 'empleado123');
    expect(can('permissions.request')).toBe(true);
    expect(can('permissions.approve')).toBe(false);
    expect(canAccessRoute('nomina')).toBe(true);
    expect(canAccessRoute('auditoria')).toBe(false);
    expect(() => requireAction('audit.view')).toThrow(/permisos/i);
    logout();

    login('felipe.vera@empresa.cl', 'nomina123');
    expect(canAccessRoute('asistencia')).toBe(true);
    expect(can('attendance.registerOwn')).toBe(true);
    expect(canAccessRoute('empleados')).toBe(true);
  });

  it('aplica el cambio de rol en el siguiente inicio de sesión y audita', () => {
    updateUserRole(5, 'supervisor', 'admin@empresa.cl');
    expect(
      getDemoUsers().find((user) => user.usuario_id === 5).rol
    ).toBe('supervisor');
    expect(
      loadAudit().some(
        (entry) => entry.accion === 'cambiar_rol' && entry.entidad_id === 5
      )
    ).toBe(true);
    expect(login('bruno.diaz@empresa.cl', 'empleado123').rol).toBe('supervisor');
  });

  it('deniega el acceso a un usuario sin rol asignado', () => {
    updateUserRole(5, '', 'admin@empresa.cl');
    expect(() => login('bruno.diaz@empresa.cl', 'empleado123')).toThrow(/rol asignado/i);
  });
});
