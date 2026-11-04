import { can } from '../auth.js';
import {
  approvePermissionRequest,
  cancelPermissionRequest,
  createPermissionRequest,
  createPermissionType,
  deletePermissionType,
  getDirectReports,
  getEmployee,
  getEmployeeName,
  getEmployeeVacationBalance,
  getPermissionRequestsForEmployee,
  getPermissionRequestsForSupervisor,
  getPermissionType,
  loadEmployees,
  loadPermissionRequests,
  loadPermissionTypes,
  rejectPermissionRequest,
  updatePermissionType
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
  table,
  tabNav
} from './ui.js';

let activeTab = 'solicitudes';

function requestableEmployees(session) {
  if (session.rol === 'employee') {
    return getEmployee(session.empleado_id) ? [getEmployee(session.empleado_id)] : [];
  }
  if (session.rol === 'supervisor') {
    return [
      ...(getEmployee(session.empleado_id) ? [getEmployee(session.empleado_id)] : []),
      ...getDirectReports(session.empleado_id)
    ];
  }
  return loadEmployees();
}

function visibleRequests(session) {
  if (session.rol === 'employee') {
    return getPermissionRequestsForEmployee(session.empleado_id);
  }
  if (session.rol === 'supervisor') {
    const reportIds = new Set(
      getDirectReports(session.empleado_id).map((employee) => Number(employee.empleado_id))
    );
    reportIds.add(Number(session.empleado_id));
    return loadPermissionRequests()
      .filter((request) => reportIds.has(Number(request.empleado_id)))
      .sort((a, b) => b.fecha_solicitud.localeCompare(a.fecha_solicitud));
  }
  return loadPermissionRequests().sort((a, b) =>
    b.fecha_solicitud.localeCompare(a.fecha_solicitud)
  );
}

function pendingApprovals(session) {
  if (session.rol === 'supervisor') {
    return getPermissionRequestsForSupervisor(session.empleado_id);
  }
  return loadPermissionRequests()
    .filter((request) => request.estado === 'Pendiente')
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
}

function typeName(id) {
  return getPermissionType(id)?.nombre_tipo || 'Permiso';
}

