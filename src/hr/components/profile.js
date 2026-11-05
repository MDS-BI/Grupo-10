import { addItem, loadCollection, updateItem } from '../storage.js';
import { validateBankRequest } from '../rules.js';
import { audit } from '../audit.js';
import { escapeHtml, formatDate, isValidEmail } from '../utils.js';
import {
  card,
  errorsSummary,
  field,
  formValues,
  pageHeader,
  showFeedback,
  statusBadge,
  toast
} from './ui.js';

export function render(container, ctx) {
  const { user } = ctx;
  const employees = loadCollection('empleados');
  const departments = loadCollection('departamentos');
  const positions = loadCollection('cargos');
  const requests = loadCollection('solicitudesBanco');
  const employee = employees.find(
    (item) => String(item.empleado_id) === String(user.empleado_id)
  );
  const pendingRequest = requests.find(
    (request) =>
      String(request.empleado_id) === String(user.empleado_id) && request.estado === 'Pendiente'
  );

  if (!employee) {
    container.innerHTML = pageHeader('Mi perfil', 'No se encontro su ficha de colaborador.');
    return;
  }

  const department = departments.find(
    (item) => String(item.departamento_id) === String(employee.departamento_id)
  );
  const position = positions.find(
    (item) => String(item.cargo_id) === String(employee.cargo_id)
  );

  container.innerHTML = `
    ${pageHeader('Mi perfil', 'Actualice sus datos de contacto y solicite cambios bancarios.')}
    <div id="profile-feedback" class="feedback-slot" role="alert"></div>

    <div class="layout-two">
      ${card(
        'Datos laborales',
        `
          <dl class="detail-list">
            <div><dt>Colaborador</dt><dd>${escapeHtml(employee.nombres)} ${escapeHtml(employee.apellidos)}</dd></div>
            <div><dt>Departamento</dt><dd>${escapeHtml(department?.nombre_departamento || 'Sin departamento')}</dd></div>
            <div><dt>Cargo</dt><dd>${escapeHtml(position?.nombre_cargo || 'Sin cargo')}</dd></div>
            <div><dt>Fecha de contratacion</dt><dd>${escapeHtml(formatDate(employee.fecha_contratacion))}</dd></div>
            <div><dt>Estado</dt><dd>${statusBadge(employee.estado_laboral)}</dd></div>
            <div><dt>Banco registrado</dt><dd class="confidential">${escapeHtml(employee.banco || 'Sin registro')} ${escapeHtml(employee.cuenta_bancaria || '')}</dd></div>
          </dl>
          <p class="muted small">El sueldo, cargo y rol no son editables desde el autoservicio.</p>
        `
      )}
      ${card(
        'Datos de contacto',
        `
          <form id="profile-form" class="form-grid" autocomplete="off">
            ${field({ label: 'Correo electronico', name: 'correo_electronico', type: 'email', value: employee.correo_electronico, required: true })}
            ${field({ label: 'Telefono', name: 'telefono', value: employee.telefono || '' })}
            ${field({ label: 'Direccion', name: 'direccion', value: employee.direccion || '' })}
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Guardar cambios</button>
            </div>
          </form>
        `,
        { className: 'form-card' }
      )}
    </div>

    ${card(
      'Solicitud de cambio bancario',
      pendingRequest
        ? `<p>${statusBadge('Pendiente')} Su solicitud de cambio al banco <strong>${escapeHtml(pendingRequest.banco)}</strong> fue enviada el ${escapeHtml(formatDate(pendingRequest.fecha_solicitud))} y esta pendiente de validacion por RRHH.</p>
           <p class="muted small">No es posible enviar otra solicitud hasta que la anterior sea resuelta.</p>`
        : `
          <form id="bank-form" class="form-grid" autocomplete="off">
            ${field({ label: 'Banco', name: 'banco', required: true, placeholder: 'Ej: Banco Estado' })}
            ${field({ label: 'Cuenta bancaria', name: 'cuenta_bancaria', required: true, placeholder: 'Numero o identificacion' })}
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Enviar solicitud</button>
            </div>
          </form>
          <p class="muted small">RRHH debera aprobar el cambio. La accion queda registrada en auditoria.</p>
        `
    )}
  `;

  const feedbackSlot = container.querySelector('#profile-feedback');

  const profileForm = container.querySelector('#profile-form');
  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(profileForm);
    if (!isValidEmail(values.correo_electronico)) {
      showFeedback(feedbackSlot, 'El correo electronico no es valido.');
      return;
    }
    const duplicate = employees.some(
      (item) =>
        String(item.empleado_id) !== String(employee.empleado_id) &&
        String(item.correo_electronico).toLowerCase() === values.correo_electronico.toLowerCase()
    );
    if (duplicate) {
      showFeedback(feedbackSlot, 'Ya existe otro colaborador con ese correo.');
      return;
    }
    updateItem('empleados', employee.empleado_id, {
      correo_electronico: values.correo_electronico.trim(),
      telefono: values.telefono.trim(),
      direccion: values.direccion.trim()
    });
    audit('Actualizacion de datos de contacto', 'empleados', String(employee.empleado_id), user);
    toast('Datos de contacto actualizados.');
    ctx.refresh();
  });

  const bankForm = container.querySelector('#bank-form');
  bankForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(bankForm);
    const payload = {
      empleado_id: employee.empleado_id,
      banco: values.banco.trim(),
      cuenta_bancaria: values.cuenta_bancaria.trim(),
      estado: 'Pendiente',
      fecha_solicitud: new Date().toISOString().slice(0, 10),
      revisado_por: null
    };
    const validation = validateBankRequest(payload, { requests });
    if (!validation.valid) {
      showFeedback(feedbackSlot, errorsSummary(validation.errors));
      return;
    }
    addItem('solicitudesBanco', payload);
    audit('Solicitud de cambio bancario', 'solicitudesBanco', String(employee.empleado_id), user);
    toast('Solicitud enviada a RRHH.');
    ctx.refresh();
  });
}
