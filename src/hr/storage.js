import { SEED } from '../data/seed.js';

export const KEYS = {
  departamentos: 'hr.departamentos',
  cargos: 'hr.cargos',
  empleados: 'hr.empleados',
  contratos: 'hr.contratos',
  beneficios: 'hr.beneficios',
  beneficiosEmpleado: 'hr.beneficiosEmpleado',
  asistencia: 'hr.asistencia',
  tiposPermiso: 'hr.tiposPermiso',
  solicitudesPermiso: 'hr.solicitudesPermiso',
  periodosNomina: 'hr.periodosNomina',
  conceptosNomina: 'hr.conceptosNomina',
  liquidaciones: 'hr.liquidaciones',
  detallesLiquidacion: 'hr.detallesLiquidacion',
  evaluaciones: 'hr.evaluaciones',
  usuarios: 'hr.usuarios',
  solicitudesBanco: 'hr.solicitudesBanco',
  auditoria: 'hr.auditoria',
  sesion: 'hr.sesion'
};

export const PRIMARY_KEYS = {
  departamentos: 'departamento_id',
  cargos: 'cargo_id',
  empleados: 'empleado_id',
  contratos: 'contrato_id',
  beneficios: 'beneficio_id',
  beneficiosEmpleado: 'beneficio_empleado_id',
  asistencia: 'asistencia_id',
  tiposPermiso: 'tipo_permiso_id',
  solicitudesPermiso: 'solicitud_permiso_id',
  periodosNomina: 'periodo_nomina_id',
  conceptosNomina: 'concepto_id',
  liquidaciones: 'liquidacion_id',
  detallesLiquidacion: 'detalle_liquidacion_id',
  evaluaciones: 'evaluacion_id',
  usuarios: 'usuario_id',
  solicitudesBanco: 'solicitud_banco_id',
  auditoria: 'auditoria_id'
};

const CORE_COLLECTIONS = Object.keys(PRIMARY_KEYS);

function getStorage() {
  return globalThis.localStorage;
}

function resolveKey(name) {
  if (!name) throw new Error('Coleccion requerida');
  return KEYS[name] || name;
}

function collectionName(name) {
  if (KEYS[name]) return name;
  const entry = Object.entries(KEYS).find(([, key]) => key === name);
  return entry ? entry[0] : name;
}

export function loadCollection(name) {
  const storage = getStorage();
  if (!storage) return [];
  const raw = storage.getItem(resolveKey(name));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function saveCollection(name, items) {
  const storage = getStorage();
  if (!storage) return [];
  const value = Array.isArray(items) ? items : [];
  storage.setItem(resolveKey(name), JSON.stringify(value));
  return value;
}

export function findById(name, id) {
  return loadCollection(name).find((item) => String(item[PRIMARY_KEYS[collectionName(name)]]) === String(id)) || null;
}

export function nextId(name) {
  const collection = collectionName(name);
  const pk = PRIMARY_KEYS[collection];
  if (!pk) throw new Error(`Coleccion sin clave primaria: ${name}`);
  const items = loadCollection(collection);
  const max = items.reduce((highest, item) => {
    const value = Number(item[pk]);
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return max + 1;
}

export function addItem(name, item) {
  const collection = collectionName(name);
  const pk = PRIMARY_KEYS[collection];
  const items = loadCollection(collection);
  const now = new Date().toISOString();
  const record = { ...item };
  if (!record[pk]) record[pk] = nextId(collection);
  if (record.createdAt === undefined) record.createdAt = now;
  record.updatedAt = now;
  items.push(record);
  saveCollection(collection, items);
  return record;
}

export function updateItem(name, id, changes) {
  const collection = collectionName(name);
  const pk = PRIMARY_KEYS[collection];
  const items = loadCollection(collection);
  const index = items.findIndex((item) => String(item[pk]) === String(id));
  if (index === -1) return null;
  const updated = { ...items[index], ...changes, updatedAt: new Date().toISOString() };
  updated[pk] = items[index][pk];
  items[index] = updated;
  saveCollection(collection, items);
  return updated;
}

export function deleteItem(name, id) {
  const collection = collectionName(name);
  const pk = PRIMARY_KEYS[collection];
  const items = loadCollection(collection);
  const filtered = items.filter((item) => String(item[pk]) !== String(id));
  const removed = filtered.length !== items.length;
  if (removed) saveCollection(collection, filtered);
  return removed;
}

export function resetSeed() {
  CORE_COLLECTIONS.forEach((collection) => {
    const seedValue = SEED[collection];
    saveCollection(collection, seedValue ? JSON.parse(JSON.stringify(seedValue)) : []);
  });
}

export function ensureSeed() {
  const storage = getStorage();
  if (!storage) return;
  const hasSeed = CORE_COLLECTIONS.every((collection) => storage.getItem(KEYS[collection]) !== null);
  if (!hasSeed) resetSeed();
}

export function clearAll() {
  const storage = getStorage();
  if (!storage) return;
  Object.values(KEYS).forEach((key) => storage.removeItem(key));
}

export function loadSession() {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(KEYS.sesion);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function saveSession(session) {
  const storage = getStorage();
  if (!storage) return null;
  storage.setItem(KEYS.sesion, JSON.stringify(session));
  return session;
}

export function clearSession() {
  const storage = getStorage();
  if (storage) storage.removeItem(KEYS.sesion);
}

export function isStorageAvailable() {
  try {
    const storage = getStorage();
    if (!storage) return false;
    const probe = '__hr_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch (error) {
    return false;
  }
}
