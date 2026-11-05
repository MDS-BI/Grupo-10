import { ROLE_LABELS, modulesForRole } from '../auth.js';
import { escapeHtml } from '../utils.js';

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>',
  building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path><path d="M16 9h3a1 1 0 0 1 1 1v11"></path><path d="M8 7h4M8 11h4M8 15h4M8 19h4"></path>',
  badge: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="9" cy="11" r="2"></circle><path d="M6 17c.6-1.5 1.7-2.3 3-2.3s2.4.8 3 2.3"></path><path d="M15 9h3M15 13h3"></path>',
  users: '<circle cx="9" cy="8" r="3.2"></circle><path d="M3.5 20c.7-3.2 2.8-5 5.5-5s4.8 1.8 5.5 5"></path><path d="M16 5.5a3 3 0 0 1 0 5.8"></path><path d="M17.3 15.2c1.9.5 3.1 2.1 3.5 4.8"></path>',
  file: '<path d="M6 3h8l4 4v14H6z"></path><path d="M14 3v4h4"></path><path d="M9 12h6M9 16h6"></path>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M3 10h18"></path><path d="M8 14h3M8 17h3M14 14h2"></path>',
  clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3.5 2"></path>',
  coins: '<ellipse cx="12" cy="6" rx="7" ry="3"></ellipse><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"></path><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"></path>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"></path><path d="M9 8h6M9 12h6M9 16h4"></path>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="2"></rect><path d="M3 12h18M12 8v13"></path><path d="M12 8C10 8 7 7 7 5s4-2 5 3c1-5 5-5 5-3s-3 3-5 3z"></path>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"></path>',
  user: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c.8-4 3.6-6 8-6s7.2 2 8 6"></path>',
  shield: '<path d="M12 3 5 6v6c0 4.3 3 7.5 7 9 4-1.5 7-4.7 7-9V6z"></path><path d="m9 12 2 2 4-4"></path>',
  logout: '<path d="M9 4H5v16h4"></path><path d="M14 8l4 4-4 4M18 12H9"></path>'
};

export function icon(name, size = 18) {
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.grid}</svg>`;
}

export function renderLogin() {
  return `
    <main class="login-screen">
      <section class="login-card">
        <div class="login-brand">
          <span class="brand-mark">RR</span>
          <div>
            <h1>RRHH y Planilla</h1>
            <p>Prototipo ERP de Recursos Humanos</p>
          </div>
        </div>
        <p class="login-intro">
          Seleccione un usuario de demostracion para ingresar. Cada perfil aplica permisos
          distintos sobre pantallas, acciones y datos sensibles.
        </p>
        <div id="login-feedback" class="feedback-slot" role="alert"></div>
        <div class="demo-users" id="demo-users">
          ${['admin_rrhh', 'nomina', 'jefatura', 'empleado']
            .map(
              (role) => `
                <section class="demo-role">
                  <h2>${escapeHtml(ROLE_LABELS[role])}</h2>
                  <div class="demo-user-list">
                    ${modulesShellUsers(role)}
                  </div>
                </section>
              `
            )
            .join('')}
        </div>
        <footer class="login-footer">
          <span>Datos almacenados solo en este navegador.</span>
          <button type="button" class="link-button" data-reset-demo="login">Restablecer datos demo</button>
        </footer>
      </section>
    </main>
  `;
}

function modulesShellUsers(role) {
  // Se completa desde app.js para evitar dependencias circulares con storage.
  return `<div class="demo-user-slot" data-demo-role="${role}"></div>`;
}

export function renderShell(user, activeModule, content) {
  const modules = modulesForRole(user.rol);
  const nav = modules
    .map(
      (module) => `
        <button
          type="button"
          class="nav-module ${module.id === activeModule ? 'active' : ''}"
          data-module="${module.id}"
          id="nav-${module.id}"
          ${module.id === activeModule ? 'aria-current="page"' : ''}
        >
          ${icon(module.icon)}
          <span class="nav-label">${escapeHtml(module.label)}</span>
        </button>
      `
    )
    .join('');

  return `
    <div class="workspace">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">RR</span>
          <div class="brand-text">
            <strong>RRHH y Planilla</strong>
            <small>Modulo ERP</small>
          </div>
        </div>
        <div class="topbar-actions">
          <div class="session-info">
            <span class="session-name">${escapeHtml(user.nombre)}</span>
            <span class="role-chip">${escapeHtml(ROLE_LABELS[user.rol] || user.rol)}</span>
          </div>
          <button type="button" class="icon-button" id="logout-button" title="Cerrar sesion" aria-label="Cerrar sesion">
            ${icon('logout')}
          </button>
        </div>
      </header>
      <aside class="sidebar" aria-label="Modulos del sistema">
        <nav class="side-nav">${nav}</nav>
        ${
          user.rol === 'admin_rrhh'
            ? `<div class="sidebar-footer">
                 <button type="button" class="link-button" data-reset-demo="app">Restablecer datos demo</button>
               </div>`
            : ''
        }
      </aside>
      <main class="main-content" id="main-content">
        ${content}
      </main>
    </div>
  `;
}

export function renderAccessDenied(user) {
  return `
    <section class="denied-panel">
      <h1>Acceso denegado</h1>
      <p>
        Su rol <strong>${escapeHtml(ROLE_LABELS[user?.rol] || 'sin rol')}</strong> no tiene permiso
        para ver esta pantalla. El intento de acceso directo fue bloqueado y no se exponen datos.
      </p>
      <button type="button" class="btn btn-primary" data-module="dashboard">Volver al panel</button>
    </section>
  `;
}
