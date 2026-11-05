import { addItem, deleteItem, loadCollection, updateItem } from '../storage.js';
import {
  benefitHasActiveEnrollments,
  employeeName,
  validateBenefit,
  validateEnrollment
} from '../rules.js';
import { audit } from '../audit.js';
import { canManage } from '../auth.js';
import { escapeHtml, formatCLP, formatDate, todayISO } from '../utils.js';
import {
  attachTableFilter,
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
  const benefits = loadCollection('beneficios');
  const enrollments = loadCollection('beneficiosEmpleado');
  const employees = loadCollection('empleados');
  const canEdit = canManage('beneficios', user);
  const isEmployee = user.rol === 'empleado';

  const scopeEnrollments = isEmployee
    ? enrollments.filter(
        (enrollment) => String(enrollment.empleado_id) === String(user.empleado_id)
      )
    : enrollments;

  const costByEmployee = employees
    .map((employee) => {
      const total = enrollments
        .filter(
          (enrollment) =>
            String(enrollment.empleado_id) === String(employee.empleado_id) &&
            enrollment.estado !== 'finalizada'
        )
        .reduce((sum, enrollment) => {
          const benefit = benefits.find(
            (item) => String(item.beneficio_id) === String(enrollment.beneficio_id)
          );
          return sum + Number(benefit?.costo || 0);
        }, 0);
      return { empleado: `${employee.nombres} ${employee.apellidos}`, total };
    })
    .filter((row) => row.total > 0);

  container.innerHTML = `
    ${pageHeader(
      'Beneficios',
      isEmployee
        ? 'Beneficios asignados a su ficha.'
        : 'Catalogo de beneficios e inscripcion de colaboradores.'
    )}
    <div id="benefit-feedback" class="feedback-slot" role="alert"></div>
    <form class="filter-bar" id="benefit-filter" autocomplete="off">
      ${field({ label: 'Buscar por beneficio, proveedor o colaborador', name: 'q', placeholder: 'Ej: dental' })}
    </form>

    <div class="layout-two">
      ${card(
        'Catalogo',
        table(
          [
            { label: 'Beneficio', render: (benefit) => escapeHtml(benefit.nombre_beneficio) },
            { label: 'Proveedor', render: (benefit) => escapeHtml(benefit.proveedor) },
            {
              label: 'Costo mensual',
              render: (benefit) => escapeHtml(formatCLP(benefit.costo))
            },
            {
              label: 'Inscripciones activas',
              render: (benefit) =>
                String(
                  enrollments.filter(
                    (enrollment) =>
                      String(enrollment.beneficio_id) === String(benefit.beneficio_id) &&
                      enrollment.estado !== 'finalizada'
                  ).length
                )
            },
            ...(canEdit
              ? [
                  {
                    label: 'Acciones',
                    render: (benefit) => `
                      <div class="inline-actions">
                        <button type="button" class="btn btn-small" data-edit-benefit="${benefit.beneficio_id}">Editar</button>
                        <button type="button" class="btn btn-small btn-danger" data-delete-benefit="${benefit.beneficio_id}">Eliminar</button>
                      </div>`
                  }
                ]
              : [])
          ],
          benefits,
          'Aun no hay beneficios registrados.',
          (benefit) =>
            `data-filter="${escapeHtml(
              `${benefit.nombre_beneficio} ${benefit.proveedor}`.toLowerCase()
            )}"`
        ),
        { actions: `<span class="count-pill">${benefits.length}</span>` }
      )}
      ${
        canEdit
          ? card(
              'Nuevo beneficio',
              `
                <form id="benefit-form" class="form-grid" autocomplete="off">
                  <input type="hidden" name="beneficio_id" value="" />
                  ${field({ label: 'Nombre', name: 'nombre_beneficio', required: true })}
                  ${field({ label: 'Proveedor', name: 'proveedor', required: true })}
                  ${field({ label: 'Costo mensual', name: 'costo', type: 'number', min: 0, step: '1', required: true })}
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar beneficio</button>
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
      canEdit
        ? card(
            'Inscribir colaborador',
            `
              <form id="enrollment-form" class="form-grid" autocomplete="off">
                ${selectField({
                  label: 'Colaborador',
                  name: 'empleado_id',
                  options: employees
                    .filter((employee) => employee.estado_laboral !== 'Desvinculado')
                    .map((employee) => ({
                      value: employee.empleado_id,
                      label: `${employee.nombres} ${employee.apellidos}`
                    })),
                  required: true
                })}
                ${selectField({
                  label: 'Beneficio',
                  name: 'beneficio_id',
                  options: benefits.map((benefit) => ({
                    value: benefit.beneficio_id,
                    label: `${benefit.nombre_beneficio} (${formatCLP(benefit.costo)})`
                  })),
                  required: true
                })}
                ${field({ label: 'Fecha de inscripcion', name: 'fecha_inscripcion', type: 'date', value: todayISO(), required: true })}
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Inscribir</button>
                </div>
              </form>
            `,
            { className: 'form-card' }
          )
        : ''
    }

    ${card(
      isEmployee ? 'Mis beneficios' : 'Inscripciones',
      table(
        [
          {
            label: 'Colaborador',
            render: (enrollment) => escapeHtml(employeeName(enrollment.empleado_id, employees))
          },
          {
            label: 'Beneficio',
            render: (enrollment) =>
              escapeHtml(
                benefits.find(
                  (benefit) => String(benefit.beneficio_id) === String(enrollment.beneficio_id)
                )?.nombre_beneficio || 'Beneficio'
              )
          },
          { label: 'Inscripcion', render: (enrollment) => escapeHtml(formatDate(enrollment.fecha_inscripcion)) },
          { label: 'Estado', render: (enrollment) => statusBadge(enrollment.estado || 'activa') },
          ...(canEdit
            ? [
                {
                  label: 'Acciones',
                  render: (enrollment) =>
                    enrollment.estado === 'finalizada'
                      ? '<span class="muted">Finalizada</span>'
                      : `<button type="button" class="btn btn-small" data-finish-enrollment="${enrollment.beneficio_empleado_id}">Finalizar</button>`
                }
              ]
            : [])
        ],
        scopeEnrollments,
        'Sin inscripciones registradas.',
        (enrollment) =>
          `data-filter="${escapeHtml(
            `${employeeName(enrollment.empleado_id, employees)} ${
              benefits.find(
                (benefit) => String(benefit.beneficio_id) === String(enrollment.beneficio_id)
              )?.nombre_beneficio || ''
            }`.toLowerCase()
          )}"`
      ),
      { actions: `<span class="count-pill">${scopeEnrollments.length}</span>` }
    )}

    ${
      !isEmployee
        ? card(
            'Costo de beneficios por colaborador',
            table(
              [
                { label: 'Colaborador', render: (row) => escapeHtml(row.empleado) },
                { label: 'Costo mensual', render: (row) => escapeHtml(formatCLP(row.total)) }
              ],
              costByEmployee,
              'Sin costos consolidados.'
            )
          )
        : ''
    }
  `;

  const feedbackSlot = container.querySelector('#benefit-feedback');
  attachTableFilter(container, container.querySelector('#benefit-filter'));

  const form = container.querySelector('#benefit-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(form);
    const editingId = values.beneficio_id || null;
    const payload = {
      nombre_beneficio: values.nombre_beneficio.trim(),
      proveedor: values.proveedor.trim(),
      costo: Number(values.costo)
    };
    const validation = validateBenefit(payload, { benefits, editingId });
    if (!validation.valid) {
      showFeedback(feedbackSlot, errorsSummary(validation.errors));
      return;
    }
    if (editingId) {
      updateItem('beneficios', editingId, payload);
      toast('Beneficio actualizado.');
    } else {
      addItem('beneficios', payload);
      toast('Beneficio creado.');
    }
    ctx.refresh();
  });

  form?.addEventListener('reset', () => {
    form.querySelector('[name="beneficio_id"]').value = '';
  });

  container.querySelectorAll('[data-edit-benefit]').forEach((button) => {
    button.addEventListener('click', () => {
      const benefit = benefits.find(
        (item) => String(item.beneficio_id) === String(button.dataset.editBenefit)
      );
      if (!benefit || !form) return;
      form.querySelector('[name="beneficio_id"]').value = benefit.beneficio_id;
      form.querySelector('[name="nombre_beneficio"]').value = benefit.nombre_beneficio;
      form.querySelector('[name="proveedor"]').value = benefit.proveedor;
      form.querySelector('[name="costo"]').value = benefit.costo;
      form.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    });
  });

  container.querySelectorAll('[data-delete-benefit]').forEach((button) => {
    button.addEventListener('click', () => {
      const benefitId = button.dataset.deleteBenefit;
      if (benefitHasActiveEnrollments(benefitId, enrollments)) {
        showFeedback(
          feedbackSlot,
          'No se puede eliminar el beneficio porque tiene inscripciones activas. Finalice las inscripciones primero.'
        );
        return;
      }
      if (!confirmAction('¿Confirma eliminar este beneficio?')) return;
      deleteItem('beneficios', benefitId);
      audit('Eliminacion de beneficio', 'beneficios', String(benefitId), user);
      toast('Beneficio eliminado.');
      ctx.refresh();
    });
  });

  container.querySelectorAll('[data-finish-enrollment]').forEach((button) => {
    button.addEventListener('click', () => {
      const enrollmentId = button.dataset.finishEnrollment;
      if (!confirmAction('¿Confirma finalizar esta inscripcion? El beneficio dejara de contar en el costo mensual.')) return;
      updateItem('beneficiosEmpleado', enrollmentId, { estado: 'finalizada' });
      audit('Finalizacion de beneficio', 'beneficiosEmpleado', String(enrollmentId), user);
      toast('Inscripcion finalizada.');
      ctx.refresh();
    });
  });

  const enrollmentForm = container.querySelector('#enrollment-form');
  enrollmentForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(enrollmentForm);
    const payload = {
      empleado_id: Number(values.empleado_id),
      beneficio_id: Number(values.beneficio_id),
      fecha_inscripcion: values.fecha_inscripcion,
      estado: 'activa'
    };
    const validation = validateEnrollment(payload, { enrollments, employees, benefits });
    if (!validation.valid) {
      showFeedback(feedbackSlot, errorsSummary(validation.errors));
      return;
    }
    addItem('beneficiosEmpleado', payload);
    audit(
      'Inscripcion en beneficio',
      'beneficiosEmpleado',
      `${employeeName(payload.empleado_id, employees)}: ${payload.beneficio_id}`,
      user
    );
    toast('Colaborador inscrito en el beneficio.');
    ctx.refresh();
  });
}
