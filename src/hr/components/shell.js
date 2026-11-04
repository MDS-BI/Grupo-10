import { accessibleRoutes, roleLabel } from '../auth.js';
import { avatar, escapeHtml } from './ui.js';

const NAV_ITEMS = [
  { route: 'panel', label: 'Panel', icon: 'grid' },
  { route: 'departamentos', label: 'Departamentos', icon: 'building' },
  { route: 'cargos', label: 'Cargos', icon: 'briefcase' },
  { route: 'empleados', label: 'Empleados', icon: 'users' },
  { route: 'contratos', label: 'Contratos', icon: 'file' },
  { route: 'permisos', label: 'Permisos', icon: 'calendar' },
  { route: 'asistencia', label: 'Asistencia', icon: 'clock' },
  { route: 'nomina', label: 'Nómina', icon: 'wallet' },
  { route: 'beneficios', label: 'Beneficios', icon: 'gift' },
  { route: 'evaluaciones', label: 'Evaluaciones', icon: 'star' },
  { route: 'auditoria', label: 'Auditoría', icon: 'shield' },
  { route: 'usuarios', label: 'Usuarios', icon: 'users' },
  { route: 'busqueda', label: 'Buscar', icon: 'search' }
];

function icon(name) {
  const paths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    building: '<path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17"/><path d="M15 9h3a1 1 0 0 1 1 1v11"/><path d="M2 21h20"/><path d="M8 7h3M8 11h3M8 15h3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5a3 3 0 0 1 0 6"/><path d="M18 20a5 5 0 0 0-3-4.6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M16 12h2"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 13h18"/><path d="M12 8C9 8 7 6.7 7 5a2 2 0 0 1 3.6-1.2C11.4 4.7 12 6 12 8z"/><path d="M12 8c3 0 5-1.3 5-3a2 2 0 0 0-3.6-1.2C12.6 4.7 12 6 12 8z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'
  };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
}

export function shell(session, route, content) {
  const allowed = new Set(accessibleRoutes(session));
  const nav = NAV_ITEMS.filter((item) => allowed.has(item.route));
  return `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <a class="brand" href="#/panel" aria-label="Ir al panel">
          <span class="brand__mark">N</span>
          <span>
            <strong>Nexo</strong>
            <small>RRHH y Planilla</small>
          </span>
        </a>
        <nav class="sidebar__nav" aria-label="Navegación principal">
          ${nav
            .map(
              (item) => `
            <a class="nav-link ${route === item.route ? 'is-active' : ''}" href="#/${item.route}" ${route === item.route ? 'aria-current="page"' : ''}>
              ${icon(item.icon)}
              <span>${escapeHtml(item.label)}</span>
            </a>`
            )
            .join('')}
        </nav>
        <div class="sidebar__foot">
          <div class="sidebar-user">
            ${avatar(session.nombre, 'sm')}
            <div>
              <strong>${escapeHtml(session.nombre)}</strong>
              <span>${escapeHtml(roleLabel(session.rol))}</span>
            </div>
          </div>
          <button type="button" class="btn btn--ghost btn--block" id="logout-button">Cerrar sesión</button>
        </div>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <button type="button" class="icon-button" id="menu-button" aria-label="Abrir menú" aria-expanded="false">${icon('grid')}</button>
          <div class="topbar__title">
            <span class="topbar__eyebrow">Módulo de personas</span>
            <strong>${escapeHtml(NAV_ITEMS.find((item) => item.route === route)?.label || 'Panel')}</strong>
          </div>
          <div class="global-search">
            <label class="global-search__field">
              <span class="sr-only">Buscar empleados, departamentos o cargos</span>
              ${icon('search')}
              <input id="global-search" type="search" placeholder="Buscar personas, áreas o cargos…" autocomplete="off">
            </label>
            <div class="search-results" id="search-results" hidden></div>
          </div>
          <span class="role-pill">${escapeHtml(roleLabel(session.rol))}</span>
        </header>
        <main class="content" id="main-content" tabindex="-1">
          ${content}
        </main>
        <footer class="app-footer">
          <span>Nexo RRHH · Datos almacenados localmente</span>
          <span>Período de demostración 2026</span>
        </footer>
      </div>
    </div>
  `;
}

export function bindShell(root, { onLogout, onSearch, onNavigate }) {
  root.querySelector('#logout-button')?.addEventListener('click', onLogout);
  const sidebar = root.querySelector('#sidebar');
  const menuButton = root.querySelector('#menu-button');
  menuButton?.addEventListener('click', () => {
    const open = sidebar.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  const search = root.querySelector('#global-search');
  const results = root.querySelector('#search-results');
  let timeout;
  search?.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const query = search.value.trim();
      if (!query) {
        results.hidden = true;
        results.innerHTML = '';
        return;
      }
      const matches = onSearch(query);
      if (!matches.length) {
        results.hidden = false;
        results.innerHTML = '<p class="search-results__empty">Sin coincidencias.</p>';
        return;
      }
      results.hidden = false;
      results.innerHTML = matches
        .map(
          (match) => `
          <button type="button" class="search-result" data-route="${escapeHtml(match.ruta)}" data-id="${escapeHtml(match.id)}">
            <span class="search-result__type">${escapeHtml(match.tipo)}</span>
            <strong>${escapeHtml(match.titulo)}</strong>
            <small>${escapeHtml(match.subtitulo)}</small>
          </button>`
        )
        .join('');
      results.querySelectorAll('.search-result').forEach((button) => {
        button.addEventListener('click', () => {
          results.hidden = true;
          search.value = '';
          onNavigate(button.dataset.route, button.dataset.id);
        });
      });
    }, 180);
  });
  search?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      results.hidden = true;
      search.value = '';
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.global-search')) {
      if (results) results.hidden = true;
    }
  });
}
