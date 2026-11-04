import {
  createAttendance,
  getAttendanceSummary,
  getDirectReports,
  getEmployee,
  getEmployeeName,
  getPendingValidationsForSupervisor,
  loadAttendance,
  loadEmployees,
  validateAttendanceRecord
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

let activeTab = 'registro';
let employeeFilter = '';

function monthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
  };
}

function visibleEmployees(session) {
  if (session.rol === 'employee') {
    const employee = getEmployee(session.empleado_id);
    return employee ? [employee] : [];
  }
  if (session.rol === 'supervisor') {
    return [
      ...(getEmployee(session.empleado_id) ? [getEmployee(session.empleado_id)] : []),
      ...getDirectReports(session.empleado_id)
    ];
  }
  return loadEmployees();
}

function visibleRecords(session) {
  const ids = new Set(visibleEmployees(session).map((employee) => Number(employee.empleado_id)));
  return loadAttendance()
    .filter((record) => ids.has(Number(record.empleado_id)))
    .filter(
      (record) =>
        !employeeFilter || Number(record.empleado_id) === Number(employeeFilter)
    )
    .sort((a, b) => b.fecha_laboral.localeCompare(a.fecha_laboral));
}

function pendingRecords(session) {
  if (session.rol === 'supervisor') {
    return getPendingValidationsForSupervisor(session.empleado_id);
  }
  return loadAttendance()
    .filter((record) => record.estado_validacion === 'Pendiente')
    .sort((a, b) => b.fecha_laboral.localeCompare(a.fecha_laboral));
}

export function render(context) {
  const { session, params } = context;
  const requestedTab = params.get('tab');
  if (requestedTab) activeTab = requestedTab;
  const tabs = [
    { id: 'registro', label: 'Registro' },
    ...(['admin', 'supervisor'].includes(session.rol)
      ? [{ id: 'validacion', label: 'Validación de horas extras' }]
      : []),
    { id: 'resumen', label: 'Resumen' }
  ];
  if (!tabs.some((tab) => tab.id === activeTab)) activeTab = tabs[0].id;
  const employees = visibleEmployees(session);
  const employeeOptions = employees.map((employee) => ({
    value: employee.empleado_id,
    label: `${employee.nombres} ${employee.apellidos} · ${employee.rut}`
  }));
  const records = visibleRecords(session);
  const pending = pendingRecords(session);
  const filterEmployee = employees.find(
    (employee) => Number(employee.empleado_id) === Number(employeeFilter)
  );

  let body = '';

  if (activeTab === 'registro') {
    const rows = records.slice(0, 30).map((record) => `<tr>
      <td>${date(record.fecha_laboral)}</td>
      <td><strong>${escapeHtml(getEmployeeName(record.empleado_id))}</strong></td>
      <td>${escapeHtml(record.hora_entrada)}</td>
      <td>${escapeHtml(record.hora_salida)}</td>
      <td>${record.horas_trabajadas}</td>
      <td>${record.horas_extras}</td>
      <td>${badge(record.estado_validacion)}</td>
      <td>${record.validado_por ? escapeHtml(getEmployeeName(record.validado_por)) : '—'}</td>
    </tr>`);
    body = `
      <div class="split-grid">
        ${sectionCard(
          'Registrar jornada',
          `<form id="attendance-form" class="form-stack">
            ${field('Empleado', select('empleado_id', employeeOptions, session.empleado_id || employees[0]?.empleado_id || '', { required: true }), { required: true })}
            ${field('Fecha laboral', input('fecha_laboral', todayISO(), { type: 'date', max: todayISO(), required: true }), { required: true })}
            <div class="two-col">
              ${field('Hora de entrada', input('hora_entrada', '09:00', { type: 'time', required: true }), { required: true })}
              ${field('Hora de salida', input('hora_salida', '18:00', { type: 'time', required: true }), { required: true })}
            </div>
            <p class="form-note" id="attendance-preview">Horas trabajadas: <strong>9</strong> · Horas extras: <strong>0</strong></p>
            ${formActions('Registrar asistencia')}
          </form>`,
          '<span class="muted">Jornada base de 9 horas para el cálculo de extras.</span>'
        )}
        ${sectionCard(
          'Últimos registros',
          `<div class="toolbar">
            <label class="toolbar__field">
              <span>Filtrar por persona</span>
              ${select('filter-attendance-employee', employeeOptions, employeeFilter, { placeholder: 'Todo el equipo visible' })}
            </label>
            <span class="muted">${records.length} registro(s)</span>
          </div>
          ${table(
            ['Fecha', 'Empleado', 'Entrada', 'Salida', 'Horas', 'Extras', 'Estado', 'Validado por'],
            rows,
            'No hay registros de asistencia.'
          )}`
        )}
      </div>
    `;
  }

  if (activeTab === 'validacion') {
    const rows = pending.map((record) => `<tr>
      <td><strong>${escapeHtml(getEmployeeName(record.empleado_id))}</strong><small>${date(record.fecha_laboral)}</small></td>
      <td>${escapeHtml(record.hora_entrada)} – ${escapeHtml(record.hora_salida)}</td>
      <td>${record.horas_trabajadas}</td>
      <td><strong>${record.horas_extras}</strong></td>
      <td class="table-actions">
        <button type="button" class="btn btn--primary btn--sm" data-validate="${record.asistencia_id}" data-state="Aprobado">Aprobar</button>
        <button type="button" class="btn btn--danger btn--sm" data-validate="${record.asistencia_id}" data-state="Rechazado">Rechazar</button>
      </td>
    </tr>`);
    body = sectionCard(
      'Horas extras por validar',
      table(
        ['Empleado', 'Jornada', 'Horas', 'Extras', 'Acciones'],
        rows,
        'No hay asistencias pendientes de validación.'
      ),
      '<span class="muted">Solo las horas extras aprobadas se consolidan en la nómina.</span>'
    );
  }

  if (activeTab === 'resumen') {
    const { start, end } = monthRange();
    if (employeeFilter) {
      const selected = filterEmployee || getEmployee(employeeFilter);
      const summary = getAttendanceSummary(employeeFilter, start, end);
      body = `
        <div class="stats-grid">
          ${statCard({ label: 'Días registrados', value: summary.dias, meta: 'Mes en curso' })}
          ${statCard({ label: 'Horas trabajadas', value: summary.horas_trabajadas, meta: 'Mes en curso' })}
          ${statCard({ label: 'Horas extras aprobadas', value: summary.horas_extras, meta: 'Consolidables', tone: 'green' })}
          ${statCard({ label: 'Pendientes de validación', value: summary.pendientes, meta: 'Requieren revisión', tone: 'amber' })}
        </div>
        ${sectionCard(
          `Detalle de ${escapeHtml(selected?.nombres || '')} ${escapeHtml(selected?.apellidos || '')}`,
          table(
            ['Fecha', 'Entrada', 'Salida', 'Horas', 'Extras', 'Estado'],
            loadAttendance()
              .filter(
                (record) =>
                  Number(record.empleado_id) === Number(employeeFilter) &&
                  record.fecha_laboral >= start &&
                  record.fecha_laboral <= end
              )
              .sort((a, b) => b.fecha_laboral.localeCompare(a.fecha_laboral))
              .map(
                (record) => `<tr>
                  <td>${date(record.fecha_laboral)}</td>
                  <td>${escapeHtml(record.hora_entrada)}</td>
                  <td>${escapeHtml(record.hora_salida)}</td>
                  <td>${record.horas_trabajadas}</td>
                  <td>${record.horas_extras}</td>
                  <td>${badge(record.estado_validacion)}</td>
                </tr>`
              ),
            'No hay registros en el mes en curso.'
          ))}
      `;
    } else if (session.rol === 'employee') {
      const summary = getAttendanceSummary(session.empleado_id, start, end);
      body = `<div class="stats-grid">
        ${statCard({ label: 'Días registrados', value: summary.dias, meta: 'Mes en curso' })}
        ${statCard({ label: 'Horas trabajadas', value: summary.horas_trabajadas, meta: 'Mes en curso' })}
        ${statCard({ label: 'Horas extras aprobadas', value: summary.horas_extras, meta: 'Consolidables', tone: 'green' })}
        ${statCard({ label: 'Pendientes de validación', value: summary.pendientes, meta: 'Requieren revisión', tone: 'amber' })}
      </div>`;
    } else {
      const rows = employees.map((employee) => {
        const summary = getAttendanceSummary(employee.empleado_id, start, end);
        return `<tr>
          <td><strong>${employee.nombres} ${employee.apellidos}</strong></td>
          <td>${summary.dias}</td>
          <td>${summary.horas_trabajadas}</td>
          <td>${summary.horas_extras}</td>
          <td>${summary.pendientes}</td>
        </tr>`;
      });
      body = `
        <div class="toolbar">
          <label class="toolbar__field">
            <span>Ver resumen individual</span>
            ${select('filter-attendance-employee', employeeOptions, employeeFilter, { placeholder: 'Todo el equipo visible' })}
          </label>
        </div>
        ${sectionCard(
          'Resumen del mes en curso',
          table(['Empleado', 'Días', 'Horas', 'Extras aprobadas', 'Pendientes'], rows, 'Sin datos para el mes en curso.')
        )}
      `;
    }
  }

  return `
    ${pageHeader(
      'Asistencia y horas extras',
      'Jornadas, validación de extras y resumen mensual.',
      activeTab === 'validacion' ? '<span class="muted">Jornada base: 9 horas</span>' : ''
    )}
    ${tabNav(tabs, activeTab)}
    ${body}
  `;
}

