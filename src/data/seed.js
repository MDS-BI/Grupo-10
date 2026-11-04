export function createSeedData() {
  const departamentos = [
    {
      departamento_id: 1,
      empresa_id: 1,
      codigo_departamento: 'VEN',
      nombre_departamento: 'Ventas',
      jefe_departamento_id: 1
    },
    {
      departamento_id: 2,
      empresa_id: 1,
      codigo_departamento: 'PRO',
      nombre_departamento: 'Producción',
      jefe_departamento_id: 3
    },
    {
      departamento_id: 3,
      empresa_id: 1,
      codigo_departamento: 'TI',
      nombre_departamento: 'Tecnología',
      jefe_departamento_id: 5
    },
    {
      departamento_id: 4,
      empresa_id: 1,
      codigo_departamento: 'ADM',
      nombre_departamento: 'Administración',
      jefe_departamento_id: 6
    }
  ];

  const cargos = [
    {
      cargo_id: 1,
      nombre_cargo: 'Gerente Comercial',
      nivel_jerarquia: 'Dirección',
      departamento_id: 1
    },
    {
      cargo_id: 2,
      nombre_cargo: 'Ejecutivo Comercial',
      nivel_jerarquia: 'Operativo',
      departamento_id: 1
    },
    {
      cargo_id: 3,
      nombre_cargo: 'Supervisor de Producción',
      nivel_jerarquia: 'Supervisión',
      departamento_id: 2
    },
    {
      cargo_id: 4,
      nombre_cargo: 'Operario de Planta',
      nivel_jerarquia: 'Operativo',
      departamento_id: 2
    },
    {
      cargo_id: 5,
      nombre_cargo: 'Desarrollador Full Stack',
      nivel_jerarquia: 'Operativo',
      departamento_id: 3
    },
    {
      cargo_id: 6,
      nombre_cargo: 'Analista de Remuneraciones',
      nivel_jerarquia: 'Operativo',
      departamento_id: 4
    }
  ];

  const empleados = [
    {
      empleado_id: 1,
      rut: '12.345.678-9',
      nombres: 'Ana',
      apellidos: 'Torres',
      fecha_nacimiento: '1988-04-12',
      email: 'ana.torres@empresa.cl',
      telefono: '+56 9 1111 1111',
      direccion: 'Av. Providencia 1200, Santiago',
      fecha_contratacion: '2022-01-03',
      estado: 'Activo',
      departamento_id: 1,
      cargo_id: 1,
      supervisor_id: null,
      datos_bancarios: 'Banco Estado · Cuenta corriente 12345678',
      solicitud_bancaria: false,
      documentos_legales: ['Contrato firmado', 'Cédula de identidad'],
      dias_vacaciones_disponibles: 15
    },
    {
      empleado_id: 2,
      rut: '13.456.789-0',
      nombres: 'Bruno',
      apellidos: 'Díaz',
      fecha_nacimiento: '1994-09-23',
      email: 'bruno.diaz@empresa.cl',
      telefono: '+56 9 2222 2222',
      direccion: 'Los Leones 450, Santiago',
      fecha_contratacion: '2024-02-01',
      estado: 'Activo',
      departamento_id: 1,
      cargo_id: 2,
      supervisor_id: 1,
      datos_bancarios: 'Banco de Chile · Cuenta vista 87654321',
      solicitud_bancaria: {
        estado: 'Pendiente',
        datos_propuestos: 'Banco de Chile · Cuenta corriente 87654321',
        fecha_solicitud: '2026-10-20',
        fecha_resolucion: null
      },
      documentos_legales: ['Contrato firmado'],
      dias_vacaciones_disponibles: 10
    },
    {
      empleado_id: 3,
      rut: '14.567.890-1',
      nombres: 'Carla',
      apellidos: 'Rojas',
      fecha_nacimiento: '1986-11-05',
      email: 'carla.rojas@empresa.cl',
      telefono: '+56 9 3333 3333',
      direccion: 'Camino El Bosque 88, Quilicura',
      fecha_contratacion: '2021-05-17',
      estado: 'Activo',
      departamento_id: 2,
      cargo_id: 3,
      supervisor_id: null,
      datos_bancarios: 'Banco Santander · Cuenta corriente 55667788',
      solicitud_bancaria: false,
      documentos_legales: ['Contrato firmado', 'Certificado de estudios'],
      dias_vacaciones_disponibles: 12
    },
    {
      empleado_id: 4,
      rut: '15.678.901-2',
      nombres: 'Diego',
      apellidos: 'Soto',
      fecha_nacimiento: '1997-01-30',
      email: 'diego.soto@empresa.cl',
      telefono: '+56 9 4444 4444',
      direccion: 'Pasaje Los Aromos 33, Renca',
      fecha_contratacion: '2023-03-06',
      estado: 'Activo',
      departamento_id: 2,
      cargo_id: 4,
      supervisor_id: 3,
      datos_bancarios: 'Banco BCI · Cuenta corriente 99887766',
      solicitud_bancaria: false,
      documentos_legales: ['Contrato firmado'],
      dias_vacaciones_disponibles: 8
    },
    {
      empleado_id: 5,
      rut: '16.789.012-3',
      nombres: 'Elena',
      apellidos: 'Muñoz',
      fecha_nacimiento: '1991-07-19',
      email: 'elena.munoz@empresa.cl',
      telefono: '+56 9 5555 5555',
      direccion: 'Av. Apoquindo 3200, Las Condes',
      fecha_contratacion: '2022-08-01',
      estado: 'Activo',
      departamento_id: 3,
      cargo_id: 5,
      supervisor_id: null,
      datos_bancarios: 'Banco Falabella · Cuenta vista 11223344',
      solicitud_bancaria: false,
      documentos_legales: ['Contrato firmado', 'Cédula de identidad'],
      dias_vacaciones_disponibles: 15
    },
    {
      empleado_id: 6,
      rut: '17.890.123-4',
      nombres: 'Felipe',
      apellidos: 'Vera',
      fecha_nacimiento: '1985-02-14',
      email: 'felipe.vera@empresa.cl',
      telefono: '+56 9 6666 6666',
      direccion: 'Av. Matta 780, Santiago',
      fecha_contratacion: '2020-10-05',
      estado: 'Activo',
      departamento_id: 4,
      cargo_id: 6,
      supervisor_id: null,
      datos_bancarios: 'Banco Estado · Cuenta corriente 44556677',
      solicitud_bancaria: false,
      documentos_legales: ['Contrato firmado'],
      dias_vacaciones_disponibles: 10
    }
  ];

  const contratosEmpleado = [
    {
      contrato_id: 1,
      empleado_id: 1,
      tipo_contrato: 'Indefinido',
      fecha_inicio: '2022-01-03',
      fecha_fin: null,
      salario_base: 2500000,
      moneda: 'CLP',
      texto_contrato:
        'Contrato indefinido de Ana Torres para desempeñar el cargo de Gerente Comercial.'
    },
    {
      contrato_id: 2,
      empleado_id: 2,
      tipo_contrato: 'Plazo fijo',
      fecha_inicio: '2024-02-01',
      fecha_fin: '2026-12-31',
      salario_base: 1200000,
      moneda: 'CLP',
      texto_contrato:
        'Contrato a plazo fijo de Bruno Díaz para desempeñar el cargo de Ejecutivo Comercial.'
    },
    {
      contrato_id: 3,
      empleado_id: 3,
      tipo_contrato: 'Indefinido',
      fecha_inicio: '2021-05-17',
      fecha_fin: null,
      salario_base: 2800000,
      moneda: 'CLP',
      texto_contrato:
        'Contrato indefinido de Carla Rojas para desempeñar el cargo de Supervisora de Producción.'
    },
    {
      contrato_id: 4,
      empleado_id: 4,
      tipo_contrato: 'Indefinido',
      fecha_inicio: '2023-03-06',
      fecha_fin: null,
      salario_base: 900000,
      moneda: 'CLP',
      texto_contrato:
        'Contrato indefinido de Diego Soto para desempeñar el cargo de Operario de Planta.'
    },
    {
      contrato_id: 5,
      empleado_id: 5,
      tipo_contrato: 'Indefinido',
      fecha_inicio: '2022-08-01',
      fecha_fin: null,
      salario_base: 2200000,
      moneda: 'CLP',
      texto_contrato:
        'Contrato indefinido de Elena Muñoz para desempeñar el cargo de Desarrolladora Full Stack.'
    },
    {
      contrato_id: 6,
      empleado_id: 6,
      tipo_contrato: 'Indefinido',
      fecha_inicio: '2020-10-05',
      fecha_fin: null,
      salario_base: 1800000,
      moneda: 'CLP',
      texto_contrato:
        'Contrato indefinido de Felipe Vera para desempeñar el cargo de Analista de Remuneraciones.'
    }
  ];

  const beneficios = [
    {
      beneficio_id: 1,
      nombre_beneficio: 'Seguro complementario de salud',
      proveedor: 'Consalud',
      costo: 45000,
      estado: 'Activo'
    },
    {
      beneficio_id: 2,
      nombre_beneficio: 'Bono de alimentación',
      proveedor: 'Sodexo',
      costo: 60000,
      estado: 'Activo'
    },
    {
      beneficio_id: 3,
      nombre_beneficio: 'Capacitación anual',
      proveedor: 'Academia Interna',
      costo: 150000,
      estado: 'Activo'
    }
  ];

  const beneficiosEmpleado = [
    {
      beneficio_empleado_id: 1,
      beneficio_id: 1,
      empleado_id: 1,
      fecha_inicio: '2024-01-01',
      fecha_fin: null,
      estado: 'Activo'
    },
    {
      beneficio_empleado_id: 2,
      beneficio_id: 2,
      empleado_id: 2,
      fecha_inicio: '2024-03-01',
      fecha_fin: null,
      estado: 'Activo'
    },
    {
      beneficio_empleado_id: 3,
      beneficio_id: 1,
      empleado_id: 3,
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31',
      estado: 'Finalizado'
    },
    {
      beneficio_empleado_id: 4,
      beneficio_id: 2,
      empleado_id: 4,
      fecha_inicio: '2024-03-01',
      fecha_fin: null,
      estado: 'Activo'
    },
    {
      beneficio_empleado_id: 5,
      beneficio_id: 3,
      empleado_id: 5,
      fecha_inicio: '2024-06-01',
      fecha_fin: null,
      estado: 'Activo'
    }
  ];

  const registrosAsistencia = [
    {
      asistencia_id: 1,
      empleado_id: 2,
      fecha_laboral: '2026-10-28',
      hora_entrada: '09:00',
      hora_salida: '18:00',
      horas_trabajadas: 9,
      horas_extras: 0,
      estado_validacion: 'Aprobado',
      validado_por: 1
    },
    {
      asistencia_id: 2,
      empleado_id: 2,
      fecha_laboral: '2026-10-29',
      hora_entrada: '09:00',
      hora_salida: '19:30',
      horas_trabajadas: 10.5,
      horas_extras: 1.5,
      estado_validacion: 'Aprobado',
      validado_por: 1
    },
    {
      asistencia_id: 3,
      empleado_id: 4,
      fecha_laboral: '2026-10-28',
      hora_entrada: '08:00',
      hora_salida: '17:00',
      horas_trabajadas: 9,
      horas_extras: 0,
      estado_validacion: 'Aprobado',
      validado_por: 3
    },
    {
      asistencia_id: 4,
      empleado_id: 4,
      fecha_laboral: '2026-10-29',
      hora_entrada: '08:00',
      hora_salida: '18:00',
      horas_trabajadas: 10,
      horas_extras: 2,
      estado_validacion: 'Aprobado',
      validado_por: 3
    },
    {
      asistencia_id: 5,
      empleado_id: 5,
      fecha_laboral: '2026-10-28',
      hora_entrada: '09:00',
      hora_salida: '18:00',
      horas_trabajadas: 9,
      horas_extras: 0,
      estado_validacion: 'Pendiente',
      validado_por: null
    },
    {
      asistencia_id: 6,
      empleado_id: 5,
      fecha_laboral: '2026-10-30',
      hora_entrada: '09:00',
      hora_salida: '20:00',
      horas_trabajadas: 11,
      horas_extras: 3,
      estado_validacion: 'Pendiente',
      validado_por: null
    },
    {
      asistencia_id: 7,
      empleado_id: 2,
      fecha_laboral: '2026-11-02',
      hora_entrada: '09:00',
      hora_salida: '18:00',
      horas_trabajadas: 9,
      horas_extras: 0,
      estado_validacion: 'Pendiente',
      validado_por: null
    }
  ];

  const tiposPermiso = [
    {
      tipo_permiso_id: 1,
      nombre_tipo: 'Vacaciones',
      es_remunerado: true,
      dias_anuales: 15
    },
    {
      tipo_permiso_id: 2,
      nombre_tipo: 'Licencia médica',
      es_remunerado: true,
      dias_anuales: 0
    },
    {
      tipo_permiso_id: 3,
      nombre_tipo: 'Permiso administrativo',
      es_remunerado: true,
      dias_anuales: 0
    },
    {
      tipo_permiso_id: 4,
      nombre_tipo: 'Permiso sin goce de sueldo',
      es_remunerado: false,
      dias_anuales: 0
    }
  ];

  const solicitudesPermiso = [
    {
      solicitud_id: 1,
      empleado_id: 2,
      tipo_permiso_id: 1,
      fecha_inicio: '2026-09-01',
      fecha_fin: '2026-09-05',
      dias_solicitados: 5,
      estado: 'Aprobada',
      fecha_solicitud: '2026-08-20',
      comentario_aprobacion: 'Vacaciones de invierno aprobadas.'
    },
    {
      solicitud_id: 2,
      empleado_id: 4,
      tipo_permiso_id: 3,
      fecha_inicio: '2026-10-15',
      fecha_fin: '2026-10-15',
      dias_solicitados: 1,
      estado: 'Pendiente',
      fecha_solicitud: '2026-10-10',
      comentario_aprobacion: ''
    },
    {
      solicitud_id: 3,
      empleado_id: 5,
      tipo_permiso_id: 1,
      fecha_inicio: '2026-11-10',
      fecha_fin: '2026-11-14',
      dias_solicitados: 5,
      estado: 'Pendiente',
      fecha_solicitud: '2026-10-25',
      comentario_aprobacion: ''
    },
    {
      solicitud_id: 4,
      empleado_id: 2,
      tipo_permiso_id: 2,
      fecha_inicio: '2026-07-10',
      fecha_fin: '2026-07-11',
      dias_solicitados: 2,
      estado: 'Rechazada',
      fecha_solicitud: '2026-07-08',
      comentario_aprobacion: 'No se recibió el certificado médico.'
    }
  ];

  const periodosNomina = [
    {
      periodo_id: 1,
      fecha_inicio: '2026-09-01',
      fecha_fin: '2026-09-30',
      estado: 'Calculado',
      fecha_generacion: '2026-10-01'
    },
    {
      periodo_id: 2,
      fecha_inicio: '2026-10-01',
      fecha_fin: '2026-10-31',
      estado: 'Borrador',
      fecha_generacion: '2026-10-01'
    },
    {
      periodo_id: 3,
      fecha_inicio: '2026-08-01',
      fecha_fin: '2026-08-31',
      estado: 'Cerrado',
      fecha_generacion: '2026-09-01'
    }
  ];

  const conceptosNomina = [
    {
      concepto_id: 1,
      nombre_concepto: 'Sueldo base',
      tipo_concepto: 'Haber',
      porcentaje: null,
      monto_fijo: null
    },
    {
      concepto_id: 2,
      nombre_concepto: 'Horas extras',
      tipo_concepto: 'Haber',
      porcentaje: null,
      monto_fijo: null
    },
    {
      concepto_id: 3,
      nombre_concepto: 'AFP',
      tipo_concepto: 'Deducción',
      porcentaje: 10,
      monto_fijo: null
    },
    {
      concepto_id: 4,
      nombre_concepto: 'Salud',
      tipo_concepto: 'Deducción',
      porcentaje: 7,
      monto_fijo: null
    },
    {
      concepto_id: 5,
      nombre_concepto: 'Impuesto único',
      tipo_concepto: 'Deducción',
      porcentaje: 5,
      monto_fijo: null
    }
  ];

  const liquidaciones = [
    {
      liquidacion_id: 1,
      periodo_id: 1,
      empleado_id: 1,
      salario_base: 2500000,
      total_haberes: 2500000,
      total_deducciones: 550000,
      salario_neto: 1950000,
      fecha_generacion: '2026-10-01',
      estado: 'Cerrada'
    },
    {
      liquidacion_id: 2,
      periodo_id: 1,
      empleado_id: 2,
      salario_base: 1200000,
      total_haberes: 1200000,
      total_deducciones: 264000,
      salario_neto: 936000,
      fecha_generacion: '2026-10-01',
      estado: 'Cerrada'
    }
  ];

  const detallesLiquidacion = [
    { detalle_id: 1, liquidacion_id: 1, concepto_id: 1, monto: 2500000 },
    { detalle_id: 2, liquidacion_id: 1, concepto_id: 3, monto: 250000 },
    { detalle_id: 3, liquidacion_id: 1, concepto_id: 4, monto: 175000 },
    { detalle_id: 4, liquidacion_id: 1, concepto_id: 5, monto: 125000 },
    { detalle_id: 5, liquidacion_id: 2, concepto_id: 1, monto: 1200000 },
    { detalle_id: 6, liquidacion_id: 2, concepto_id: 3, monto: 120000 },
    { detalle_id: 7, liquidacion_id: 2, concepto_id: 4, monto: 84000 },
    { detalle_id: 8, liquidacion_id: 2, concepto_id: 5, monto: 60000 }
  ];

  const evaluaciones = [
    {
      evaluacion_id: 1,
      empleado_id: 2,
      evaluador_id: 1,
      fecha_evaluacion: '2026-06-30',
      calificacion: 4,
      comentarios: 'Buen desempeño comercial y cumplimiento de metas.',
      objetivos: 'Aumentar la cartera de clientes en un 10% durante el próximo semestre.'
    },
    {
      evaluacion_id: 2,
      empleado_id: 4,
      evaluador_id: 3,
      fecha_evaluacion: '2026-06-30',
      calificacion: 3,
      comentarios: 'Cumple con las funciones asignadas.',
      objetivos: 'Completar la certificación de seguridad industrial.'
    }
  ];

  const auditoria = [
    {
      auditoria_id: 1,
      usuario: 'sistema',
      accion: 'seed',
      entidad: 'sistema',
      entidad_id: null,
      detalle: 'Carga inicial de datos de demostración de RRHH.',
      fecha: '2026-10-01T09:00:00.000Z'
    }
  ];

  return {
    departamentos,
    cargos,
    empleados,
    contratosEmpleado,
    beneficios,
    beneficiosEmpleado,
    registrosAsistencia,
    tiposPermiso,
    solicitudesPermiso,
    periodosNomina,
    conceptosNomina,
    liquidaciones,
    detallesLiquidacion,
    evaluaciones,
    auditoria
  };
}
