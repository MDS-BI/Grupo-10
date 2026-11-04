import { beforeEach, describe, expect, it } from 'vitest';
import {
  createAttendance,
  createEmployee,
  getDashboardMetrics,
  loadAttendance,
  loadEmployees,
  resetStorage
} from '../../src/hr/storage.js';
import { searchAll } from '../../src/hr/search.js';
import { sessionFor } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
});

describe('rendimiento con volumen', () => {
  it('soporta 500 empleados y 500 asistencias en tiempos razonables', () => {
    const started = performance.now();
    for (let index = 1; index <= 500; index += 1) {
      const employee = createEmployee({
        rut: `50.000.${String(index).padStart(3, '0')}-1`,
        nombres: `Empleado ${index}`,
        apellidos: 'Volumen',
        email: `volumen.${index}@empresa.cl`,
        fecha_contratacion: '2026-01-01',
        estado: 'Activo',
        departamento_id: 3,
        cargo_id: 5,
        supervisor_id: 2,
        dias_vacaciones_disponibles: 10
      });
      createAttendance({
        empleado_id: employee.empleado_id,
        fecha_laboral: '2026-01-05',
        hora_entrada: '09:00',
        hora_salida: '19:00'
      });
    }
    const elapsed = performance.now() - started;
    console.log(`Rendimiento: ${loadEmployees().length} empleados y ${loadAttendance().length} asistencias en ${Math.round(elapsed)} ms`);

    expect(loadEmployees()).toHaveLength(506);
    expect(loadAttendance()).toHaveLength(507);
    expect(searchAll('Empleado 499', sessionFor('admin')).length).toBeGreaterThan(0);
    expect(getDashboardMetrics().activeEmployees).toBe(506);
    expect(elapsed).toBeLessThan(10000);
  }, 30000);
});