export function render(context) {
  const { session, params } = context;
  const requestedTab = params.get('tab');
  if (requestedTab) activeTab = requestedTab;
  const editingType = getPermissionType(params.get('tipo'));
  if (editingType) activeTab = 'tipos';
  const tabs = [
    { id: 'solicitudes', label: 'Solicitudes' },
    ...(['admin', 'supervisor'].includes(session.rol)
      ? [{ id: 'aprobaciones', label: 'Aprobaciones' }]
      : []),
    ...(session.rol === 'admin' ? [{ id: 'tipos', label: 'Tipos de permiso' }] : [])
  ];
  if (!tabs.some((tab) => tab.id === activeTab)) activeTab = tabs[0].id;

  const employees = requestableEmployees(session);
  const types = loadPermissionTypes();
  const employeeOptions = employees.map((employee) => ({
    value: employee.empleado_id,
    label: `${employee.nombres} ${employee.apellidos} · Saldo ${employee.dias_vacaciones_disponibles} días`
  }));
  const typeOptions = types.map((type) => ({
    value: type.tipo_permiso_id,
    label: `${type.nombre_tipo} · ${type.dias_anuales} día(s) anuales`
  }));
  const selectedEmployeeId =
    params.get('empleado') || session.empleado_id || employees[0]?.empleado_id || '';
  const selectedEmployee = getEmployee(selectedEmployeeId);
  const requests = visibleRequests(session);
  const approvals = pendingApprovals(session);

  let body = '';

  if (activeTab === 'solicitudes') {
    const rows = requests.map((request) => {
      const own = Number(request.empleado_id) === Number(session.empleado_id);
      return `<tr>
        <td>
          <strong>${escapeHtml(getEmployeeName(request.empleado_id))}</strong>
          <small>${date(request.fecha_solicitud)}</small>
        </td>
        <td>${escapeHtml(typeName(request.tipo_permiso_id))}</td>
        <td>${date(request.fecha_inicio)} – ${date(request.fecha_fin)}</td>
        <td>${request.dias_solicitados}</td>
        <td>${badge(request.estado)}</td>
        <td>${escapeHtml(request.comentario_aprobacion || '—')}</td>
        <td class="table-actions">
          ${
            own && request.estado === 'Pendiente'
              ? `<button type="button" class="btn btn--ghost btn--sm" data-cancel="${request.solicitud_id}">Cancelar</button>`
              : '<span class="muted">—</span>'
          }
        </td>
      </tr>`;
    });
    body = `
      <div class="split-grid">
        ${sectionCard(
          'Nueva solicitud',
          `<form id="permission-request-form" class="form-stack">
            ${field('Empleado', select('empleado_id', employeeOptions, selectedEmployeeId, { required: true }), { required: true })}
            <p class="form-note" id="request-balance">Saldo disponible: <strong>${selectedEmployee?.dias_vacaciones_disponibles ?? 0} días</strong></p>
            ${field('Tipo de permiso', select('tipo_permiso_id', typeOptions, '', { placeholder: 'Selecciona un tipo', required: true }), { required: true })}
            ${field('Fecha de inicio', input('fecha_inicio', todayISO(), { type: 'date', required: true }), { required: true })}
            ${field('Fecha de término', input('fecha_fin', todayISO(), { type: 'date', required: true }), { required: true })}
            <p class="form-note" id="request-days">Días solicitados: <strong>1</strong></p>
            ${formActions('Enviar solicitud')}
          </form>`,
          `<span class="muted">Las vacaciones descuentan saldo al aprobarse.</span>`
        )}
        ${sectionCard(
          'Historial de solicitudes',
          table(
            ['Empleado', 'Tipo', 'Fechas', 'Días', 'Estado', 'Comentario', 'Acciones'],
            rows,
            'No hay solicitudes registradas.'
          ),
          `<span class="muted">${requests.length} solicitud(es)</span>`
        )}
      </div>
    `;
  }

  if (activeTab === 'aprobaciones') {
    const rows = approvals.map((request) => {
      const employee = getEmployee(request.empleado_id);
      return `<tr>
        <td>
          <strong>${escapeHtml(getEmployeeName(request.empleado_id))}</strong>
          <small>${escapeHtml(employee?.email || '')}</small>
        </td>
        <td>${escapeHtml(typeName(request.tipo_permiso_id))}</td>
        <td>${date(request.fecha_inicio)} – ${date(request.fecha_fin)}</td>
        <td>${request.dias_solicitados}</td>
        <td>${getEmployeeVacationBalance(request.empleado_id)} días</td>
        <td class="table-actions">
          <button type="button" class="btn btn--primary btn--sm" data-approve="${request.solicitud_id}">Aprobar</button>
          <button type="button" class="btn btn--danger btn--sm" data-reject="${request.solicitud_id}">Rechazar</button>
        </td>
      </tr>`;
    });
    body = sectionCard(
      'Solicitudes por resolver',
      table(
        ['Empleado', 'Tipo', 'Fechas', 'Días', 'Saldo', 'Acciones'],
        rows,
        'No hay solicitudes pendientes de aprobación.'
      ),
      '<span class="muted">La aprobación respeta la dotación mínima del departamento.</span>'
    );
  }

  if (activeTab === 'tipos') {
    const typeRows = types.map((type) => `<tr>
      <td><strong>${escapeHtml(type.nombre_tipo)}</strong></td>
      <td>${type.dias_anuales}</td>
      <td>${type.es_remunerado ? 'Sí' : 'No'}</td>
      <td class="table-actions">
        <a class="btn btn--ghost btn--sm" href="#/permisos?tab=tipos&tipo=${type.tipo_permiso_id}">Editar</a>
        <button type="button" class="btn btn--danger btn--sm" data-delete-type="${type.tipo_permiso_id}">Eliminar</button>
      </td>
    </tr>`);
    body = `
      ${sectionCard(
        editingType ? 'Editar tipo de permiso' : 'Nuevo tipo de permiso',
        `<form id="permission-type-form" class="form-grid">
          ${field('Nombre', input('nombre_tipo', editingType?.nombre_tipo || '', { placeholder: 'Ej. Vacaciones', required: true }), { required: true })}
          ${field('Días anuales', input('dias_anuales', editingType?.dias_anuales ?? 0, { type: 'number', min: 0, step: 1, required: true }), { required: true })}
          <label class="check-field form-grid__wide">
            <input type="checkbox" name="es_remunerado" ${editingType?.es_remunerado !== false ? 'checked' : ''}>
            <span>Tipo de permiso remunerado</span>
          </label>
          <div class="form-grid__wide">${formActions(editingType ? 'Guardar cambios' : 'Crear tipo', '#/permisos?tab=tipos')}</div>
        </form>`,
        editingType ? '<a class="btn btn--ghost btn--sm" href="#/permisos?tab=tipos">Cancelar edición</a>' : ''
      )}
      ${sectionCard(
        'Tipos configurados',
        table(['Nombre', 'Días anuales', 'Remunerado', 'Acciones'], typeRows, 'No hay tipos de permiso configurados.')
      )}
    `;
  }

  return `
    ${pageHeader(
      'Permisos y vacaciones',
      'Solicitudes, aprobaciones y saldos del equipo.',
      activeTab === 'solicitudes' ? '<a class="btn btn--primary" href="#/permisos">Nueva solicitud</a>' : ''
    )}
    ${tabNav(tabs, activeTab)}
    ${body}
  `;
}

