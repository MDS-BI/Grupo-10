import { addItem, loadCollection, updateItem } from '../storage.js';
import {
  CONTRACT_TYPES,
  VALID_CURRENCIES,
  employeeName,
  isContractActiveOn,
  validateContract
} from '../rules.js';
import { audit } from '../audit.js';
import { canManage, canViewSalary } from '../auth.js';
import { escapeHtml, formatCLP, formatDate } from '../utils.js';
import {
  attachTableFilter,
  badge,
  card,
  errorsSummary,
  feedback,
  field,
  formValues,
  modal,
  pageHeader,
  selectField,
  showFeedback,
  table,
  toast
} from './ui.js';

export function render(container, ctx) {
  const { user } = ctx;
  const contracts = loadCollection('contratos');
  const employees = loadCollection('empleados');
  const canEdit = canManage('contratos', user);

  const rows = [...contracts].sort((a, b) => (a.fecha_inicio < b.fecha_inicio ? 1 : -1));

  container.innerHTML = `
    ${pageHeader('Contratos', 'Historial contractual y generacion de documentos.')}
    <div id="contract-feedback" class="feedback-slot" role="alert"></div>
    <form class="filter-bar" id="contract-filter" autocomplete="off">
      ${field({ label: 'Buscar por colaborador o tipo', name: 'q', placeholder: 'Ej: Ana o Indefinido' })}
    </form>
    <div class="layout-two">
      ${card(
        'Contratos registrados',
        table(
          [
            {
              label: 'Colaborador',
              render: (row) => escapeHtml(employeeName(row.empleado_id, employees))
            },
            { label: 'Tipo', render: (row) => escapeHtml(row.tipo_contrato) },
            {
              label: 'Vigencia',
              render: (row) =>
                `${escapeHtml(formatDate(row.fecha_inicio))} - ${row.fecha_fin ? escapeHtml(formatDate(row.fecha_fin)) : 'Indefinido'}`
            },
            {
              label: 'Salario base',
              render: (row) =>
                canViewSalary(user, row.empleado_id)
                  ? escapeHtml(formatCLP(row.salario_base))
                  : '<span class="confidential">Confidencial</span>'
            },
            { label: 'Moneda', render: (row) => escapeHtml(row.codigo_moneda) },
            {
              label: 'Estado',
              render: (row) =>
                isContractActiveOn(row)
                  ? badge('Vigente', 'success')
                  : badge('Finalizado', 'neutral')
            },
            {
              label: 'Documento',
              render: (row) =>
                `<button type="button" class="btn btn-small" data-contract-doc="${row.contrato_id}">Generar contrato</button>`
            }
          ],
          rows,
          'Aun no hay contratos registrados.',
          (row) =>
            `data-filter="${escapeHtml(
              `${employeeName(row.empleado_id, employees)} ${row.tipo_contrato} ${row.codigo_moneda}`.toLowerCase()
            )}"`
        ),
        { actions: `<span class="count-pill">${rows.length}</span>` }
      )}
      ${
        canEdit
          ? card(
              'Nuevo contrato',
              `
                <form id="contract-form" data-form="contract" class="form-grid" autocomplete="off">
                  <input type="hidden" name="contrato_id" value="" />
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
                    label: 'Tipo de contrato',
                    name: 'tipo_contrato',
                    options: CONTRACT_TYPES.map((type) => ({ value: type, label: type })),
                    required: true
                  })}
                  ${field({ label: 'Fecha de inicio', name: 'fecha_inicio', type: 'date', required: true })}
                  ${field({ label: 'Fecha de termino', name: 'fecha_fin', type: 'date', hint: 'Dejar vacio para contrato indefinido.' })}
                  ${field({ label: 'Salario base', name: 'salario_base', type: 'number', min: 1, step: '1', required: true })}
                  ${selectField({
                    label: 'Moneda',
                    name: 'codigo_moneda',
                    options: VALID_CURRENCIES.map((currency) => ({ value: currency, label: currency })),
                    value: 'CLP',
                    required: true
                  })}
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Guardar contrato</button>
                    <button type="reset" class="btn btn-ghost">Limpiar</button>
                  </div>
                </form>
              `,
              { className: 'form-card' }
            )
          : ''
      }
    </div>
    <div id="contract-modal-slot"></div>
  `;

  const feedbackSlot = container.querySelector('#contract-feedback');
  attachTableFilter(container, container.querySelector('#contract-filter'));

  if (canEdit) {
    const form = container.querySelector('#contract-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = formValues(form);
      const editingId = values.contrato_id || null;
      const payload = {
        empleado_id: Number(values.empleado_id),
        tipo_contrato: values.tipo_contrato,
        fecha_inicio: values.fecha_inicio,
        fecha_fin: values.fecha_fin || null,
        salario_base: Number(values.salario_base),
        codigo_moneda: values.codigo_moneda
      };
      const validation = validateContract(payload, { contracts, employees, editingId });
      if (!validation.valid) {
        showFeedback(feedbackSlot, errorsSummary(validation.errors));
        return;
      }
      if (editingId) {
        const previous = contracts.find(
          (contract) => String(contract.contrato_id) === String(editingId)
        );
        updateItem('contratos', editingId, payload);
        if (Number(previous?.salario_base) !== payload.salario_base) {
          audit(
            'Cambio de salario',
            'contratos',
            `${employeeName(payload.empleado_id, employees)}: ${formatCLP(previous?.salario_base)} -> ${formatCLP(payload.salario_base)}`,
            user
          );
        }
        toast('Contrato actualizado.');
      } else {
        addItem('contratos', payload);
        audit(
          'Creacion de contrato',
          'contratos',
          `${employeeName(payload.empleado_id, employees)}: ${formatCLP(payload.salario_base)}`,
          user
        );
        toast('Contrato registrado.');
      }
      ctx.refresh();
    });

    form.addEventListener('reset', () => {
      form.querySelector('[name="contrato_id"]').value = '';
    });
  }

  container.querySelectorAll('[data-contract-doc]').forEach((button) => {
    button.addEventListener('click', () => {
      const contract = contracts.find(
        (item) => String(item.contrato_id) === String(button.dataset.contractDoc)
      );
      if (!contract) return;
      const employee = employees.find(
        (item) => String(item.empleado_id) === String(contract.empleado_id)
      );
      openContractTemplate(container, contract, employee);
    });
  });

  function openContractTemplate(target, contract, employee) {
    const slot = target.querySelector('#contract-modal-slot');
    const text = buildContractText(contract, employee);
    slot.innerHTML = modal(
      'Contrato generado',
      `
        ${feedback('Revise y edite el texto antes de descargarlo. No constituye firma electronica.', 'info')}
        <label class="sr-only" for="contract-text">Texto del contrato</label>
        <textarea id="contract-text" rows="16">${escapeHtml(text)}</textarea>
        <div class="form-actions">
          <button type="button" class="btn btn-primary" id="download-contract">Descargar contrato</button>
          <button type="button" class="btn btn-ghost" data-close-modal="app-modal">Cerrar</button>
        </div>
      `
    );
    slot.querySelector('[data-close-modal]').addEventListener('click', () => {
      slot.innerHTML = '';
    });
    slot.querySelector('#download-contract').addEventListener('click', () => {
      const content = slot.querySelector('#contract-text').value;
      downloadText(`contrato-${contract.contrato_id}.txt`, content);
      toast('Contrato descargado.');
    });
  }
}

function buildContractText(contract, employee) {
  return [
    'CONTRATO DE TRABAJO',
    '',
    `Trabajador: ${employee?.nombres || ''} ${employee?.apellidos || ''}`,
    `Correo: ${employee?.correo_electronico || ''}`,
    `Tipo de contrato: ${contract.tipo_contrato}`,
    `Fecha de inicio: ${formatDate(contract.fecha_inicio)}`,
    `Fecha de termino: ${contract.fecha_fin ? formatDate(contract.fecha_fin) : 'Indefinido'}`,
    `Salario base: ${formatCLP(contract.salario_base)} ${contract.codigo_moneda}`,
    '',
    'El presente documento es un borrador generado por el prototipo academico.',
    'Las partes declaran aceptar las condiciones descritas y las normas laborales vigentes.'
  ].join('\n');
}

function downloadText(filename, content) {
  const document = globalThis.document;
  if (!document) return;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = globalThis.URL?.createObjectURL?.(blob);
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  globalThis.URL.revokeObjectURL?.(url);
}
