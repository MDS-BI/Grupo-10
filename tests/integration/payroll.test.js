import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bootApp } from '../helpers/hr.js';
import { loadAudit } from '../../src/hr/audit.js';

describe('HU7 - ejecucion de nomina y papeletas', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test('el encargado de nomina ejecuta el periodo y se generan liquidaciones', async () => {
    const { app, storage } = await bootApp('nomina');
    app.navigate('nomina');
    document.querySelector('[data-run="2"]').click();

    expect(storage.loadCollection('liquidaciones')).toHaveLength(10);
    expect(document.querySelector('#main-content').textContent).toContain('10 liquidacion(es)');
    expect(
      storage.loadCollection('liquidaciones').every((item) => item.sueldo_liquido >= 0)
    ).toBe(true);
  });

  test('no duplica liquidaciones al ejecutar dos veces el mismo periodo', async () => {
    const { app, storage } = await bootApp('nomina');
    app.navigate('nomina');
    document.querySelector('[data-run="2"]').click();
    document.querySelector('[data-run="2"]').click();
    expect(storage.loadCollection('liquidaciones')).toHaveLength(10);
  });

  test('cierra y reabre el periodo con bloqueo y auditoria', async () => {
    const { app, storage } = await bootApp('nomina');
    app.navigate('nomina');
    document.querySelector('[data-close="2"]').click();
    let period = storage
      .loadCollection('periodosNomina')
      .find((item) => item.periodo_nomina_id === 2);
    expect(period.estado).toBe('Cerrado');
    expect(document.querySelector('[data-run="2"]').disabled).toBe(true);

    document.querySelector('[data-reopen="2"]').click();
    period = storage
      .loadCollection('periodosNomina')
      .find((item) => item.periodo_nomina_id === 2);
    expect(period.estado).toBe('Borrador');
    expect(loadAudit().some((entry) => entry.accion === 'Reapertura de periodo')).toBe(true);
  });

  test('el empleado consulta y descarga su propia papeleta', async () => {
    const { app, storage, auth } = await bootApp('nomina');
    app.navigate('nomina');
    document.querySelector('[data-run="2"]').click();
    expect(storage.loadCollection('liquidaciones')).toHaveLength(10);

    auth.logout();
    auth.login(4);
    app.initApp(document.getElementById('app'));
    app.navigate('papeletas');
    const content = document.querySelector('#main-content').textContent;
    expect(content).toContain('Mis papeletas');
    expect(content).toContain('Sueldo liquido');
    expect(document.querySelector('[data-download-payslip]')).toBeTruthy();
  });
});
