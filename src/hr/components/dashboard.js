import { loadCollection } from '../storage.js';
import {
  daysBetweenInclusive,
  escapeHtml,
  formatCLP,
  formatDate,
  monthRange,
  todayISO
} from '../utils.js';
import { activeEmployeesOfDepartment, latestPeriod } from '../rules.js';
import { payrollCostByDepartment, payrollSummary } from '../payroll.js';
import { card, pageHeader, statCard } from './ui.js';

function quickActionsFor(role) {
  const actions = {
    admin_rrhh: [
      { label: 'Nuevo empleado', module: 'empleados', hint: 'Alta de colaborador y contrato' },
      { label: 'Gestionar permisos', module: 'permisos', hint: 'Revisar solicitudes del equipo' },
      { label: 'Ejecutar nomina', module: 'nomina', hint: 'Calcular y cerrar el periodo' },
      { label: 'Beneficios', module: 'beneficios', hint: 'Catalogo e inscripciones' }
    ],
    nomina: [
      { label: 'Ejecutar nomina', module: 'nomina', hint: 'Calcular liquidaciones' },
      { label: 'Asistencia', module: 'asistencia', hint: 'Revisar horas del periodo' },
      { label: 'Beneficios', module: 'beneficios', hint: 'Costo de beneficios' }
    ],
    jefatura: [
      { label: 'Aprobar permisos', module: 'permisos', hint: 'Bandeja de mi equipo' },
      { label: 'Validar asistencia', module: 'asistencia', hint: 'Horas extras pendientes' },
      { label: 'Evaluar desempeno', module: 'evaluaciones', hint: 'Subordinados directos' }
    ],
    empleado: [
      { label: 'Solicitar permiso', module: 'permisos', hint: 'Vacaciones o licencia' },
      { label: 'Mis papeletas', module: 'papeletas', hint: 'Liquidaciones y descargas' },
      { label: 'Mi perfil', module: 'perfil', hint: 'Contacto y datos bancarios' }
    ]
  };
  return actions[role] || [];
}

export function render(container, ctx) {
  const { user } = ctx;
  const employees = loadCollection('empleados');
  const departments = loadCollection('departamentos');
  const requests = loadCollection('solicitudesPermiso');
  const attendance = loadCollection('asistencia');
  const periods = loadCollection('periodosNomina');

  const activeEmployees = employees.filter((employee) => employee.estado_laboral === 'Activo');
  const nowMonth = todayISO().slice(0, 7);
  const range = monthRange(nowMonth);

  const approvedDays = requests
    .filter(
      (request) =>
        request.estado === 'Aprobada' &&
        request.fecha_inicio &&
        request.fecha_inicio.slice(0, 7) === nowMonth
    )
    .reduce((total, request) => total + daysBetweenInclusive(request.fecha_inicio, request.fecha_fin), 0);

  const expectedDays = Math.max(1, activeEmployees.length * 20);
  const absenteeism = Math.min(100, Math.round((approvedDays / expectedDays) * 1000) / 10);

  const lastPeriod = latestPeriod({ periods });
  const summary = lastPeriod ? payrollSummary(lastPeriod.periodo_nomina_id) : { total_liquido: 0, count: 0 };
  const costByDepartment = lastPeriod
    ? payrollCostByDepartment(lastPeriod.periodo_nomina_id, { employees, departments })
    : [];

  const pendingRequests = requests.filter((request) => request.estado === 'Pendiente');
  const pendingOvertime = attendance.filter(
    (record) => record.estado_aprobacion === 'Pendiente' && record.horas_extras > 0
  );

  const teamFilter = (employee) =>
    user.rol !== 'jefatura' || String(employee.supervisor_id) === String(user.empleado_id);
  const teamEmployees = activeEmployees.filter(teamFilter);

  const distribution = departments
    .map((department) => {
      const count = activeEmployeesOfDepartment(department.departamento_id, employees).length;
      return { departamento: department.nombre_departamento, count };
    })
    .sort((a, b) => b.count - a.count);

  const quickActions = quickActionsFor(user.rol)
    .map(
      (action) => `
        <button type="button" class="quick-action" data-module="${action.module}">
          <strong>${escapeHtml(action.label)}</strong>
          <span>${escapeHtml(action.hint)}</span>
        </button>
      `
    )
    .join('');

  const pendingForRole =
    user.rol === 'jefatura'
      ? pendingRequests.filter((request) => teamEmployees.some((employee) => String(employee.empleado_id) === String(request.empleado_id))).length
      : pendingRequests.length;

  container.innerHTML = `
    ${pageHeader(`Hola, ${user.nombre.split(' ')[0]}`, 'Resumen operativo del modulo de Recursos Humanos y Planilla.')}
    <section class="stat-grid">
      ${statCard(user.rol === 'empleado' ? 'Colaboradores activos' : 'Dotacion activa', String(user.rol === 'jefatura' ? teamEmployees.length : activeEmployees.length), user.rol === 'jefatura' ? 'Equipo directo' : 'Colaboradores en la empresa', 'primary')}
      ${statCard('Departamentos', String(departments.length), 'Areas organizacionales')}
      ${statCard('Ausentismo del mes', `${absenteeism}%`, `${approvedDays} dia(s) aprobados en ${nowMonth}`)}
      ${statCard('Costo de nomina', formatCLP(summary.total_liquido), lastPeriod ? `Periodo ${formatDate(lastPeriod.inicio_periodo)} - ${formatDate(lastPeriod.fin_periodo)}` : 'Sin periodos', 'accent')}
    </section>

    <div class="dashboard-grid">
      ${card(
        'Acciones rapidas',
        `<div class="quick-actions">${quickActions || '<p class="muted">Sin acciones disponibles para su rol.</p>'}</div>`
      )}
      ${card(
        'Pendientes',
        `
          <ul class="metric-list">
            <li><span>Solicitudes de permiso pendientes</span><strong>${pendingForRole}</strong></li>
            <li><span>Registros de horas extras por validar</span><strong>${user.rol === 'jefatura' ? pendingOvertime.filter((record) => teamEmployees.some((employee) => String(employee.empleado_id) === String(record.empleado_id))).length : pendingOvertime.length}</strong></li>
            <li><span>Liquidaciones del ultimo periodo</span><strong>${summary.count}</strong></li>
          </ul>
          <p class="muted small">Los indicadores se recalculan con los datos almacenados en el navegador.</p>
        `
      )}
      ${card(
        'Distribucion por departamento',
        distribution.length
          ? `<ul class="bar-list">${distribution
              .map(
                (item) => `
                  <li>
                    <span>${escapeHtml(item.departamento)}</span>
                    <span class="bar-track"><span class="bar-fill" style="width:${Math.max(4, Math.round((item.count / Math.max(1, activeEmployees.length)) * 100))}%"></span></span>
                    <strong>${item.count}</strong>
                  </li>
                `
              )
              .join('')}</ul>`
          : '<p class="muted">Aun no hay departamentos.</p>'
      )}
      ${card(
        'Costo de nomina por area',
        costByDepartment.length
          ? `<ul class="metric-list">${costByDepartment
              .map(
                (item) =>
                  `<li><span>${escapeHtml(item.departamento)}</span><strong>${formatCLP(item.monto)}</strong></li>`
              )
              .join('')}</ul>`
          : '<p class="muted">Ejecute una nomina para ver el costo consolidado.</p>'
      )}
    </div>
  `;
}