export function bind(root, context) {
  queryAll('[data-tab]', root).forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab;
      context.navigate('asistencia');
    });
  });

  queryAll('select[name="filter-attendance-employee"]', root).forEach((inputNode) => {
    inputNode.addEventListener('change', (event) => {
      employeeFilter = event.target.value;
      context.refresh();
    });
  });

  const form = query('#attendance-form', root);
  const updatePreview = () => {
    if (!form) return;
    const entry = form.querySelector('[name="hora_entrada"]').value;
    const exit = form.querySelector('[name="hora_salida"]').value;
    const preview = form.querySelector('#attendance-preview');
    if (!preview || !entry || !exit) return;
    const [eh, em] = entry.split(':').map(Number);
    const [sh, sm] = exit.split(':').map(Number);
    const hours = Math.round(((sh * 60 + sm - eh * 60 - em) / 60) * 100) / 100;
    const overtime = Math.max(0, hours - 9);
    preview.innerHTML = `Horas trabajadas: <strong>${hours}</strong> · Horas extras: <strong>${Math.round(overtime * 100) / 100}</strong>`;
  };
  form?.addEventListener('input', updatePreview);

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      createAttendance(formValues(form), context.session.email);
      showToast('Asistencia registrada.');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-validate]', root).forEach((button) => {
    button.addEventListener('click', () => {
      try {
        validateAttendanceRecord(
          button.dataset.validate,
          button.dataset.state,
          context.session.empleado_id,
          context.session.rol,
          context.session.email
        );
        showToast(`Asistencia ${button.dataset.state.toLowerCase()}.`);
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });
}
