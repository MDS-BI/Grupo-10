import { addItem, loadCollection } from '../storage.js';
import { employeeName } from '../rules.js';
import {
  closePeriod,
  liquidationDetails,
  liquidationsForPeriod,
  payrollSummary,
  reopenPeriod,
  runPayroll
} from '../payroll.js';
import { audit } from '../audit.js';
import { canManage } from '../auth.js';
import { escapeHtml, formatCLP, formatDate, isValidISODate, todayISO } from '../utils.js';
import {
  card,
  confirmAction,
  errorsSummary,
  feedback,
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
  const periods = [...loadCollection('periodosNomina')].sort((a, b) =>
    a.inicio_periodo < b.inicio_periodo ? 1 : -1
  );
  const employees = loadCollection('empleados');
  const concepts = loadCollection('conceptosNomina');
  const canEdit = canManage('nomina', user);

  container.innerHTML = `
    ${pageHeader('Nomina', 'Periodos, conceptos y liquidaciones del modulo de remuneraciones.')}
    <div id="payroll-feedback" class="feedback-slot" role="alert"></div>

    ${card(
      'Periodos de nomina',
      table(
        [
          {
            label: 'Periodo',
            render: (period) =>
              `${escapeHtml(formatDate(period.inicio_periodo))} - ${escapeHtml(formatDate(period.fin_periodo))}`
          },
          {
            label: 'Ejecucion',
            render: (period) =>
              period.fecha_ejecucion ? escapeHtml(formatDate(period.fecha_ejecucion)) : '<span class="muted">Pendiente</span>'
          },
          { label: 'Estado', render: (period) => statusBadge(period.estado) },
          {
            label: 'Liquidaciones',
            render: (period) => String(liquidationsForPeriod(period.periodo_nomina_id).length)
          },
          {
            label: 'Costo liquido',
            render: (period) =>
              escapeHtml(formatCLP(payrollSummary(period.periodo_nomina_id).total_liquido))
          },
          {
            label: 'Acciones',
            render: (period) =>
              canEdit
                ? `<div class="inline-actions">
                     <button type="button" class="btn btn-small btn-primary" data-run="${period.periodo_nomina_id}" ${period.estado === 'Cerrado' ? 'disabled' : ''}>Ejecutar</button>
                     ${
                       period.estado === 'Cerrado'
                         ? `<button type="button" class="btn btn-small btn-danger" data-reopen="${period.periodo_nomina_id}">Reabrir</button>`
                         : `<button type="button" class="btn btn-small" data-close="${period.periodo_nomina_id}">Cerrar</button>`
                     }
                   </div>`
                : '<span class="muted">Solo lectura</span>'
          }
        ],
        periods,
        'Aun no hay periodos de nomina.'
      ),
      { actions: `<span class="count-pill">${periods.length}</span>` }
    )}

    ${
      canEdit
        ? card(
            'Nuevo periodo',
            `
              <form id="period-form" class="form-grid" autocomplete="off">
                ${field({ label: 'Inicio del periodo', name: 'inicio_periodo', type: 'date', required: true })}
                ${field({ label: 'Fin del periodo', name: 'fin_periodo', type: 'date', required: true })}
                ${field({ label: 'Empresa (ID)', name: 'empresa_id', type: 'number', min: 1, value: '1', required: true })}
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Crear periodo</button>
                </div>
              </form>
            `,
            { className: 'form-card' }
          )
        : ''
    }

    <div class="layout-two">
      ${card(
        'Conceptos de nomina',
        `
          <div class="table-wrapper">
            <table class="data-table">
              <thead><tr><th>Concepto</th><th>Tipo</th><th>Uso del motor</th></tr></thead>
              <tbody>
                ${concepts
                  .map((concept) => {
                    const motor = ['sueldo base', 'horas extras', 'afp', 'salud'].includes(
                      String(concept.nombre_concepto).toLowerCase()
                    );
                    return `<tr>
                      <td>${escapeHtml(concept.nombre_concepto)}</td>
                      <td>${escapeHtml(concept.tipo_concepto)}</td>
                      <td>${motor ? '<span class="badge badge-info">Automatico</span>' : '<span class="muted">Informativo</span>'}</td>
                    </tr>`;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
          ${
            canEdit
              ? `<form id="concept-form" class="inline-form" autocomplete="off">
                   ${field({ label: 'Nuevo concepto', name: 'nombre_concepto', required: true })}
                   ${selectField({
                     label: 'Tipo',
                     name: 'tipo_concepto',
                     options: [
                       { value: 'haber', label: 'Haber' },
                       { value: 'deduccion', label: 'Deduccion' }
                     ],
                     required: true
                   })}
                   <button type="submit" class="btn btn-primary">Agregar concepto</button>
                 </form>
                 <p class="muted small">El motor calcula sueldo base, horas extras aprobadas, AFP (10%) y Salud (7%). Los demas conceptos quedan disponibles para futuras reglas.</p>`
              : ''
          }
        `
      )}
      ${card(
        'Reglas de calculo',
        `
          <ul class="metric-list">
            <li><span>Sueldo base</span><strong>Contrato vigente</strong></li>
            <li><span>Horas extras</span><strong>1.5x valor hora</strong></li>
            <li><span>AFP</span><strong>10% imponible</strong></li>
            <li><span>Salud</span><strong>7% imponible</strong></li>
          </ul>
          <p class="muted small">El sueldo liquido siempre se calcula como haberes menos deducciones.</p>
        `
      )}
    </div>

    <section class="payroll-periods">
      ${periods
        .map((period) => {
          const liquidations = liquidationsForPeriod(period.periodo_nomina_id);
          const summary = payrollSummary(period.periodo_nomina_id);
          return card(
            `Liquidaciones ${formatDate(period.inicio_periodo)} - ${formatDate(period.fin_periodo)}`,
            liquidations.length
              ? `
                <div class="summary-strip">
                  <span><strong>${summary.count}</strong> liquidacion(es)</span>
                  <span>Haberes: <strong>${escapeHtml(formatCLP(summary.total_haberes))}</strong></span>
                  <span>Deducciones: <strong>${escapeHtml(formatCLP(summary.total_deducciones))}</strong></span>
                  <span>Liquido: <strong>${escapeHtml(formatCLP(summary.total_liquido))}</strong></span>
                </div>
                <div class="payslip-list">
                  ${liquidations
                    .map((liquidation) => {
                      const details = liquidationDetails(liquidation.liquidacion_id);
                      return `
                        <details class="payslip">
                          <summary>
                            <span>${escapeHtml(employeeName(liquidation.empleado_id, employees))}</span>
                            <span>Haberes ${escapeHtml(formatCLP(liquidation.total_haberes))}</span>
                            <span>Liquido <strong>${escapeHtml(formatCLP(liquidation.sueldo_liquido))}</strong></span>
                          </summary>
                          <div class="payslip-detail">
                            <table class="data-table">
                              <thead><tr><th>Concepto</th><th>Tipo</th><th>Monto</th></tr></thead>
                              <tbody>
                                ${details
                                  .map(
                                    (detail) => `
                                      <tr>
                                        <td>${escapeHtml(detail.nombre_concepto)}</td>
                                        <td>${escapeHtml(detail.tipo_concepto)}</td>
                                        <td>${escapeHtml(formatCLP(detail.monto))}</td>
                                      </tr>
                                    `
                                  )
                                  .join('')}
                                <tr class="total-row">
                                  <td colspan="2">Sueldo liquido</td>
                                  <td>${escapeHtml(formatCLP(liquidation.sueldo_liquido))}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </details>
                      `;
                    })
                    .join('')}
                </div>
              `
              : `<p class="muted">Sin liquidaciones. ${period.estado === 'Cerrado' ? 'El periodo esta cerrado.' : 'Ejecute la nomina para generarlas.'}</p>`
          );
        })
        .join('')}
    </section>
  `;

  const feedbackSlot = container.querySelector('#payroll-feedback');

  const periodForm = container.querySelector('#period-form');
  periodForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(periodForm);
    if (!isValidISODate(values.inicio_periodo) || !isValidISODate(values.fin_periodo)) {
      showFeedback(feedbackSlot, 'Debe indicar fechas validas para el periodo.');
      return;
    }
    if (values.fin_periodo < values.inicio_periodo) {
      showFeedback(feedbackSlot, 'La fecha de termino debe ser posterior a la fecha de inicio.');
      return;
    }
    const duplicate = periods.some(
      (period) =>
        period.inicio_periodo === values.inicio_periodo && period.fin_periodo === values.fin_periodo
    );
    if (duplicate) {
      showFeedback(feedbackSlot, 'Ya existe un periodo con ese rango de fechas.');
      return;
    }
    addItem('periodosNomina', {
      empresa_id: Number(values.empresa_id),
      inicio_periodo: values.inicio_periodo,
      fin_periodo: values.fin_periodo,
      fecha_ejecucion: null,
      estado: 'Borrador'
    });
    audit(
      'Creacion de periodo de nomina',
      'periodosNomina',
      `${values.inicio_periodo} a ${values.fin_periodo}`,
      user
    );
    toast('Periodo creado.');
    ctx.refresh();
  });

  const conceptForm = container.querySelector('#concept-form');
  conceptForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = formValues(conceptForm);
    if (!values.nombre_concepto?.trim()) {
      showFeedback(feedbackSlot, 'El nombre del concepto es obligatorio.');
      return;
    }
    addItem('conceptosNomina', {
      nombre_concepto: values.nombre_concepto.trim(),
      tipo_concepto: values.tipo_concepto
    });
    toast('Concepto agregado.');
    ctx.refresh();
  });

  container.querySelectorAll('[data-run]').forEach((button) => {
    button.addEventListener('click', () => {
      const result = runPayroll(Number(button.dataset.run), user);
      if (!result.ok) {
        showFeedback(feedbackSlot, result.reason);
        return;
      }
      if (result.empty) {
        showFeedback(feedbackSlot, 'No hay colaboradores elegibles con contrato vigente en el periodo.', 'info');
        return;
      }
      const parts = [`${result.created} liquidacion(es) generada(s).`];
      if (result.skipped) parts.push(`${result.skipped} ya existian.`);
      if (result.errors.length) parts.push(result.errors.join(' '));
      showFeedback(feedbackSlot, parts.join(' '), 'success');
      toast('Nomina ejecutada.');
      ctx.refresh();
    });
  });

  container.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!confirmAction('¿Cerrar el periodo? Las liquidaciones quedaran bloqueadas.')) return;
      const result = closePeriod(Number(button.dataset.close), user);
      if (!result.ok) {
        showFeedback(feedbackSlot, result.reason);
        return;
      }
      toast('Periodo cerrado.');
      ctx.refresh();
    });
  });

  container.querySelectorAll('[data-reopen]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!confirmAction('¿Reabrir el periodo? La accion quedara registrada en auditoria.')) return;
      const result = reopenPeriod(Number(button.dataset.reopen), user);
      if (!result.ok) {
        showFeedback(feedbackSlot, result.reason);
        return;
      }
      showFeedback(feedbackSlot, 'Periodo reabierto. La accion quedo registrada en auditoria.', 'info');
      ctx.refresh();
    });
  });
}
