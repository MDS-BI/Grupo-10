import { escapeHtml, formatCLP, formatDate } from '../utils.js';

export function pageHeader(title, subtitle = '', actions = '') {
  return `
    <header class="page-header">
      <div>
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="page-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </header>
  `;
}

export function card(title, body, options = {}) {
  return `
    <section class="card ${options.className || ''}">
      ${
        title
          ? `<header class="card-header">
               <h2>${escapeHtml(title)}</h2>
               ${options.actions || ''}
             </header>`
          : ''
      }
      <div class="card-body">${body}</div>
    </section>
  `;
}

export function statCard(label, value, hint = '', tone = '') {
  return `
    <article class="stat-card ${tone ? `tone-${tone}` : ''}">
      <span class="stat-label">${escapeHtml(label)}</span>
      <strong class="stat-value">${escapeHtml(value)}</strong>
      ${hint ? `<span class="stat-hint">${escapeHtml(hint)}</span>` : ''}
    </article>
  `;
}

export function feedback(message, type = 'error') {
  if (!message) return '';
  return `<div class="feedback feedback-${type}" role="${type === 'error' ? 'alert' : 'status'}">${escapeHtml(message)}</div>`;
}

export function showFeedback(container, message, type = 'error') {
  if (!container) return;
  container.innerHTML = feedback(message, type);
}

export function clearFeedback(container) {
  if (container) container.innerHTML = '';
}

export function field({
  label,
  name,
  type = 'text',
  value = '',
  required = false,
  error = '',
  placeholder = '',
  min,
  max,
  step,
  autocomplete,
  hint = ''
}) {
  const attrs = [
    `id="field-${name}"`,
    `name="${name}"`,
    `type="${type}"`,
    value !== '' && value !== null && value !== undefined ? `value="${escapeHtml(value)}"` : '',
    required ? 'required' : '',
    placeholder ? `placeholder="${escapeHtml(placeholder)}"` : '',
    min !== undefined ? `min="${min}"` : '',
    max !== undefined ? `max="${max}"` : '',
    step !== undefined ? `step="${step}"` : '',
    autocomplete ? `autocomplete="${autocomplete}"` : '',
    error ? 'aria-invalid="true"' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <div class="field ${error ? 'has-error' : ''}">
      <label for="field-${name}">${escapeHtml(label)}${required ? ' <span class="required">*</span>' : ''}</label>
      <input ${attrs} />
      ${hint ? `<small class="field-hint">${escapeHtml(hint)}</small>` : ''}
      ${error ? `<small class="field-error">${escapeHtml(error)}</small>` : ''}
    </div>
  `;
}

export function textareaField({ label, name, value = '', error = '', rows = 3, required = false }) {
  return `
    <div class="field ${error ? 'has-error' : ''}">
      <label for="field-${name}">${escapeHtml(label)}${required ? ' <span class="required">*</span>' : ''}</label>
      <textarea id="field-${name}" name="${name}" rows="${rows}" ${required ? 'required' : ''}>${escapeHtml(value)}</textarea>
      ${error ? `<small class="field-error">${escapeHtml(error)}</small>` : ''}
    </div>
  `;
}

export function selectField({
  label,
  name,
  options,
  value = '',
  required = false,
  error = '',
  placeholder = 'Seleccione...',
  disabled = false
}) {
  const items = options
    .map(
      (option) =>
        `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(value) ? 'selected' : ''}>${escapeHtml(option.label)}</option>`
    )
    .join('');
  return `
    <div class="field ${error ? 'has-error' : ''}">
      <label for="field-${name}">${escapeHtml(label)}${required ? ' <span class="required">*</span>' : ''}</label>
      <select id="field-${name}" name="${name}" ${required ? 'required' : ''} ${disabled ? 'disabled' : ''}>
        <option value="">${escapeHtml(placeholder)}</option>
        ${items}
      </select>
      ${error ? `<small class="field-error">${escapeHtml(error)}</small>` : ''}
    </div>
  `;
}

export function optionsFor(items, valueKey, labelFn, selected = '') {
  return items.map((item) => ({
    value: item[valueKey],
    label: typeof labelFn === 'function' ? labelFn(item) : item[labelFn],
    selected: String(item[valueKey]) === String(selected)
  }));
}

export function table(columns, rows, emptyMessage = 'Sin registros.', rowAttrs = null) {
  if (!rows.length) {
    return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  }
  const head = columns.map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`).join('');
  const body = rows
    .map(
      (row) => `
        <tr ${rowAttrs ? rowAttrs(row) : ''}>
          ${columns
            .map((column) => {
              const content = column.render ? column.render(row) : escapeHtml(row[column.key] ?? '');
              return `<td data-label="${escapeHtml(column.label)}">${content}</td>`;
            })
            .join('')}
        </tr>
      `
    )
    .join('');
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

