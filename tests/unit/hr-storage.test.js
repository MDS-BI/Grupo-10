import { beforeEach, describe, expect, it } from 'vitest';
import {
  approvePermissionRequest,
  createAttendance,
  createBenefit,
  createBenefitEnrollment,
  createContract,
  createDepartment,
  createEmployee,
  createEvaluation,
  createPermissionRequest,
  createPosition,
  deleteBenefit,
  deleteBenefitEnrollment,
  deleteDepartment,
  deleteEmployee,
  deletePosition,
  getApprovedOvertime,
  getBenefitCostByDepartment,
  getBenefitCostForEmployee,
  getEmployee,
  getEmployeeVacationBalance,
  loadAttendance,
  loadBenefits,
  loadContracts,
  loadDepartments,
  loadEmployees,
  loadEvaluations,
  loadPermissionRequests,
  loadPositions,
  rejectPermissionRequest,
  resetStorage,
  resolveBankRequest,
  updateContract,
  updateEmployee,
  updateEmployeeContact,
  validateAttendanceRecord
} from '../../src/hr/storage.js';
import { loadAudit } from '../../src/hr/audit.js';

beforeEach(() => {
  resetStorage();
});

describe('estructura organizacional', () => {
  it('crea, actualiza y elimina un departamento sin dependencias', () => {
    const created = createDepartment({
      codigo_departamento: 'OPS',
      nombre_departamento: 'Operaciones'
    });
    expect(created.codigo_departamento).toBe('OPS');
    expect(loadDepartments().some((item) => item.departamento_id === created.departamento_id)).toBe(true);
    expect(() =>
      createDepartment({ codigo_departamento: 'OPS', nombre_departamento: 'Otra' })
    ).toThrow(/código/i);
    expect(() => deleteDepartment(created.departamento_id)).not.toThrow();
  });

  it('bloquea la eliminación de un departamento con personas', () => {
    expect(() => deleteDepartment(1)).toThrow(/empleado/i);
  });

  it('crea y elimina un cargo sin personas asignadas', () => {
    const position = createPosition({
      nombre_cargo: 'Business Partner',
      nivel_jerarquia: 'Operativo',
      departamento_id: 4
    });
    expect(loadPositions().some((item) => item.cargo_id === position.cargo_id)).toBe(true);
    expect(() => deletePosition(position.cargo_id)).not.toThrow();
  });

  it('bloquea la eliminación de un cargo en uso', () => {
    expect(() => deletePosition(2)).toThrow(/empleado/i);
  });
});

describe('fichas de empleado', () => {
  it('valida RUT y correo únicos, jerarquía y ciclo de supervisión', () => {
    const employee = createEmployee({
      rut: '11.111.111-1',
      nombres: 'Test',
      apellidos: 'Usuario',
      email: 'test.usuario@empresa.cl',
      fecha_contratacion: '2026-01-01',
      estado: 'Activo',
      departamento_id: 3,
      cargo_id: 5,
      supervisor_id: 5,
      dias_vacaciones_disponibles: 10
    });
    expect(employee.rut).toBe('11.111.111-1');
    expect(() =>
      createEmployee({
        rut: '11.111.111-1',
        nombres: 'Otro',
        apellidos: 'Usuario',
        email: 'otro@empresa.cl',
        fecha_contratacion: '2026-01-01',
        departamento_id: 3,
        cargo_id: 5
      })
    ).toThrow(/RUT/i);
    expect(() => updateEmployee(1, { supervisor_id: 2 })).toThrow(/ciclo/i);
    expect(() => deleteEmployee(employee.empleado_id)).not.toThrow();
  });

  it('actualiza datos de contacto y documentos legales con auditoría bancaria', () => {
    const updated = updateEmployeeContact(
      3,
      {
        telefono: '+56 9 0000 0000',
        direccion: 'Nueva dirección 123',
        nuevo_datos_bancarios: 'Banco Nuevo · Cuenta corriente · 000111222',
        certificado: 'certificado-banco-nuevo.pdf',
        documentos_legales: ['Contrato firmado', 'Certificado']
      },
      'carla.rojas@empresa.cl'
    );
    expect(updated.telefono).toBe('+56 9 0000 0000');
    expect(updated.documentos_legales).toContain('Certificado');
    expect(getEmployee(3).direccion).toBe('Nueva dirección 123');
    expect(updated.datos_bancarios).toBe('Banco Santander · Cuenta corriente 55667788');
    expect(updated.solicitud_bancaria.estado).toBe('Pendiente');
    expect(updated.solicitud_bancaria.certificado).toBe('certificado-banco-nuevo.pdf');
    expect(() =>
      updateEmployeeContact(
        3,
        {
          nuevo_datos_bancarios: 'Otro Banco · Cuenta vista · 999',
          certificado: 'otro-certificado.pdf'
        },
        'carla.rojas@empresa.cl'
      )
    ).toThrow(/pendiente/i);
    expect(
      loadAudit().some(
        (entry) =>
          entry.accion === 'actualizar_datos_bancarios' && entry.entidad_id === 3
      )
    ).toBe(true);

    const resolved = resolveBankRequest(3, 'Aprobada', 'admin@empresa.cl');
    expect(resolved.datos_bancarios).toBe('Banco Nuevo · Cuenta corriente · 000111222');
    expect(resolved.solicitud_bancaria.estado).toBe('Aprobada');
    expect(
      loadAudit().some(
        (entry) => entry.accion === 'aprobar_datos_bancarios' && entry.entidad_id === 3
      )
    ).toBe(true);
  });
});