export function bind(root, context) {
  queryAll('[data-tab]', root).forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab;
      context.navigate('permisos');
    });
  });

  const requestForm = query('#permission-request-form', root);
  const updateBalance = () => {
    if (!requestForm) return;
    const employeeId = requestForm.querySelector('[name="empleado_id"]').value;
    const employee = getEmployee(employeeId);
    const balance = requestForm.querySelector('#request-balance');
    if (balance) {
      balance.innerHTML = `Saldo disponible: <strong>${employee?.dias_vacaciones_disponibles ?? 0} días</strong>`;
    }
    const start = requestForm.querySelector('[name="fecha_inicio"]').value;
    const end = requestForm.querySelector('[name="fecha_fin"]').value;
    if (start && end && end >= start) {
      const days = Math.floor(
        (new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000
      ) + 1;
      const daysNode = requestForm.querySelector('#request-days');
      if (daysNode) daysNode.innerHTML = `Días solicitados: <strong>${days}</strong>`;
    }
  };
  requestForm?.addEventListener('change', updateBalance);
  requestForm?.addEventListener('input', updateBalance);

  requestForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const values = formValues(requestForm);
      createPermissionRequest(values, context.session.email);
      showToast('Solicitud enviada.');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-cancel]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Cancelar esta solicitud?')) return;
      try {
        cancelPermissionRequest(
          button.dataset.cancel,
          context.session.empleado_id,
          context.session.email
        );
        showToast('Solicitud cancelada.', 'info');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  queryAll('[data-approve]', root).forEach((button) => {
    button.addEventListener('click', () => {
      const comment = window.prompt('Comentario de aprobación (opcional):', 'Aprobado');
      if (comment === null) return;
      try {
        approvePermissionRequest(
          button.dataset.approve,
          context.session.empleado_id,
          comment,
          context.session.rol,
          context.session.email
        );
        showToast('Solicitud aprobada.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  queryAll('[data-reject]', root).forEach((button) => {
    button.addEventListener('click', () => {
      const comment = window.prompt('Motivo del rechazo:', '');
      if (comment === null) return;
      try {
        rejectPermissionRequest(
          button.dataset.reject,
          context.session.empleado_id,
          comment,
          context.session.rol,
          context.session.email
        );
        showToast('Solicitud rechazada.', 'info');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  const typeForm = query('#permission-type-form', root);
  typeForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const values = formValues(typeForm);
      values.es_remunerado = typeForm.querySelector('[name="es_remunerado"]')?.checked || false;
      const editingId = context.params.get('tipo');
      if (editingId) {
        updatePermissionType(editingId, values, context.session.email);
        showToast('Tipo de permiso actualizado.');
      } else {
        createPermissionType(values, context.session.email);
        showToast('Tipo de permiso creado.');
      }
      context.navigate('permisos');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-delete-type]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar este tipo de permiso?')) return;
      try {
        deletePermissionType(button.dataset.deleteType, context.session.email);
        showToast('Tipo de permiso eliminado.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });
}
