import { can } from '../auth.js';
import {
  createPosition,
  deletePosition,
  getDepartmentName,
  getPosition,
  loadDepartments,
  loadEmployees,
  loadPositions,
  updatePosition
} from '../storage.js';
import {
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

let departmentFilter = '';

export function render(context) {
  const { session, id } = context;
  const canManage = can('positions.manage', session);
  const departments = loadDepartments();
  const employees = loadEmployees();
  const positions = loadPositions();
  const editing = id ? getPosition(id) : null;
  const visible = positions
    .filter(
      (position) =>
        !departmentFilter || Number(position.departamento_id) === Number(departmentFilter)
    )
    .sort((a, b) => a.nombre_cargo.localeCompare(b.nombre_cargo));
  const departmentOptions = departments.map((department) => ({
    value: department.departamento_id,
    label: `${department.codigo_departamento} · ${department.nombre_departamento}`
  }));

  const rows = visible.map((position) => {
    const employeeCount = employees.filter(
      (employee) => Number(employee.cargo_id) === Number(position.cargo_id)
    ).length;
    return `
      <tr>
        <td>
          <strong>${escapeHtml(position.nombre_cargo)}</strong>
          <small>${escapeHtml(position.nivel_jerarquia)}</small>
        </td>
        <td>${escapeHtml(getDepartmentName(position.departamento_id))}</td>
        <td>${employeeCount}</td>
        <td class="table-actions">
          ${
            canManage
              ? `<a class="btn btn--ghost btn--sm" href="#/cargos/${position.cargo_id}">Editar</a>
                 <button type="button" class="btn btn--danger btn--sm" data-delete="${position.cargo_id}">Eliminar</button>`
              : '<span class="muted">Solo lectura</span>'
          }
        </td>
      </tr>
    `;
  });

  return `
    ${pageHeader(
      'Cargos',
      'Descripción de puestos, niveles jerárquicos y asignación por área.',
      canManage ? '<a class="btn btn--primary" href="#/cargos">Nuevo cargo</a>' : ''
    )}
    ${
      canManage
        ? sectionCard(
            editing ? 'Editar cargo' : 'Nuevo cargo',
            `<form id="position-form" class="form-grid">
              ${field('Nombre del cargo', input('nombre_cargo', editing?.nombre_cargo || '', { placeholder: 'Ej. Analista de datos', required: true }), { required: true })}
              ${field('Nivel jerárquico', select('nivel_jerarquia', ['Dirección', 'Gerencia', 'Supervisión', 'Operativo'], editing?.nivel_jerarquia || '', { placeholder: 'Selecciona un nivel', required: true }), { required: true })}
              ${field('Departamento', select('departamento_id', departmentOptions, editing?.departamento_id || '', { placeholder: 'Selecciona un departamento', required: true }), { required: true })}
              <div class="form-grid__wide">${formActions(editing ? 'Guardar cambios' : 'Crear cargo', '#/cargos')}</div>
            </form>`,
            editing ? '<a class="btn btn--ghost btn--sm" href="#/cargos">Cancelar edición</a>' : ''
          )
        : ''
    }
    ${sectionCard(
      'Cargos definidos',
      `<div class="toolbar">
        <label class="toolbar__field">
          <span>Departamento</span>
          ${select('filter-department', departmentOptions, departmentFilter, { placeholder: 'Todos los departamentos' })}
        </label>
        <span class="muted">${visible.length} cargo(s)</span>
      </div>
      ${table(['Cargo', 'Departamento', 'Personas', 'Acciones'], rows, 'No hay cargos para el filtro seleccionado.')}`
    )}
    ${
      !canManage
        ? emptyState(
            'Vista de solo lectura',
            'Solo administración puede crear o modificar cargos.',
            '<a class="btn btn--ghost btn--sm" href="#/departamentos">Ver departamentos</a>'
          )
        : ''
    }
  `;
}

export function bind(root, context) {
  query('#filter-department', root)?.addEventListener('change', (event) => {
    departmentFilter = event.target.value;
    context.refresh();
  });

  if (!can('positions.manage', context.session)) return;

  const form = query('#position-form', root);
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const values = formValues(form);
      if (context.id) {
        updatePosition(context.id, values, context.session.email);
        showToast('Cargo actualizado.');
      } else {
        createPosition(values, context.session.email);
        showToast('Cargo creado.');
      }
      context.navigate('cargos');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-delete]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar este cargo?')) return;
      try {
        deletePosition(button.dataset.delete, context.session.email);
        showToast('Cargo eliminado.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });
}
