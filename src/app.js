import {
  canAccessRoute,
  getDemoUsers,
  getSession,
  login,
  logout,
  roleLabel
} from './hr/auth.js';
import { loadEmployees } from './hr/storage.js';
import { searchAll } from './hr/search.js';
import { shell, bindShell } from './hr/components/shell.js';
import { escapeHtml, showToast } from './hr/components/ui.js';
import * as dashboard from './hr/components/dashboard.js';
import * as departments from './hr/components/departments.js';
import * as positions from './hr/components/positions.js';
import * as employees from './hr/components/employees.js';
import * as contracts from './hr/components/contracts.js';
import * as permissions from './hr/components/permissions.js';
import * as attendance from './hr/components/attendance.js';
import * as payroll from './hr/components/payroll-view.js';
import * as benefits from './hr/components/benefits.js';
import * as evaluations from './hr/components/evaluations.js';
import * as audit from './hr/components/audit-view.js';
import * as users from './hr/components/users.js';
import * as search from './hr/components/search-view.js';

const COMPONENTS = {
  panel: dashboard,
  departamentos: departments,
  cargos: positions,
  empleados: employees,
  contratos: contracts,
  permisos: permissions,
  asistencia: attendance,
  nomina: payroll,
  beneficios: benefits,
  evaluaciones: evaluations,
  auditoria: audit,
  usuarios: users,
  busqueda: search
};

function parseRoute() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const [routePart, idPart] = (pathPart || 'panel').split('/');
  return {
    route: routePart || 'panel',
    id: idPart || null,
    params: new URLSearchParams(queryPart || '')
  };
}

export function navigate(route, id = null) {
  const target = `#/${route}${id ? `/${id}` : ''}`;
  if (window.location.hash === target) {
    render();
  } else {
    window.location.hash = target;
  }
}

function loginView() {
  const demoUsers = getDemoUsers();
  return `
    <main class="login-shell">
      <section class="login-brand">
        <div class="brand brand--large">
          <span class="brand__mark">N</span>
          <span>
            <strong>Nexo</strong>
            <small>RRHH y Planilla</small>
          </span>
        </div>
        <div class="login-brand__copy">
          <p class="eyebrow">Gestión de personas</p>
          <h1>Una vista clara de tu equipo, tu nómina y tu operación.</h1>
          <p>Administra el ciclo laboral completo: estructura, contratos, permisos, asistencia, remuneraciones, beneficios y desempeño, en un solo lugar.</p>
        </div>
        <div class="login-brand__stats">
          <article><strong>14</strong><span>entidades integradas</span></article>
          <article><strong>11</strong><span>flujos de trabajo</span></article>
          <article><strong>100%</strong><span>local y trazable</span></article>
        </div>
      </section>
      <section class="login-panel">
        <div class="login-card">
          <p class="eyebrow">Acceso al módulo</p>
          <h2>Inicia sesión</h2>
          <p class="muted">Usa una de las cuentas de demostración para explorar cada rol.</p>
          <form id="login-form" class="form-stack" novalidate>
            <label class="field">
              <span class="field__label">Correo o usuario</span>
              <input class="input" type="text" name="identifier" id="login-identifier" autocomplete="username" required placeholder="admin@empresa.cl">
            </label>
            <label class="field">
              <span class="field__label">Contraseña</span>
              <input class="input" type="password" name="password" id="login-password" autocomplete="current-password" required placeholder="••••••••">
            </label>
            <div id="login-error" class="alert alert--danger" role="alert" hidden></div>
            <button class="btn btn--primary btn--block" type="submit">Ingresar</button>
          </form>
          <div class="demo-accounts">
            <h3>Cuentas de demostración</h3>
            ${demoUsers
              .map(
                (user) => `
              <button type="button" class="demo-account" data-email="${escapeHtml(user.email)}" data-password="${escapeHtml(
                user.email === 'admin@empresa.cl'
                  ? 'admin123'
                  : user.email === 'felipe.vera@empresa.cl'
                    ? 'nomina123'
                    : user.rol === 'supervisor'
                      ? 'super123'
                      : 'empleado123'
              )}">
                <span>
                  <strong>${escapeHtml(user.nombre)}</strong>
                  <small>${escapeHtml(user.email)}</small>
                </span>
                <span class="badge badge--neutral">${escapeHtml(roleLabel(user.rol))}</span>
              </button>`
              )
              .join('')}
          </div>
          <p class="login-footnote">Datos de demostración. No uses información real en este entorno.</p>
        </div>
      </section>
    </main>
  `;
}

function bindLogin(root) {
  const form = root.querySelector('#login-form');
  const error = root.querySelector('#login-error');
  root.querySelectorAll('.demo-account').forEach((button) => {
    button.addEventListener('click', () => {
      root.querySelector('#login-identifier').value = button.dataset.email;
      root.querySelector('#login-password').value = button.dataset.password;
      root.querySelector('#login-password').focus();
    });
  });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    error.hidden = true;
    const values = new FormData(form);
    try {
      login(values.get('identifier'), values.get('password'));
      if (!window.location.hash || window.location.hash === '#/') {
        window.location.hash = '#/panel';
      }
      render();
    } catch (loginError) {
      error.textContent = loginError.message;
      error.hidden = false;
    }
  });
}

function accessDenied(route) {
  return `
    <div class="access-denied">
      <p class="eyebrow">Acceso restringido</p>
      <h1>No tienes permisos para ver este módulo.</h1>
      <p>La ruta <code>${escapeHtml(route)}</code> está reservada para otro rol. Si necesitas acceso, solicita permisos a un administrador.</p>
      <a class="btn btn--primary" href="#/panel">Volver al panel</a>
    </div>
  `;
}

export function render() {
  const root = document.getElementById('app');
  if (!root) return;
  loadEmployees();
  const session = getSession();
  if (!session) {
    root.innerHTML = loginView();
    bindLogin(root);
    return;
  }

  const parsed = parseRoute();
  const route = COMPONENTS[parsed.route] ? parsed.route : 'panel';
  const component = COMPONENTS[route];
  const context = {
    session,
    route,
    id: parsed.id,
    params: parsed.params,
    navigate,
    refresh: render,
    roleLabel
  };

  let content = '';
  if (!canAccessRoute(route, session)) {
    content = accessDenied(route);
  } else {
    content = component.render(context);
  }

  root.innerHTML = shell(session, route, content);
  bindShell(root, {
    onLogout: () => {
      logout();
      window.location.hash = '#/';
      render();
      showToast('Sesión cerrada.', 'info');
    },
    onSearch: (query) => searchAll(query, session),
    onNavigate: navigate
  });

  const main = root.querySelector('#main-content');
  if (canAccessRoute(route, session) && component.bind) {
    component.bind(main, context);
  }
}

export function boot() {
  if (!window.location.hash) {
    window.location.hash = '#/panel';
  }
  window.addEventListener('hashchange', render);
  render();
}

if (typeof window !== 'undefined') {
  window.__hrApp = { render, navigate };
}
