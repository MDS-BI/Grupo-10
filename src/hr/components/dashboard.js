import {
  getActiveBenefitEnrollments,
  getBenefit,
  getDashboardMetrics,
  getDepartmentName,
  getDirectReports,
  getEmployee,
  getEmployeeName,
  getEmployeeVacationBalance,
  getEvaluationsForEmployee,
  getPendingValidationsForSupervisor,
  getPermissionRequestsForSupervisor,
  loadAttendance,
  loadDepartments,
  loadEmployees,
  loadPayrollPeriods,
  loadPermissionRequests
} from '../storage.js';
import {
  getEmployeePayslips,
  getPayrollCostSummary,
  getPayrollTrend
} from '../payroll.js';
import {
  avatar,
  badge,
  barChart,
  date,
  emptyState,
  escapeHtml,
  money,
  pageHeader,
  progress,
  sectionCard,
  statCard
} from './ui.js';

function pendingPermissions(session) {
  if (session.rol === 'supervisor') {
    return getPermissionRequestsForSupervisor(session.empleado_id).slice(0, 5);
  }
  return loadPermissionRequests()
    .filter((request) => request.estado === 'Pendiente')
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
    .slice(0, 5);
}

function pendingValidations(session) {
  const records =
    session.rol === 'supervisor'
      ? getPendingValidationsForSupervisor(session.empleado_id)
      : loadAttendance().filter((record) => record.estado_validacion === 'Pendiente');
  return records.slice(0, 5);
}

function requestRows(requests) {
  return requests.map(
    (request) => `
    <tr>
      <td>
        <strong>${getEmployeeName(request.empleado_id)}</strong>
        <small>${date(request.fecha_inicio)} – ${date(request.fecha_fin)}</small>
      </td>
      <td>${request.dias_solicitados} día(s)</td>
      <td>${badge(request.estado)}</td>
      <td><a class="link" href="#/permisos">Revisar</a></td>
    </tr>`
  );
}

function validationRows(records) {
  return records.map(
    (record) => `
    <tr>
      <td>
        <strong>${getEmployeeName(record.empleado_id)}</strong>
        <small>${date(record.fecha_laboral)}</small>
      </td>
      <td>${record.horas_extras} h extra</td>
      <td>${badge(record.estado_validacion)}</td>
      <td><a class="link" href="#/asistencia?tab=validacion">Validar</a></td>
    </tr>`
  );
}

