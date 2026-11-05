import { normalizeText } from './utils.js';

export function filterByText(items, term, fields) {
  const query = normalizeText(term);
  if (!query) return [...items];
  const keys = Array.isArray(fields) ? fields : [fields];
  return items.filter((item) =>
    keys.some((field) => normalizeText(item[field]).includes(query))
  );
}

export function filterByValue(items, field, value) {
  if (!value) return [...items];
  return items.filter((item) => String(item[field]) === String(value));
}

export function sortBy(items, field, direction = 'asc') {
  const factor = direction === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const left = a[field];
    const right = b[field];
    if (left === right) return 0;
    if (left === null || left === undefined) return 1;
    if (right === null || right === undefined) return -1;
    return left < right ? -1 * factor : 1 * factor;
  });
}

export function filterRecords(items, filters = {}) {
  return items.filter((item) =>
    Object.entries(filters).every(([field, value]) => {
      if (value === '' || value === null || value === undefined) return true;
      return String(item[field]) === String(value);
    })
  );
}

export function searchEmployees(employees, term, options = {}) {
  const filtered = filterByText(employees, term, ['nombres', 'apellidos', 'correo_electronico']);
  if (options.departamentoId) {
    return filterByValue(filtered, 'departamento_id', options.departamentoId);
  }
  return filtered;
}
