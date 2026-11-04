import { can } from '../auth.js';
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  getEmployee,
  getEmployeeName,
  loadDepartments,
  loadEmployees,
  loadPositions,
  reassignDepartment,
  updateDepartment
} from '../storage.js';
import {
  badge,
  emptyState,
  escapeHtml,
  field,
  formActions,
  formValues,
  input,
  pageHeader,
  query,
  queryAll,
  sectionCard,
  select,
  showToast,
  table
} from './ui.js';

let reassignSource = null;

export function render(context) {
  const { session, id } = context;
  const canManage = can('departments.manage', session);
  const departments = loadDepartments();
  const employees = loadEmployees();
  const positions = loadPositions();
  const editing = id ? getDepartment(id) : null;
  const departmentOptions = departments
    .filter((department) => String(department.departamento_id) !== String(reassignSource))
    .map((department) => ({
      value: department.departamento_id,
      label: `${department.codigo_departamento} · ${department.nombre_departamento}`
    }));
  const jefeOptions = employees.map((employee) => ({
    value: employee.empleado_id,
    label: `${employee.nombres} ${employee.apellidos} · ${employee.rut}`
  }));

  const rows = departments.map((department) => {
    const employeeCount = employees.filter(
      (employee) => Number(employee.departamento_id) === Number(department.departamento_id)
    ).length;
    const positionCount = positions.filter(
      (position) => Number(position.departamento_id) === Number(department.departamento_id)
    ).length;
    return `
      <tr>
        <td><span class="code-pill">${escapeHtml(department.codigo_departamento)}</span></td>
        <td>
          <strong>${escapeHtml(department.nombre_departamento)}</strong>
          <small>${employeeCount} persona(s) · ${positionCount} cargo(s)</small>
        </td>
        <td>${department.jefe_departamento_id ? escapeHtml(getEmployeeName(department.jefe_departamento_id)) : '<span class="muted">Sin jefatura</span>'}</td>
        <td class="table-actions">
          ${
            canManage
              ? `<a class="btn btn--ghost btn--sm" href="#/departamentos/${department.departamento_id}">Editar</a>
                 <button type="button" class="btn btn--ghost btn--sm" data-reassign="${department.departamento_id}">Reasignar</button>
                 <button type="button" class="btn btn--danger btn--sm" data-delete="${department.departamento_id}">Eliminar</button>`
              : '<span class="muted">Solo lectura</span>'
          }
        </td>
      </tr>
    `;
  });

  const form = canManage
    ? sectionCard(
        editing ? 'Editar departamento' : 'Nuevo departamento',
        `<form id="department-form" class="form-grid">
          ${field('Código', input('codigo_departamento', editing?.codigo_departamento || '', { placeholder: 'Ej. VEN', required: true }), { required: true, hint: 'Identificador único de hasta 10 caracteres.' })}
          ${field('Nombre', input('nombre_departamento', editing?.nombre_departamento || '', { placeholder: 'Ej. Ventas', required: true }), { required: true })}
          ${field('Jefatura', select('jefe_departamento_id', jefeOptions, editing?.jefe_departamento_id || '', { placeholder: 'Sin jefatura asignada' }), { hint: 'Puede asignarse después desde la ficha del empleado.' })}
          <div class="form-grid__wide">${formActions(editing ? 'Guardar cambios' : 'Crear departamento', '#/departamentos')}</div>
        </form>`,
        editing ? '<a class="btn btn--ghost btn--sm" href="#/departamentos">Cancelar edición</a>' : ''
      )
    : '';
  const reassignForm =
    canManage && reassignSource
      ? sectionCard(
          'Reasignar personas y cargos',
          `<form id="reassign-form" class="form-grid">
            <p class="form-grid__wide muted">El departamento <strong>${escapeHtml(getDepartment(reassignSource)?.nombre_departamento || '')}</strong> se eliminará después de mover sus personas y cargos.</p>
            ${field('Departamento destino', select('target_department', departmentOptions, '', { placeholder: 'Selecciona un destino', required: true }), { required: true })}
            <div class="form-grid__wide">${formActions('Reasignar y eliminar origen')}</div>
          </form>`,
          '<button type="button" class="btn btn--ghost btn--sm" id="cancel-reassign">Cancelar</button>'
        )
      : '';

  return `
    ${pageHeader(
      'Departamentos',
      'Estructura organizacional, jefaturas y dotación por área.',
      canManage ? '<a class="btn btn--primary" href="#/departamentos">Nuevo departamento</a>' : ''
    )}
    ${form}
    ${reassignForm}
    ${sectionCard(
      'Áreas de la organización',
      table(
        ['Código', 'Departamento', 'Jefatura', 'Acciones'],
        rows,
        'Aún no hay departamentos registrados.'
      ),
      `<span class="muted">${departments.length} área(s)</span>`
    )}
    ${
      !canManage
        ? emptyState(
            'Vista de solo lectura',
            'Tu rol puede consultar la estructura, pero no modificarla.',
            '<a class="btn btn--ghost btn--sm" href="#/empleados">Ver personas</a>'
          )
        : ''
    }
  `;
}

export function bind(root, context) {
  const canManage = can('departments.manage', context.session);
  if (!canManage) return;

  const form = query('#department-form', root);
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const values = formValues(form);
      if (context.id) {
        updateDepartment(context.id, values, context.session.email);
        showToast('Departamento actualizado.');
      } else {
        createDepartment(values, context.session.email);
        showToast('Departamento creado.');
      }
      reassignSource = null;
      context.navigate('departamentos');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-delete]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar este departamento? Esta acción no se puede deshacer.')) return;
      try {
        deleteDepartment(button.dataset.delete, context.session.email);
        showToast('Departamento eliminado.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  queryAll('[data-reassign]', root).forEach((button) => {
    button.addEventListener('click', () => {
      reassignSource = button.dataset.reassign;
      context.refresh();
    });
  });

  query('#cancel-reassign', root)?.addEventListener('click', () => {
    reassignSource = null;
    context.refresh();
  });

  const reassignForm = query('#reassign-form', root);
  reassignForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(reassignForm);
    try {
      reassignDepartment(reassignSource, values.target_department, context.session.email);
      deleteDepartment(reassignSource, context.session.email);
      showToast('Personas y cargos reasignados. Departamento eliminado.');
      reassignSource = null;
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });
}
