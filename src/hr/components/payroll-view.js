import {
  getConcept,
  getDepartmentName,
  getEmployee,
  getEmployeeName,
  getLiquidation,
  getLiquidationsForPeriod,
  getPayrollPeriod,
  loadConcepts,
  loadPayrollPeriods,
  createPayrollPeriod,
  createConcept,
  deleteConcept,
  deletePayrollPeriod,
  setPayrollPeriodState,
  updateConcept
} from '../storage.js';
import {
  getEmployeePayslips,
  getPayrollCostSummary,
  getPayrollTrend,
  getPayslip,
  runPayroll
} from '../payroll.js';
import { todayISO } from '../utils.js';
import {
  badge,
  barChart,
  date,
  emptyState,
  escapeHtml,
  field,
  formActions,
  formValues,
  input,
  money,
  pageHeader,
  query,
  queryAll,
  sectionCard,
  select,
  showToast,
  statCard,
  table,
  tabNav
} from './ui.js';

let activeTab = 'periodos';
let selectedPeriodId = '';
let selectedLiquidationId = '';

function periodOptions() {
  return loadPayrollPeriods()
    .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))
    .map((period) => ({
      value: period.periodo_id,
      label: `${date(period.fecha_inicio)} – ${date(period.fecha_fin)} · ${period.estado}`
    }));
}

function latestPeriod() {
  return loadPayrollPeriods()
    .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))[0];
}

function currentPeriodId() {
  if (selectedPeriodId) return selectedPeriodId;
  return latestPeriod()?.periodo_id || '';
}

function periodTotals(periodId) {
  const liquidations = getLiquidationsForPeriod(periodId);
  return {
    employees: liquidations.length,
    net: liquidations.reduce((total, item) => total + Number(item.salario_neto || 0), 0)
  };
}

function payslipForLiquidation(liquidationId) {
  const liquidation = getLiquidation(liquidationId);
  if (!liquidation) return null;
  return getPayslip(liquidation.periodo_id, liquidation.empleado_id);
}

