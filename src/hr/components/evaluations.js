import { can } from '../auth.js';
import {
  createEvaluation,
  deleteEvaluation,
  getDirectReports,
  getEmployee,
  getEmployeeName,
  getEvaluation,
  getEvaluationsForEmployee,
  getEvaluationsForSupervisor,
  loadEvaluations,
  updateEvaluation
} from '../storage.js';
import { todayISO } from '../utils.js';
import {
  avatar,
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
  rating,
  sectionCard,
  select,
  showToast,
  statCard,
  tabNav,
  textarea
} from './ui.js';

let activeTab = 'equipo';

function evaluationCard(evaluation, { actions = false, session } = {}) {
  const employee = getEmployee(evaluation.empleado_id);
  const evaluator = getEmployee(evaluation.evaluador_id);
  const canEdit =
    actions &&
    session.rol === 'supervisor' &&
    Number(evaluation.evaluador_id) === Number(session.empleado_id);
  const canDelete = actions && ['admin', 'supervisor'].includes(session.rol);
  return `
    <article class="evaluation-card">
      <div class="evaluation-card__head">
        <div class="person-cell">
          ${avatar(`${employee?.nombres || ''} ${employee?.apellidos || ''}`, 'sm')}
          <span>
            <strong>${escapeHtml(employee ? `${employee.nombres} ${employee.apellidos}` : 'Empleado')}</strong>
            <small>Evaluado por ${escapeHtml(evaluator ? `${evaluator.nombres} ${evaluator.apellidos}` : '—')} · ${date(evaluation.fecha_evaluacion)}</small>
          </span>
        </div>
        <div class="evaluation-card__score">
          ${rating(evaluation.calificacion)}
          ${
            canEdit || canDelete
              ? `<span class="table-actions">
                  ${canEdit ? `<a class="btn btn--ghost btn--sm" href="#/evaluaciones?tab=equipo&evaluacion=${evaluation.evaluacion_id}">Editar</a>` : ''}
                  ${canDelete ? `<button type="button" class="btn btn--danger btn--sm" data-delete-evaluation="${evaluation.evaluacion_id}">Eliminar</button>` : ''}
                </span>`
              : ''
          }
        </div>
      </div>
      <p>${escapeHtml(evaluation.comentarios)}</p>
      <div class="evaluation-card__objective"><strong>Objetivos</strong><span>${escapeHtml(evaluation.objetivos)}</span></div>
    </article>
  `;
}

