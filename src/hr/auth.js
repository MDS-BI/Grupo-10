import { readRaw, writeRaw, removeRaw } from './storage-core.js';
import { SESSION_KEY, logAudit } from './audit.js';
import { safeJsonParse } from './utils.js';

export const USER_ROLES_KEY = 'hr.rolesUsuarios';
const VALID_ROLES = ['admin', 'payroll', 'supervisor', 'employee', ''];

const DEMO_USERS = [
  {
    usuario_id: 1,
    email: 'admin@empresa.cl',
    password: 'admin123',
    nombre: 'Administrador de RRHH',
    rol: 'admin',
    empleado_id: null
  },
  {
    usuario_id: 2,
    email: 'felipe.vera@empresa.cl',
    password: 'nomina123',
    nombre: 'Felipe Vera',
    rol: 'payroll',
    empleado_id: 6
  },
  {
    usuario_id: 3,
    email: 'ana.torres@empresa.cl',
    password: 'super123',
    nombre: 'Ana Torres',
    rol: 'supervisor',
    empleado_id: 1
  },
  {
    usuario_id: 4,
    email: 'carla.rojas@empresa.cl',
    password: 'super123',
    nombre: 'Carla Rojas',
    rol: 'supervisor',
    empleado_id: 3
  },
  {
    usuario_id: 5,
    email: 'bruno.diaz@empresa.cl',
    password: 'empleado123',
    nombre: 'Bruno Díaz',
    rol: 'employee',
    empleado_id: 2
  },
  {
    usuario_id: 6,
    email: 'elena.munoz@empresa.cl',
    password: 'empleado123',
    nombre: 'Elena Muñoz',
    rol: 'employee',
    empleado_id: 5
  }
];

const ROLE_LABELS = {
  admin: 'Administrador',
  payroll: 'Remuneraciones',
  supervisor: 'Jefatura',
  employee: 'Colaborador'
};

const ROUTE_ROLES = {
  panel: ['admin', 'payroll', 'supervisor', 'employee'],
  departamentos: ['admin', 'supervisor'],
  cargos: ['admin'],
  empleados: ['admin', 'payroll', 'supervisor', 'employee'],
  contratos: ['admin'],
  permisos: ['admin', 'payroll', 'supervisor', 'employee'],
  asistencia: ['admin', 'payroll', 'supervisor', 'employee'],
  nomina: ['admin', 'payroll', 'employee'],
  beneficios: ['admin', 'employee'],
  evaluaciones: ['admin', 'supervisor', 'employee'],
  auditoria: ['admin'],
  busqueda: ['admin', 'payroll', 'supervisor', 'employee'],
  usuarios: ['admin']
};

const ACTIONS = {
  'departments.manage': ['admin'],
  'positions.manage': ['admin'],
  'employees.manage': ['admin'],
  'employees.viewAll': ['admin', 'payroll', 'supervisor'],
  'contracts.manage': ['admin'],
  'permissions.request': ['admin', 'payroll', 'supervisor', 'employee'],
  'permissions.approve': ['admin', 'supervisor'],
  'permissions.types': ['admin'],
  'attendance.manage': ['admin', 'supervisor'],
  'attendance.registerOwn': ['admin', 'payroll', 'supervisor', 'employee'],
  'attendance.validate': ['admin', 'supervisor'],
  'payroll.manage': ['admin', 'payroll'],
  'payroll.viewOwn': ['admin', 'payroll', 'employee'],
  'benefits.manage': ['admin'],
  'benefits.viewAll': ['admin', 'payroll'],
  'benefits.viewOwn': ['admin', 'payroll', 'employee'],
  'evaluations.manage': ['admin', 'supervisor'],
  'evaluations.viewAll': ['admin', 'supervisor'],
  'evaluations.viewOwn': ['admin', 'supervisor', 'employee'],
  'audit.view': ['admin'],
  'users.manage': ['admin'],
  'search.use': ['admin', 'payroll', 'supervisor', 'employee']
};

