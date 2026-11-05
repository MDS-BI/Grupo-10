import { beforeEach, describe, expect, test } from 'vitest';
import {
  ROLES,
  canAccessModule,
  canApproveRequests,
  canManage,
  canValidateAttendance,
  canViewSalary,
  changeRole,
  currentUser,
  listUsers,
  login,
  logout,
  modulesForRole
} from '../../src/hr/auth.js';
import { clearAll, loadCollection, resetSeed, updateItem } from '../../src/hr/storage.js';
import { loadAudit } from '../../src/hr/audit.js';

describe('autenticacion simulada y RBAC', () => {
  beforeEach(() => {
    clearAll();
    resetSeed();
  });

  test('permite iniciar y cerrar sesion con los cuatro roles demo', () => {
    const users = listUsers();
    expect(users).toHaveLength(4);
    expect(new Set(users.map((user) => user.rol))).toEqual(
      new Set([ROLES.ADMIN, ROLES.NOMINA, ROLES.JEFATURA, ROLES.EMPLEADO])
    );
    for (const user of users) {
      const outcome = login(user.usuario_id);
      expect(outcome.ok).toBe(true);
      expect(currentUser()).toMatchObject({
        usuario_id: user.usuario_id,
        rol: user.rol,
        empleado_id: user.empleado_id
      });
      logout();
      expect(currentUser()).toBeNull();
    }
  });

  test('rechaza usuarios inexistentes o sin rol valido', () => {
    expect(login(999).ok).toBe(false);
    const employeeUser = loadCollection('usuarios').find((user) => user.rol === ROLES.EMPLEADO);
    updateItem('usuarios', employeeUser.usuario_id, { rol: '' });
    expect(login(employeeUser.usuario_id).ok).toBe(false);
  });

  test('aplica la matriz de acceso por modulo', () => {
    const admin = modulesForRole(ROLES.ADMIN).map((module) => module.id);
    expect(admin).toContain('departamentos');
    expect(admin).toContain('nomina');
    expect(admin).toContain('auditoria');

    const payroll = modulesForRole(ROLES.NOMINA).map((module) => module.id);
    expect(payroll).toContain('nomina');
    expect(payroll).not.toContain('contratos');
    expect(payroll).not.toContain('departamentos');

    const supervisor = modulesForRole(ROLES.JEFATURA).map((module) => module.id);
    expect(supervisor).toContain('evaluaciones');
    expect(supervisor).toContain('permisos');
    expect(supervisor).not.toContain('nomina');

    const employee = modulesForRole(ROLES.EMPLEADO).map((module) => module.id);
    expect(employee).toContain('papeletas');
    expect(employee).toContain('perfil');
    expect(employee).not.toContain('empleados');
    expect(employee).not.toContain('nomina');
  });

  test('bloquea acceso directo a modulos no autorizados', () => {
    const employeeSession = login(
      listUsers().find((user) => user.rol === ROLES.EMPLEADO).usuario_id
    ).session;
    expect(canAccessModule('papeletas', employeeSession)).toBe(true);
    expect(canAccessModule('nomina', employeeSession)).toBe(false);
    expect(canAccessModule('empleados', employeeSession)).toBe(false);
    expect(canAccessModule('desconocido', employeeSession)).toBe(false);
  });

  test('distingue acciones de gestion de acciones de lectura', () => {
    const admin = { rol: ROLES.ADMIN };
    const payroll = { rol: ROLES.NOMINA };
    const supervisor = { rol: ROLES.JEFATURA };
    const employee = { rol: ROLES.EMPLEADO, empleado_id: 10 };

    expect(canManage('empleados', admin)).toBe(true);
    expect(canManage('empleados', payroll)).toBe(false);
    expect(canManage('nomina', payroll)).toBe(true);
    expect(canManage('permisos', supervisor)).toBe(true);
    expect(canManage('evaluaciones', supervisor)).toBe(true);
    expect(canApproveRequests(employee)).toBe(false);
    expect(canApproveRequests(supervisor)).toBe(true);
    expect(canValidateAttendance(payroll)).toBe(true);
    expect(canValidateAttendance(employee)).toBe(false);
  });

  test('restringe salario y datos bancarios por rol y autoria', () => {
    expect(canViewSalary({ rol: ROLES.ADMIN }, 999)).toBe(true);
    expect(canViewSalary({ rol: ROLES.NOMINA }, 999)).toBe(true);
    expect(canViewSalary({ rol: ROLES.JEFATURA, empleado_id: 7 }, 10)).toBe(false);
    expect(canViewSalary({ rol: ROLES.EMPLEADO, empleado_id: 10 }, 10)).toBe(true);
    expect(canViewSalary({ rol: ROLES.EMPLEADO, empleado_id: 10 }, 9)).toBe(false);
  });

  test('el cambio de rol se aplica en el siguiente inicio de sesion y queda auditado', () => {
    const employeeUser = listUsers().find((user) => user.rol === ROLES.EMPLEADO);
    const outcome = changeRole(employeeUser.usuario_id, ROLES.JEFATURA, {
      nombre: 'Ana Torres',
      rol: ROLES.ADMIN
    });
    expect(outcome.ok).toBe(true);
    expect(
      loadCollection('usuarios').find((user) => user.usuario_id === employeeUser.usuario_id).rol
    ).toBe(ROLES.JEFATURA);
    expect(loadAudit()[0].accion).toBe('Cambio de rol');

    const session = login(employeeUser.usuario_id).session;
    expect(session.rol).toBe(ROLES.JEFATURA);
    expect(canAccessModule('evaluaciones', session)).toBe(true);
  });
});