export function render(context) {
  const { session, params } = context;
  const canManage = can('evaluations.manage', session);
  const requestedTab = params.get('tab');
  if (requestedTab) activeTab = requestedTab;
  const editing = getEvaluation(params.get('evaluacion'));
  if (editing) activeTab = 'equipo';

  if (session.rol === 'employee') {
    const evaluations = getEvaluationsForEmployee(session.empleado_id);
    const average = evaluations.length
      ? evaluations.reduce((total, item) => total + Number(item.calificacion), 0) /
        evaluations.length
      : 0;
    return `
      ${pageHeader('Mis evaluaciones', 'Retroalimentación, calificación y objetivos de desempeño.')}
      <div class="stats-grid">
        ${statCard({ label: 'Evaluaciones', value: evaluations.length, meta: 'Historial' })}
        ${statCard({ label: 'Promedio', value: average ? average.toFixed(1) : '—', meta: 'Escala 1 a 5', tone: 'green' })}
        ${statCard({ label: 'Última evaluación', value: evaluations[0] ? date(evaluations[0].fecha_evaluacion) : '—', meta: evaluations[0] ? `Calificación ${evaluations[0].calificacion}/5` : 'Sin registros' })}
      </div>
      ${sectionCard(
        'Historial de desempeño',
        evaluations.length
          ? evaluations.map((evaluation) => evaluationCard(evaluation, { session })).join('')
          : emptyState('Sin evaluaciones', 'Tu jefatura aún no registra una evaluación.')
      )}
    `;
  }

  const tabs =
    session.rol === 'admin'
      ? [{ id: 'todas', label: 'Todas las evaluaciones' }]
      : [
          { id: 'equipo', label: 'Equipo directo' },
          { id: 'mias', label: 'Mis evaluaciones' }
        ];
  if (!tabs.some((tab) => tab.id === activeTab)) activeTab = tabs[0].id;

  const reports = getDirectReports(session.empleado_id);
  const reportOptions = reports.map((employee) => ({
    value: employee.empleado_id,
    label: `${employee.nombres} ${employee.apellidos} · ${employee.rut}`
  }));

  let body = '';

  if (activeTab === 'equipo' && session.rol === 'supervisor') {
    const evaluations = getEvaluationsForSupervisor(session.empleado_id);
    const average = evaluations.length
      ? evaluations.reduce((total, item) => total + Number(item.calificacion), 0) /
        evaluations.length
      : 0;
    body = `
      <div class="stats-grid">
        ${statCard({ label: 'Equipo directo', value: reports.length, meta: 'Personas evaluables' })}
        ${statCard({ label: 'Evaluaciones realizadas', value: evaluations.length, meta: 'Historial' })}
        ${statCard({ label: 'Promedio del equipo', value: average ? average.toFixed(1) : '—', meta: 'Escala 1 a 5', tone: 'green' })}
      </div>
      ${sectionCard(
        editing ? 'Editar evaluación' : 'Nueva evaluación',
        `<form id="evaluation-form" class="form-grid">
          ${field('Empleado', select('empleado_id', reportOptions, editing?.empleado_id || '', { placeholder: 'Selecciona una persona del equipo', required: true }), { required: true })}
          ${field('Fecha de evaluación', input('fecha_evaluacion', editing?.fecha_evaluacion || todayISO(), { type: 'date', max: todayISO(), required: true }), { required: true })}
          ${field('Calificación', input('calificacion', editing?.calificacion ?? 3, { type: 'number', min: '1', max: '5', step: '0.01', required: true }), { required: true, hint: 'Escala de 1.00 a 5.00; se admiten decimales.' })}
          <div class="form-grid__wide">${field('Comentarios', textarea('comentarios', editing?.comentarios || '', { rows: 4, placeholder: 'Retroalimentación del período', required: true }), { required: true })}</div>
          <div class="form-grid__wide">${field('Objetivos', textarea('objetivos', editing?.objetivos || '', { rows: 3, placeholder: 'Objetivos para el próximo período', required: true }), { required: true })}</div>
          <div class="form-grid__wide">${formActions(editing ? 'Guardar cambios' : 'Registrar evaluación', editing ? '#/evaluaciones' : '')}</div>
        </form>`,
        editing ? '<a class="btn btn--ghost btn--sm" href="#/evaluaciones">Cancelar edición</a>' : ''
      )}
      ${sectionCard(
        'Evaluaciones del equipo',
        evaluations.length
          ? evaluations
              .map((evaluation) =>
                evaluationCard(evaluation, { actions: true, session })
              )
              .join('')
          : emptyState('Sin evaluaciones', 'Registra la primera evaluación de una persona de tu equipo.')
      )}
    `;
  }

  if (activeTab === 'mias' && session.rol === 'supervisor') {
    const evaluations = getEvaluationsForEmployee(session.empleado_id);
    body = sectionCard(
      'Mis evaluaciones',
      evaluations.length
        ? evaluations.map((evaluation) => evaluationCard(evaluation, { session })).join('')
        : emptyState('Sin evaluaciones', 'Tu jefatura aún no registra una evaluación.')
    );
  }

  if (activeTab === 'todas' && session.rol === 'admin') {
    const evaluations = loadEvaluations().sort((a, b) =>
      b.fecha_evaluacion.localeCompare(a.fecha_evaluacion)
    );
    body = sectionCard(
      'Todas las evaluaciones',
      evaluations.length
        ? evaluations
            .map((evaluation) =>
              evaluationCard(evaluation, { actions: true, session })
            )
            .join('')
        : emptyState('Sin evaluaciones', 'Aún no se registran evaluaciones de desempeño.')
    );
  }

  return `
    ${pageHeader(
      'Evaluaciones',
      'Desempeño, retroalimentación y objetivos del equipo.',
      session.rol === 'supervisor' ? '<span class="muted">Solo la jefatura directa evalúa</span>' : ''
    )}
    ${tabNav(tabs, activeTab)}
    ${body}
  `;
}

export function bind(root, context) {
  queryAll('[data-tab]', root).forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab;
      context.navigate('evaluaciones');
    });
  });

  const form = query('#evaluation-form', root);
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const values = formValues(form);
      values.evaluador_id = context.session.empleado_id;
      values.calificacion = Number(values.calificacion);
      const editingId = context.params.get('evaluacion');
      if (editingId) {
        updateEvaluation(editingId, values, context.session.email);
        showToast('Evaluación actualizada.');
      } else {
        createEvaluation(values, context.session.email);
        showToast('Evaluación registrada.');
      }
      context.navigate('evaluaciones');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-delete-evaluation]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar esta evaluación?')) return;
      try {
        deleteEvaluation(button.dataset.deleteEvaluation, context.session.email);
        showToast('Evaluación eliminada.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });
}