describe('contratos', () => {
  it('genera el texto y rechaza superposiciones', () => {
    const employee = createEmployee({
      rut: '11.111.112-2',
      nombres: 'Contrato',
      apellidos: 'Prueba',
      email: 'contrato.prueba@empresa.cl',
      fecha_contratacion: '2026-01-01',
      departamento_id: 3,
      cargo_id: 5,
      dias_vacaciones_disponibles: 15
    });
    const contract = createContract({
      empleado_id: employee.empleado_id,
      tipo_contrato: 'Indefinido',
      fecha_inicio: '2026-01-01',
      salario_base: 1000000,
      moneda: 'CLP'
    });
    expect(contract.texto_contrato).toContain('Contrato Prueba');
    expect(() =>
      createContract({
        empleado_id: employee.empleado_id,
        tipo_contrato: 'Plazo fijo',
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-12-31',
        salario_base: 1100000,
        moneda: 'CLP'
      })
    ).toThrow(/superpone/i);
    expect(loadContracts().length).toBe(7);
  });

  it('audita los cambios de salario base', () => {
    updateContract(2, { salario_base: 1250000 }, 'admin@empresa.cl');
    expect(
      loadAudit().some(
        (entry) => entry.accion === 'actualizar_salario' && entry.entidad_id === 2
      )
    ).toBe(true);
  });
});

describe('beneficios', () => {
  it('evita duplicados activos y bloquea eliminación con inscripciones', () => {
    const benefit = createBenefit({
      nombre_beneficio: 'Bono de prueba',
      proveedor: 'Proveedor',
      costo: 10000
    });
    const enrollment = createBenefitEnrollment({
      empleado_id: 1,
      beneficio_id: benefit.beneficio_id,
      fecha_inicio: '2026-01-01'
    });
    expect(enrollment.estado).toBe('Activo');
    expect(() =>
      createBenefitEnrollment({
        empleado_id: 1,
        beneficio_id: benefit.beneficio_id,
        fecha_inicio: '2026-02-01'
      })
    ).toThrow(/inscripción activa/i);
    expect(() => deleteBenefit(benefit.beneficio_id)).toThrow(/inscritos/i);
    deleteBenefitEnrollment(enrollment.beneficio_empleado_id);
    expect(loadBenefits().some((item) => item.beneficio_id === benefit.beneficio_id)).toBe(true);
    expect(() => deleteBenefit(benefit.beneficio_id)).not.toThrow();
  });

  it('consolida el costo de beneficios por persona y departamento', () => {
    const employeeCost = getBenefitCostForEmployee(1, '2026-10-01', '2026-10-31');
    const byDepartment = getBenefitCostByDepartment('2026-10-01', '2026-10-31');
    expect(employeeCost).toBeGreaterThan(0);
    expect(byDepartment.reduce((total, item) => total + item.costo, 0)).toBeGreaterThan(0);
  });
});

describe('asistencia y horas extras', () => {
  it('calcula horas, evita duplicados y valida extras', () => {
    const record = createAttendance({
      empleado_id: 2,
      fecha_laboral: '2026-01-15',
      hora_entrada: '09:00',
      hora_salida: '20:00'
    });
    expect(record.horas_trabajadas).toBe(11);
    expect(record.horas_extras).toBe(2);
    expect(() =>
      createAttendance({
        empleado_id: 2,
        fecha_laboral: '2026-01-15',
        hora_entrada: '09:00',
        hora_salida: '18:00'
      })
    ).toThrow(/ya existe/i);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    expect(() =>
      createAttendance({
        empleado_id: 2,
        fecha_laboral: tomorrow,
        hora_entrada: '09:00',
        hora_salida: '18:00'
      })
    ).toThrow(/futura/i);
    const approved = validateAttendanceRecord(record.asistencia_id, 'Aprobado', 1, 'supervisor');
    expect(approved.estado_validacion).toBe('Aprobado');
    expect(getApprovedOvertime(2, '2026-01-15', '2026-01-15')).toBe(2);
    expect(() =>
      validateAttendanceRecord(record.asistencia_id, 'Aprobado', 1, 'supervisor')
    ).toThrow(/ya fue validado/i);
  });
});

