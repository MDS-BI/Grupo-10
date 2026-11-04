import { escapeHtml, formatCLP, formatDateTime } from '../utils.js';

const TONES = {
  activo: 'success',
  aprobada: 'success',
  aprobado: 'success',
  calculado: 'info',
  cerrado: 'neutral',
  pendiente: 'warning',
  borrador: 'warning',
  rechazada: 'danger',
  rechazado: 'danger',
  desvinculado: 'danger',
  inactivo: 'danger',
  finalizado: 'neutral',
  haber: 'success',
  deducción: 'danger',
  deduccion: 'danger'
};

export function badge(text, tone = '') {
  const normalized = TONES[String(text || '').toLowerCase()] || tone || 'neutral';
  return `<span class="badge badge--${normalized}">${escapeHtml(text)}</span>`;
}

export function pageHeader(title, subtitle = '', actions = '') {
  return `
    <header class="page-header">
      <div>
        <h1 class="page-title">${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="page-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </header>
  `;
}

export function statCard({ label, value, meta = '', tone = '' }) {
  return `
    <article class="stat-card ${tone ? `stat-card--${tone}` : ''}">
      <span class="stat-card__label">${escapeHtml(label)}</span>
      <strong class="stat-card__value">${value}</strong>
      ${meta ? `<span class="stat-card__meta">${escapeHtml(meta)}</span>` : ''}
    </article>
  `;
}

export function emptyState(title, message, action = '') {
  return `
    <div class="empty-state">
      <div class="empty-state__mark">—</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      ${action ? `<div class="empty-state__action">${action}</div>` : ''}
    </div>
  `;
}

export function table(headers, rows, emptyMessage = 'No hay registros para mostrar.') {
  if (!rows.length) {
    return emptyState('Sin resultados', emptyMessage);
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>${headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr>
        </thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>
  `;
}

export function field(label, control, { hint = '', required = false } = {}) {
  return `
    <label class="field">
      <span class="field__label">${escapeHtml(label)}${required ? ' <em>*</em>' : ''}</span>
      ${control}
      ${hint ? `<span class="field__hint">${escapeHtml(hint)}</span>` : ''}
    </label>
  `;
}

export function input(name, value = '', options = {}) {
  const { type = 'text', placeholder = '', min = '', max = '', step = '', required = false, readonly = false, autocomplete = '' } = options;
  return `<input class="input" type="${type}" name="${escapeHtml(name)}" value="${escapeHtml(value ?? '')}" placeholder="${escapeHtml(placeholder)}" ${min !== '' ? `min="${min}"` : ''} ${max !== '' ? `max="${max}"` : ''} ${step !== '' ? `step="${step}"` : ''} ${required ? 'required' : ''} ${readonly ? 'readonly' : ''} ${autocomplete ? `autocomplete="${escapeHtml(autocomplete)}"` : ''}>`;
}

export function textarea(name, value = '', options = {}) {
  const { rows = 4, placeholder = '', required = false } = options;
  return `<textarea class="input input--textarea" name="${escapeHtml(name)}" rows="${rows}" placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''}>${escapeHtml(value ?? '')}</textarea>`;
}

export function select(name, items, selected = '', options = {}) {
  const { placeholder = '', required = false } = options;
  const values = items.map((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return `<option value="${escapeHtml(item)}" ${String(item) === String(selected) ? 'selected' : ''}>${escapeHtml(item)}</option>`;
    }
    const value = item.value ?? item.id;
    const label = item.label ?? item.name;
    return `<option value="${escapeHtml(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
  });
  return `<select class="input" name="${escapeHtml(name)}" ${required ? 'required' : ''}>${placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : ''}${values.join('')}</select>`;
}

export function tabNav(tabs, active) {
  return `
    <div class="tabs" role="tablist">
      ${tabs
        .map(
          (tab) => `
        <button type="button" class="tab ${tab.id === active ? 'is-active' : ''}" data-tab="${escapeHtml(tab.id)}" role="tab" aria-selected="${tab.id === active}">
          ${escapeHtml(tab.label)}
        </button>`
        )
        .join('')}
    </div>
  `;
}

export function formActions(submitLabel = 'Guardar', cancelHref = '') {
  return `
    <div class="form-actions">
      <button type="submit" class="btn btn--primary">${escapeHtml(submitLabel)}</button>
      ${cancelHref ? `<a class="btn btn--ghost" href="${cancelHref}">Cancelar</a>` : ''}
    </div>
  `;
}

export function money(value) {
  return formatCLP(value);
}

export function date(value) {
  if (!value) return '—';
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('es-CL');
}

export function dateTime(value) {
  return formatDateTime(value);
}

export function initials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function avatar(name, size = '') {
  return `<span class="avatar ${size ? `avatar--${size}` : ''}" aria-hidden="true">${escapeHtml(initials(name))}</span>`;
}

export function rating(value) {
  const score = Math.max(0, Math.min(5, Number(value) || 0));
  return `<span class="rating" aria-label="Calificación ${score} de 5">${Array.from({ length: 5 }, (_, index) => `<span class="${index < score ? 'is-on' : ''}">★</span>`).join('')}<strong>${score}</strong></span>`;
}

export function progress(value, max = 100) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (Number(value) / max) * 100)) : 0;
  return `<span class="progress" aria-label="${percent}%"><span class="progress__bar" style="width:${percent}%"></span></span>`;
}

export function sectionCard(title, body, actions = '') {
  return `
    <section class="card">
      <div class="card__head">
        <h2 class="card__title">${escapeHtml(title)}</h2>
        ${actions ? `<div class="card__actions">${actions}</div>` : ''}
      </div>
      <div class="card__body">${body}</div>
    </section>
  `;
}

export function infoList(items) {
  return `
    <dl class="info-list">
      ${items
        .map(
          (item) => `
        <div class="info-list__row">
          <dt>${escapeHtml(item.label)}</dt>
          <dd>${item.value ?? '—'}</dd>
        </div>`
        )
        .join('')}
    </dl>
  `;
}

export function alert(message, type = 'info') {
  if (!message) return '';
  return `<div class="alert alert--${escapeHtml(type)}" role="${type === 'danger' ? 'alert' : 'status'}">${escapeHtml(message)}</div>`;
}

export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast--${type} is-visible`;
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.className = 'toast';
  }, 4200);
}

export function confirmAction(message) {
  return window.confirm(message);
}

export function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function query(selector, root = document) {
  return root.querySelector(selector);
}

export function queryAll(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function bindTabs(root, onChange) {
  queryAll('[data-tab]', root).forEach((button) => {
    button.addEventListener('click', () => onChange(button.dataset.tab));
  });
}

export function barChart(items, valueKey = 'value', labelKey = 'label') {
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);
  return `
    <div class="bar-chart">
      ${items
        .map(
          (item) => `
        <div class="bar-chart__row">
          <span class="bar-chart__label">${escapeHtml(item[labelKey])}</span>
          <span class="bar-chart__track"><span class="bar-chart__bar" style="width:${((Number(item[valueKey]) || 0) / max) * 100}%"></span></span>
          <strong class="bar-chart__value">${escapeHtml(item.display ?? item[valueKey])}</strong>
        </div>`
        )
        .join('')}
    </div>
  `;
}

export { escapeHtml };