function adminDashboard(session, metrics) {
  const trend = getPayrollTrend().slice(-5);
  const departments = getHeadcountByDepartment();
  const periods = loadPayrollPeriods().sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
  const latest = periods.find((period) => period.estado !== 'Borrador') || periods[0];
  const cost = latest ? getPayrollCostSummary(latest.periodo_id) : null;
  const permissions = pendingPermissions(session);
  const validations = pendingValidations(session);
  return `
    <div class="stats-grid">
      ${statCard({ label: 'Personas activas', value: metrics.activeEmployees, meta: `${metrics.totalEmployees} en dotación`, tone: 'blue' })}
      ${statCard({ label: 'Departamentos', value: metrics.departments, meta: `${metrics.positions} cargos definidos` })}
      ${statCard({ label: 'Ausentismo del mes', value: `${metrics.absenceRate}%`, meta: `${metrics.absenceDays} día(s) aprobados`, tone: 'amber' })}
      ${statCard({ label: 'Permisos pendientes', value: metrics.pendingPermissions, meta: 'Requieren revisión', tone: 'amber' })}
      ${statCard({ label: 'Asistencias por validar', value: metrics.pendingValidations, meta: 'Incluye horas extras', tone: 'amber' })}
    </div>
    <div class="dashboard-grid">
      ${sectionCard(
        'Costo de nómina por período',
        trend.length
          ? barChart(
              trend.map((item) => ({
                label: item.etiqueta,
                value: item.total_neto,
                display: money(item.total_neto)
              }))
            )
          : emptyState('Sin períodos calculados', 'Ejecuta la nómina de un período para ver la evolución.'),
        '<a class="btn btn--ghost btn--sm" href="#/nomina">Abrir nómina</a>'
      )}
      ${sectionCard(
        'Dotación por departamento',
        departments.length
          ? barChart(
              departments.map((item) => ({
                label: item.nombre_departamento,
                value: item.personas,
                display: `${item.personas}`
              }))
            )
          : emptyState('Sin departamentos', 'Crea áreas para organizar la dotación.'),
        '<a class="btn btn--ghost btn--sm" href="#/departamentos">Ver áreas</a>'
      )}
      ${sectionCard(
        'Solicitudes por resolver',
        permissions.length
          ? `<div class="table-wrap"><table class="data-table data-table--compact"><tbody>${requestRows(permissions).join('')}</tbody></table></div>`
          : emptyState('Todo al día', 'No hay solicitudes de permiso pendientes.'),
        '<a class="btn btn--ghost btn--sm" href="#/permisos">Ver todas</a>'
      )}
      ${sectionCard(
        'Horas extras por validar',
        validations.length
          ? `<div class="table-wrap"><table class="data-table data-table--compact"><tbody>${validationRows(validations).join('')}</tbody></table></div>`
          : emptyState('Sin validaciones pendientes', 'Las horas extras aprobadas se consolidan en la nómina.'),
        '<a class="btn btn--ghost btn--sm" href="#/asistencia">Ver asistencia</a>'
      )}
      ${sectionCard(
        'Último costo consolidado',
        cost
          ? `<div class="cost-highlight">
              <div><span>Período</span><strong>${date(cost.periodo.fecha_inicio)} – ${date(cost.periodo.fecha_fin)}</strong></div>
              <div><span>Nómina neta</span><strong>${money(cost.total_neto)}</strong></div>
              <div><span>Beneficios</span><strong>${money(cost.costo_beneficios)}</strong></div>
              <div><span>Costo total</span><strong>${money(cost.costo_total)}</strong></div>
            </div>`
          : emptyState('Sin liquidaciones', 'Calcula un período para consolidar el costo.'),
        '<a class="btn btn--ghost btn--sm" href="#/nomina">Ver costos</a>'
      )}
      ${sectionCard(
        'Accesos rápidos',
        `<div class="quick-grid">
          <a class="quick-action" href="#/empleados"><strong>Nueva persona</strong><span>Alta y ficha laboral</span></a>
          <a class="quick-action" href="#/contratos"><strong>Nuevo contrato</strong><span>Texto y vigencia</span></a>
          <a class="quick-action" href="#/nomina"><strong>Procesar nómina</strong><span>Haberes y descuentos</span></a>
          <a class="quick-action" href="#/evaluaciones"><strong>Evaluar equipo</strong><span>Objetivos y desempeño</span></a>
        </div>`
      )}
    </div>
  `;
}

function getHeadcountByDepartment() {
  const employees = loadEmployees();
  return loadDepartments().map((department) => ({
    ...department,
    personas: employees.filter(
      (employee) =>
        Number(employee.departamento_id) === Number(department.departamento_id) &&
        employee.estado === 'Activo'
    ).length
  }));
}

