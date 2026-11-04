import { can } from '../auth.js';
import {
  buildContractText,
  createContract,
  deleteContract,
  getContract,
  getEmployee,
  getEmployeeName,
  loadContracts,
  loadEmployees,
  updateContract
} from '../storage.js';
import { todayISO } from '../utils.js';
import {
  badge,
  date,
  emptyState,
  escapeHtml,
  field,
  formActions,
  formValues,
  input,
  money,
  pageHeader,
  query,
  queryAll,
  sectionCard,
  select,
  showToast,
  table,
  textarea
} from './ui.js';

let employeeFilter = '';

function contractStatus(contract) {
  const today = todayISO();
  if (contract.fecha_inicio > today) return 'Futuro';
  if (contract.fecha_fin && contract.fecha_fin < today) return 'Vencido';
  return 'Vigente';
}

export function render(context) {
  const { session, id } = context;
  const canManage = can('contracts.manage', session);
  const employees = loadEmployees();
  const contracts = loadContracts();
  const editing = id ? getContract(id) : null;
  const visible = contracts
    .filter(
      (contract) =>
        !employeeFilter || Number(contract.empleado_id) === Number(employeeFilter)
    )
    .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
  const employeeOptions = employees.map((employee) => ({
    value: employee.empleado_id,
    label: `${employee.nombres} ${employee.apellidos} · ${employee.rut}`
  }));

  const rows = visible.map((contract) => {
    const employee = getEmployee(contract.empleado_id);
    const status = contractStatus(contract);
    return `<tr>
      <td>
        <strong>${escapeHtml(getEmployeeName(contract.empleado_id))}</strong>
        <small>${escapeHtml(employee?.rut || '')}</small>
      </td>
      <td>${escapeHtml(contract.tipo_contrato)}</td>
      <td>${date(contract.fecha_inicio)} – ${contract.fecha_fin ? date(contract.fecha_fin) : 'Indefinido'}</td>
      <td>${money(contract.salario_base)} ${escapeHtml(contract.moneda)}</td>
      <td>${badge(status, status === 'Vigente' ? 'success' : status === 'Vencido' ? 'danger' : 'warning')}</td>
      <td class="table-actions">
        <a class="btn btn--ghost btn--sm" href="#/contratos/${contract.contrato_id}">Editar</a>
        <button type="button" class="btn btn--danger btn--sm" data-delete="${contract.contrato_id}">Eliminar</button>
      </td>
    </tr>`;
  });

  return `
    ${pageHeader(
      'Contratos',
      'Vigencias, remuneración base y respaldo contractual del equipo.',
      canManage ? '<a class="btn btn--primary" href="#/contratos">Nuevo contrato</a>' : ''
    )}
    ${
      canManage
        ? sectionCard(
            editing ? 'Editar contrato' : 'Nuevo contrato',
            `<form id="contract-form" class="form-grid">
              ${field('Empleado', select('empleado_id', employeeOptions, editing?.empleado_id || '', { placeholder: 'Selecciona una persona', required: true }), { required: true })}
              ${field('Tipo de contrato', select('tipo_contrato', ['Indefinido', 'Plazo fijo', 'Honorarios'], editing?.tipo_contrato || '', { placeholder: 'Selecciona un tipo', required: true }), { required: true })}
              ${field('Fecha de inicio', input('fecha_inicio', editing?.fecha_inicio || '', { type: 'date', required: true }), { required: true })}
              ${field('Fecha de término', input('fecha_fin', editing?.fecha_fin || '', { type: 'date' }), { hint: 'Obligatoria para contratos a plazo fijo.' })}
              ${field('Salario base', input('salario_base', editing?.salario_base || '', { type: 'number', min: 1, step: 1, required: true }), { required: true })}
              ${field('Moneda', select('moneda', ['CLP', 'USD', 'UF'], editing?.moneda || 'CLP', { required: true }), { required: true })}
              <div class="form-grid__wide">${field('Texto del contrato', textarea('texto_contrato', editing?.texto_contrato || '', { rows: 8, placeholder: 'Si lo dejas vacío, se generará automáticamente con los datos de la ficha.' }))}</div>
              <div class="form-grid__wide form-actions">
                <button type="button" class="btn btn--ghost" id="generate-contract-text">Generar texto automático</button>
                <button type="submit" class="btn btn--primary">${editing ? 'Guardar cambios' : 'Crear contrato'}</button>
                ${editing ? '<a class="btn btn--ghost" href="#/contratos">Cancelar</a>' : ''}
              </div>
            </form>`,
            editing ? '<a class="btn btn--ghost btn--sm" href="#/contratos">Cancelar edición</a>' : ''
          )
        : ''
    }
    ${sectionCard(
      'Contratos registrados',
      `<div class="toolbar">
        <label class="toolbar__field">
          <span>Empleado</span>
          ${select('filter-employee', employeeOptions, employeeFilter, { placeholder: 'Todos los empleados' })}
        </label>
        <span class="muted">${visible.length} contrato(s)</span>
      </div>
      ${table(['Empleado', 'Tipo', 'Vigencia', 'Salario', 'Estado', 'Acciones'], rows, 'No hay contratos para el filtro seleccionado.')}`
    )}
    ${
      !canManage
        ? emptyState('Vista de solo lectura', 'Solo administración puede crear o modificar contratos.')
        : ''
    }
  `;
}

export function bind(root, context) {
  query('#filter-employee', root)?.addEventListener('change', (event) => {
    employeeFilter = event.target.value;
    context.refresh();
  });

  if (!can('contracts.manage', context.session)) return;

  const form = query('#contract-form', root);
  query('#generate-contract-text', root)?.addEventListener('click', () => {
    if (!form) return;
    const values = formValues(form);
    const employee = getEmployee(values.empleado_id);
    if (!employee) {
      showToast('Selecciona un empleado antes de generar el texto.', 'danger');
      return;
    }
    const text = buildContractText(employee, {
      tipo_contrato: values.tipo_contrato || 'Indefinido',
      fecha_inicio: values.fecha_inicio || todayISO(),
      fecha_fin: values.fecha_fin || null,
      salario_base: Number(values.salario_base) || 0,
      moneda: values.moneda || 'CLP'
    });
    form.querySelector('[name="texto_contrato"]').value = text;
    showToast('Texto del contrato generado.', 'info');
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const values = formValues(form);
      if (context.id) {
        updateContract(context.id, values, context.session.email);
        showToast('Contrato actualizado.');
      } else {
        createContract(values, context.session.email);
        showToast('Contrato creado.');
      }
      context.navigate('contratos');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-delete]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar este contrato?')) return;
      try {
        deleteContract(button.dataset.delete, context.session.email);
        showToast('Contrato eliminado.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });
}
