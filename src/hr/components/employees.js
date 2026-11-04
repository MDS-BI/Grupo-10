import { can } from '../auth.js';
import { searchEmployees } from '../search.js';
import {
  createEmployee,
  deleteEmployee,
  getActiveContract,
  getAttendanceSummary,
  getBenefit,
  getDepartmentName,
  getDirectReports,
  getEmployee,
  getEmployeeBenefitEnrollments,
  getEmployeeFull,
  getEmployeeVacationBalance,
  getEvaluationsForEmployee,
  getPermissionRequestsForEmployee,
  getPositionName,
  loadAttendance,
  loadContracts,
  loadDepartments,
  loadEmployees,
  loadPermissionTypes,
  loadPositions,
  resolveBankRequest,
  updateEmployee,
  updateEmployeeContact
} from '../storage.js';
import {
  avatar,
  badge,
  date,
  emptyState,
  escapeHtml,
  field,
  formActions,
  formValues,
  infoList,
  input,
  money,
  pageHeader,
  query,
  queryAll,
  rating,
  sectionCard,
  select,
  showToast,
  statCard,
  table,
  textarea
} from './ui.js';

let activeTab = 'datos';
let searchTerm = '';
let departmentFilter = '';
let statusFilter = '';
let editMode = false;

function employeeOptions() {
  return loadEmployees().map((employee) => ({
    value: employee.empleado_id,
    label: `${employee.nombres} ${employee.apellidos} · ${employee.rut}`
  }));
}

function departmentOptions() {
  return loadDepartments().map((department) => ({
    value: department.departamento_id,
    label: `${department.codigo_departamento} · ${department.nombre_departamento}`
  }));
}

function positionOptions() {
  return loadPositions().map((position) => ({
    value: position.cargo_id,
    label: `${position.nombre_cargo} · ${getDepartmentName(position.departamento_id)}`
  }));
}

function canSeeSensitive(session, employeeId) {
  return session.rol === 'admin' || Number(session.empleado_id) === Number(employeeId);
}

function canSeeSalary(session, employeeId) {
  return ['admin', 'payroll'].includes(session.rol) || Number(session.empleado_id) === Number(employeeId);
}

function visibleEmployees(session) {
  return searchEmployees(searchTerm, session)
    .filter(
      (employee) =>
        !departmentFilter || Number(employee.departamento_id) === Number(departmentFilter)
    )
    .filter((employee) => !statusFilter || employee.estado === statusFilter)
    .sort((a, b) => `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`));
}

