import { addItem, deleteItem, loadCollection, updateItem } from '../storage.js';
import {
  activeContractFor,
  canDeleteEmployee,
  directSubordinates,
  employeeName,
  getDepartmentName,
  pendingBankRequests,
  validateEmployee
} from '../rules.js';
import { audit } from '../audit.js';
import {
  ROLE_LABELS,
  ROLES,
  canManage,
  canViewSalary,
  changeRole
} from '../auth.js';
import { escapeHtml, formatCLP, formatDate } from '../utils.js';
import {
  card,
  confirmAction,
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
  const employees = loadCollection('empleados');
  const departments = loadCollection('departamentos');
  const positions = loadCollection('cargos');
  const contracts = loadCollection('contratos');
  const bankRequests = loadCollection('solicitudesBanco');
  const users = loadCollection('usuarios');
  const canEdit = canManage('empleados', user);

  const visibleEmployees =
    user.rol === 'jefatura' ? directSubordinates(user.empleado_id, employees) : employees;

  const rows = [...visibleEmployees].sort((a, b) =>
    `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`)
  );

  const pendingBank = pendingBankRequests({ requests: bankRequests });

  container.innerHTML = `
    ${pageHeader(
      'Empleados',
      user.rol === 'jefatura'
        ? 'Solo se muestran sus subordinados directos.'
        : 'Fichas laborales del personal de la empresa.'
    )}
    <div id="employee-feedback" class="feedback-slot" role="alert"></div>

    ${card(
      'Buscar y filtrar',
      `<form class="filter-bar" id="employee-filter" autocomplete="off">
         ${field({ label: 'Buscar', name: 'q', placeholder: 'Nombre, apellido o correo' })}
         ${selectField({
           label: 'Departamento',
           name: 'departamento',
           options: departments.map((department) => ({
             value: department.departamento_id,
             label: department.nombre_departamento
           }))
         })}
         ${selectField({
           label: 'Cargo',
           name: 'cargo',
           options: positions.map((position) => ({
             value: position.cargo_id,
             label: position.nombre_cargo
           }))
         })}
         ${selectField({
           label: 'Estado',
           name: 'estado',
           options: ['Activo', 'Con licencia', 'Desvinculado'].map((state) => ({
             value: state,
             label: state
           }))
         })}
       </form>`
    )}

    <div class="layout-two">
      ${card(
        'Fichas de personal',
        table(
          [
            {
              label: 'Colaborador',
              render: (row) =>
                `<strong>${escapeHtml(row.nombres)} ${escapeHtml(row.apellidos)}</strong><br /><small class="muted">${escapeHtml(row.correo_electronico)}</small>`
            },
            {
              label: 'Departamento',
              render: (row) => escapeHtml(getDepartmentName(row.departamento_id, departments))
            },
            {
              label: 'Cargo',
              render: (row) =>
                escapeHtml(
                  positions.find((position) => String(position.cargo_id) === String(row.cargo_id))
                    ?.nombre_cargo || 'Sin cargo'
                )
            },
            {
              label: 'Supervisor',
              render: (row) =>
                row.supervisor_id
                  ? escapeHtml(employeeName(row.supervisor_id, employees))
                  : '<span class="muted">Sin supervisor</span>'
            },
            {
              label: 'Sueldo base',
              render: (row) => {
                if (!canViewSalary(user, row.empleado_id)) {
                  return '<span class="confidential">Confidencial</span>';
                }
                const contract = activeContractFor(row.empleado_id, undefined, contracts);
                return contract ? escapeHtml(formatCLP(contract.salario_base)) : '<span class="muted">Sin contrato</span>';
              }
            },
            { label: 'Estado', render: (row) => statusBadge(row.estado_laboral) },
            {
              label: 'Acciones',
              render: (row) =>
                canEdit
                  ? `<div class="inline-actions">
                       <button type="button" class="btn btn-small" data-edit="${row.empleado_id}">Editar</button>
                       <button type="button" class="btn btn-small btn-danger" data-delete="${row.empleado_id}">Eliminar</button>
                     </div>`
                  : '<span class="muted">Solo lectura</span>'
            }
          ],
          rows,
          'No hay colaboradores que coincidan con el filtro.',
          (row) =>
            `data-search="${escapeHtml(`${row.nombres} ${row.apellidos} ${row.correo_electronico}`.toLowerCase())}" data-dept="${row.departamento_id}" data-cargo="${row.cargo_id}" data-state="${escapeHtml(row.estado_laboral)}"`
        ),
        { actions: `<span class="count-pill">${rows.length}</span>` }
      )}
      ${
        canEdit
          ? card(
              'Alta / edicion de colaborador',
              `
                <form id="employee-form" data-form="employee" class="form-grid" autocomplete="off">
                  <input type="hidden" name="empleado_id" value="" />
                  ${field({ label: 'Nombres', name: 'nombres', required: true })}
                  ${field({ label: 'Apellidos', name: 'apellidos', required: true })}
                  ${field({ label: 'Correo electronico', name: 'correo_electronico', type: 'email', required: true })}
                  ${field({ label: 'Fecha de contratacion', name: 'fecha_contratacion', type: 'date', required: true })}
                  ${selectField({
                    label: 'Estado laboral',
                    name: 'estado_laboral',
                    options: ['Activo', 'Con licencia', 'Desvinculado'].map((state) => ({
                      value: state,
                      label: state
                    })),
                    value: 'Activo',
                    required: true
                  })}
                  ${selectField({
                    label: 'Departamento',
                    name: 'departamento_id',
                    options: departments.map((department) => ({
                      value: department.departamento_id,
                      label: department.nombre_departamento
                    })),
                    required: true
                  })}
                  ${selectField({
                    label: 'Cargo',
                    name: 'cargo_id',
                    options: positions.map((position) => ({
                      value: position.cargo_id,
                      label: `${position.nombre_cargo} (${position.nivel_grado})`
                    })),
                    required: true
                  })}
                  ${selectField({
                    label: 'Supervisor directo',
                    name: 'supervisor_id',
                    options: employees
                      .filter((employee) => employee.estado_laboral !== 'Desvinculado')
                      .map((employee) => ({
                        value: employee.empleado_id,
                        label: `${employee.nombres} ${employee.apellidos}`
                      })),
                    placeholder: 'Sin supervisor'
                  })}
                  ${field({ label: 'Telefono', name: 'telefono' })}
                  ${field({ label: 'Direccion', name: 'direccion' })}
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar colaborador</button>
                    <button type="reset" class="btn btn-ghost">Limpiar</button>
                  </div>
                </form>
              `,
              { className: 'form-card' }
            )
          : ''
      }
    </div>

    ${
      user.rol === 'admin_rrhh'
        ? card(
            'Solicitudes de cambio bancario pendientes',
            pendingBank.length
              ? table(
                  [
                    {
                      label: 'Colaborador',
                      render: (request) => escapeHtml(employeeName(request.empleado_id, employees))
                    },
                    { label: 'Banco', render: (request) => escapeHtml(request.banco) },
                    {
                      label: 'Cuenta',
                      render: (request) => `<span class="confidential">${escapeHtml(request.cuenta_bancaria)}</span>`
                    },
                    { label: 'Solicitado', render: (request) => escapeHtml(formatDate(request.fecha_solicitud)) },
                    {
                      label: 'Acciones',
                      render: (request) => `
                        <div class="inline-actions">
                          <button type="button" class="btn btn-small btn-primary" data-approve-bank="${request.solicitud_banco_id}">Aprobar</button>
                          <button type="button" class="btn btn-small btn-danger" data-reject-bank="${request.solicitud_banco_id}">Rechazar</button>
                        </div>`
                    }
                  ],
                  pendingBank,
                  'Sin solicitudes pendientes.'
                )
              : '<p class="muted">Sin solicitudes bancarias pendientes.</p>'
          )
        : ''
    }

    ${
      user.rol === 'admin_rrhh'
        ? card(
            'Usuarios y roles',
            `<p class="muted small">Los cambios de rol se aplican en el siguiente inicio de sesion del usuario.</p>
             <div class="table-wrapper">
               <table class="data-table">
                 <thead><tr><th>Usuario</th><th>Correo</th><th>Rol actual</th><th>Nuevo rol</th><th></th></tr></thead>
                 <tbody>
                   ${users
                     .map(
                       (account) => `
                         <tr>
                           <td>${escapeHtml(account.nombre)}</td>
                           <td>${escapeHtml(account.correo_electronico)}</td>
                           <td>${escapeHtml(ROLE_LABELS[account.rol] || account.rol)}</td>
                           <td>
                             <select data-role-select="${account.usuario_id}" aria-label="Rol de ${escapeHtml(account.nombre)}">
                               ${Object.values(ROLES)
                                 .map(
                                   (role) =>
                                     `<option value="${role}" ${role === account.rol ? 'selected' : ''}>${escapeHtml(ROLE_LABELS[role])}</option>`
                                 )
                                 .join('')}
                             </select>
                           </td>
                           <td><button type="button" class="btn btn-small" data-role-save="${account.usuario_id}">Guardar rol</button></td>
                         </tr>
                       `
                     )
                     .join('')}
                 </tbody>
               </table>
             </div>`
          )
        : ''
    }
  `;

  const feedbackSlot = container.querySelector('#employee-feedback');

  const filterForm = container.querySelector('#employee-filter');
  if (filterForm) {
    const applyFilter = () => {
      const query = filterForm.querySelector('[name="q"]').value.toLowerCase();
      const department = filterForm.querySelector('[name="departamento"]').value;
      const position = filterForm.querySelector('[name="cargo"]').value;
      const state = filterForm.querySelector('[name="estado"]').value;
      container.querySelectorAll('tbody tr[data-search]').forEach((row) => {
        const matchQuery = !query || row.dataset.search.includes(query);
        const matchDepartment = !department || row.dataset.dept === department;
        const matchPosition = !position || row.dataset.cargo === position;
        const matchState = !state || row.dataset.state === state;
        row.hidden = !(matchQuery && matchDepartment && matchPosition && matchState);
      });
    };
    filterForm.addEventListener('input', applyFilter);
    filterForm.addEventListener('change', applyFilter);
  }

  if (canEdit) {
    const form = container.querySelector('#employee-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = formValues(form);
      const editingId = values.empleado_id || null;
      const payload = {
        nombres: values.nombres.trim(),
        apellidos: values.apellidos.trim(),
        correo_electronico: values.correo_electronico.trim(),
        fecha_contratacion: values.fecha_contratacion,
        estado_laboral: values.estado_laboral,
        departamento_id: Number(values.departamento_id),
        cargo_id: Number(values.cargo_id),
        supervisor_id: values.supervisor_id ? Number(values.supervisor_id) : null,
        telefono: values.telefono?.trim() || '',
        direccion: values.direccion?.trim() || ''
      };
      const validation = validateEmployee(payload, {
        employees,
        departments,
        positions,
        editingId
      });
      if (!validation.valid) {
        showFeedback(feedbackSlot, errorsSummary(validation.errors));
        return;
      }
      if (editingId) {
        updateItem('empleados', editingId, payload);
        audit('Edicion de ficha de empleado', 'empleados', `${payload.nombres} ${payload.apellidos}`, user);
        toast('Colaborador actualizado.');
      } else {
        addItem('empleados', payload);
        audit('Alta de empleado', 'empleados', `${payload.nombres} ${payload.apellidos}`, user);
        toast('Colaborador creado.');
      }
      ctx.refresh();
    });

    form.addEventListener('reset', () => {
      form.querySelector('[name="empleado_id"]').value = '';
    });

    container.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const employee = employees.find(
          (item) => String(item.empleado_id) === String(button.dataset.edit)
        );
        if (!employee) return;
        form.querySelector('[name="empleado_id"]').value = employee.empleado_id;
        form.querySelector('[name="nombres"]').value = employee.nombres || '';
        form.querySelector('[name="apellidos"]').value = employee.apellidos || '';
        form.querySelector('[name="correo_electronico"]').value = employee.correo_electronico || '';
        form.querySelector('[name="fecha_contratacion"]').value = employee.fecha_contratacion || '';
        form.querySelector('[name="estado_laboral"]').value = employee.estado_laboral || 'Activo';
        form.querySelector('[name="departamento_id"]').value = employee.departamento_id || '';
        form.querySelector('[name="cargo_id"]').value = employee.cargo_id || '';
        form.querySelector('[name="supervisor_id"]').value = employee.supervisor_id || '';
        form.querySelector('[name="telefono"]').value = employee.telefono || '';
        form.querySelector('[name="direccion"]').value = employee.direccion || '';
        form.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  container.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      const employeeId = button.dataset.delete;
      const check = canDeleteEmployee(employeeId);
      if (!check.allowed) {
        showFeedback(feedbackSlot, check.reason);
        return;
      }
      if (!confirmAction('¿Confirma eliminar esta ficha de colaborador?')) return;
      deleteItem('empleados', employeeId);
      audit('Eliminacion de empleado', 'empleados', String(employeeId), user);
      toast('Colaborador eliminado.');
      ctx.refresh();
    });
  });

  container.querySelectorAll('[data-approve-bank]').forEach((button) => {
    button.addEventListener('click', () => {
      const request = bankRequests.find(
        (item) => String(item.solicitud_banco_id) === String(button.dataset.approveBank)
      );
      if (!request) return;
      updateItem('empleados', request.empleado_id, {
        banco: request.banco,
        cuenta_bancaria: request.cuenta_bancaria
      });
      updateItem('solicitudesBanco', request.solicitud_banco_id, {
        estado: 'Aprobada',
        revisado_por: user.empleado_id
      });
      audit('Cambio de datos bancarios', 'empleados', `Solicitud ${request.solicitud_banco_id} aprobada`, user);
      toast('Solicitud bancaria aprobada.');
      ctx.refresh();
    });
  });

  container.querySelectorAll('[data-reject-bank]').forEach((button) => {
    button.addEventListener('click', () => {
      updateItem('solicitudesBanco', button.dataset.rejectBank, {
        estado: 'Rechazada',
        revisado_por: user.empleado_id
      });
      audit('Rechazo de cambio bancario', 'solicitudesBanco', String(button.dataset.rejectBank), user);
      toast('Solicitud bancaria rechazada.');
      ctx.refresh();
    });
  });

  container.querySelectorAll('[data-role-save]').forEach((button) => {
    button.addEventListener('click', () => {
      const usuarioId = button.dataset.roleSave;
      const select = container.querySelector(`[data-role-select="${usuarioId}"]`);
      const outcome = changeRole(usuarioId, select.value, user);
      if (!outcome.ok) {
        showFeedback(feedbackSlot, outcome.reason);
        return;
      }
      toast('Rol actualizado. Se aplicara en el siguiente inicio de sesion.');
      ctx.refresh();
    });
  });
}