describe('permisos y dotación mínima', () => {
  it('aprueba vacaciones, descuenta saldo y evita superposiciones', () => {
    const request = createPermissionRequest({
      empleado_id: 2,
      tipo_permiso_id: 1,
      fecha_inicio: '2026-12-01',
      fecha_fin: '2026-12-02'
    });
    expect(request.dias_solicitados).toBe(2);
    const approved = approvePermissionRequest(
      request.solicitud_id,
      1,
      'Aprobado',
      'supervisor'
    );
    expect(approved.estado).toBe('Aprobada');
    expect(approved.aprobado_por).toBe(1);
    expect(approved.fecha_resolucion).toBeTruthy();
    expect(getEmployeeVacationBalance(2)).toBe(8);
    expect(() =>
      createPermissionRequest({
        empleado_id: 2,
        tipo_permiso_id: 3,
        fecha_inicio: '2026-12-01',
        fecha_fin: '2026-12-01'
      })
    ).toThrow(/superpone/i);
  });

  it('exige motivo al rechazar una solicitud y registra al aprobador', () => {
    const request = createPermissionRequest({
      empleado_id: 2,
      tipo_permiso_id: 3,
      fecha_inicio: '2026-12-22',
      fecha_fin: '2026-12-22'
    });
    expect(() =>
      rejectPermissionRequest(request.solicitud_id, 1, '   ', 'supervisor')
    ).toThrow(/comentario/i);
    const rejected = rejectPermissionRequest(
      request.solicitud_id,
      1,
      'Sin cobertura en el equipo',
      'supervisor'
    );
    expect(rejected.estado).toBe('Rechazada');
    expect(rejected.aprobado_por).toBe(1);
    expect(rejected.fecha_resolucion).toBeTruthy();
  });

  it('registra una ausencia médica por tipo y días sin diagnóstico clínico', () => {
    const request = createPermissionRequest({
      empleado_id: 3,
      tipo_permiso_id: 2,
      fecha_inicio: '2026-12-05',
      fecha_fin: '2026-12-06'
    });
    expect(request.dias_solicitados).toBe(2);
    expect(Object.keys(request)).not.toContain('diagnostico');
    expect(Object.keys(request)).not.toContain('diagnóstico');
  });

  it('rechaza una aprobación que dejaría el área sin dotación', () => {
    const request = createPermissionRequest({
      empleado_id: 5,
      tipo_permiso_id: 3,
      fecha_inicio: '2026-12-10',
      fecha_fin: '2026-12-10'
    });
    expect(() =>
      approvePermissionRequest(request.solicitud_id, null, 'Aprobado', 'admin')
    ).toThrow(/dotación mínima/i);
    expect(
      loadPermissionRequests().find((item) => item.solicitud_id === request.solicitud_id)
        .estado
    ).toBe('Pendiente');
  });
});

describe('evaluaciones y auditoría', () => {
  it('solo permite evaluar a la jefatura directa', () => {
    const evaluation = createEvaluation({
      empleado_id: 2,
      evaluador_id: 1,
      fecha_evaluacion: '2026-01-15',
      calificacion: 5,
      comentarios: 'Excelente desempeño',
      objetivos: 'Mantener resultados'
    });
    expect(evaluation.calificacion).toBe(5);
    const decimal = createEvaluation({
      empleado_id: 2,
      evaluador_id: 1,
      fecha_evaluacion: '2026-01-16',
      calificacion: 4.5,
      comentarios: 'Buen desempeño',
      objetivos: 'Consolidar resultados'
    });
    expect(decimal.calificacion).toBe(4.5);
    expect(loadEvaluations().length).toBe(4);
    expect(() =>
      createEvaluation({
        empleado_id: 2,
        evaluador_id: 2,
        fecha_evaluacion: '2026-01-16',
        calificacion: 4,
        comentarios: 'Auto evaluación',
        objetivos: 'Ninguno'
      })
    ).toThrow(/jefatura directa/i);
  });

  it('registra eventos de auditoría en las mutaciones', () => {
    createDepartment({ codigo_departamento: 'AUD', nombre_departamento: 'Auditoría' });
    expect(loadAudit().some((entry) => entry.entidad === 'departamento')).toBe(true);
  });
});