function roleOverrides() {
  const stored = safeJsonParse(readRaw(USER_ROLES_KEY), {});
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

export function getUserRoleOverrides() {
  return { ...roleOverrides() };
}

export function getDemoUsers() {
  const overrides = roleOverrides();
  return DEMO_USERS.map(({ password, ...user }) => ({
    ...user,
    rol: Object.prototype.hasOwnProperty.call(overrides, user.usuario_id)
      ? overrides[user.usuario_id]
      : user.rol
  }));
}

export function updateUserRole(usuarioId, rol, actor = 'sistema') {
  const user = DEMO_USERS.find((candidate) => Number(candidate.usuario_id) === Number(usuarioId));
  if (!user) throw new Error('Usuario no encontrado.');
  if (!VALID_ROLES.includes(rol)) throw new Error('El rol seleccionado no es válido.');
  const previous = getDemoUsers().find(
    (candidate) => Number(candidate.usuario_id) === Number(usuarioId)
  )?.rol;
  const overrides = { ...roleOverrides(), [usuarioId]: rol };
  writeRaw(USER_ROLES_KEY, JSON.stringify(overrides));
  logAudit({
    usuario: actor,
    accion: 'cambiar_rol',
    entidad: 'usuario',
    entidad_id: user.usuario_id,
    detalle: `${user.email}: ${previous || 'sin rol'} → ${rol || 'sin rol'}`
  });
  return getDemoUsers().find((candidate) => Number(candidate.usuario_id) === Number(usuarioId));
}

export function resetUserRoles(actor = 'sistema') {
  removeRaw(USER_ROLES_KEY);
  logAudit({
    usuario: actor,
    accion: 'restablecer',
    entidad: 'usuario',
    detalle: 'Roles de demostración restablecidos'
  });
}

export function getSession() {
  const session = safeJsonParse(readRaw(SESSION_KEY), null);
  return session && getDemoUsers().some((user) => user.usuario_id === session.usuario_id)
    ? session
    : null;
}

export function saveSession(session) {
  writeRaw(SESSION_KEY, JSON.stringify(session));
}

export function login(identifier, password) {
  const normalized = String(identifier || '').trim().toLowerCase();
  const credentials = DEMO_USERS.find(
    (candidate) =>
      (candidate.email.toLowerCase() === normalized ||
        candidate.email.split('@')[0] === normalized) &&
      candidate.password === password
  );
  if (!credentials) {
    throw new Error('Credenciales inválidas. Revisa el correo y la contraseña.');
  }
  const user = getDemoUsers().find(
    (candidate) => Number(candidate.usuario_id) === Number(credentials.usuario_id)
  );
  if (!user.rol) {
    throw new Error('Tu usuario no tiene un rol asignado. Contacta a un administrador.');
  }
  const session = {
    usuario_id: user.usuario_id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    empleado_id: user.empleado_id,
    iniciada: new Date().toISOString()
  };
  saveSession(session);
  return session;
}

export function logout() {
  removeRaw(SESSION_KEY);
}

export function isAuthenticated() {
  return Boolean(getSession());
}

export function roleLabel(rol) {
  if (!rol) return 'Sin rol';
  return ROLE_LABELS[rol] || rol;
}

export function can(action, session = getSession()) {
  if (!session) return false;
  return (ACTIONS[action] || []).includes(session.rol);
}

export function canAccessRoute(route, session = getSession()) {
  if (!session) return false;
  return (ROUTE_ROLES[route] || []).includes(session.rol);
}

export function requireAction(action, session = getSession()) {
  if (!can(action, session)) {
    throw new Error('No tienes permisos para realizar esta acción.');
  }
  return session;
}

export function requireRoute(route, session = getSession()) {
  if (!canAccessRoute(route, session)) {
    throw new Error('No tienes permisos para acceder a este módulo.');
  }
  return session;
}

export function isPrivileged(session = getSession()) {
  return ['admin', 'payroll'].includes(session?.rol);
}

export function accessibleRoutes(session = getSession()) {
  return Object.keys(ROUTE_ROLES).filter((route) => canAccessRoute(route, session));
}

export { DEMO_USERS, ROUTE_ROLES, ROLE_LABELS };
