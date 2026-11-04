import { can } from '../auth.js';
import {
  createBenefit,
  createBenefitEnrollment,
  deleteBenefit,
  deleteBenefitEnrollment,
  endBenefitEnrollment,
  getActiveBenefitEnrollments,
  getBenefit,
  getBenefitCostByDepartment,
  getBenefitCostForEmployee,
  getEmployeeBenefitEnrollments,
  getEmployeeName,
  loadBenefitEnrollments,
  loadBenefits,
  loadEmployees,
  updateBenefit
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
  statCard,
  table,
  tabNav
} from './ui.js';

let activeTab = 'catalogo';
let costMonth = todayISO().slice(0, 7);

function monthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`
  };
}

function employeeBenefits(session) {
  const enrollments = getEmployeeBenefitEnrollments(session.empleado_id);
  return `
    ${sectionCard(
      'Mis beneficios asignados',
      enrollments.length
        ? table(
            ['Beneficio', 'Proveedor', 'Costo', 'Desde', 'Hasta', 'Estado'],
            enrollments.map((enrollment) => {
              const benefit = getBenefit(enrollment.beneficio_id);
              return `<tr>
                <td><strong>${escapeHtml(benefit?.nombre_beneficio || 'Beneficio')}</strong></td>
                <td>${escapeHtml(benefit?.proveedor || '—')}</td>
                <td>${money(benefit?.costo || 0)}</td>
                <td>${date(enrollment.fecha_inicio)}</td>
                <td>${enrollment.fecha_fin ? date(enrollment.fecha_fin) : 'Indefinido'}</td>
                <td>${badge(enrollment.estado)}</td>
              </tr>`;
            })
          )
        : emptyState('Sin beneficios asignados', 'Administración de RRHH puede inscribirte en el catálogo de beneficios.')
    )}
    ${sectionCard(
      'Catálogo disponible',
      table(
        ['Beneficio', 'Proveedor', 'Costo'],
        loadBenefits()
          .filter((benefit) => benefit.estado === 'Activo')
          .map(
            (benefit) => `<tr>
              <td><strong>${escapeHtml(benefit.nombre_beneficio)}</strong></td>
              <td>${escapeHtml(benefit.proveedor)}</td>
              <td>${money(benefit.costo)}</td>
            </tr>`
          ),
        'No hay beneficios activos en el catálogo.'
      )
    )}
  `;
}

export function render(context) {
  const { session, params } = context;
  const canManage = can('benefits.manage', session);
  if (!canManage) {
    return `
      ${pageHeader('Beneficios', 'Beneficios asignados y catálogo disponible para tu rol.')}
      ${employeeBenefits(session)}
    `;
  }

  const requestedTab = params.get('tab');
  if (requestedTab) activeTab = requestedTab;
  if (params.get('beneficio')) activeTab = 'catalogo';
  const tabs = [
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'inscripciones', label: 'Inscripciones' },
    { id: 'costos', label: 'Costos' }
  ];
  if (!tabs.some((tab) => tab.id === activeTab)) activeTab = tabs[0].id;

  const benefits = loadBenefits();
  const enrollments = loadBenefitEnrollments();
  const employees = loadEmployees();
  const editingBenefit = getBenefit(params.get('beneficio'));
  const employeeOptions = employees.map((employee) => ({
    value: employee.empleado_id,
    label: `${employee.nombres} ${employee.apellidos} · ${employee.rut}`
  }));
  const benefitOptions = benefits
    .filter((benefit) => benefit.estado === 'Activo' || String(benefit.beneficio_id) === String(editingBenefit?.beneficio_id))
    .map((benefit) => ({
      value: benefit.beneficio_id,
      label: `${benefit.nombre_beneficio} · ${money(benefit.costo)}`
    }));
  const { start, end } = monthRange(costMonth);

  let body = '';

  if (activeTab === 'catalogo') {
    const rows = benefits.map((benefit) => {
      const activeEnrollments = enrollments.filter(
        (enrollment) =>
          Number(enrollment.beneficio_id) === Number(benefit.beneficio_id) &&
          enrollment.estado === 'Activo'
      ).length;
      return `<tr>
        <td><strong>${escapeHtml(benefit.nombre_beneficio)}</strong></td>
        <td>${escapeHtml(benefit.proveedor)}</td>
        <td>${money(benefit.costo)}</td>
        <td>${badge(benefit.estado)}</td>
        <td>${activeEnrollments}</td>
        <td class="table-actions">
          <a class="btn btn--ghost btn--sm" href="#/beneficios?tab=catalogo&beneficio=${benefit.beneficio_id}">Editar</a>
          <button type="button" class="btn btn--danger btn--sm" data-delete-benefit="${benefit.beneficio_id}">Eliminar</button>
        </td>
      </tr>`;
    });
    body = `
      ${sectionCard(
        editingBenefit ? 'Editar beneficio' : 'Nuevo beneficio',
        `<form id="benefit-form" class="form-grid">
          ${field('Nombre', input('nombre_beneficio', editingBenefit?.nombre_beneficio || '', { placeholder: 'Ej. Seguro complementario', required: true }), { required: true })}
          ${field('Proveedor', input('proveedor', editingBenefit?.proveedor || '', { placeholder: 'Ej. Consalud', required: true }), { required: true })}
          ${field('Costo mensual', input('costo', editingBenefit?.costo ?? 0, { type: 'number', min: 0, step: 1, required: true }), { required: true })}
          ${field('Estado', select('estado', ['Activo', 'Inactivo'], editingBenefit?.estado || 'Activo', { required: true }), { required: true })}
          <div class="form-grid__wide">${formActions(editingBenefit ? 'Guardar cambios' : 'Crear beneficio', '#/beneficios?tab=catalogo')}</div>
        </form>`,
        editingBenefit ? '<a class="btn btn--ghost btn--sm" href="#/beneficios?tab=catalogo">Cancelar edición</a>' : ''
      )}
      ${sectionCard('Catálogo de beneficios', table(['Beneficio', 'Proveedor', 'Costo', 'Estado', 'Inscritos', 'Acciones'], rows, 'No hay beneficios configurados.'))}
    `;
  }

  if (activeTab === 'inscripciones') {
    const rows = enrollments
      .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))
      .map((enrollment) => {
        const benefit = getBenefit(enrollment.beneficio_id);
        return `<tr>
          <td><strong>${escapeHtml(getEmployeeName(enrollment.empleado_id))}</strong></td>
          <td>${escapeHtml(benefit?.nombre_beneficio || 'Beneficio')}</td>
          <td>${date(enrollment.fecha_inicio)}</td>
          <td>${enrollment.fecha_fin ? date(enrollment.fecha_fin) : 'Indefinido'}</td>
          <td>${badge(enrollment.estado)}</td>
          <td class="table-actions">
            ${
              enrollment.estado === 'Activo'
                ? `<button type="button" class="btn btn--ghost btn--sm" data-end-enrollment="${enrollment.beneficio_empleado_id}">Finalizar</button>`
                : ''
            }
            <button type="button" class="btn btn--danger btn--sm" data-delete-enrollment="${enrollment.beneficio_empleado_id}">Eliminar</button>
          </td>
        </tr>`;
      });
    body = `
      <div class="split-grid">
        ${sectionCard(
          'Inscribir a un beneficio',
          `<form id="enrollment-form" class="form-stack">
            ${field('Empleado', select('empleado_id', employeeOptions, '', { placeholder: 'Selecciona una persona', required: true }), { required: true })}
            ${field('Beneficio', select('beneficio_id', benefitOptions, '', { placeholder: 'Selecciona un beneficio', required: true }), { required: true })}
            ${field('Fecha de inicio', input('fecha_inicio', todayISO(), { type: 'date', required: true }), { required: true })}
            ${field('Fecha de término', input('fecha_fin', '', { type: 'date' }), { hint: 'Opcional. Déjala vacía para vigencia indefinida.' })}
            ${formActions('Inscribir')}
          </form>`
        )}
        ${sectionCard('Inscripciones', table(['Empleado', 'Beneficio', 'Desde', 'Hasta', 'Estado', 'Acciones'], rows, 'No hay inscripciones registradas.'))}
      </div>
    `;
  }

  if (activeTab === 'costos') {
    const perEmployee = employees.map((employee) => ({
      employee,
      cost: getBenefitCostForEmployee(employee.empleado_id, start, end),
      active: getActiveBenefitEnrollments(employee.empleado_id).length
    }));
    const byDepartment = getBenefitCostByDepartment(start, end);
    const total = perEmployee.reduce((sum, item) => sum + item.cost, 0);
    body = `
      <div class="stats-grid">
        ${statCard({ label: 'Costo del mes', value: money(total), meta: `${costMonth}`, tone: 'green' })}
        ${statCard({ label: 'Personas con beneficios', value: perEmployee.filter((item) => item.active > 0).length, meta: 'Inscripciones activas' })}
        ${statCard({ label: 'Beneficios activos', value: benefits.filter((benefit) => benefit.estado === 'Activo').length, meta: 'En catálogo' })}
      </div>
      <div class="toolbar">
        <label class="toolbar__field">
          <span>Mes de costeo</span>
          <input class="input" type="month" id="cost-month" value="${escapeHtml(costMonth)}">
        </label>
      </div>
      ${sectionCard(
        'Costo prorrateado por persona',
        table(
          ['Empleado', 'Beneficios activos', 'Costo del mes'],
          perEmployee.map(
            (item) => `<tr>
              <td><strong>${escapeHtml(`${item.employee.nombres} ${item.employee.apellidos}`)}</strong></td>
              <td>${item.active}</td>
              <td>${money(item.cost)}</td>
            </tr>`
          )
        )
      )}
      ${sectionCard(
        'Costo por departamento',
        table(
          ['Departamento', 'Costo del mes'],
          byDepartment.map(
            (department) => `<tr>
              <td><strong>${escapeHtml(department.nombre_departamento)}</strong></td>
              <td>${money(department.costo)}</td>
            </tr>`
          )
        )
      )}
    `;
  }

  return `
    ${pageHeader(
      'Beneficios',
      'Catálogo, inscripciones y costo prorrateado de beneficios.',
      '<span class="muted">Costo mensual prorrateado por días de vigencia</span>'
    )}
    ${tabNav(tabs, activeTab)}
    ${body}
  `;
}

export function bind(root, context) {
  if (!can('benefits.manage', context.session)) return;

  queryAll('[data-tab]', root).forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab;
      context.navigate('beneficios');
    });
  });

  const benefitForm = query('#benefit-form', root);
  benefitForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const values = formValues(benefitForm);
      if (context.params.get('beneficio')) {
        updateBenefit(context.params.get('beneficio'), values, context.session.email);
        showToast('Beneficio actualizado.');
      } else {
        createBenefit(values, context.session.email);
        showToast('Beneficio creado.');
      }
      context.navigate('beneficios');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-delete-benefit]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar este beneficio?')) return;
      try {
        deleteBenefit(button.dataset.deleteBenefit, context.session.email);
        showToast('Beneficio eliminado.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  const enrollmentForm = query('#enrollment-form', root);
  enrollmentForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      createBenefitEnrollment(formValues(enrollmentForm), context.session.email);
      showToast('Inscripción creada.');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-end-enrollment]', root).forEach((button) => {
    button.addEventListener('click', () => {
      try {
        endBenefitEnrollment(button.dataset.endEnrollment, todayISO(), context.session.email);
        showToast('Inscripción finalizada.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  queryAll('[data-delete-enrollment]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar esta inscripción?')) return;
      try {
        deleteBenefitEnrollment(button.dataset.deleteEnrollment, context.session.email);
        showToast('Inscripción eliminada.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  query('#cost-month', root)?.addEventListener('change', (event) => {
    costMonth = event.target.value;
    context.refresh();
  });
}
