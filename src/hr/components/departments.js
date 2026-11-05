import { addItem, deleteItem, loadCollection, updateItem } from '../storage.js';
import {
  activeEmployeesOfDepartment,
  canDeleteDepartment,
  employeeName,
  getDepartmentName,
  validateDepartment
} from '../rules.js';
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
  selectField,
  showFeedback,
  table,
  toast
} from './ui.js';

export function render(container, ctx) {
  const { user } = ctx;
  const departments = loadCollection('departamentos');
  const employees = loadCollection('empleados');
  const canEdit = canManage('departamentos', user);

  const rows = [...departments].sort((a, b) =>
    String(a.nombre_departamento).localeCompare(String(b.nombre_departamento))
  );

  container.innerHTML = `
    ${pageHeader('Departamentos', 'Estructura organizacional de la empresa.')}
    <div id="department-feedback" class="feedback-slot" role="alert"></div>
    <form class="filter-bar" id="department-filter" autocomplete="off">
      ${field({ label: 'Buscar por nombre o codigo', name: 'q', placeholder: 'Ej: RRHH' })}
    </form>
    <div class="layout-two">
      ${card(
        'Departamentos registrados',
        table(
          [
            { label: 'Nombre', render: (row) => escapeHtml(row.nombre_departamento) },
            { label: 'Codigo', render: (row) => escapeHtml(row.codigo_departamento || '-') },
            {
              label: 'Jefatura',
              render: (row) =>
                row.jefe_departamento_id
                  ? escapeHtml(employeeName(row.jefe_departamento_id, employees))
                  : '<span class="muted">Sin asignar</span>'
            },
            {
              label: 'Empleados activos',
              render: (row) =>
                String(activeEmployeesOfDepartment(row.departamento_id, employees).length)
            },
            {
              label: 'Acciones',
              render: (row) =>
                canEdit
                  ? `<div class="inline-actions">
                       <button type="button" class="btn btn-small" data-edit="${row.departamento_id}">Editar</button>
                       <button type="button" class="btn btn-small btn-danger" data-delete="${row.departamento_id}">Eliminar</button>
                     </div>`
                  : '<span class="muted">Solo lectura</span>'
            }
          ],
          rows,
          'Aun no hay departamentos registrados.',
          (row) =>
            `data-filter="${escapeHtml(`${row.nombre_departamento} ${row.codigo_departamento || ''}`.toLowerCase())}"`
        ),
        {
          actions: `<span class="count-pill">${rows.length}</span>`
        }
      )}
      ${
        canEdit
          ? card(
              'Nuevo departamento',
              `
                <form id="department-form" data-form="department" class="form-grid" autocomplete="off">
                  <input type="hidden" name="departamento_id" value="" />
                  ${field({ label: 'Nombre', name: 'nombre_departamento', required: true, placeholder: 'Ej: Operaciones' })}
                  ${field({ label: 'Codigo', name: 'codigo_departamento', required: true, placeholder: 'Ej: OPE' })}
                  ${field({ label: 'Empresa (ID)', name: 'empresa_id', type: 'number', value: '1', min: 1, required: true })}
                  ${selectField({
                    label: 'Jefatura de departamento',
                    name: 'jefe_departamento_id',
                    options: employees
                      .filter((employee) => employee.estado_laboral !== 'Desvinculado')
                      .map((employee) => ({
                        value: employee.empleado_id,
                        label: `${employee.nombres} ${employee.apellidos}`
                      })),
                    placeholder: 'Sin asignar'
                  })}
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar departamento</button>
                    <button type="reset" class="btn btn-ghost">Limpiar</button>
                  </div>
                </form>
              `,
              { className: 'form-card' }
            )
          : ''
      }
    </div>
    <div id="reassign-panel"></div>
  `;

  const feedbackSlot = container.querySelector('#department-feedback');
  attachTableFilter(container, container.querySelector('#department-filter'));

  if (canEdit) {
    const form = container.querySelector('#department-form');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = formValues(form);
      const editingId = values.departamento_id || null;
      const payload = {
        nombre_departamento: values.nombre_departamento.trim(),
        codigo_departamento: values.codigo_departamento.trim().toUpperCase(),
        empresa_id: Number(values.empresa_id),
        jefe_departamento_id: values.jefe_departamento_id ? Number(values.jefe_departamento_id) : null
      };
      const validation = validateDepartment(payload, { departments, editingId });
      if (!validation.valid) {
        showFeedback(feedbackSlot, errorsSummary(validation.errors));
        return;
      }
      if (editingId) {
        updateItem('departamentos', editingId, payload);
        audit('Edicion de departamento', 'departamentos', payload.nombre_departamento, user);
        toast('Departamento actualizado.');
      } else {
        addItem('departamentos', payload);
        audit('Creacion de departamento', 'departamentos', payload.nombre_departamento, user);
        toast('Departamento creado.');
      }
      ctx.refresh();
    });

    form.addEventListener('reset', () => {
      form.querySelector('[name="departamento_id"]').value = '';
    });

    container.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const department = departments.find(
          (item) => String(item.departamento_id) === String(button.dataset.edit)
        );
        if (!department) return;
        form.querySelector('[name="departamento_id"]').value = department.departamento_id;
        form.querySelector('[name="nombre_departamento"]').value = department.nombre_departamento || '';
        form.querySelector('[name="codigo_departamento"]').value = department.codigo_departamento || '';
        form.querySelector('[name="empresa_id"]').value = department.empresa_id || 1;
        form.querySelector('[name="jefe_departamento_id"]').value = department.jefe_departamento_id || '';
        form.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  container.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      const departmentId = button.dataset.delete;
      const check = canDeleteDepartment(departmentId, { employees, departments });
      if (!check.allowed) {
        renderReassignPanel(container, departmentId, check, ctx, departments, employees);
        return;
      }
      if (!confirmAction('¿Confirma eliminar este departamento?')) return;
      deleteItem('departamentos', departmentId);
      audit('Eliminacion de departamento', 'departamentos', String(departmentId), user);
      toast('Departamento eliminado.');
      ctx.refresh();
    });
  });
}

