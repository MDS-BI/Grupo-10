import { loadCollection, addItem } from '../storage.js';
import { directSubordinates, employeeName, validateEvaluation } from '../rules.js';
import { audit } from '../audit.js';
import { escapeHtml, formatDate, formatNumber, todayISO } from '../utils.js';
import {
  attachTableFilter,
  card,
  errorsSummary,
  field,
  formValues,
  pageHeader,
  selectField,
  showFeedback,
  table,
  textareaField,
  toast
} from './ui.js';

export function render(container, ctx) {
  const { user } = ctx;
  const evaluations = loadCollection('evaluaciones');
  const employees = loadCollection('empleados');

  const team =
    user.rol === 'jefatura'
      ? directSubordinates(user.empleado_id, employees)
      : employees;
  const teamIds = new Set(team.map((employee) => String(employee.empleado_id)));

  const scopeEvaluations = evaluations
    .filter((evaluation) => {
      if (user.rol === 'empleado') return String(evaluation.empleado_id) === String(user.empleado_id);
      if (user.rol === 'jefatura') return teamIds.has(String(evaluation.empleado_id));
      return true;
    })
    .sort((a, b) => (a.fecha_evaluacion < b.fecha_evaluacion ? 1 : -1));

  const averages = employees
    .map((employee) => {
      const own = evaluations.filter(
        (evaluation) => String(evaluation.empleado_id) === String(employee.empleado_id)
      );
      if (!own.length) return null;
      return {
        empleado: `${employee.nombres} ${employee.apellidos}`,
        promedio: own.reduce((total, item) => total + Number(item.calificacion), 0) / own.length,
        cantidad: own.length
      };
    })
    .filter(Boolean);

  container.innerHTML = `
    ${pageHeader(
      'Evaluaciones de desempeno',
      user.rol === 'empleado'
        ? 'Sus evaluaciones registradas por la jefatura.'
        : user.rol === 'jefatura'
          ? 'Evaluaciones de sus subordinados directos.'
          : 'Consolidado de evaluaciones de la empresa.'
    )}
    <div id="evaluation-feedback" class="feedback-slot" role="alert"></div>
    <form class="filter-bar" id="evaluation-filter" autocomplete="off">
      ${field({ label: 'Buscar por colaborador, evaluador o comentario', name: 'q', placeholder: 'Ej: Javiera' })}
      ${field({ label: 'Periodo', name: 'periodo', type: 'month' })}
    </form>

    <div class="layout-two">
      ${card(
        'Evaluaciones',
        table(
          [
            {
              label: 'Colaborador',
              render: (evaluation) => escapeHtml(employeeName(evaluation.empleado_id, employees))
            },
            {
              label: 'Evaluador',
              render: (evaluation) => escapeHtml(employeeName(evaluation.evaluador_id, employees))
            },
            { label: 'Fecha', render: (evaluation) => escapeHtml(formatDate(evaluation.fecha_evaluacion)) },
            {
              label: 'Calificacion',
              render: (evaluation) => `<strong>${escapeHtml(formatNumber(evaluation.calificacion, 2))}</strong>`
            },
            { label: 'Comentarios', render: (evaluation) => escapeHtml(evaluation.comentarios || '-') }
          ],
          scopeEvaluations,
          'Sin evaluaciones registradas.',
          (evaluation) =>
            `data-filter="${escapeHtml(
              `${employeeName(evaluation.empleado_id, employees)} ${employeeName(evaluation.evaluador_id, employees)} ${evaluation.comentarios || ''} ${evaluation.fecha_evaluacion}`.toLowerCase()
            )}"`
        ),
        { actions: `<span class="count-pill">${scopeEvaluations.length}</span>` }
      )}
      ${
        user.rol === 'jefatura'
          ? card(
              'Registrar evaluacion',
              `
                <form id="evaluation-form" class="form-grid" autocomplete="off">
                  ${selectField({
                    label: 'Colaborador evaluado',
                    name: 'empleado_id',
                    options: team.map((employee) => ({
                      value: employee.empleado_id,
                      label: `${employee.nombres} ${employee.apellidos}`
                    })),
                    required: true
                  })}
                  ${field({ label: 'Fecha de evaluacion', name: 'fecha_evaluacion', type: 'date', value: todayISO(), required: true })}
                  ${field({ label: 'Calificacion (1.00 - 5.00)', name: 'calificacion', type: 'number', min: '1', max: '5', step: '0.01', required: true })}
                  ${textareaField({ label: 'Comentarios', name: 'comentarios', rows: 3 })}
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar evaluacion</button>
                  </div>
                </form>
              `,
              { className: 'form-card' }
            )
          : user.rol === 'admin_rrhh'
            ? card(
                'Promedio por colaborador',
                table(
                  [
                    { label: 'Colaborador', render: (row) => escapeHtml(row.empleado) },
                    { label: 'Promedio', render: (row) => escapeHtml(formatNumber(row.promedio, 2)) },
                    { label: 'Evaluaciones', render: (row) => String(row.cantidad) }
                  ],
                  averages,
                  'Sin evaluaciones para consolidar.'
                )
              )
            : card(
                'Solo lectura',
                '<p class="muted">Puede consultar sus evaluaciones, pero no registrar nuevas.</p>'
              )
      }
    </div>
  `;

  const feedbackSlot = container.querySelector('#evaluation-feedback');
  attachTableFilter(container, container.querySelector('#evaluation-filter'));
  const form = container.querySelector('#evaluation-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(form);
    const payload = {
      empleado_id: Number(values.empleado_id),
      evaluador_id: user.empleado_id,
      fecha_evaluacion: values.fecha_evaluacion,
      calificacion: Number(values.calificacion),
      comentarios: values.comentarios.trim()
    };
    const validation = validateEvaluation(payload, {
      employees,
      evaluatorId: user.empleado_id
    });
    if (!validation.valid) {
      showFeedback(feedbackSlot, errorsSummary(validation.errors));
      return;
    }
    addItem('evaluaciones', payload);
    audit(
      'Registro de evaluacion',
      'evaluaciones',
      `${employeeName(payload.empleado_id, employees)}: ${payload.calificacion}`,
      user
    );
    toast('Evaluacion registrada.');
    ctx.refresh();
  });
}