function downloadPayslip(payslip) {
  const lines = [
    'NEXO · LIQUIDACIÓN DE SUELDO',
    `Colaborador: ${getEmployeeName(payslip.empleado_id)}`,
    `RUT: ${payslip.empleado?.rut || ''}`,
    `Período: ${date(payslip.periodo?.fecha_inicio)} – ${date(payslip.periodo?.fecha_fin)}`,
    '',
    'Concepto\tTipo\tMonto',
    ...payslip.detalles.map(
      (detail) => `${detail.nombre_concepto}\t${detail.tipo_concepto}\t${money(detail.monto)}`
    ),
    '',
    `Total haberes\t${money(payslip.total_haberes)}`,
    `Total deducciones\t${money(payslip.total_deducciones)}`,
    `Neto a pagar\t${money(payslip.salario_neto)}`
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `liquidacion-${payslip.liquidacion_id}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function payslipDetail(liquidationId) {
  const payslip = payslipForLiquidation(liquidationId);
  if (!payslip) return '';
  return sectionCard(
    `Liquidación de ${getEmployeeName(payslip.empleado_id)}`,
    `
    <div class="payslip-head">
      <div>
        <span class="eyebrow">Período</span>
        <strong>${date(payslip.periodo?.fecha_inicio)} – ${date(payslip.periodo?.fecha_fin)}</strong>
      </div>
      <div>
        <span class="eyebrow">Neto a pagar</span>
        <strong class="payslip-net">${money(payslip.salario_neto)}</strong>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn--ghost btn--sm" data-download-payslip="${payslip.liquidacion_id}">Descargar</button>
        <button type="button" class="btn btn--ghost btn--sm" id="print-payslip">Imprimir</button>
      </div>
    </div>
    <div class="payslip-meta">
      <span>${escapeHtml(payslip.empleado?.rut || '')}</span>
      <span>${escapeHtml(getDepartmentName(payslip.empleado?.departamento_id))}</span>
      <span>Base ${money(payslip.salario_base)}</span>
    </div>
    <div class="table-wrap">
      <table class="data-table payslip-table">
        <thead><tr><th>Concepto</th><th>Tipo</th><th>Monto</th></tr></thead>
        <tbody>
          ${payslip.detalles
            .map(
              (detail) => `<tr>
                <td>${escapeHtml(detail.nombre_concepto)}</td>
                <td>${badge(detail.tipo_concepto)}</td>
                <td class="${detail.tipo_concepto === 'Deducción' ? 'amount-negative' : 'amount-positive'}">${detail.tipo_concepto === 'Deducción' ? '−' : '+'}${money(detail.monto)}</td>
              </tr>`
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr><th colspan="2">Total haberes</th><th>${money(payslip.total_haberes)}</th></tr>
          <tr><th colspan="2">Total deducciones</th><th>−${money(payslip.total_deducciones)}</th></tr>
          <tr><th colspan="2">Neto</th><th>${money(payslip.salario_neto)}</th></tr>
        </tfoot>
      </table>
    </div>
    <p class="muted">La liquidación consolida horas extras aprobadas y descuentos configurados.</p>
    `
  );
}

function employeeView(session) {
  const payslips = getEmployeePayslips(session.empleado_id);
  if (!payslips.length) {
    return emptyState(
      'Sin liquidaciones',
      'Tu liquidación aparecerá cuando remuneraciones procese el período.',
      '<a class="btn btn--ghost btn--sm" href="#/empleados">Volver a mi ficha</a>'
    );
  }
  const selected =
    payslips.find((item) => Number(item.liquidacion_id) === Number(selectedLiquidationId)) ||
    payslips[0];
  const detail = payslipDetail(selected.liquidacion_id);
  return `
    <div class="stats-grid">
      ${statCard({ label: 'Liquidaciones', value: payslips.length, meta: 'Historial disponible' })}
      ${statCard({ label: 'Último neto', value: money(payslips[0].salario_neto), meta: date(payslips[0].fecha_generacion), tone: 'green' })}
      ${statCard({ label: 'Últimas deducciones', value: money(payslips[0].total_deducciones), meta: 'Incluye descuentos legales' })}
    </div>
    ${sectionCard(
      'Mis liquidaciones',
      table(
        ['Período', 'Haberes', 'Deducciones', 'Neto', 'Acciones'],
        payslips.map(
          (payslip) => `<tr>
            <td>${date(payslip.periodo?.fecha_inicio)} – ${date(payslip.periodo?.fecha_fin)}</td>
            <td>${money(payslip.total_haberes)}</td>
            <td>${money(payslip.total_deducciones)}</td>
            <td><strong>${money(payslip.salario_neto)}</strong></td>
            <td><button type="button" class="btn btn--ghost btn--sm" data-payslip="${payslip.liquidacion_id}">Ver detalle</button></td>
          </tr>`
        )
      )
    )}
    ${detail}
  `;
}

function periodsTab(session) {
  const periods = loadPayrollPeriods().sort((a, b) =>
    b.fecha_inicio.localeCompare(a.fecha_inicio)
  );
  const today = new Date();
  const defaultStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  ).padStart(2, '0')}`;
  const rows = periods.map((period) => {
    const totals = periodTotals(period.periodo_id);
    return `<tr>
      <td>
        <strong>${date(period.fecha_inicio)} – ${date(period.fecha_fin)}</strong>
        <small>Generado ${date(period.fecha_generacion)}</small>
      </td>
      <td>${badge(period.estado)}</td>
      <td>${totals.employees}</td>
      <td>${money(totals.net)}</td>
      <td class="table-actions">
        ${
          period.estado !== 'Cerrado'
            ? `<button type="button" class="btn btn--primary btn--sm" data-run-period="${period.periodo_id}">Calcular</button>`
            : ''
        }
        ${
          period.estado === 'Calculado'
            ? `<button type="button" class="btn btn--ghost btn--sm" data-period-state="${period.periodo_id}" data-state="Aprobado">Aprobar</button>`
            : ''
        }
        ${
          period.estado === 'Aprobado'
            ? `<button type="button" class="btn btn--ghost btn--sm" data-period-state="${period.periodo_id}" data-state="Cerrado">Cerrar</button>`
            : ''
        }
        ${
          period.estado === 'Cerrado' && session.rol === 'admin'
            ? `<button type="button" class="btn btn--ghost btn--sm" data-period-state="${period.periodo_id}" data-state="Aprobado">Reabrir</button>`
            : ''
        }
        ${
          period.estado === 'Borrador'
            ? `<button type="button" class="btn btn--danger btn--sm" data-delete-period="${period.periodo_id}">Eliminar</button>`
            : ''
        }
        <a class="btn btn--ghost btn--sm" href="#/nomina?tab=liquidaciones&periodo=${period.periodo_id}">Liquidaciones</a>
      </td>
    </tr>`;
  });
  return `
    <div class="split-grid">
      ${sectionCard(
        'Nuevo período',
        `<form id="period-form" class="form-stack">
          ${field('Fecha de inicio', input('fecha_inicio', defaultStart, { type: 'date', required: true }), { required: true })}
          ${field('Fecha de fin', input('fecha_fin', defaultEnd, { type: 'date', required: true }), { required: true })}
          ${formActions('Crear período')}
        </form>`,
        '<span class="muted">El período no puede superponerse con otro existente.</span>'
      )}
      ${sectionCard(
        'Períodos de nómina',
        table(['Período', 'Estado', 'Empleados', 'Neto', 'Acciones'], rows, 'No hay períodos creados.')
      )}
    </div>
  `;
}

function liquidationsTab(session) {
  const periodId = currentPeriodId();
  const period = getPayrollPeriod(periodId);
  const liquidations = period ? getLiquidationsForPeriod(periodId) : [];
  const rows = liquidations.map((liquidation) => `<tr>
    <td><strong>${escapeHtml(getEmployeeName(liquidation.empleado_id))}</strong><small>${date(liquidation.fecha_generacion)}</small></td>
    <td>${money(liquidation.salario_base)}</td>
    <td>${money(liquidation.total_haberes)}</td>
    <td>${money(liquidation.total_deducciones)}</td>
    <td><strong>${money(liquidation.salario_neto)}</strong></td>
    <td><button type="button" class="btn btn--ghost btn--sm" data-payslip="${liquidation.liquidacion_id}">Ver detalle</button></td>
  </tr>`);
  return `
    ${sectionCard(
      'Liquidaciones del período',
      `<div class="toolbar">
        <label class="toolbar__field">
          <span>Período</span>
          ${select('period-selector', periodOptions(), periodId, { placeholder: 'Selecciona un período' })}
        </label>
        <span class="muted">${liquidations.length} liquidación(es)</span>
      </div>
      ${
        period
          ? table(
              ['Empleado', 'Base', 'Haberes', 'Deducciones', 'Neto', 'Acciones'],
              rows,
              'El período aún no tiene liquidaciones. Ejecuta el cálculo.'
            )
          : emptyState('Sin períodos', 'Crea un período de nómina para comenzar.')
      }`
    )}
    ${selectedLiquidationId ? payslipDetail(selectedLiquidationId) : ''}
  `;
}

function conceptsTab(context) {
  const concepts = loadConcepts();
  const editing = getConcept(context.params.get('concepto'));
  const rows = concepts.map((concept) => `<tr>
    <td><strong>${escapeHtml(concept.nombre_concepto)}</strong></td>
    <td>${badge(concept.tipo_concepto)}</td>
    <td>${concept.porcentaje !== null && concept.porcentaje !== undefined ? `${concept.porcentaje}%` : concept.monto_fijo !== null && concept.monto_fijo !== undefined ? money(concept.monto_fijo) : 'Calculado'}</td>
    <td class="table-actions">
      <a class="btn btn--ghost btn--sm" href="#/nomina?tab=conceptos&concepto=${concept.concepto_id}">Editar</a>
      <button type="button" class="btn btn--danger btn--sm" data-delete-concept="${concept.concepto_id}">Eliminar</button>
    </td>
  </tr>`);
  return `
    ${sectionCard(
      editing ? 'Editar concepto' : 'Nuevo concepto',
      `<form id="concept-form" class="form-grid">
        ${field('Nombre', input('nombre_concepto', editing?.nombre_concepto || '', { placeholder: 'Ej. AFP', required: true }), { required: true })}
        ${field('Tipo', select('tipo_concepto', ['Haber', 'Deducción'], editing?.tipo_concepto || '', { placeholder: 'Selecciona un tipo', required: true }), { required: true })}
        ${field('Porcentaje', input('porcentaje', editing?.porcentaje ?? '', { type: 'number', min: 0, max: 100, step: 0.01 }), { hint: 'Opcional. Se aplica sobre el total de haberes.' })}
        ${field('Monto fijo', input('monto_fijo', editing?.monto_fijo ?? '', { type: 'number', min: 0, step: 1 }), { hint: 'Opcional. Usa porcentaje o monto fijo, no ambos.' })}
        <div class="form-grid__wide">${formActions(editing ? 'Guardar cambios' : 'Crear concepto', '#/nomina?tab=conceptos')}</div>
      </form>`,
      editing ? '<a class="btn btn--ghost btn--sm" href="#/nomina?tab=conceptos">Cancelar edición</a>' : ''
    )}
    ${sectionCard(
      'Conceptos de nómina',
      table(['Concepto', 'Tipo', 'Regla', 'Acciones'], rows, 'No hay conceptos configurados.')
    )}
  `;
}

function costsTab() {
  const periodId = currentPeriodId();
  const period = getPayrollPeriod(periodId);
  if (!period) {
    return emptyState('Sin períodos', 'Crea un período para consolidar costos.');
  }
  const cost = getPayrollCostSummary(periodId);
  const trend = getPayrollTrend();
  return `
    <div class="stats-grid">
      ${statCard({ label: 'Personas liquidadas', value: cost.empleados, meta: `${date(period.fecha_inicio)} – ${date(period.fecha_fin)}` })}
      ${statCard({ label: 'Haberes', value: money(cost.total_haberes), meta: 'Total bruto' })}
      ${statCard({ label: 'Deducciones', value: money(cost.total_deducciones), meta: 'Descuentos legales y configurados' })}
      ${statCard({ label: 'Costo total', value: money(cost.costo_total), meta: `Incluye ${money(cost.costo_beneficios)} en beneficios`, tone: 'green' })}
    </div>
    <div class="toolbar">
      <label class="toolbar__field">
        <span>Período</span>
        ${select('cost-period-selector', periodOptions(), periodId, { placeholder: 'Selecciona un período' })}
      </label>
    </div>
    ${sectionCard(
      'Costo consolidado por departamento',
      table(
        ['Departamento', 'Personas', 'Haberes', 'Deducciones', 'Neto', 'Beneficios', 'Costo total'],
        cost.departamentos.map(
          (department) => `<tr>
            <td><strong>${escapeHtml(department.nombre_departamento)}</strong></td>
            <td>${department.empleados}</td>
            <td>${money(department.total_haberes)}</td>
            <td>${money(department.total_deducciones)}</td>
            <td>${money(department.total_neto)}</td>
            <td>${money(department.costo_beneficios)}</td>
            <td><strong>${money(department.costo_total)}</strong></td>
          </tr>`
        ),
        'No hay liquidaciones para consolidar en este período.'
      )
    )}
    ${sectionCard(
      'Costo total por área',
      barChart(
        cost.departamentos.map((department) => ({
          label: department.nombre_departamento,
          value: department.costo_total,
          display: money(department.costo_total)
        }))
      )
    )}
    ${sectionCard(
      'Evolución de la nómina neta',
      trend.length
        ? barChart(
            trend.map((item) => ({
              label: item.etiqueta,
              value: item.total_neto,
              display: money(item.total_neto)
            }))
          )
        : emptyState('Sin historial', 'Calcula períodos para ver la evolución.')
    )}
  `;
}

export function render(context) {
  const { session, params } = context;
  const requestedTab = params.get('tab');
  if (requestedTab) activeTab = requestedTab;
  if (params.get('periodo')) selectedPeriodId = params.get('periodo');
  if (params.get('concepto')) activeTab = 'conceptos';
  const tabs =
    session.rol === 'employee'
      ? [{ id: 'mis-liquidaciones', label: 'Mis liquidaciones' }]
      : [
          { id: 'periodos', label: 'Períodos' },
          { id: 'liquidaciones', label: 'Liquidaciones' },
          { id: 'conceptos', label: 'Conceptos' },
          { id: 'costos', label: 'Costos' }
        ];
  if (!tabs.some((tab) => tab.id === activeTab)) activeTab = tabs[0].id;

  if (session.rol === 'employee') {
    return `
      ${pageHeader('Mis liquidaciones', 'Haberes, descuentos y neto de tus períodos de remuneración.')}
      ${employeeView(session)}
    `;
  }

  let body = '';
  if (activeTab === 'periodos') body = periodsTab(session);
  if (activeTab === 'liquidaciones') body = liquidationsTab(session);
  if (activeTab === 'conceptos') body = conceptsTab(context);
  if (activeTab === 'costos') body = costsTab();

  return `
    ${pageHeader(
      'Nómina',
      'Períodos, liquidaciones, conceptos y consolidación de costos.',
      activeTab === 'periodos' ? '<span class="muted">Jornada base: 9 horas · extras al 1,5</span>' : ''
    )}
    ${tabNav(tabs, activeTab)}
    ${body}
  `;
}

export function bind(root, context) {
  queryAll('[data-tab]', root).forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab;
      context.navigate('nomina');
    });
  });

  if (context.session.rol === 'employee') {
    queryAll('[data-payslip]', root).forEach((button) => {
      button.addEventListener('click', () => {
        selectedLiquidationId = button.dataset.payslip;
        context.refresh();
      });
    });
    queryAll('[data-download-payslip]', root).forEach((button) => {
      button.addEventListener('click', () => {
        const payslip = payslipForLiquidation(button.dataset.downloadPayslip);
        if (payslip) downloadPayslip(payslip);
      });
    });
    query('#print-payslip', root)?.addEventListener('click', () => {
      window.print();
    });
    return;
  }

  const periodForm = query('#period-form', root);
  periodForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      createPayrollPeriod(formValues(periodForm), context.session.email);
      showToast('Período creado.');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-run-period]', root).forEach((button) => {
    button.addEventListener('click', () => {
      try {
        runPayroll(button.dataset.runPeriod, context.session.email);
        showToast('Nómina calculada y liquidaciones generadas.');
        selectedPeriodId = button.dataset.runPeriod;
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  queryAll('[data-period-state]', root).forEach((button) => {
    button.addEventListener('click', () => {
      try {
        setPayrollPeriodState(
          button.dataset.periodState,
          button.dataset.state,
          context.session.email,
          context.session.rol
        );
        showToast(
          button.dataset.state === 'Aprobado' && button.textContent.trim() === 'Reabrir'
            ? 'Período reabierto.'
            : `Período ${button.dataset.state.toLowerCase()}.`
        );
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  queryAll('[data-delete-period]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar este período en borrador?')) return;
      try {
        deletePayrollPeriod(button.dataset.deletePeriod, context.session.email);
        showToast('Período eliminado.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  query('select[name="period-selector"]', root)?.addEventListener('change', (event) => {
    selectedPeriodId = event.target.value;
    context.refresh();
  });
  query('select[name="cost-period-selector"]', root)?.addEventListener('change', (event) => {
    selectedPeriodId = event.target.value;
    context.refresh();
  });

  queryAll('[data-payslip]', root).forEach((button) => {
    button.addEventListener('click', () => {
      selectedLiquidationId = button.dataset.payslip;
      context.refresh();
    });
  });

  queryAll('[data-download-payslip]', root).forEach((button) => {
    button.addEventListener('click', () => {
      const payslip = payslipForLiquidation(button.dataset.downloadPayslip);
      if (payslip) downloadPayslip(payslip);
    });
  });

  query('#print-payslip', root)?.addEventListener('click', () => {
    window.print();
  });

  const conceptForm = query('#concept-form', root);
  conceptForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const values = formValues(conceptForm);
      if (context.params.get('concepto')) {
        updateConcept(context.params.get('concepto'), values, context.session.email);
        showToast('Concepto actualizado.');
      } else {
        createConcept(values, context.session.email);
        showToast('Concepto creado.');
      }
      context.navigate('nomina');
      context.refresh();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  queryAll('[data-delete-concept]', root).forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('¿Eliminar este concepto?')) return;
      try {
        deleteConcept(button.dataset.deleteConcept, context.session.email);
        showToast('Concepto eliminado.');
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });
}
