import { searchAll } from '../search.js';
import {
  emptyState,
  escapeHtml,
  pageHeader,
  query,
  sectionCard,
  showToast
} from './ui.js';

let term = '';

export function render(context) {
  const requested = context.params.get('q');
  if (requested !== null && requested !== undefined) term = requested;
  const results = term ? searchAll(term, context.session) : [];
  const grouped = results.reduce((groups, result) => {
    groups[result.tipo] = groups[result.tipo] || [];
    groups[result.tipo].push(result);
    return groups;
  }, {});

  return `
    ${pageHeader(
      'Buscar',
      'Encuentra personas, áreas y cargos en todo el módulo.',
      '<span class="muted">Resultados según tus permisos</span>'
    )}
    ${sectionCard(
      'Búsqueda global',
      `<form id="search-page-form" class="search-page-form">
        <label class="search-page-form__field">
          <span class="sr-only">Término de búsqueda</span>
          <input class="input" type="search" name="q" value="${escapeHtml(term)}" placeholder="Nombre, RUT, correo, departamento o cargo…" autofocus>
        </label>
        <button class="btn btn--primary" type="submit">Buscar</button>
      </form>
      ${
        term
          ? results.length
            ? Object.entries(grouped)
                .map(
                  ([type, items]) => `
                <div class="search-group">
                  <h3>${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))}s</h3>
                  <div class="search-result-grid">
                    ${items
                      .map(
                        (item) => `
                      <a class="search-result-card" href="#/${item.ruta}${item.tipo === 'empleado' ? `/${item.id}` : ''}">
                        <span class="search-result__type">${escapeHtml(item.tipo)}</span>
                        <strong>${escapeHtml(item.titulo)}</strong>
                        <small>${escapeHtml(item.subtitulo)}</small>
                      </a>`
                      )
                      .join('')}
                  </div>
                </div>`
                )
                .join('')
            : emptyState('Sin coincidencias', `No encontramos resultados para "${term}".`)
          : `<div class="quick-grid">
              <a class="quick-action" href="#/empleados"><strong>Personas</strong><span>Fichas y contratos</span></a>
              <a class="quick-action" href="#/departamentos"><strong>Departamentos</strong><span>Estructura y jefaturas</span></a>
              <a class="quick-action" href="#/cargos"><strong>Cargos</strong><span>Niveles y asignación</span></a>
              <a class="quick-action" href="#/nomina"><strong>Nómina</strong><span>Períodos y liquidaciones</span></a>
            </div>`
      }`
    )}
  `;
}

export function bind(root, context) {
  query('#search-page-form', root)?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = new FormData(event.target).get('q') || '';
    term = String(value).trim();
    if (!term) {
      showToast('Escribe un término para buscar.', 'info');
    }
    context.refresh();
  });
}