export function badge(text, tone = 'neutral') {
  const tones = {
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
    neutral: 'neutral'
  };
  return `<span class="badge badge-${tones[tone] || 'neutral'}">${escapeHtml(text)}</span>`;
}

export function statusBadge(status) {
  const map = {
    Activo: 'success',
    'Con licencia': 'warning',
    Desvinculado: 'danger',
    Pendiente: 'warning',
    Aprobada: 'success',
    Rechazada: 'danger',
    pendiente: 'warning',
    aprobado: 'success',
    rechazado: 'danger',
    aprobada: 'success',
    rechazada: 'danger',
    Borrador: 'info',
    Calculado: 'info',
    Aprobado: 'success',
    Cerrado: 'neutral',
    activa: 'success',
    finalizada: 'neutral'
  };
  return badge(status, map[status] || 'neutral');
}

export function money(value) {
  return escapeHtml(formatCLP(value));
}

export function date(value) {
  return escapeHtml(formatDate(value));
}

export function toast(message, type = 'success') {
  const region = globalThis.document?.getElementById('toast-region');
  if (!region) return;
  const element = globalThis.document.createElement('div');
  element.className = `toast toast-${type}`;
  element.textContent = message;
  region.appendChild(element);
  globalThis.setTimeout?.(() => element.remove(), 3500);
}

export function confirmAction(message) {
  if (typeof globalThis.confirm === 'function') return globalThis.confirm(message);
  return true;
}

export function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function errorsSummary(errors) {
  const messages = Object.values(errors || {});
  return messages.length ? messages.join(' ') : '';
}

export function filterBar(fields) {
  return `<form class="filter-bar" data-form="filter" autocomplete="off">${fields
    .map((item) => {
      if (item.type === 'select') {
        return selectField({ ...item, value: item.value || '' });
      }
      return field({ ...item, required: false });
    })
    .join('')}</form>`;
}

export function sectionTitle(title, count) {
  return `<div class="section-title"><h2>${escapeHtml(title)}</h2>${
    count !== undefined ? `<span class="count-pill">${count}</span>` : ''
  }</div>`;
}

export function inlineActions(buttons) {
  return `<div class="inline-actions">${buttons.join('')}</div>`;
}

export function attachTableFilter(scope, form) {
  if (!form) return () => {};
  const inputs = [...form.querySelectorAll('input, select')].filter(
    (input) => input.type !== 'hidden'
  );
  const apply = () => {
    const rows = scope.querySelectorAll('tbody tr[data-filter]');
    rows.forEach((row) => {
      let visible = true;
      inputs.forEach((input) => {
        const value = String(input.value || '').trim();
        if (!value) return;
        const field = input.dataset.filterField;
        if (field) {
          if (String(row.dataset[field] || '') !== value) visible = false;
        } else if (input.tagName === 'SELECT' && row.dataset[input.name] !== undefined) {
          if (String(row.dataset[input.name] || '') !== value) visible = false;
        } else {
          const haystack = String(row.dataset.filter || row.textContent || '').toLowerCase();
          if (!haystack.includes(value.toLowerCase())) visible = false;
        }
      });
      row.hidden = !visible;
    });
  };
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  return apply;
}

export function modal(title, body, id = 'app-modal') {
  return `
    <div class="modal-backdrop" id="${id}" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
      <div class="modal">
        <header class="modal-header">
          <h2 id="${id}-title">${escapeHtml(title)}</h2>
          <button type="button" class="icon-button" data-close-modal="${id}" aria-label="Cerrar">&times;</button>
        </header>
        <div class="modal-body">${body}</div>
      </div>
    </div>
  `;
}
