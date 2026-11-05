import { loadAudit } from '../audit.js';
import { escapeHtml, formatDate } from '../utils.js';
import { card, pageHeader, table } from './ui.js';

export function render(container) {
  const entries = loadAudit();

  container.innerHTML = `
    ${pageHeader('Auditoria', 'Registro de acciones sensibles sobre salarios, datos bancarios, roles y nomina.')}
    ${card(
      'Eventos registrados',
      table(
        [
          {
            label: 'Fecha',
            render: (entry) =>
              `${escapeHtml(formatDate(entry.fecha))} ${escapeHtml(String(entry.fecha).slice(11, 16))}`
          },
          { label: 'Usuario', render: (entry) => escapeHtml(entry.usuario) },
          { label: 'Rol', render: (entry) => escapeHtml(entry.rol) },
          { label: 'Accion', render: (entry) => escapeHtml(entry.accion) },
          { label: 'Entidad', render: (entry) => escapeHtml(entry.entidad) },
          { label: 'Detalle', render: (entry) => escapeHtml(entry.detalle) }
        ],
        entries,
        'Aun no hay eventos de auditoria.'
      ),
      { actions: `<span class="count-pill">${entries.length}</span>` }
    )}
  `;
}
