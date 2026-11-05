import {
  canAccessModule,
  currentUser,
  listUsers,
  login,
  logout
} from './hr/auth.js';
import { ensureSeed, resetSeed } from './hr/storage.js';
import { escapeHtml } from './hr/utils.js';
import {
  renderAccessDenied,
  renderLogin,
  renderShell
} from './hr/components/shell.js';
import * as dashboard from './hr/components/dashboard.js';
import * as departments from './hr/components/departments.js';
import * as positions from './hr/components/positions.js';
import * as employees from './hr/components/employees.js';
import * as contracts from './hr/components/contracts.js';
import * as permissions from './hr/components/permissions.js';
import * as attendance from './hr/components/attendance.js';
import * as payrollView from './hr/components/payroll-view.js';
import * as payslips from './hr/components/payslips.js';
import * as benefits from './hr/components/benefits.js';
import * as evaluations from './hr/components/evaluations.js';
import * as profile from './hr/components/profile.js';
import * as auditView from './hr/components/audit-view.js';

const VIEWS = {
  dashboard,
  departamentos: departments,
  cargos: positions,
  empleados: employees,
  contratos: contracts,
  permisos: permissions,
  asistencia: attendance,
  nomina: payrollView,
  papeletas: payslips,
  beneficios: benefits,
  evaluaciones: evaluations,
  perfil: profile,
  auditoria: auditView
};

const state = {
  root: null,
  user: null,
  route: 'dashboard',
  boundRoot: null,
  hashBound: false
};

function parseRoute() {
  const raw = String(globalThis.location?.hash || '').replace(/^#\/?/, '');
  const route = raw.split('?')[0] || 'dashboard';
  return VIEWS[route] ? route : 'dashboard';
}

function setHash(route) {
  const target = `#/${route}`;
  if (globalThis.location && globalThis.location.hash !== target) {
    globalThis.location.hash = target;
  }
}

function fillLoginUsers() {
  const users = listUsers();
  const groups = {
    admin_rrhh: users.filter((user) => user.rol === 'admin_rrhh'),
    nomina: users.filter((user) => user.rol === 'nomina'),
    jefatura: users.filter((user) => user.rol === 'jefatura'),
    empleado: users.filter((user) => user.rol === 'empleado')
  };
  Object.entries(groups).forEach(([role, roleUsers]) => {
    const slot = state.root.querySelector(`[data-demo-role="${role}"]`);
    if (!slot) return;
    if (!roleUsers.length) {
      slot.innerHTML = '<p class="muted small">Sin usuario demo para este rol.</p>';
      return;
    }
    slot.innerHTML = roleUsers
      .map(
        (user) => `
          <button type="button" class="demo-user" data-login="${user.usuario_id}">
            <span class="demo-avatar">${escapeHtml(
              user.nombre
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
            )}</span>
            <span>
              <strong>${escapeHtml(user.nombre)}</strong>
              <small>${escapeHtml(user.correo_electronico)}</small>
            </span>
          </button>
        `
      )
      .join('');
  });
}

function renderLoginScreen() {
  state.root.innerHTML = renderLogin();
  fillLoginUsers();
}

function renderRoute() {
  if (!state.user) {
    renderLoginScreen();
    return;
  }
  const route = state.route;
  if (!VIEWS[route] || !canAccessModule(route, state.user)) {
    state.root.innerHTML = renderShell(state.user, 'dashboard', renderAccessDenied(state.user));
    return;
  }
  state.root.innerHTML = renderShell(state.user, route, '<div id="view-root"></div>');
  const viewRoot = state.root.querySelector('#view-root');
  const view = VIEWS[route];
  view.render(viewRoot, {
    user: state.user,
    navigate,
    refresh,
    resetDemo
  });
}

export function navigate(moduleId) {
  if (!state.user) return;
  if (!VIEWS[moduleId] || !canAccessModule(moduleId, state.user)) {
    state.route = 'dashboard';
    setHash('dashboard');
    renderRoute();
    return;
  }
  state.route = moduleId;
  setHash(moduleId);
  renderRoute();
}

export function refresh() {
  renderRoute();
}

function resetDemo() {
  const confirmed =
    typeof globalThis.confirm === 'function'
      ? globalThis.confirm('Se restableceran todos los datos demo. ¿Continuar?')
      : true;
  if (!confirmed) return;
  resetSeed();
  if (!state.user) {
    renderLoginScreen();
    return;
  }
  refresh();
}

function handleLogin(usuarioId) {
  const outcome = login(usuarioId);
  if (!outcome.ok) {
    const feedbackSlot = state.root.querySelector('#login-feedback');
    if (feedbackSlot) {
      feedbackSlot.innerHTML = `<div class="feedback feedback-error" role="alert">${escapeHtml(outcome.reason)}</div>`;
    }
    return;
  }
  state.user = outcome.session;
  state.route = 'dashboard';
  setHash('dashboard');
  renderRoute();
}

function bindEvents() {
  if (state.boundRoot === state.root) return;
  state.boundRoot = state.root;

  state.root.addEventListener('click', (event) => {
    const loginButton = event.target.closest('[data-login]');
    if (loginButton) {
      handleLogin(loginButton.dataset.login);
      return;
    }
    if (event.target.closest('#logout-button')) {
      logout();
      state.user = null;
      if (globalThis.location) globalThis.location.hash = '';
      renderLoginScreen();
      return;
    }
    const resetButton = event.target.closest('[data-reset-demo]');
    if (resetButton) {
      resetDemo();
      return;
    }
    const moduleButton = event.target.closest('[data-module]');
    if (moduleButton && !moduleButton.disabled) {
      navigate(moduleButton.dataset.module);
    }
  });

  if (!state.hashBound) {
    state.hashBound = true;
    globalThis.addEventListener?.('hashchange', () => {
      if (!state.user) return;
      const route = parseRoute();
      if (route !== state.route) {
        state.route = route;
        renderRoute();
      }
    });
  }
}

export function initApp(rootElement) {
  state.root = rootElement || globalThis.document?.getElementById('app');
  if (!state.root) throw new Error('No se encontro el contenedor #app.');
  ensureSeed();
  state.user = currentUser();
  state.route = parseRoute();
  bindEvents();
  if (state.user) {
    state.route = canAccessModule(state.route, state.user) ? state.route : 'dashboard';
    setHash(state.route);
    renderRoute();
  } else {
    renderLoginScreen();
  }
  return state;
}

export function getState() {
  return state;
}
