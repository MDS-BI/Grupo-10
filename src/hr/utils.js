const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function parseNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const normalized = String(value).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : fallback;
}

export function formatCLP(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '$0';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(number);
}

export function formatNumber(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(number);
}

export function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidISODate(value) {
  if (!DATE_RE.test(String(value || ''))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function formatDate(value) {
  if (!value) return 'Sin fecha';
  const raw = String(value).slice(0, 10);
  if (!isValidISODate(raw)) return String(value);
  const [year, month, day] = raw.split('-');
  return `${day}/${month}/${year}`;
}

export function daysBetweenInclusive(start, end) {
  if (!isValidISODate(start) || !isValidISODate(end)) return 0;
  const startDate = Date.UTC(...start.split('-').map((part, index) => Number(part) - (index === 1 ? 1 : 0)));
  const endDate = Date.UTC(...end.split('-').map((part, index) => Number(part) - (index === 1 ? 1 : 0)));
  return Math.floor((endDate - startDate) / 86400000) + 1;
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !bStart) return false;
  const aFinish = aEnd || '9999-12-31';
  const bFinish = bEnd || '9999-12-31';
  return aStart <= bFinish && bStart <= aFinish;
}

export function isDateWithin(date, start, end) {
  return date >= start && date <= (end || '9999-12-31');
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function monthLabel(isoDate) {
  if (!isValidISODate(isoDate)) return '';
  return isoDate.slice(0, 7);
}

export function monthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return null;
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`
  };
}

export function timeToMinutes(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function hoursBetween(entry, exit) {
  const start = timeToMinutes(entry);
  const end = timeToMinutes(exit);
  if (start === null || end === null) return 0;
  return Math.round(((end - start) / 60) * 100) / 100;
}

export function createId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