function renderReassignPanel(container, departmentId, check, ctx, departments, employees) {
  const panel = container.querySelector('#reassign-panel');
  const name = getDepartmentName(departmentId, departments);
  const alternatives = departments.filter(
    (department) => String(department.departamento_id) !== String(departmentId)
  );
  if (!alternatives.length) {
    showFeedback(panel, `${check.reason} No existen otros departamentos para reasignar.`);
    return;
  }
  panel.innerHTML = card(
    'Reasignar y eliminar',
    `
      <p>${escapeHtml(check.reason)}</p>
      <div class="inline-form">
        <label class="sr-only" for="reassign-target">Departamento destino</label>
        <select id="reassign-target">
          ${alternatives
            .map(
              (department) =>
                `<option value="${department.departamento_id}">${escapeHtml(department.nombre_departamento)}</option>`
            )
            .join('')}
        </select>
        <button type="button" class="btn btn-danger" id="reassign-confirm">Reasignar y eliminar ${escapeHtml(name)}</button>
      </div>
    `
  );
  panel.querySelector('#reassign-confirm').addEventListener('click', () => {
    const targetId = panel.querySelector('#reassign-target').value;
    check.active.forEach((employee) => {
      updateItem('empleados', employee.empleado_id, { departamento_id: Number(targetId) });
    });
    deleteItem('departamentos', departmentId);
    audit(
      'Reasignacion y eliminacion de departamento',
      'departamentos',
      `${name}: ${check.active.length} empleado(s) reasignado(s).`,
      ctx.user
    );
    toast('Empleados reasignados y departamento eliminado.');
    ctx.refresh();
  });
}
