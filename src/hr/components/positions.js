import { loadCollection, addItem, updateItem, deleteItem } from '../storage.js';
import { positionHasActiveContracts, validatePosition } from '../rules.js';
import { audit } from '../audit.js';
import { canManage } from '../auth.js';
import { escapeHtml } from '../utils.js';
import {
  attachTableFilter,
  card,
  confirmAction,
  errorsSummary,
  field,
  formValues,
  pageHeader,
  showFeedback,
  table,
  toast
} from './ui.js';

export function render(container, ctx) {
  const { user } = ctx;
  const positions = loadCollection('cargos');
  const employees = loadCollection('empleados');
  const canEdit = canManage('cargos', user);

  const rows = [...positions].sort((a, b) =>
    String(a.nombre_cargo).localeCompare(String(b.nombre_cargo))
  );

  container.innerHTML = `
    ${pageHeader('Cargos', 'Catalogo de puestos y niveles de grado.')}
    <div id="position-feedback" class="feedback-slot" role="alert"></div>
    <form class="filter-bar" id="position-filter" autocomplete="off">
      ${field({ label: 'Buscar por cargo o nivel', name: 'q', placeholder: 'Ej: Senior' })}
    </form>
    <div class="layout-two">
      ${card(
        'Catalogo de cargos',
        table(
          [
            { label: 'Cargo', render: (row) => escapeHtml(row.nombre_cargo) },
            { label: 'Nivel de grado', render: (row) => escapeHtml(row.nivel_grado) },
            {
              label: 'Empleados',
              render: (row) =>
                String(
                  employees.filter(
                    (employee) => String(employee.cargo_id) === String(row.cargo_id)
                  ).length
                )
            },
            {
              label: 'Contrato vigente',
              render: (row) =>
                positionHasActiveContracts(row.cargo_id, { employees })
                  ? '<span class="badge badge-warning">Si</span>'
                  : '<span class="badge badge-neutral">No</span>'
            },
            {
              label: 'Acciones',
              render: (row) =>
                canEdit
                  ? `<div class="inline-actions">
                       <button type="button" class="btn btn-small" data-edit="${row.cargo_id}">Editar</button>
                       <button type="button" class="btn btn-small btn-danger" data-delete="${row.cargo_id}">Eliminar</button>
                     </div>`
                  : '<span class="muted">Solo lectura</span>'
            }
          ],
          rows,
          'Aun no hay cargos registrados.',
          (row) =>
            `data-filter="${escapeHtml(`${row.nombre_cargo} ${row.nivel_grado}`.toLowerCase())}"`
        ),
        { actions: `<span class="count-pill">${rows.length}</span>` }
      )}
      ${
        canEdit
          ? card(
              'Nuevo cargo',
              `
                <form id="position-form" data-form="position" class="form-grid" autocomplete="off">
                  <input type="hidden" name="cargo_id" value="" />
                  ${field({ label: 'Nombre del cargo', name: 'nombre_cargo', required: true, placeholder: 'Ej: Analista de datos' })}
                  ${field({ label: 'Nivel de grado', name: 'nivel_grado', required: true, placeholder: 'Junior / Senior / Jefatura' })}
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar cargo</button>
                    <button type="reset" class="btn btn-ghost">Limpiar</button>
                  </div>
                </form>
              `,
              { className: 'form-card' }
            )
          : ''
      }
    </div>
    <div id="position-delete-note"></div>
  `;

  const feedbackSlot = container.querySelector('#position-feedback');
  const noteSlot = container.querySelector('#position-delete-note');
  attachTableFilter(container, container.querySelector('#position-filter'));

  if (canEdit) {
    const form = container.querySelector('#position-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = formValues(form);
      const editingId = values.cargo_id || null;
      const payload = {
        nombre_cargo: values.nombre_cargo.trim(),
        nivel_grado: values.nivel_grado.trim()
      };
      const validation = validatePosition(payload, { positions, editingId });
      if (!validation.valid) {
        showFeedback(feedbackSlot, errorsSummary(validation.errors));
        return;
      }
      if (editingId) {
        updateItem('cargos', editingId, payload);
        audit('Edicion de cargo', 'cargos', payload.nombre_cargo, user);
        toast('Cargo actualizado.');
      } else {
        addItem('cargos', payload);
        audit('Creacion de cargo', 'cargos', payload.nombre_cargo, user);
        toast('Cargo creado.');
      }
      ctx.refresh();
    });

    form.addEventListener('reset', () => {
      form.querySelector('[name="cargo_id"]').value = '';
    });

    container.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const position = positions.find(
          (item) => String(item.cargo_id) === String(button.dataset.edit)
        );
        if (!position) return;
        form.querySelector('[name="cargo_id"]').value = position.cargo_id;
        form.querySelector('[name="nombre_cargo"]').value = position.nombre_cargo || '';
        form.querySelector('[name="nivel_grado"]').value = position.nivel_grado || '';
        form.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  container.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      const positionId = button.dataset.delete;
      if (positionHasActiveContracts(positionId, { employees })) {
        showFeedback(
          noteSlot,
          'No se puede eliminar el cargo: tiene contratos vigentes asociados. Finalice o reasigne esos contratos primero.'
        );
        return;
      }
      if (!confirmAction('¿Confirma eliminar este cargo?')) return;
      deleteItem('cargos', positionId);
      audit('Eliminacion de cargo', 'cargos', String(positionId), user);
      toast('Cargo eliminado.');
      ctx.refresh();
    });
  });
}
