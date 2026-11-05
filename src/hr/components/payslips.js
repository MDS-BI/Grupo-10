import { loadCollection } from '../storage.js';
import { liquidationDetails, employeeLiquidations } from '../payroll.js';
import { escapeHtml, formatCLP, formatDate } from '../utils.js';
import { card, pageHeader, table } from './ui.js';

export function render(container, ctx) {
  const { user } = ctx;
  const periods = loadCollection('periodosNomina');
  const liquidations = employeeLiquidations(user.empleado_id);

  const periodLabel = (periodoId) => {
    const period = periods.find(
      (item) => String(item.periodo_nomina_id) === String(periodoId)
    );
    return period
      ? `${formatDate(period.inicio_periodo)} - ${formatDate(period.fin_periodo)}`
      : 'Periodo';
  };

  container.innerHTML = `
    ${pageHeader('Mis papeletas', 'Liquidaciones de sueldo emitidas a su nombre.')}
    ${
      liquidations.length
        ? `<div class="payslip-list">${liquidations
            .map((liquidation) => {
              const details = liquidationDetails(liquidation.liquidacion_id);
              return `
                <article class="payslip-card">
                  <header>
                    <div>
                      <h2>${escapeHtml(periodLabel(liquidation.periodo_nomina_id))}</h2>
                      <small class="muted">Calculada el ${escapeHtml(formatDate(liquidation.fecha_calculo))}</small>
                    </div>
                    <div class="payslip-amount">
                      <small>Sueldo liquido</small>
                      <strong class="payslip-net">${escapeHtml(formatCLP(liquidation.sueldo_liquido))}</strong>
                    </div>
                  </header>
                  ${table(
                    [
                      { label: 'Concepto', render: (detail) => escapeHtml(detail.nombre_concepto) },
                      { label: 'Tipo', render: (detail) => escapeHtml(detail.tipo_concepto) },
                      { label: 'Monto', render: (detail) => escapeHtml(formatCLP(detail.monto)) }
                    ],
                    details,
                    'Sin detalles.'
                  )}
                  <footer class="payslip-footer">
                    <span>Haberes: ${escapeHtml(formatCLP(liquidation.total_haberes))}</span>
                    <span>Deducciones: ${escapeHtml(formatCLP(liquidation.total_deducciones))}</span>
                    <button type="button" class="btn btn-small" data-download-payslip="${liquidation.liquidacion_id}">Descargar papeleta</button>
                  </footer>
                </article>
              `;
            })
            .join('')}</div>`
        : card('Sin papeletas', '<p class="muted">Aun no tiene liquidaciones emitidas.</p>')
    }
  `;

  container.querySelectorAll('[data-download-payslip]').forEach((button) => {
    button.addEventListener('click', () => {
      const liquidation = liquidations.find(
        (item) => String(item.liquidacion_id) === String(button.dataset.downloadPayslip)
      );
      if (!liquidation) return;
      const details = liquidationDetails(liquidation.liquidacion_id);
      const text = [
        'PAPELETA DE PAGO',
        `Colaborador: ${user.nombre}`,
        `Periodo: ${periodLabel(liquidation.periodo_nomina_id)}`,
        '',
        ...details.map(
          (detail) =>
            `${detail.nombre_concepto} (${detail.tipo_concepto}): ${formatCLP(detail.monto)}`
        ),
        '',
        `Total haberes: ${formatCLP(liquidation.total_haberes)}`,
        `Total deducciones: ${formatCLP(liquidation.total_deducciones)}`,
        `Sueldo liquido: ${formatCLP(liquidation.sueldo_liquido)}`
      ].join('\n');
      downloadText(`papeleta-${liquidation.liquidacion_id}.txt`, text);
    });
  });
}

function downloadText(filename, content) {
  const document = globalThis.document;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = globalThis.URL?.createObjectURL?.(blob);
  if (!document || !url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL?.(url);
}
