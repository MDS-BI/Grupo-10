import { loadAudit } from '../audit.js';
import {
  badge,
  dateTime,
  emptyState,
  escapeHtml,
  pageHeader,
  query,
  sectionCard,
  select,
  formValues,
  table
} from './ui.js';

let entityFilter = '';
let actionFilter = '';

export function render() {
  const entries = loadAudit()
    .filter((entry) => !entityFilter || entry.entidad === entityFilter)
    .filter((entry) => !actionFilter || entry.accion === actionFilter)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const entities = [...new Set(loadAudit().map((entry) => entry.entidad))].sort();
  const actions = [...new Set(loadAudit().map((entry) => entry.accion))].sort();

  const rows = entries.slice(0, 200).map((entry) => `<tr>
    <td>${dateTime(entry.fecha)}</td>
    <td><strong>${escapeHtml(entry.usuario)}</strong></td>
    <td>${badge(entry.accion, 'info')}</td>
    <td>${escapeHtml(entry.entidad)}${entry.entidad_id ? ` #${escapeHtml(entry.entidad_id)}` : ''}</td>
    <td>${escapeHtml(entry.detalle || '—')}</td>
  </tr>`);

  return `
    ${pageHeader(
      'Auditoría',
      'Trazabilidad de altas, cambios, aprobaciones y procesos sensibles.',
      '<span class="muted">Registro local de solo lectura</span>'
    )}
    ${sectionCard(
      'Bitácora de eventos',
      `<form id="audit-filters" class="toolbar">
        <label class="toolbar__field">
          <span>Entidad</span>
          ${select('entity', entities, entityFilter, { placeholder: 'Todas las entidades' })}
        </label>
        <label class="toolbar__field">
          <span>Acción</span>
          ${select('action', actions, actionFilter, { placeholder: 'Todas las acciones' })}
        </label>
        <button class="btn btn--ghost btn--sm" type="submit">Filtrar</button>
        <span class="muted">${entries.length} evento(s)</span>
      </form>
      ${table(['Fecha', 'Usuario', 'Acción', 'Entidad', 'Detalle'], rows, 'No hay eventos para el filtro seleccionado.')}`
    )}
    ${
      entries.length
        ? ''
        : emptyState(
            'Bitácora vacía',
            'Los eventos de auditoría aparecerán a medida que se realicen cambios.'
          )
    }
  `;
}

export function bind(root, context) {
  query('#audit-filters', root)?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(event.target);
    entityFilter = values.entity || '';
    actionFilter = values.action || '';
    context.refresh();
  });
}
