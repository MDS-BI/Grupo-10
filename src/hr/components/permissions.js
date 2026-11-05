import { addItem, loadCollection, updateItem } from '../storage.js';
import {
  directSubordinates,
  employeeName,
  staffingConflict,
  validatePermissionRequest,
  vacationBalance
} from '../rules.js';
import { audit } from '../audit.js';
import { canApproveRequests, canManage } from '../auth.js';
import { daysBetweenInclusive, escapeHtml, formatDate, todayISO } from '../utils.js';
import {
  attachTableFilter,
  card,
  errorsSummary,
  field,
  formValues,
  pageHeader,
  selectField,
  showFeedback,
  statusBadge,
  table,
  textareaField,
  toast
} from './ui.js';

export function render(container, ctx) {
  const { user } = ctx;
  const types = loadCollection('tiposPermiso');
  const requests = loadCollection('solicitudesPermiso');
  const employees = loadCollection('empleados');
  const canApprove = canApproveRequests(user);
  const canCreateForOthers = user.rol === 'admin_rrhh';

  const scopeEmployees =
    user.rol === 'jefatura'
      ? directSubordinates(user.empleado_id, employees)
      : user.rol === 'empleado'
        ? employees.filter((employee) => String(employee.empleado_id) === String(user.empleado_id))
        : employees;

  const scopeRequests = requests
    .filter((request) => {
      if (user.rol === 'empleado') return String(request.empleado_id) === String(user.empleado_id);
      if (user.rol === 'jefatura') {
        return scopeEmployees.some(
          (employee) => String(employee.empleado_id) === String(request.empleado_id)
        );
      }
      return true;
    })
    .sort((a, b) => (a.fecha_solicitud < b.fecha_solicitud ? 1 : -1));

  const pending = scopeRequests.filter((request) => request.estado === 'Pendiente');
  const year = Number(todayISO().slice(0, 4));
  const ownBalance = vacationBalance(user.empleado_id, year, { requests, types });

  const employeeOptions = (canCreateForOthers
    ? employees.filter((employee) => employee.estado_laboral !== 'Desvinculado')
    : scopeEmployees
  ).map((employee) => ({
    value: employee.empleado_id,
    label: `${employee.nombres} ${employee.apellidos}`
  }));

  container.innerHTML = `
    ${pageHeader(
      'Permisos y ausencias',
      canApprove
        ? 'Bandeja de aprobacion de solicitudes del equipo.'
        : 'Solicite vacaciones o permisos y consulte el estado de sus solicitudes.'
    )}
    <div id="permission-feedback" class="feedback-slot" role="alert"></div>

    ${
      user.rol === 'empleado'
        ? `<section class="stat-grid">
             ${statCardSimple('Saldo de vacaciones', `${ownBalance} dia(s)`, 'Saldo anual disponible')}
             ${statCardSimple('Solicitudes pendientes', String(pending.length), 'En espera de jefatura')}
           </section>`
        : ''
    }

    ${canCreateForOthers || user.rol === 'empleado'
      ? card(
          'Nueva solicitud',
          `
            <form id="permission-form" class="form-grid" autocomplete="off">
              ${
                canCreateForOthers
                  ? selectField({
                      label: 'Colaborador',
                      name: 'empleado_id',
                      options: employeeOptions,
                      required: true
                    })
                  : `<input type="hidden" name="empleado_id" value="${user.empleado_id}" />`
              }
              ${selectField({
                label: 'Tipo de permiso',
                name: 'tipo_permiso_id',
                options: types.map((type) => ({
                  value: type.tipo_permiso_id,
                  label: `${type.nombre_tipo_permiso}${type.es_remunerado ? '' : ' (sin goce)'}`
                })),
                required: true
              })}
              ${field({ label: 'Fecha de inicio', name: 'fecha_inicio', type: 'date', required: true })}
              ${field({ label: 'Fecha de termino', name: 'fecha_fin', type: 'date', required: true })}
              ${textareaField({ label: 'Comentario', name: 'comentario', rows: 2 })}
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Enviar solicitud</button>
              </div>
            </form>
          `,
          { className: 'form-card' }
        )
      : ''}

    ${
      canApprove
        ? card(
            'Bandeja de aprobacion',
            pending.length
              ? `<div class="approval-list">
                   ${pending
                     .map(
                       (request) => `
                         <article class="approval-card" data-request="${request.solicitud_permiso_id}">
                           <div class="approval-head">
                             <div>
                               <strong>${escapeHtml(employeeName(request.empleado_id, employees))}</strong>
                               <span>${escapeHtml(
                                 types.find((type) => String(type.tipo_permiso_id) === String(request.tipo_permiso_id))
                                   ?.nombre_tipo_permiso || 'Permiso'
                               )}</span>
                             </div>
                             <span>${escapeHtml(formatDate(request.fecha_inicio))} - ${escapeHtml(formatDate(request.fecha_fin))} · ${request.fecha_inicio ? daysBetweenInclusive(request.fecha_inicio, request.fecha_fin) : 0} dia(s)</span>
                           </div>
                           <p class="muted small">${escapeHtml(request.comentario || 'Sin comentario del solicitante.')}</p>
                           <div class="inline-form">
                             <input type="text" class="approval-comment" placeholder="Comentario de resolucion (opcional)" aria-label="Comentario de resolucion" />
                             <button type="button" class="btn btn-primary btn-small" data-approve="${request.solicitud_permiso_id}">Aprobar</button>
                             <button type="button" class="btn btn-danger btn-small" data-reject="${request.solicitud_permiso_id}">Rechazar</button>
                           </div>
                         </article>
                       `
                     )
                     .join('')}
                 </div>`
              : '<p class="muted">No hay solicitudes pendientes en su ambito.</p>'
          )
        : ''
    }

    <form class="filter-bar" id="permission-filter" autocomplete="off">
      ${field({ label: 'Buscar por colaborador o comentario', name: 'q', placeholder: 'Ej: Javiera' })}
      ${selectField({
        label: 'Estado',
        name: 'estado',
        options: ['Pendiente', 'Aprobada', 'Rechazada'].map((state) => ({
          value: state,
          label: state
        }))
      })}
    </form>

    ${card(
      'Historial de solicitudes',
      table(
        [
          {
            label: 'Colaborador',
            render: (request) => escapeHtml(employeeName(request.empleado_id, employees))
          },
          {
            label: 'Tipo',
            render: (request) =>
              escapeHtml(
                types.find((type) => String(type.tipo_permiso_id) === String(request.tipo_permiso_id))
                  ?.nombre_tipo_permiso || 'Permiso'
              )
          },
          {
            label: 'Periodo',
            render: (request) =>
              `${escapeHtml(formatDate(request.fecha_inicio))} - ${escapeHtml(formatDate(request.fecha_fin))}`
          },
          { label: 'Dias', render: (request) => String(daysBetweenInclusive(request.fecha_inicio, request.fecha_fin)) },
          { label: 'Estado', render: (request) => statusBadge(request.estado) },
          {
            label: 'Resolucion',
            render: (request) =>
              request.comentario ? escapeHtml(request.comentario) : '<span class="muted">-</span>'
          }
        ],
        scopeRequests,
        'Sin solicitudes registradas.',
        (request) => {
          const typeName =
            types.find((type) => String(type.tipo_permiso_id) === String(request.tipo_permiso_id))
              ?.nombre_tipo_permiso || 'Permiso';
          return `data-filter="${escapeHtml(
            `${employeeName(request.empleado_id, employees)} ${typeName} ${request.comentario || ''} ${request.fecha_inicio} ${request.fecha_fin}`.toLowerCase()
          )}" data-state="${escapeHtml(request.estado)}"`;
        }
      ),
      { actions: `<span class="count-pill">${scopeRequests.length}</span>` }
    )}

    ${
      user.rol === 'admin_rrhh'
        ? card(
            'Tipos de permiso',
            `
              <div class="table-wrapper">
                <table class="data-table">
                  <thead><tr><th>Tipo</th><th>Remunerado</th><th>Dias maximos</th></tr></thead>
                  <tbody>
                    ${types
                      .map(
                        (type) => `
                          <tr>
                            <td>${escapeHtml(type.nombre_tipo_permiso)}</td>
                            <td>${type.es_remunerado ? 'Si' : 'No'}</td>
                            <td>${type.dias_maximos || '-'}</td>
                          </tr>
                        `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
              <form id="permission-type-form" class="inline-form" autocomplete="off">
                ${field({ label: 'Nuevo tipo', name: 'nombre_tipo_permiso', required: true })}
                ${selectField({
                  label: 'Remunerado',
                  name: 'es_remunerado',
                  options: [
                    { value: 'true', label: 'Si' },
                    { value: 'false', label: 'No' }
                  ],
                  value: 'true',
                  required: true
                })}
                ${field({ label: 'Dias maximos', name: 'dias_maximos', type: 'number', min: 1, value: '5' })}
                <button type="submit" class="btn btn-primary">Agregar tipo</button>
              </form>
            `
          )
        : ''
    }
  `;

  const feedbackSlot = container.querySelector('#permission-feedback');
  attachTableFilter(container, container.querySelector('#permission-filter'));

  const form = container.querySelector('#permission-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = formValues(form);
      const payload = {
        empleado_id: Number(values.empleado_id),
        tipo_permiso_id: Number(values.tipo_permiso_id),
        fecha_inicio: values.fecha_inicio,
        fecha_fin: values.fecha_fin,
        estado: 'Pendiente',
        aprobado_por: null,
        comentario: values.comentario?.trim() || '',
        fecha_solicitud: todayISO()
      };
      const validation = validatePermissionRequest(payload, { requests, employees, types });
      if (!validation.valid) {
        showFeedback(feedbackSlot, errorsSummary(validation.errors));
        return;
      }
      addItem('solicitudesPermiso', payload);
      audit(
        'Solicitud de permiso',
        'solicitudesPermiso',
        `${employeeName(payload.empleado_id, employees)}: ${payload.fecha_inicio} a ${payload.fecha_fin}`,
        user
      );
      toast('Solicitud enviada a la jefatura.');
      ctx.refresh();
    });
  }

  container.querySelectorAll('[data-approve]').forEach((button) => {
    button.addEventListener('click', () => {
      const cardElement = button.closest('[data-request]');
      const request = requests.find(
        (item) => String(item.solicitud_permiso_id) === String(button.dataset.approve)
      );
      if (!request) return;
      const conflict = staffingConflict(request, { employees, requests });
      if (conflict.conflict) {
        showFeedback(feedbackSlot, conflict.reason);
        return;
      }
      const comment = cardElement?.querySelector('.approval-comment')?.value?.trim() || '';
      updateItem('solicitudesPermiso', request.solicitud_permiso_id, {
        estado: 'Aprobada',
        aprobado_por: user.empleado_id,
        comentario: comment || 'Solicitud aprobada.'
      });
      audit('Aprobacion de permiso', 'solicitudesPermiso', String(request.solicitud_permiso_id), user);
      toast('Solicitud aprobada. El saldo y calendario quedaron actualizados.');
      ctx.refresh();
    });
  });

  container.querySelectorAll('[data-reject]').forEach((button) => {
    button.addEventListener('click', () => {
      const cardElement = button.closest('[data-request]');
      const request = requests.find(
        (item) => String(item.solicitud_permiso_id) === String(button.dataset.reject)
      );
      if (!request) return;
      const comment = cardElement?.querySelector('.approval-comment')?.value?.trim() || '';
      updateItem('solicitudesPermiso', request.solicitud_permiso_id, {
        estado: 'Rechazada',
        aprobado_por: user.empleado_id,
        comentario: comment || 'Solicitud rechazada por la jefatura.'
      });
      audit('Rechazo de permiso', 'solicitudesPermiso', String(request.solicitud_permiso_id), user);
      toast('Solicitud rechazada.');
      ctx.refresh();
    });
  });

  const typeForm = container.querySelector('#permission-type-form');
  if (typeForm) {
    typeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = formValues(typeForm);
      if (!values.nombre_tipo_permiso?.trim()) {
        showFeedback(feedbackSlot, 'El nombre del tipo de permiso es obligatorio.');
        return;
      }
      addItem('tiposPermiso', {
        nombre_tipo_permiso: values.nombre_tipo_permiso.trim(),
        es_remunerado: values.es_remunerado === 'true',
        dias_maximos: Number(values.dias_maximos) || 1
      });
      toast('Tipo de permiso agregado.');
      ctx.refresh();
    });
  }
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
