import { clearSession, loadCollection, loadSession, saveSession, updateItem } from './storage.js';
import { audit } from './audit.js';

export const ROLES = {
  ADMIN: 'admin_rrhh',
  NOMINA: 'nomina',
  JEFATURA: 'jefatura',
  EMPLEADO: 'empleado'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador de RRHH',
  [ROLES.NOMINA]: 'Encargado de Nomina',
  [ROLES.JEFATURA]: 'Jefatura / Supervisor',
  [ROLES.EMPLEADO]: 'Empleado'
};

export const MODULES = [
  { id: 'dashboard', label: 'Panel', icon: 'grid' },
  { id: 'departamentos', label: 'Departamentos', icon: 'building' },
  { id: 'cargos', label: 'Cargos', icon: 'badge' },
  { id: 'empleados', label: 'Empleados', icon: 'users' },
  { id: 'contratos', label: 'Contratos', icon: 'file' },
  { id: 'permisos', label: 'Permisos', icon: 'calendar' },
  { id: 'asistencia', label: 'Asistencia', icon: 'clock' },
  { id: 'nomina', label: 'Nomina', icon: 'coins' },
  { id: 'papeletas', label: 'Mis papeletas', icon: 'receipt' },
  { id: 'beneficios', label: 'Beneficios', icon: 'gift' },
  { id: 'evaluaciones', label: 'Evaluaciones', icon: 'star' },
  { id: 'perfil', label: 'Mi perfil', icon: 'user' },
  { id: 'auditoria', label: 'Auditoria', icon: 'shield' }
];

const ACCESS = {
  [ROLES.ADMIN]: [
    'dashboard',
    'departamentos',
    'cargos',
    'empleados',
    'contratos',
    'permisos',
    'asistencia',
    'nomina',
    'beneficios',
    'evaluaciones',
    'auditoria'
  ],
  [ROLES.NOMINA]: ['dashboard', 'empleados', 'asistencia', 'nomina', 'beneficios', 'evaluaciones'],
  [ROLES.JEFATURA]: ['dashboard', 'empleados', 'permisos', 'asistencia', 'evaluaciones'],
  [ROLES.EMPLEADO]: ['dashboard', 'perfil', 'permisos', 'papeletas', 'beneficios', 'evaluaciones']
};

const MANAGE = {
  [ROLES.ADMIN]: [
    'departamentos',
    'cargos',
    'empleados',
    'contratos',
    'permisos',
    'nomina',
    'beneficios',
    'evaluaciones',
    'auditoria'
  ],
  [ROLES.NOMINA]: ['nomina', 'asistencia'],
  [ROLES.JEFATURA]: ['permisos', 'asistencia', 'evaluaciones'],
  [ROLES.EMPLEADO]: ['perfil', 'permisos']
};

export function roleOf(user) {
  return user?.rol || null;
}

export function getModule(moduleId) {
  return MODULES.find((module) => module.id === moduleId) || null;
}

export function modulesForRole(role) {
  const allowed = ACCESS[role] || [];
  return MODULES.filter((module) => allowed.includes(module.id));
}

export function canAccessModule(moduleId, user) {
  const role = roleOf(user);
  if (!role) return false;
  return (ACCESS[role] || []).includes(moduleId);
}

export function canManage(moduleId, user) {
  const role = roleOf(user);
  if (!role) return false;
  return (MANAGE[role] || []).includes(moduleId);
}

export function canViewSalary(user, employeeId) {
  const role = roleOf(user);
  if (role === ROLES.ADMIN || role === ROLES.NOMINA) return true;
  return role === ROLES.EMPLEADO && String(user?.empleado_id) === String(employeeId);
}

export function canViewBank(user, employeeId) {
  return canViewSalary(user, employeeId);
}

export function canApproveRequests(user) {
  const role = roleOf(user);
  return role === ROLES.JEFATURA || role === ROLES.ADMIN;
}

export function canValidateAttendance(user) {
  const role = roleOf(user);
  return role === ROLES.JEFATURA || role === ROLES.ADMIN || role === ROLES.NOMINA;
}

export function isAdmin(user) {
  return roleOf(user) === ROLES.ADMIN;
}

export function isPayroll(user) {
  return roleOf(user) === ROLES.NOMINA;
}

export function isSupervisor(user) {
  return roleOf(user) === ROLES.JEFATURA;
}

export function isEmployee(user) {
  return roleOf(user) === ROLES.EMPLEADO;
}

export function listUsers() {
  return loadCollection('usuarios').filter((user) => user.activo !== false);
}

export function login(usuarioId) {
  const user = loadCollection('usuarios').find(
    (item) => String(item.usuario_id) === String(usuarioId)
  );
  if (!user) return { ok: false, reason: 'El usuario demo no existe.' };
  if (!user.rol) return { ok: false, reason: 'El usuario no tiene un rol asignado.' };
  if (!Object.values(ROLES).includes(user.rol)) {
    return { ok: false, reason: 'El rol asignado no es valido.' };
  }
  const session = {
    usuario_id: user.usuario_id,
    empleado_id: user.empleado_id,
    nombre: user.nombre,
    correo_electronico: user.correo_electronico,
    rol: user.rol,
    iniciadoEn: new Date().toISOString()
  };
  saveSession(session);
  return { ok: true, session };
}

export function logout() {
  clearSession();
}

export function currentSession() {
  return loadSession();
}

export function currentUser() {
  return loadSession();
}

export function changeRole(usuarioId, newRole, actor) {
  if (!Object.values(ROLES).includes(newRole)) {
    return { ok: false, reason: 'Rol invalido.' };
  }
  const user = loadCollection('usuarios').find(
    (item) => String(item.usuario_id) === String(usuarioId)
  );
  if (!user) return { ok: false, reason: 'Usuario no encontrado.' };
  updateItem('usuarios', usuarioId, { rol: newRole });
  audit(
    'Cambio de rol',
    'usuarios',
    `${user.nombre}: ${ROLE_LABELS[user.rol] || user.rol} -> ${ROLE_LABELS[newRole]}`,
    actor
  );
  return { ok: true };
}
