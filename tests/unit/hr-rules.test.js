import { beforeEach, describe, expect, test } from 'vitest';
import { clearAll, resetSeed } from '../../src/hr/storage.js';
import {
  annualAllowanceForType,
  benefitHasActiveEnrollments,
  staffingConflict,
  validateEnrollment,
  validatePermissionRequest,
  vacationBalance
} from '../../src/hr/rules.js';

describe('reglas de negocio HR - casos limite', () => {
  beforeEach(() => {
    clearAll();
    resetSeed();
  });

  test('usa el derecho anual configurado y acepta tipos sin saldo', () => {
    const types = [
      { tipo_permiso_id: 1, nombre_tipo_permiso: 'Vacaciones', es_remunerado: true, dias_anuales: 2 },
      { tipo_permiso_id: 9, nombre_tipo_permiso: 'Licencia sin saldo', es_remunerado: true, dias_anuales: null }
    ];

    const exceeds = validatePermissionRequest(
      {
        empleado_id: 10,
        tipo_permiso_id: 1,
        fecha_inicio: '2026-12-01',
        fecha_fin: '2026-12-03'
      },
      { requests: [], types }
    );

    expect(exceeds.valid).toBe(false);
    expect(exceeds.errors.fecha_fin).toContain('Saldo insuficiente');
    expect(vacationBalance(10, 2026, { requests: [], types })).toBe(2);
    expect(annualAllowanceForType({ dias_maximos: 7 })).toBe(7);

    const withoutAllowance = validatePermissionRequest(
      {
        empleado_id: 10,
        tipo_permiso_id: 9,
        fecha_inicio: '2026-12-01',
        fecha_fin: '2026-12-30'
      },
      { requests: [], types }
    );

    expect(withoutAllowance.valid).toBe(true);
  });

  test('descuenta del saldo los dias ya aprobados del mismo tipo', () => {
    const types = [
      { tipo_permiso_id: 1, nombre_tipo_permiso: 'Vacaciones', es_remunerado: true, dias_anuales: 5 }
    ];
    const requests = [
      {
        solicitud_permiso_id: 1,
        empleado_id: 10,
        tipo_permiso_id: 1,
        fecha_inicio: '2026-03-01',
        fecha_fin: '2026-03-03',
        estado: 'Aprobada'
      }
    ];

    const result = validatePermissionRequest(
      {
        empleado_id: 10,
        tipo_permiso_id: 1,
        fecha_inicio: '2026-12-01',
        fecha_fin: '2026-12-03'
      },
      { requests, types }
    );

    expect(result.valid).toBe(false);
    expect(result.errors.fecha_fin).toContain('Saldo insuficiente');
  });

  test('usa la dotacion_minima configurada del departamento al aprobar ausencias', () => {
    const employees = [
      { empleado_id: 100, departamento_id: 900, estado_laboral: 'Activo', supervisor_id: null },
      { empleado_id: 101, departamento_id: 900, estado_laboral: 'Activo', supervisor_id: 100 },
      { empleado_id: 102, departamento_id: 900, estado_laboral: 'Activo', supervisor_id: 100 }
    ];
    const departments = [{ departamento_id: 900, dotacion_minima: 5 }];
    const request = {
      solicitud_permiso_id: 900,
      empleado_id: 100,
      fecha_inicio: '2026-12-01',
      fecha_fin: '2026-12-02'
    };

    const result = staffingConflict(request, { employees, requests: [], departments });

    expect(result.conflict).toBe(true);
    expect(result.reason).toContain('se requieren al menos 5');
  });

  test('rechaza inscribir en un beneficio inactivo', () => {
    const benefits = [
      {
        beneficio_id: 99,
        nombre_beneficio: 'Beneficio inactivo',
        proveedor: 'Proveedor X',
        costo: 1000,
        estado: 'inactivo'
      }
    ];

    const result = validateEnrollment(
      { empleado_id: 10, beneficio_id: 99, fecha_inscripcion: '2026-11-01' },
      { enrollments: [], benefits }
    );

    expect(result.valid).toBe(false);
    expect(result.errors.beneficio_id).toContain('no esta vigente');
  });

  test('considera finalizada cualquier inscripcion terminada', () => {
    expect(benefitHasActiveEnrollments(1, [{ beneficio_id: 1, estado: 'activa' }])).toBe(true);
    expect(benefitHasActiveEnrollments(1, [{ beneficio_id: 1, estado: 'finalizada' }])).toBe(false);
    expect(benefitHasActiveEnrollments(1, [{ beneficio_id: 1, estado: 'finalizado' }])).toBe(false);
  });
});
