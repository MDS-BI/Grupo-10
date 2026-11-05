import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp, setField, submit } from '../helpers/hr.js';
import { loadAudit } from '../../src/hr/audit.js';

describe('HU4 - contratos', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('rechaza contratos superpuestos para el mismo colaborador', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('contratos');
    const before = storage.loadCollection('contratos').length;
    const form = document.querySelector('#contract-form');
    setField(form, 'empleado_id', '1');
    setField(form, 'tipo_contrato', 'Indefinido');
    setField(form, 'fecha_inicio', '2026-10-01');
    setField(form, 'fecha_fin', '');
    setField(form, 'salario_base', '3600000');
    setField(form, 'codigo_moneda', 'CLP');
    submit(form);

    expect(storage.loadCollection('contratos')).toHaveLength(before);
    expect(document.querySelector('#contract-feedback').textContent).toContain('superpuesto');
  });

  test('crea un contrato valido, audita el salario y genera el documento', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    const employee = storage.addItem('empleados', {
      departamento_id: 3,
      cargo_id: 3,
      supervisor_id: 2,
      nombres: 'Nuevo',
      apellidos: 'Contratado',
      correo_electronico: 'nuevo.contratado@empresa.cl',
      fecha_contratacion: '2026-10-15',
      estado_laboral: 'Activo',
      telefono: '',
      direccion: '',
      banco: '',
      cuenta_bancaria: ''
    });
    app.navigate('contratos');
    const form = document.querySelector('#contract-form');
    setField(form, 'empleado_id', String(employee.empleado_id));
    setField(form, 'tipo_contrato', 'Plazo fijo');
    setField(form, 'fecha_inicio', '2026-10-15');
    setField(form, 'fecha_fin', '2027-03-31');
    setField(form, 'salario_base', '1800000');
    setField(form, 'codigo_moneda', 'CLP');
    submit(form);

    const contract = storage
      .loadCollection('contratos')
      .find((item) => item.empleado_id === employee.empleado_id);
    expect(contract).toMatchObject({
      tipo_contrato: 'Plazo fijo',
      salario_base: 1800000
    });
    expect(loadAudit().some((entry) => entry.accion === 'Creacion de contrato')).toBe(true);

    document.querySelector(`[data-contract-doc="${contract.contrato_id}"]`).click();
    expect(document.querySelector('#contract-text').value).toContain('Nuevo Contratado');
    expect(document.querySelector('#contract-text').value).toContain('1.800.000');
  });

  test('valida salario positivo y fecha de termino posterior al inicio', async () => {
    const { app, storage } = await bootApp('admin_rrhh');
    app.navigate('contratos');
    const before = storage.loadCollection('contratos').length;
    const form = document.querySelector('#contract-form');
    setField(form, 'empleado_id', '1');
    setField(form, 'tipo_contrato', 'Indefinido');
    setField(form, 'fecha_inicio', '2026-06-01');
    setField(form, 'fecha_fin', '2026-05-01');
    setField(form, 'salario_base', '0');
    setField(form, 'codigo_moneda', 'CLP');
    submit(form);
    expect(storage.loadCollection('contratos')).toHaveLength(before);
    expect(document.querySelector('#contract-feedback').textContent).toMatch(/salario|termino/);
  });
});
