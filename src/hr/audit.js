import { addItem, loadCollection } from './storage.js';

export function audit(action, entity, detail, actor) {
  return addItem('auditoria', {
    usuario: actor?.nombre || actor?.usuario_nombre || 'Sistema',
    rol: actor?.rol || 'sistema',
    accion: action,
    entidad: entity,
    detalle: detail,
    fecha: new Date().toISOString()
  });
}

export function loadAudit() {
  return [...loadCollection('auditoria')].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}
