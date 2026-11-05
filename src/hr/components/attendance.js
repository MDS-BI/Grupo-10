import { addItem, loadCollection, updateItem } from '../storage.js';
import {
  directSubordinates,
  employeeName,
  getDepartmentName,
  validateAttendance
} from '../rules.js';
import { audit } from '../audit.js';
import { canValidateAttendance } from '../auth.js';
import {
  escapeHtml,
  formatDate,
  formatNumber,
  hoursBetween,
  todayISO
} from '../utils.js';
import {
  card,
  errorsSummary,
  field,
  formValues,
  pageHeader,
  selectField,
  showFeedback,
  statusBadge,
  table,
  toast
} from './ui.js';

export function render(container, ctx) {
  const { user } = ctx;
  const records = loadCollection('asistencia');
  const employees = loadCollection('empleados');
  const departments = loadCollection('departamentos');
  const requests = loadCollection('solicitudesPermiso');

  const canValidate = canValidateAttendance(user);
  const scopeEmployees =
    user.rol === 'jefatura' ? directSubordinates(user.empleado_id, employees) : employees;
  const scopeIds = new Set(scopeEmployees.map((employee) => String(employee.empleado_id)));
  const scopeRecords = records.filter((record) => scopeIds.has(String(record.empleado_id)));

  const latestMonth =
    [...scopeRecords]
      .map((record) => record.fecha_laboral)
      .sort()
      .reverse()[0]
      ?.slice(0, 7) || todayISO().slice(0, 7);

  const pendingOvertime = scopeRecords.filter(
    (record) => record.estado_aprobacion === 'Pendiente' && Number(record.horas_extras) > 0
  );

  const summary = departments
    .map((department) => {
      const departmentEmployees = scopeEmployees.filter(
        (employee) => String(employee.departamento_id) === String(department.departamento_id)
      );
      const ids = new Set(departmentEmployees.map((employee) => String(employee.empleado_id)));
      const monthRecords = scopeRecords.filter(
        (record) => ids.has(String(record.empleado_id)) && record.fecha_laboral.startsWith(latestMonth)
      );
      const hours = monthRecords.reduce((total, record) => total + Number(record.horas_trabajadas || 0), 0);
      const overtime = monthRecords.reduce((total, record) => total + Number(record.horas_extras || 0), 0);
      return {
        departamento: department.nombre_departamento,
        colaboradores: departmentEmployees.length,
        registros: monthRecords.length,
        horas: hours,
        extras: overtime
      };
    })
    .filter((row) => row.colaboradores > 0);

  const absenceDays = requests
    .filter(
      (request) =>
        request.estado === 'Aprobada' &&
        request.fecha_inicio?.startsWith(latestMonth) &&
        scopeIds.has(String(request.empleado_id))
    )
    .reduce((total, request) => {
      const start = new Date(`${request.fecha_inicio}T00:00:00Z`).getTime();
      const end = new Date(`${request.fecha_fin}T00:00:00Z`).getTime();
      return total + Math.floor((end - start) / 86400000) + 1;
    }, 0);
  const absentRate = scopeEmployees.length
    ? Math.round((absenceDays / (scopeEmployees.length * 20)) * 1000) / 10
    : 0;

  container.innerHTML = `
    ${pageHeader(
      'Asistencia',
      user.rol === 'jefatura'
        ? 'Registro y validacion de asistencia de sus subordinados directos.'
        : 'Registro diario, horas trabajadas, horas extras y ausentismo.'
    )}
    <div id="attendance-feedback" class="feedback-slot" role="alert"></div>

    <section class="stat-grid">
      ${statCardSimple('Horas registradas', formatNumber(summary.reduce((total, row) => total + row.horas, 0), 1), `Periodo ${latestMonth}`)}
      ${statCardSimple('Horas extras pendientes', formatNumber(pendingOvertime.reduce((total, record) => total + Number(record.horas_extras || 0), 0), 1), `${pendingOvertime.length} registro(s)`)}
      ${statCardSimple('Dias de ausencia', String(absenceDays), 'Permisos aprobados del mes')}
      ${statCardSimple('Ausentismo', `${absentRate}%`, 'Sobre jornadas esperadas')}
    </section>

    ${card(
      'Registrar jornada',
      `
        <form id="attendance-form" class="form-grid" autocomplete="off">
          ${selectField({
            label: 'Colaborador',
            name: 'empleado_id',
            options: scopeEmployees
              .filter((employee) => employee.estado_laboral !== 'Desvinculado')
              .map((employee) => ({
                value: employee.empleado_id,
                label: `${employee.nombres} ${employee.apellidos}`
              })),
            required: true
          })}
          ${field({ label: 'Fecha laboral', name: 'fecha_laboral', type: 'date', value: todayISO(), required: true })}
          ${field({ label: 'Hora de entrada', name: 'hora_entrada', type: 'time', value: '08:30', required: true })}
          ${field({ label: 'Hora de salida', name: 'hora_salida', type: 'time', value: '18:00', required: true })}
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Guardar asistencia</button>
          </div>
        </form>
      `,
      { className: 'form-card' }
    )}

    ${
      canValidate
        ? card(
            'Validacion de horas extras',
            pendingOvertime.length
              ? table(
                  [
                    {
                      label: 'Colaborador',
                      render: (record) => escapeHtml(employeeName(record.empleado_id, employees))
                    },
                    { label: 'Fecha', render: (record) => escapeHtml(formatDate(record.fecha_laboral)) },
                    { label: 'Horas', render: (record) => escapeHtml(record.horas_trabajadas) },
                    {
                      label: 'Horas extras',
                      render: (record) => `<strong>${escapeHtml(record.horas_extras)}</strong>`
                    },
                    { label: 'Estado', render: (record) => statusBadge(record.estado_aprobacion) },
                    {
                      label: 'Acciones',
                      render: (record) =>
                        `<button type="button" class="btn btn-small btn-primary" data-approve-overtime="${record.asistencia_id}">Aprobar horas extras</button>`
                    }
                  ],
                  pendingOvertime,
                  'No hay horas extras pendientes.'
                )
              : '<p class="muted">No hay registros con horas extras por validar.</p>'
          )
        : ''
    }

    <div class="layout-two">
      ${card(
        'Registros de asistencia',
        `
          <form class="filter-bar" id="attendance-filter">
            ${field({ label: 'Mes', name: 'month', type: 'month', value: latestMonth })}
          </form>
          ${table(
            [
              {
                label: 'Colaborador',
                render: (record) => escapeHtml(employeeName(record.empleado_id, employees))
              },
              {
                label: 'Area',
                render: (record) => {
                  const employee = employees.find(
                    (item) => String(item.empleado_id) === String(record.empleado_id)
                  );
                  return escapeHtml(getDepartmentName(employee?.departamento_id, departments));
                }
              },
              { label: 'Fecha', render: (record) => escapeHtml(formatDate(record.fecha_laboral)) },
              {
                label: 'Entrada / salida',
                render: (record) =>
                  `${escapeHtml(String(record.hora_entrada).slice(11, 16))} - ${escapeHtml(String(record.hora_salida).slice(11, 16))}`
              },
              { label: 'Horas', render: (record) => escapeHtml(record.horas_trabajadas) },
              { label: 'Extras', render: (record) => escapeHtml(record.horas_extras || 0) },
              { label: 'Estado', render: (record) => statusBadge(record.estado_aprobacion) }
            ],
            scopeRecords.slice(0, 200),
            'Sin registros de asistencia.',
            (record) => `data-month="${record.fecha_laboral.slice(0, 7)}"`
          )}
        `,
        { actions: `<span class="count-pill">${scopeRecords.length}</span>` }
      )}
      ${card(
        'Resumen por area',
        table(
          [
            { label: 'Area', render: (row) => escapeHtml(row.departamento) },
            { label: 'Colaboradores', render: (row) => String(row.colaboradores) },
            { label: 'Registros', render: (row) => String(row.registros) },
            { label: 'Horas', render: (row) => formatNumber(row.horas, 1) },
            { label: 'Extras', render: (row) => formatNumber(row.extras, 1) }
          ],
          summary,
          'Sin datos para el periodo.'
        ),
        { actions: `<span class="muted small">Periodo ${escapeHtml(latestMonth)}</span>` }
      )}
    </div>
  `;

  const feedbackSlot = container.querySelector('#attendance-feedback');

  const form = container.querySelector('#attendance-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(form);
    const hours = hoursBetween(values.hora_entrada, values.hora_salida);
    const payload = {
      empleado_id: Number(values.empleado_id),
      fecha_laboral: values.fecha_laboral,
      hora_entrada: `${values.fecha_laboral}T${values.hora_entrada}`,
      hora_salida: `${values.fecha_laboral}T${values.hora_salida}`,
      horas_trabajadas: hours,
      horas_extras: Math.max(0, Math.round((hours - 8) * 100) / 100),
      estado_aprobacion: hours > 8 ? 'Pendiente' : 'Aprobada',
      aprobado_por: hours > 8 ? null : user.empleado_id
    };
    const validation = validateAttendance(payload, { records, employees });
    if (!validation.valid) {
      showFeedback(feedbackSlot, errorsSummary(validation.errors));
      return;
    }
    addItem('asistencia', payload);
    audit(
      'Registro de asistencia',
      'asistencia',
      `${employeeName(payload.empleado_id, employees)}: ${payload.fecha_laboral}`,
      user
    );
    toast('Asistencia registrada.');
    ctx.refresh();
  });

  const filterForm = container.querySelector('#attendance-filter');
  filterForm?.addEventListener('input', () => {
    const month = filterForm.querySelector('[name="month"]').value;
    container.querySelectorAll('tbody tr[data-month]').forEach((row) => {
      row.hidden = Boolean(month) && row.dataset.month !== month;
    });
  });

  container.querySelectorAll('[data-approve-overtime]').forEach((button) => {
    button.addEventListener('click', () => {
      const record = records.find(
        (item) => String(item.asistencia_id) === String(button.dataset.approveOvertime)
      );
      if (!record || record.estado_aprobacion === 'Aprobada') {
        showFeedback(feedbackSlot, 'El registro ya fue aprobado o no existe.');
        return;
      }
      updateItem('asistencia', record.asistencia_id, {
        estado_aprobacion: 'Aprobada',
        aprobado_por: user.empleado_id
      });
      audit(
        'Aprobacion de horas extras',
        'asistencia',
        `${employeeName(record.empleado_id, employees)}: ${record.horas_extras} hora(s)`,
        user
      );
      toast('Horas extras aprobadas y consolidadas para la nomina.');
      ctx.refresh();
    });
  });
}

function statCardSimple(label, value, hint) {
  return `
    <article class="stat-card">
      <span class="stat-label">${escapeHtml(label)}</span>
      <strong class="stat-value">${escapeHtml(value)}</strong>
      <span class="stat-hint">${escapeHtml(hint)}</span>
    </article>
  `;
}