function employeeForm(employee, { isSelf = false } = {}) {
  const full = employee || {};
  const fields = isSelf
    ? `
      ${field('Correo electrónico', input('email', full.email || '', { type: 'email', required: true }), { required: true })}
      ${field('Teléfono', input('telefono', full.telefono || '', { placeholder: '+56 9 …' }))}
      ${field('Dirección', input('direccion', full.direccion || '', { placeholder: 'Calle, número, comuna' }))}
      ${field('Datos bancarios actuales', input('datos_bancarios_actuales', full.datos_bancarios || '', { readonly: true }), { hint: 'Los cambios bancarios requieren aprobación de RRHH.' })}
      ${field('Nuevo dato bancario', input('nuevo_datos_bancarios', '', { placeholder: 'Banco · tipo de cuenta · número' }), { hint: 'Déjalo vacío para mantener el dato actual.' })}
      ${field('Certificado de respaldo', input('certificado', '', { placeholder: 'Nombre o referencia del documento' }), { hint: 'Obligatorio cuando solicitas un cambio bancario.' })}
      <div class="form-grid__wide">${field('Documentos legales', textarea('documentos_legales', (full.documentos_legales || []).join('\n'), { rows: 3, placeholder: 'Un documento por línea' }), { hint: 'Un documento por línea.' })}</div>
    `
    : `
      ${field('RUT', input('rut', full.rut || '', { placeholder: '12.345.678-9', required: true }), { required: true })}
      ${field('Nombres', input('nombres', full.nombres || '', { required: true }), { required: true })}
      ${field('Apellidos', input('apellidos', full.apellidos || '', { required: true }), { required: true })}
      ${field('Fecha de nacimiento', input('fecha_nacimiento', full.fecha_nacimiento || '', { type: 'date' }))}
      ${field('Correo electrónico', input('email', full.email || '', { type: 'email', required: true }), { required: true })}
      ${field('Teléfono', input('telefono', full.telefono || '', { placeholder: '+56 9 …' }))}
      ${field('Dirección', input('direccion', full.direccion || '', { placeholder: 'Calle, número, comuna' }))}
      ${field('Fecha de contratación', input('fecha_contratacion', full.fecha_contratacion || '', { type: 'date', required: true }), { required: true })}
      ${field('Estado', select('estado', ['Activo', 'Con licencia', 'Desvinculado'], full.estado || 'Activo', { required: true }), { required: true })}
      ${field('Departamento', select('departamento_id', departmentOptions(), full.departamento_id || '', { placeholder: 'Selecciona un departamento', required: true }), { required: true })}
      ${field('Cargo', select('cargo_id', positionOptions(), full.cargo_id || '', { placeholder: 'Selecciona un cargo', required: true }), { required: true })}
      ${field('Supervisor directo', select('supervisor_id', employeeOptions(), full.supervisor_id || '', { placeholder: 'Sin supervisor' }), { hint: 'Debe pertenecer a la misma organización.' })}
      ${field('Días de vacaciones disponibles', input('dias_vacaciones_disponibles', full.dias_vacaciones_disponibles ?? 0, { type: 'number', min: 0, step: 1 }), { hint: 'Saldo inicial o ajuste manual.' })}
      ${field('Datos bancarios', input('datos_bancarios', full.datos_bancarios || '', { placeholder: 'Banco · tipo de cuenta · número' }))}
      <label class="check-field form-grid__wide">
        <input type="checkbox" name="solicitud_bancaria" ${full.solicitud_bancaria ? 'checked' : ''}>
        <span>Solicitar actualización de datos bancarios</span>
      </label>
      <div class="form-grid__wide">${field('Documentos legales', textarea('documentos_legales', (full.documentos_legales || []).join('\n'), { rows: 3, placeholder: 'Un documento por línea' }), { hint: 'Un documento por línea.' })}</div>
    `;
  return `<form id="employee-form" class="form-grid">${fields}<div class="form-grid__wide">${formActions(employee ? 'Guardar cambios' : 'Crear persona')}</div></form>`;
}

function profileTabs(employee, context) {
  const tabs = [
    { id: 'datos', label: 'Datos personales' },
    { id: 'contrato', label: 'Contrato' },
    { id: 'asistencia', label: 'Asistencia' },
    { id: 'permisos', label: 'Permisos' },
    { id: 'beneficios', label: 'Beneficios' },
    { id: 'evaluaciones', label: 'Evaluaciones' }
  ];
  return `<div class="tabs" role="tablist">${tabs
    .map(
      (tab) => `<button type="button" class="tab ${activeTab === tab.id ? 'is-active' : ''}" data-profile-tab="${tab.id}" role="tab" aria-selected="${activeTab === tab.id}">${tab.label}</button>`
    )
    .join('')}</div>`;
}

