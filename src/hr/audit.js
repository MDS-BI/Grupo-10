import { readRaw, writeRaw, removeRaw } from './storage-core.js';
import { nowISO, safeJsonParse } from './utils.js';

export const AUDIT_KEY = 'hr.auditoria';
export const SESSION_KEY = 'hr.sesion';

export function loadAudit() {
  const entries = safeJsonParse(readRaw(AUDIT_KEY), []);
  return Array.isArray(entries) ? entries : [];
}

export function saveAudit(entries) {
  writeRaw(AUDIT_KEY, JSON.stringify(entries));
}

export function logAudit({ usuario, accion, entidad, entidad_id = null, detalle = '' }) {
  const session = safeJsonParse(readRaw(SESSION_KEY), null);
  const entries = loadAudit();
  const nextId = entries.reduce((max, item) => Math.max(max, Number(item.auditoria_id) || 0), 0) + 1;
  const entry = {
    auditoria_id: nextId,
    usuario: usuario || session?.email || session?.rol || 'sistema',
    accion,
    entidad,
    entidad_id,
    detalle,
    fecha: nowISO()
  };
  entries.push(entry);
  saveAudit(entries.slice(-500));
  return entry;
}

export function clearAudit() {
  removeRaw(AUDIT_KEY);
}

export function auditFor(entidad, entidadId) {
  return loadAudit().filter(
    (entry) => entry.entidad === entidad && String(entry.entidad_id) === String(entidadId)
  );
}
