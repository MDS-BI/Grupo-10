const CURRENCIES = ['CLP', 'USD', 'UF'];
const EMPLOYMENT_STATES = ['Activo', 'Con licencia', 'Desvinculado'];
const CONTRACT_TYPES = ['Indefinido', 'Plazo fijo', 'Honorarios'];
const PERMISSION_STATES = ['Pendiente', 'Aprobada', 'Rechazada'];
const VALIDATION_STATES = ['Pendiente', 'Aprobado', 'Rechazado'];
const PAYROLL_STATES = ['Borrador', 'Calculado', 'Aprobado', 'Cerrado'];
const ROLES = ['admin', 'payroll', 'supervisor', 'employee'];

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatCLP(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(number);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function nowISO() {
  return new Date().toISOString();
}

export function toISODate(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${toISODate(value)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidDate(value) {
  return Boolean(parseDate(value));
}

export function dateInRange(date, start, end) {
  const target = toISODate(date);
  if (!target) return false;
  const startValue = toISODate(start);
  const endValue = toISODate(end);
  return (!startValue || target >= startValue) && (!endValue || target <= endValue);
}

export function rangesOverlap(startA, endA, startB, endB) {
  const aStart = toISODate(startA);
  const aEnd = toISODate(endA) || '9999-12-31';
  const bStart = toISODate(startB);
  const bEnd = toISODate(endB) || '9999-12-31';
  if (!aStart || !bStart) return false;
  return aStart <= bEnd && bStart <= aEnd;
}

export function daysBetweenInclusive(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return 0;
  const diff = Math.floor((endDate - startDate) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function isBlank(value) {
  return String(value ?? '').trim() === '';
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function assert(condition, message) {
  if (!condition) {
    const error = new Error(message);
    error.name = 'ValidationError';
    throw error;
  }
}

export function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CL');
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export {
  CURRENCIES,
  EMPLOYMENT_STATES,
  CONTRACT_TYPES,
  PERMISSION_STATES,
  VALIDATION_STATES,
  PAYROLL_STATES,
  ROLES
};