function supervisorDashboard(session, metrics) {
  const reports = getDirectReports(session.empleado_id);
  const permissions = pendingPermissions(session);
  const validations = pendingValidations(session);
  return `
    <div class="stats-grid">
      ${statCard({ label: 'Equipo directo', value: reports.length, meta: 'Personas a cargo', tone: 'blue' })}
      ${statCard({ label: 'Solicitudes pendientes', value: permissions.length, meta: 'Para revisar', tone: 'amber' })}
      ${statCard({ label: 'Asistencias por validar', value: validations.length, meta: 'Horas extras del equipo', tone: 'amber' })}
      ${statCard({ label: 'Evaluaciones', value: metrics.averageRating || '—', meta: 'Promedio general', tone: 'green' })}
    </div>
    <div class="dashboard-grid">
      ${sectionCard(
        'Mi equipo',
        reports.length
          ? `<div class="people-list">${reports
              .map(
                (employee) => `
              <a class="person-row" href="#/empleados/${employee.empleado_id}">
                ${avatar(`${employee.nombres} ${employee.apellidos}`)}
                <span>
                  <strong>${employee.nombres} ${employee.apellidos}</strong>
                  <small>${getDepartmentName(employee.departamento_id)} · ${employee.email}</small>
                </span>
                ${badge(employee.estado)}
              </a>`
              )
              .join('')}</div>`
          : emptyState('Sin personas a cargo', 'La jerarquía se configura desde la ficha de cada empleado.'),
        '<a class="btn btn--ghost btn--sm" href="#/empleados">Ver personas</a>'
      )}
      ${sectionCard(
        'Solicitudes del equipo',
        permissions.length
          ? `<div class="table-wrap"><table class="data-table data-table--compact"><tbody>${requestRows(permissions).join('')}</tbody></table></div>`
          : emptyState('Sin solicitudes pendientes', 'El equipo no tiene permisos por aprobar.'),
        '<a class="btn btn--ghost btn--sm" href="#/permisos">Gestionar</a>'
      )}
      ${sectionCard(
        'Validación de asistencia',
        validations.length
          ? `<div class="table-wrap"><table class="data-table data-table--compact"><tbody>${validationRows(validations).join('')}</tbody></table></div>`
          : emptyState('Sin horas extras pendientes', 'Las asistencias del equipo están al día.'),
        '<a class="btn btn--ghost btn--sm" href="#/asistencia">Revisar</a>'
      )}
      ${sectionCard(
        'Evaluaciones recientes',
        (() => {
          const evaluations = reports.flatMap((report) =>
            getEvaluationsForEmployee(report.empleado_id).map((evaluation) => ({
              ...evaluation,
              empleado: report
            }))
          ).sort((a, b) => b.fecha_evaluacion.localeCompare(a.fecha_evaluacion));
          return evaluations.length
            ? `<div class="people-list">${evaluations
                .slice(0, 4)
                .map(
                  (evaluation) => `
                <a class="person-row" href="#/evaluaciones">
                  ${avatar(`${evaluation.empleado.nombres} ${evaluation.empleado.apellidos}`)}
                  <span>
                    <strong>${evaluation.empleado.nombres} ${evaluation.empleado.apellidos}</strong>
                    <small>${date(evaluation.fecha_evaluacion)} · ${evaluation.comentarios}</small>
                  </span>
                  <span class="rating-inline">${evaluation.calificacion}/5</span>
                </a>`
                )
                .join('')}</div>`
            : emptyState('Sin evaluaciones', 'Registra la primera evaluación de tu equipo.');
        })(),
        '<a class="btn btn--ghost btn--sm" href="#/evaluaciones">Evaluar</a>'
      )}
    </div>
  `;
}

