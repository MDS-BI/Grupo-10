import { beforeEach, describe, expect, test } from 'vitest';
import {
  KEYS,
  addItem,
  clearAll,
  clearSession,
  deleteItem,
  ensureSeed,
  findById,
  loadCollection,
  loadSession,
  nextId,
  resetSeed,
  saveSession,
  updateItem
} from '../../src/hr/storage.js';

describe('almacenamiento HR sobre localStorage', () => {
  beforeEach(() => {
    clearAll();
    resetSeed();
  });

  test('carga la semilla de las 14 entidades y colecciones de apoyo', () => {
    expect(loadCollection('departamentos')).toHaveLength(5);
    expect(loadCollection('cargos')).toHaveLength(7);
    expect(loadCollection('empleados')).toHaveLength(10);
    expect(loadCollection('contratos')).toHaveLength(10);
    expect(loadCollection('beneficios')).toHaveLength(3);
    expect(loadCollection('beneficiosEmpleado')).toHaveLength(5);
    expect(loadCollection('asistencia')).toHaveLength(50);
    expect(loadCollection('tiposPermiso')).toHaveLength(4);
    expect(loadCollection('solicitudesPermiso')).toHaveLength(2);
    expect(loadCollection('periodosNomina')).toHaveLength(2);
    expect(loadCollection('conceptosNomina')).toHaveLength(6);
    expect(loadCollection('liquidaciones')).toHaveLength(0);
    expect(loadCollection('evaluaciones')).toHaveLength(2);
    expect(loadCollection('usuarios')).toHaveLength(4);
  });

  test('crea, actualiza, busca y elimina registros con PK numerica', () => {
    const created = addItem('departamentos', {
      empresa_id: 1,
      nombre_departamento: 'Operaciones',
      codigo_departamento: 'OPE',
      jefe_departamento_id: null
    });
    expect(created.departamento_id).toBe(6);
    expect(created.createdAt).toBeTruthy();
    expect(findById('departamentos', 6)?.nombre_departamento).toBe('Operaciones');

    const updated = updateItem('departamentos', 6, { nombre_departamento: 'Operaciones Sur' });
    expect(updated.nombre_departamento).toBe('Operaciones Sur');
    expect(updated.departamento_id).toBe(6);

    expect(deleteItem('departamentos', 6)).toBe(true);
    expect(deleteItem('departamentos', 6)).toBe(false);
    expect(findById('departamentos', 6)).toBeNull();
    expect(nextId('departamentos')).toBe(6);
  });

  test('ensureSeed no sobrescribe datos existentes', () => {
    addItem('departamentos', {
      empresa_id: 1,
      nombre_departamento: 'Extra',
      codigo_departamento: 'EXT',
      jefe_departamento_id: null
    });
    ensureSeed();
    expect(loadCollection('departamentos')).toHaveLength(6);
  });

  test('ensureSeed repuebla cuando falta una coleccion completa', () => {
    localStorage.removeItem(KEYS.empleados);
    ensureSeed();
    expect(loadCollection('empleados')).toHaveLength(10);
  });

  test('tolera JSON corrupto en una coleccion', () => {
    localStorage.setItem(KEYS.departamentos, '{no-json');
    expect(loadCollection('departamentos')).toEqual([]);
  });

  test('gestiona la sesion de forma separada de las colecciones', () => {
    expect(loadSession()).toBeNull();
    saveSession({ usuario_id: 1, rol: 'admin_rrhh' });
    expect(loadSession()).toMatchObject({ usuario_id: 1, rol: 'admin_rrhh' });
    clearSession();
    expect(loadSession()).toBeNull();
  });
});