function profileBody(employee, context) {
  const { session } = context;
  const sensitive = canSeeSensitive(session, employee.empleado_id);
  const salaryVisible = canSeeSalary(session, employee.empleado_id);
  const bankRequest =
    employee.solicitud_bancaria && typeof employee.solicitud_bancaria === 'object'
      ? employee.solicitud_bancaria
      : null;
  const contracts = loadContracts().filter(
    (contract) => Number(contract.empleado_id) === Number(employee.empleado_id)
  );
  const activeContract = getActiveContract(employee.empleado_id);
  const requests = getPermissionRequestsForEmployee(employee.empleado_id);
  const attendance = loadAttendance()
    .filter((record) => Number(record.empleado_id) === Number(employee.empleado_id))
    .sort((a, b) => b.fecha_laboral.localeCompare(a.fecha_laboral));
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-30`;
  const summary = getAttendanceSummary(employee.empleado_id, monthStart, monthEnd);
  const enrollments = getEmployeeBenefitEnrollments(employee.empleado_id);
  const evaluations = getEvaluationsForEmployee(employee.empleado_id);

  if (activeTab === 'contrato') {
    return `
      <div class="profile-grid">
        ${sectionCard(
          'Contrato vigente',
          activeContract
            ? infoList([
                { label: 'Tipo', value: escapeHtml(activeContract.tipo_contrato) },
                { label: 'Inicio', value: date(activeContract.fecha_inicio) },
                { label: 'Término', value: activeContract.fecha_fin ? date(activeContract.fecha_fin) : 'Indefinido' },
                { label: 'Salario base', value: salaryVisible ? money(activeContract.salario_base) : 'Restringido' },
                { label: 'Moneda', value: escapeHtml(activeContract.moneda) }
              ])
            : emptyState('Sin contrato vigente', 'Crea un contrato desde el módulo de contratos.'),
          can('contracts.manage', session) ? '<a class="btn btn--ghost btn--sm" href="#/contratos">Gestionar contratos</a>' : ''
        )}
        ${sectionCard(
          'Historial de contratos',
          contracts.length
            ? table(
                ['Tipo', 'Inicio', 'Término', 'Salario'],
                contracts
                  .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))
                  .map(
                    (contract) => `<tr>
                      <td>${escapeHtml(contract.tipo_contrato)}</td>
                      <td>${date(contract.fecha_inicio)}</td>
                      <td>${contract.fecha_fin ? date(contract.fecha_fin) : 'Indefinido'}</td>
                      <td>${salaryVisible ? money(contract.salario_base) : 'Restringido'}</td>
                    </tr>`
                  )
              )
            : emptyState('Sin contratos', 'El historial contractual aparecerá aquí.')
        )}
        ${
          activeContract?.texto_contrato
            ? sectionCard('Texto del contrato', `<pre class="contract-text">${escapeHtml(activeContract.texto_contrato)}</pre>`)
            : ''
        }
      </div>
    `;
  }

  if (activeTab === 'asistencia') {
    return `
      <div class="stats-grid">
        ${statCard({ label: 'Días registrados', value: summary.dias, meta: 'Mes en curso' })}
        ${statCard({ label: 'Horas trabajadas', value: summary.horas_trabajadas, meta: 'Mes en curso' })}
        ${statCard({ label: 'Horas extras aprobadas', value: summary.horas_extras, meta: 'Consolidables en nómina', tone: 'green' })}
        ${statCard({ label: 'Registros pendientes', value: summary.pendientes, meta: 'Por validar', tone: 'amber' })}
      </div>
      ${sectionCard(
        'Últimos registros',
        attendance.length
          ? table(
              ['Fecha', 'Entrada', 'Salida', 'Horas', 'Extras', 'Estado'],
              attendance.slice(0, 10).map(
                (record) => `<tr>
                  <td>${date(record.fecha_laboral)}</td>
                  <td>${escapeHtml(record.hora_entrada)}</td>
                  <td>${escapeHtml(record.hora_salida)}</td>
                  <td>${record.horas_trabajadas}</td>
                  <td>${record.horas_extras}</td>
                  <td>${badge(record.estado_validacion)}</td>
                </tr>`
              )
            )
          : emptyState('Sin registros de asistencia', 'Los registros aparecerán al registrar jornadas.')
      )}
    `;
  }

  if (activeTab === 'permisos') {
    return `
      ${sectionCard(
        'Saldo y solicitudes',
        `<div class="inline-stats">
          <div><span>Saldo disponible</span><strong>${getEmployeeVacationBalance(employee.empleado_id)} días</strong></div>
          <div><span>Solicitudes</span><strong>${requests.length}</strong></div>
          <div><span>Aprobadas</span><strong>${requests.filter((request) => request.estado === 'Aprobada').length}</strong></div>
        </div>
        ${
          requests.length
            ? table(
                ['Tipo', 'Fechas', 'Días', 'Estado'],
                requests.map(
                  (request) => `<tr>
                    <td>${escapeHtml(loadPermissionTypeName(request.tipo_permiso_id))}</td>
                    <td>${date(request.fecha_inicio)} – ${date(request.fecha_fin)}</td>
                    <td>${request.dias_solicitados}</td>
                    <td>${badge(request.estado)}</td>
                  </tr>`
                )
              )
            : emptyState('Sin solicitudes', 'Las solicitudes de permiso aparecerán aquí.')
        }`,
        '<a class="btn btn--ghost btn--sm" href="#/permisos">Gestionar permisos</a>'
      )}
    `;
  }

  if (activeTab === 'beneficios') {
    return sectionCard(
      'Beneficios asignados',
      enrollments.length
        ? table(
            ['Beneficio', 'Proveedor', 'Desde', 'Hasta', 'Estado'],
            enrollments.map((enrollment) => {
              const benefit = getBenefit(enrollment.beneficio_id);
              return `<tr>
                <td>${escapeHtml(benefit?.nombre_beneficio || 'Beneficio')}</td>
                <td>${escapeHtml(benefit?.proveedor || '—')}</td>
                <td>${date(enrollment.fecha_inicio)}</td>
                <td>${enrollment.fecha_fin ? date(enrollment.fecha_fin) : 'Indefinido'}</td>
                <td>${badge(enrollment.estado)}</td>
              </tr>`;
            })
          )
        : emptyState('Sin beneficios', 'Las inscripciones a beneficios aparecerán aquí.'),
      can('benefits.manage', session) ? '<a class="btn btn--ghost btn--sm" href="#/beneficios">Gestionar beneficios</a>' : ''
    );
  }

  if (activeTab === 'evaluaciones') {
    const average = evaluations.length
      ? evaluations.reduce((total, item) => total + Number(item.calificacion), 0) / evaluations.length
      : 0;
    return `
      <div class="stats-grid">
        ${statCard({ label: 'Evaluaciones', value: evaluations.length, meta: 'Historial' })}
        ${statCard({ label: 'Promedio', value: average ? average.toFixed(1) : '—', meta: 'Escala 1 a 5', tone: 'green' })}
      </div>
      ${sectionCard(
        'Historial de desempeño',
        evaluations.length
          ? evaluations
              .map(
                (evaluation) => `
            <article class="evaluation-card">
              <div class="evaluation-card__head">
                <div><strong>${date(evaluation.fecha_evaluacion)}</strong><small>Evaluador: ${escapeHtml(getEmployeeDisplayName(evaluation.evaluador_id))}</small></div>
                ${rating(evaluation.calificacion)}
              </div>
              <p>${escapeHtml(evaluation.comentarios)}</p>
              <div class="evaluation-card__objective"><strong>Objetivos</strong><span>${escapeHtml(evaluation.objetivos)}</span></div>
            </article>`
              )
              .join('')
          : emptyState('Sin evaluaciones', 'Las evaluaciones de desempeño aparecerán aquí.')
      )}
    `;
  }

  return `
    <div class="profile-grid">
      ${sectionCard(
        'Información personal',
        infoList([
          { label: 'RUT', value: escapeHtml(employee.rut) },
          { label: 'Correo', value: escapeHtml(employee.email) },
          { label: 'Teléfono', value: escapeHtml(employee.telefono || '—') },
          { label: 'Dirección', value: escapeHtml(employee.direccion || '—') },
          { label: 'Fecha de nacimiento', value: employee.fecha_nacimiento ? date(employee.fecha_nacimiento) : '—' },
          { label: 'Ingreso', value: date(employee.fecha_contratacion) },
          { label: 'Estado', value: badge(employee.estado) },
          { label: 'Departamento', value: escapeHtml(getDepartmentName(employee.departamento_id)) },
          { label: 'Cargo', value: escapeHtml(getPositionName(employee.cargo_id)) },
          { label: 'Supervisor', value: employee.supervisor ? escapeHtml(`${employee.supervisor.nombres} ${employee.supervisor.apellidos}`) : 'Sin supervisor' }
        ]),
        can('employees.manage', session) && !editMode
          ? `<a class="btn btn--ghost btn--sm" href="#/empleados/${employee.empleado_id}?editar=1">Editar ficha</a>`
          : ''
      )}
      ${sectionCard(
        'Privacidad y documentos',
        `
        <div class="inline-stats">
          <div><span>Saldo de vacaciones</span><strong>${employee.dias_vacaciones_disponibles} días</strong></div>
          <div><span>Datos bancarios</span><strong>${sensitive ? (bankRequest ? `Solicitud ${bankRequest.estado.toLowerCase()}` : 'Registrados') : 'Restringido'}</strong></div>
          <div><span>Documentos</span><strong>${sensitive ? employee.documentos_legales.length : 'Restringido'}</strong></div>
        </div>
        ${
          sensitive
            ? `<p class="muted">${escapeHtml(employee.datos_bancarios || 'Sin datos bancarios registrados.')}</p>
               ${
                 bankRequest
                   ? `<div class="alert ${bankRequest.estado === 'Pendiente' ? 'alert--warning' : 'alert--info'}">
                        <strong>Solicitud bancaria ${escapeHtml(bankRequest.estado.toLowerCase())}</strong>
                        <span>${escapeHtml(bankRequest.datos_propuestos || 'Sin datos propuestos')}</span>
                        ${bankRequest.certificado ? `<span class="muted">Certificado: ${escapeHtml(bankRequest.certificado)}</span>` : ''}
                        ${
                          bankRequest.estado === 'Pendiente' && can('employees.manage', session)
                            ? `<div class="page-actions">
                                <button type="button" class="btn btn--primary btn--sm" data-bank-decision="Aprobada" data-bank-employee="${employee.empleado_id}">Aprobar</button>
                                <button type="button" class="btn btn--danger btn--sm" data-bank-decision="Rechazada" data-bank-employee="${employee.empleado_id}">Rechazar</button>
                              </div>`
                            : ''
                        }
                      </div>`
                   : ''
               }
               <div class="chip-list">${(employee.documentos_legales || [])
                 .map((document) => `<span class="chip">${escapeHtml(document)}</span>`)
                 .join('') || '<span class="muted">Sin documentos.</span>'}</div>`
            : '<p class="muted">Los datos bancarios y documentos legales solo son visibles para la persona y administración.</p>'
        }
        `
      )}
      ${
        Number(session.empleado_id) === Number(employee.empleado_id) && !editMode
          ? sectionCard('Actualizar mis datos', employeeForm(employee, { isSelf: true }))
          : ''
      }
    </div>
  `;
}

function loadPermissionTypeName(id) {
  return (
    loadPermissionTypes().find(
      (type) => Number(type.tipo_permiso_id) === Number(id)
    )?.nombre_tipo || 'Permiso'
  );
}

function getEmployeeDisplayName(id) {
  const employee = getEmployee(id);
  return employee ? `${employee.nombres} ${employee.apellidos}` : 'Sin evaluador';
}

export function render(context) {
  const { session, id } = context;
  const targetId = id || (session.rol === 'employee' ? session.empleado_id : null);
  const employee = targetId ? getEmployeeFull(targetId) : null;
  const isEditing = editMode || context.params.get('editar') === '1';

  if (isEditing && employee) {
    return `
      ${pageHeader(
        'Editar ficha',
        `${employee.nombres} ${employee.apellidos} · ${employee.rut}`,
        `<a class="btn btn--ghost" href="#/empleados/${employee.empleado_id}">Volver a la ficha</a>`
      )}
      ${sectionCard('Datos de la persona', employeeForm(employee))}
    `;
  }

  if (employee) {
    if (
      session.rol === 'employee' &&
      Number(session.empleado_id) !== Number(employee.empleado_id)
    ) {
      return emptyState('Acceso restringido', 'Solo puedes consultar tu propia ficha.');
    }
    if (
      session.rol === 'supervisor' &&
      Number(session.empleado_id) !== Number(employee.empleado_id) &&
      !getDirectReports(session.empleado_id).some(
        (report) => Number(report.empleado_id) === Number(employee.empleado_id)
      )
    ) {
      return emptyState('Acceso restringido', 'Solo puedes consultar tu ficha y la de tu equipo directo.');
    }
    return `
      ${pageHeader(
        `${employee.nombres} ${employee.apellidos}`,
        `${getPositionName(employee.cargo_id)} · ${getDepartmentName(employee.departamento_id)}`,
        `<a class="btn btn--ghost" href="#/empleados">Volver al listado</a>
         ${can('employees.manage', session) ? `<a class="btn btn--ghost" href="#/empleados/${employee.empleado_id}?editar=1">Editar</a>` : ''}`
      )}
      <div class="profile-hero">
        ${avatar(`${employee.nombres} ${employee.apellidos}`, 'xl')}
        <div class="profile-hero__copy">
          <h2>${employee.nombres} ${employee.apellidos}</h2>
          <p>${escapeHtml(employee.email)} · ${escapeHtml(employee.telefono || 'Sin teléfono')}</p>
          <div class="profile-hero__meta">
            ${badge(employee.estado)}
            <span class="muted">${escapeHtml(employee.rut)}</span>
            <span class="muted">Ingreso ${date(employee.fecha_contratacion)}</span>
          </div>
        </div>
        <div class="profile-hero__balance">
          <span>Vacaciones</span>
          <strong>${employee.dias_vacaciones_disponibles} días</strong>
        </div>
      </div>
      ${profileTabs(employee, context)}
      ${profileBody(employee, context)}
    `;
  }

  if (session.rol === 'employee') {
    return emptyState('Ficha no encontrada', 'No se encontró la ficha asociada a tu usuario.');
  }

  const canManage = can('employees.manage', session);
  const employees = visibleEmployees(session);
  const rows = employees.map((item) => {
    const contract = getActiveContract(item.empleado_id);
    return `<tr>
      <td>
        <a class="person-cell" href="#/empleados/${item.empleado_id}">
          ${avatar(`${item.nombres} ${item.apellidos}`, 'sm')}
          <span><strong>${item.nombres} ${item.apellidos}</strong><small>${item.email}</small></span>
        </a>
      </td>
      <td>${escapeHtml(item.rut)}</td>
      <td>${escapeHtml(getDepartmentName(item.departamento_id))}</td>
      <td>${escapeHtml(getPositionName(item.cargo_id))}</td>
      <td>${contract && canSeeSalary(session, item.empleado_id) ? money(contract.salario_base) : '<span class="muted">Restringido</span>'}</td>
      <td>${badge(item.estado)}</td>
      <td><a class="btn btn--ghost btn--sm" href="#/empleados/${item.empleado_id}">Ver ficha</a></td>
    </tr>`;
  });

  const createForm =
    canManage && context.params.get('nuevo') === '1'
      ? sectionCard(
          'Nueva persona',
          employeeForm(null),
          '<a class="btn btn--ghost btn--sm" href="#/empleados">Cancelar</a>'
        )
      : '';

  return `
    ${pageHeader(
      'Empleados',
      'Fichas laborales, datos de contacto, jerarquía y documentación.',
      canManage ? '<a class="btn btn--primary" href="#/empleados?nuevo=1">Nueva persona</a>' : ''
    )}
    ${createForm}
    ${sectionCard(
      'Dotación',
      `<form id="employee-filters" class="toolbar toolbar--wrap">
        <label class="toolbar__field toolbar__field--grow">
          <span>Buscar</span>
          <input class="input" type="search" name="search" value="${escapeHtml(searchTerm)}" placeholder="Nombre, RUT, correo, área o cargo">
        </label>
        <label class="toolbar__field">
          <span>Departamento</span>
          ${select('department', departmentOptions(), departmentFilter, { placeholder: 'Todos' })}
        </label>
        <label class="toolbar__field">
          <span>Estado</span>
          ${select('status', ['Activo', 'Con licencia', 'Desvinculado'], statusFilter, { placeholder: 'Todos' })}
        </label>
        <button class="btn btn--ghost btn--sm" type="submit">Filtrar</button>
        <span class="muted">${employees.length} persona(s)</span>
      </form>
      ${table(['Persona', 'RUT', 'Área', 'Cargo', 'Salario', 'Estado', 'Acciones'], rows, 'No hay personas para el filtro seleccionado.')}`,
      canManage ? '<span class="muted">Los salarios se administran desde contratos.</span>' : ''
    )}
  `;
}

export function bind(root, context) {
  const targetId = context.id || (context.session.rol === 'employee' ? context.session.empleado_id : null);
  const employee = targetId ? getEmployee(targetId) : null;

  queryAll('[data-profile-tab]', root).forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.profileTab;
      context.refresh();
    });
  });

  query('#employee-filters', root)?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(event.target);
    searchTerm = values.search || '';
    departmentFilter = values.department || '';
    statusFilter = values.status || '';
    context.refresh();
  });

  query('#employee-filters select[name="department"]', root)?.addEventListener('change', () => {
    query('#employee-filters', root)?.requestSubmit();
  });
  query('#employee-filters select[name="status"]', root)?.addEventListener('change', () => {
    query('#employee-filters', root)?.requestSubmit();
  });

  const form = query('#employee-form', root);
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(form);
    values.documentos_legales = String(values.documentos_legales || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    try {
      if (employee) {
        if (context.session.rol === 'employee') {
          updateEmployeeContact(employee.empleado_id, values, context.session.email);
        } else {
          updateEmployee(employee.empleado_id, values, context.session.email);
        }
        showToast('Ficha actualizada.');
        editMode = false;
        context.navigate('empleados', employee.empleado_id);
        context.refresh();
      } else {
        const created = createEmployee(values, context.session.email);
        showToast('Persona creada.');
        context.navigate('empleados', created.empleado_id);
        context.refresh();
      }
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-bank-decision]', root).forEach((button) => {
    button.addEventListener('click', () => {
      try {
        resolveBankRequest(
          button.dataset.bankEmployee,
          button.dataset.bankDecision,
          context.session.email
        );
        showToast(`Solicitud bancaria ${button.dataset.bankDecision.toLowerCase()}.`);
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  queryAll('[data-delete-employee]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar la ficha de esta persona?')) return;
      try {
        deleteEmployee(button.dataset.deleteEmployee, context.session.email);
        showToast('Persona eliminada.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });
}