function employeeDashboard(session) {
  const employeeId = session.empleado_id;
  const employee = getEmployee(employeeId);
  const balance = getEmployeeVacationBalance(employeeId);
  const requests = getEmployeePayslips(employeeId);
  const lastPayslip = requests[0] || null;
  const benefits = getActiveBenefitEnrollments(employeeId);
  const evaluations = getEvaluationsForEmployee(employeeId);
  const lastEvaluation = evaluations[0] || null;
  const myRequests = loadPermissionRequests()
    .filter((request) => Number(request.empleado_id) === Number(employeeId))
    .sort((a, b) => Number(b.solicitud_id) - Number(a.solicitud_id));
  const pendingRequests = myRequests.filter((request) => request.estado === 'Pendiente');
  const recentCutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const latestResolved = myRequests.find(
    (request) => request.estado !== 'Pendiente' && request.fecha_solicitud >= recentCutoff
  );
  const recentRequests = myRequests.slice(0, 5);
  return `
    ${
      latestResolved
        ? `<div class="alert alert--info">
            <strong>Actualización de solicitud</strong>
            <span>Tu solicitud del ${date(latestResolved.fecha_inicio)} fue ${latestResolved.estado.toLowerCase()}${latestResolved.comentario_aprobacion ? `: ${escapeHtml(latestResolved.comentario_aprobacion)}` : '.'}</span>
          </div>`
        : ''
    }
    <div class="stats-grid">
      ${statCard({ label: 'Saldo de vacaciones', value: `${balance} días`, meta: 'Disponibles', tone: 'green' })}
      ${statCard({ label: 'Solicitudes pendientes', value: pendingRequests.length, meta: 'En revisión' })}
      ${statCard({ label: 'Última liquidación', value: lastPayslip ? money(lastPayslip.salario_neto) : '—', meta: lastPayslip ? `Período ${lastPayslip.periodo?.fecha_inicio?.slice(0, 7) || ''}` : 'Sin liquidaciones' })}
      ${statCard({ label: 'Beneficios activos', value: benefits.length, meta: 'Inscripciones vigentes' })}
    </div>
    <div class="dashboard-grid">
      ${sectionCard(
        'Mi ficha',
        `<div class="profile-summary">
          ${avatar(`${employee.nombres} ${employee.apellidos}`, 'lg')}
          <div>
            <h3>${employee.nombres} ${employee.apellidos}</h3>
            <p>${getDepartmentName(employee.departamento_id)} · ${employee.email}</p>
            <p class="muted">Ingreso ${date(employee.fecha_contratacion)} · ${employee.estado}</p>
          </div>
          <a class="btn btn--ghost btn--sm" href="#/empleados/${employee.empleado_id}">Ver ficha</a>
        </div>`,
        '<a class="btn btn--ghost btn--sm" href="#/permisos">Solicitar permiso</a>'
      )}
      ${sectionCard(
        'Mis solicitudes',
        recentRequests.length
          ? `<div class="table-wrap"><table class="data-table data-table--compact"><tbody>${requestRows(recentRequests).join('')}</tbody></table></div>`
          : emptyState('Sin solicitudes registradas', 'Puedes solicitar vacaciones o permisos desde el módulo correspondiente.'),
        '<a class="btn btn--ghost btn--sm" href="#/permisos">Ver historial</a>'
      )}
      ${sectionCard(
        'Mis beneficios',
        benefits.length
          ? `<div class="people-list">${benefits
              .map((enrollment) => {
                const benefit = getBenefit(enrollment.beneficio_id);
                return `<div class="person-row">
                  <span class="benefit-mark">B</span>
                  <span><strong>${benefit?.nombre_beneficio || 'Beneficio'}</strong><small>${benefit?.proveedor || ''} · desde ${date(enrollment.fecha_inicio)}</small></span>
                </div>`;
              })
              .join('')}</div>`
          : emptyState('Sin beneficios activos', 'Consulta el catálogo disponible.'),
        '<a class="btn btn--ghost btn--sm" href="#/beneficios">Ver beneficios</a>'
      )}
      ${sectionCard(
        'Mi desempeño',
        lastEvaluation
          ? `<div class="evaluation-highlight">
              <span class="evaluation-highlight__score">${lastEvaluation.calificacion}/5</span>
              <p>${lastEvaluation.comentarios}</p>
              <small>Objetivo: ${lastEvaluation.objetivos}</small>
              <span class="muted">Evaluado el ${date(lastEvaluation.fecha_evaluacion)}</span>
            </div>`
          : emptyState('Sin evaluaciones', 'Tu jefatura aún no registra una evaluación.'),
        '<a class="btn btn--ghost btn--sm" href="#/evaluaciones">Ver detalle</a>'
      )}
      ${sectionCard(
        'Accesos rápidos',
        `<div class="quick-grid">
          <a class="quick-action" href="#/permisos"><strong>Pedir vacaciones</strong><span>Saldo y fechas</span></a>
          <a class="quick-action" href="#/asistencia"><strong>Mi asistencia</strong><span>Registro y resumen</span></a>
          <a class="quick-action" href="#/nomina"><strong>Mis liquidaciones</strong><span>Haberes y descuentos</span></a>
          <a class="quick-action" href="#/beneficios"><strong>Mis beneficios</strong><span>Inscripciones activas</span></a>
        </div>`
      )}
    </div>
    <div class="vacation-meter">${sectionCard(
      'Progreso de vacaciones',
      `<div class="meter-row"><span>Saldo utilizado</span><strong>${Math.max(0, 15 - balance)} de 15 días</strong></div>${progress(
        Math.max(0, 15 - balance),
        15
      )}`,
      '<a class="btn btn--ghost btn--sm" href="#/permisos">Gestionar</a>'
    )}</div>
  `;
}

export function render(context) {
  const { session } = context;
  const metrics = getDashboardMetrics();
  const greeting = session.nombre.split(' ')[0];
  const header = pageHeader(
    `Hola, ${greeting}`,
    'Resumen operativo de personas, nómina y cumplimiento.',
    session.rol === 'employee'
      ? '<a class="btn btn--primary" href="#/permisos">Solicitar permiso</a>'
      : session.rol === 'supervisor'
        ? '<a class="btn btn--primary" href="#/asistencia?tab=validacion">Validar asistencia</a>'
        : '<a class="btn btn--primary" href="#/empleados">Nueva persona</a>'
  );
  let body = '';
  if (session.rol === 'employee') {
    body = employeeDashboard(session);
  } else if (session.rol === 'supervisor') {
    body = supervisorDashboard(session, metrics);
  } else {
    body = adminDashboard(session, metrics);
  }
  return `${header}${body}`;
}

export function bind() {}
