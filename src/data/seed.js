// Datos semilla de las 14 entidades oficiales del modulo de RRHH y Planilla.
// Se cargan la primera vez que se abre la aplicacion y se pueden restablecer
// desde el panel de administracion.

const departments = [
  { departamento_id: 1, empresa_id: 1, nombre_departamento: 'Administracion', codigo_departamento: 'ADM', jefe_departamento_id: 5, dotacion_minima: 1 },
  { departamento_id: 2, empresa_id: 1, nombre_departamento: 'Recursos Humanos', codigo_departamento: 'RRHH', jefe_departamento_id: 1, dotacion_minima: 1 },
  { departamento_id: 3, empresa_id: 1, nombre_departamento: 'Tecnologia', codigo_departamento: 'TI', jefe_departamento_id: 2, dotacion_minima: 1 },
  { departamento_id: 4, empresa_id: 1, nombre_departamento: 'Ventas', codigo_departamento: 'VEN', jefe_departamento_id: 7, dotacion_minima: 1 },
  { departamento_id: 5, empresa_id: 1, nombre_departamento: 'Finanzas', codigo_departamento: 'FIN', jefe_departamento_id: 4, dotacion_minima: 1 }
];

const positions = [
  { cargo_id: 1, nombre_cargo: 'Gerente General', nivel_grado: 'Jefatura' },
  { cargo_id: 2, nombre_cargo: 'Jefe de Recursos Humanos', nivel_grado: 'Jefatura' },
  { cargo_id: 3, nombre_cargo: 'Ingeniero de Software', nivel_grado: 'Senior' },
  { cargo_id: 4, nombre_cargo: 'Vendedor', nivel_grado: 'Junior' },
  { cargo_id: 5, nombre_cargo: 'Analista de Nomina', nivel_grado: 'Senior' },
  { cargo_id: 6, nombre_cargo: 'Asistente Administrativo', nivel_grado: 'Junior' },
  { cargo_id: 7, nombre_cargo: 'Jefe de Ventas', nivel_grado: 'Jefatura' }
];

const employees = [
  {
    empleado_id: 1,
    departamento_id: 2,
    cargo_id: 2,
    supervisor_id: null,
    nombres: 'Ana',
    apellidos: 'Torres',
    rut: '12.345.678-9',
    correo_electronico: 'ana.torres@empresa.cl',
    fecha_contratacion: '2023-01-09',
    estado_laboral: 'Activo',
    telefono: '+56 9 1111 1111',
    direccion: 'Av. Central 100, Concepcion',
    banco: 'Banco Estado',
    numero_cuenta: '**** 1234'
  },
  {
    empleado_id: 2,
    departamento_id: 3,
    cargo_id: 3,
    supervisor_id: null,
    nombres: 'Bruno',
    apellidos: 'Diaz',
    rut: '13.456.789-0',
    correo_electronico: 'bruno.diaz@empresa.cl',
    fecha_contratacion: '2023-03-15',
    estado_laboral: 'Activo',
    telefono: '+56 9 2222 2222',
    direccion: 'Los Aromos 45, Concepcion',
    banco: 'Banco de Chile',
    numero_cuenta: '**** 5678'
  },
  {
    empleado_id: 3,
    departamento_id: 4,
    cargo_id: 4,
    supervisor_id: 7,
    nombres: 'Carla',
    apellidos: 'Rojas',
    rut: '14.567.890-1',
    correo_electronico: 'carla.rojas@empresa.cl',
    fecha_contratacion: '2024-02-01',
    estado_laboral: 'Activo',
    telefono: '+56 9 3333 3333',
    direccion: 'Calle Freire 220, Concepcion',
    banco: 'Banco Santander',
    numero_cuenta: '**** 9012'
  },
  {
    empleado_id: 4,
    departamento_id: 5,
    cargo_id: 5,
    supervisor_id: 1,
    nombres: 'Diego',
    apellidos: 'Soto',
    rut: '15.678.901-2',
    correo_electronico: 'diego.soto@empresa.cl',
    fecha_contratacion: '2023-06-12',
    estado_laboral: 'Activo',
    telefono: '+56 9 4444 4444',
    direccion: 'O\'Higgins 810, Concepcion',
    banco: 'Banco Estado',
    numero_cuenta: '**** 3456'
  },
  {
    empleado_id: 5,
    departamento_id: 1,
    cargo_id: 1,
    supervisor_id: null,
    nombres: 'Elena',
    apellidos: 'Munoz',
    rut: '16.789.012-3',
    correo_electronico: 'elena.munoz@empresa.cl',
    fecha_contratacion: '2022-05-02',
    estado_laboral: 'Activo',
    telefono: '+56 9 5555 5555',
    direccion: 'Av. Alemana 1520, Concepcion',
    banco: 'Banco de Chile',
    numero_cuenta: '**** 7890'
  },
  {
    empleado_id: 6,
    departamento_id: 3,
    cargo_id: 3,
    supervisor_id: 2,
    nombres: 'Felipe',
    apellidos: 'Vera',
    rut: '17.890.123-4',
    correo_electronico: 'felipe.vera@empresa.cl',
    fecha_contratacion: '2024-08-19',
    estado_laboral: 'Activo',
    telefono: '+56 9 6666 6666',
    direccion: 'Barros Arana 55, Concepcion',
    banco: 'Banco BCI',
    numero_cuenta: '**** 2345'
  },
  {
    empleado_id: 7,
    departamento_id: 4,
    cargo_id: 7,
    supervisor_id: 5,
    nombres: 'Gonzalo',
    apellidos: 'Paredes',
    rut: '18.901.234-5',
    correo_electronico: 'gonzalo.paredes@empresa.cl',
    fecha_contratacion: '2023-02-20',
    estado_laboral: 'Activo',
    telefono: '+56 9 7777 7777',
    direccion: 'Paicavi 340, Concepcion',
    banco: 'Banco Santander',
    numero_cuenta: '**** 6789'
  },
  {
    empleado_id: 8,
    departamento_id: 2,
    cargo_id: 6,
    supervisor_id: 1,
    nombres: 'Hilda',
    apellidos: 'Castro',
    rut: '19.012.345-6',
    correo_electronico: 'hilda.castro@empresa.cl',
    fecha_contratacion: '2024-04-08',
    estado_laboral: 'Activo',
    telefono: '+56 9 8888 8888',
    direccion: 'San Martin 900, Concepcion',
    banco: 'Banco Estado',
    numero_cuenta: '**** 1122'
  },
  {
    empleado_id: 9,
    departamento_id: 5,
    cargo_id: 5,
    supervisor_id: 4,
    nombres: 'Ivan',
    apellidos: 'Lagos',
    rut: '20.123.456-7',
    correo_electronico: 'ivan.lagos@empresa.cl',
    fecha_contratacion: '2025-01-13',
    estado_laboral: 'Activo',
    telefono: '+56 9 9999 9999',
    direccion: 'Colo Colo 125, Concepcion',
    banco: 'Banco Itau',
    numero_cuenta: '**** 3344'
  },
  {
    empleado_id: 10,
    departamento_id: 4,
    cargo_id: 4,
    supervisor_id: 7,
    nombres: 'Javiera',
    apellidos: 'Nunez',
    rut: '21.234.567-8',
    correo_electronico: 'javiera.nunez@empresa.cl',
    fecha_contratacion: '2025-03-03',
    estado_laboral: 'Activo',
    telefono: '+56 9 1010 1010',
    direccion: 'Rengo 77, Concepcion',
    banco: 'Banco Falabella',
    numero_cuenta: '**** 5566'
  }
];

const contracts = [
  { contrato_id: 1, empleado_id: 1, tipo_contrato: 'Indefinido', fecha_inicio: '2023-01-09', fecha_fin: null, salario_base: 3500000, codigo_moneda: 'CLP' },
  { contrato_id: 2, empleado_id: 2, tipo_contrato: 'Indefinido', fecha_inicio: '2023-03-15', fecha_fin: null, salario_base: 2800000, codigo_moneda: 'CLP' },
  { contrato_id: 3, empleado_id: 3, tipo_contrato: 'Plazo fijo', fecha_inicio: '2024-02-01', fecha_fin: '2026-12-31', salario_base: 1200000, codigo_moneda: 'CLP' },
  { contrato_id: 4, empleado_id: 4, tipo_contrato: 'Indefinido', fecha_inicio: '2023-06-12', fecha_fin: null, salario_base: 2400000, codigo_moneda: 'CLP' },
  { contrato_id: 5, empleado_id: 5, tipo_contrato: 'Indefinido', fecha_inicio: '2022-05-02', fecha_fin: null, salario_base: 4500000, codigo_moneda: 'CLP' },
  { contrato_id: 6, empleado_id: 6, tipo_contrato: 'Indefinido', fecha_inicio: '2024-08-19', fecha_fin: null, salario_base: 2500000, codigo_moneda: 'CLP' },
  { contrato_id: 7, empleado_id: 7, tipo_contrato: 'Indefinido', fecha_inicio: '2023-02-20', fecha_fin: null, salario_base: 3000000, codigo_moneda: 'CLP' },
  { contrato_id: 8, empleado_id: 8, tipo_contrato: 'Plazo fijo', fecha_inicio: '2024-04-08', fecha_fin: '2026-12-31', salario_base: 1300000, codigo_moneda: 'CLP' },
  { contrato_id: 9, empleado_id: 9, tipo_contrato: 'Indefinido', fecha_inicio: '2025-01-13', fecha_fin: null, salario_base: 2200000, codigo_moneda: 'CLP' },
  { contrato_id: 10, empleado_id: 10, tipo_contrato: 'Plazo fijo', fecha_inicio: '2025-03-03', fecha_fin: '2026-12-31', salario_base: 1150000, codigo_moneda: 'CLP' }
];

const benefits = [
  { beneficio_id: 1, nombre_beneficio: 'Seguro complementario de salud', proveedor: 'Consalud', costo: 45000, estado: 'activo' },
  { beneficio_id: 2, nombre_beneficio: 'Bono de colacion', proveedor: 'Sodexo', costo: 80000, estado: 'activo' },
  { beneficio_id: 3, nombre_beneficio: 'Membresia gimnasio', proveedor: 'SmartFit', costo: 25000, estado: 'activo' }
];

const employeeBenefits = [
  { beneficio_empleado_id: 1, empleado_id: 1, beneficio_id: 1, fecha_inscripcion: '2025-01-15', estado: 'activa' },
  { beneficio_empleado_id: 2, empleado_id: 3, beneficio_id: 2, fecha_inscripcion: '2025-04-01', estado: 'activa' },
  { beneficio_empleado_id: 3, empleado_id: 7, beneficio_id: 1, fecha_inscripcion: '2025-02-10', estado: 'activa' },
  { beneficio_empleado_id: 4, empleado_id: 10, beneficio_id: 2, fecha_inscripcion: '2025-06-01', estado: 'activa' },
  { beneficio_empleado_id: 5, empleado_id: 10, beneficio_id: 3, fecha_inscripcion: '2025-06-01', estado: 'activa' }
];

const permissionTypes = [
  { tipo_permiso_id: 1, nombre_tipo_permiso: 'Vacaciones', es_remunerado: true, dias_anuales: 15 },
  { tipo_permiso_id: 2, nombre_tipo_permiso: 'Licencia medica', es_remunerado: true, dias_anuales: 10 },
  { tipo_permiso_id: 3, nombre_tipo_permiso: 'Permiso administrativo', es_remunerado: true, dias_anuales: 5 },
  { tipo_permiso_id: 4, nombre_tipo_permiso: 'Permiso sin goce de sueldo', es_remunerado: false, dias_anuales: 10 }
];

const permissionRequests = [
  {
    solicitud_permiso_id: 1,
    empleado_id: 10,
    tipo_permiso_id: 1,
    aprobado_por: null,
    fecha_inicio: '2026-11-10',
    fecha_fin: '2026-11-12',
    estado: 'Pendiente',
    comentario: '',
    fecha_solicitud: '2026-10-28'
  },
  {
    solicitud_permiso_id: 2,
    empleado_id: 6,
    tipo_permiso_id: 3,
    aprobado_por: 2,
    fecha_inicio: '2026-09-15',
    fecha_fin: '2026-09-16',
    estado: 'Aprobada',
    comentario: 'Aprobado por jefatura directa.',
    fecha_solicitud: '2026-09-01'
  }
];

const payrollPeriods = [
  {
    periodo_nomina_id: 1,
    empresa_id: 1,
    inicio_periodo: '2026-09-01',
    fin_periodo: '2026-09-30',
    fecha_ejecucion: '2026-09-30',
    estado: 'Cerrado'
  },
  {
    periodo_nomina_id: 2,
    empresa_id: 1,
    inicio_periodo: '2026-10-01',
    fin_periodo: '2026-10-31',
    fecha_ejecucion: null,
    estado: 'Borrador'
  }
];

const payrollConcepts = [
  { concepto_id: 1, nombre_concepto: 'Sueldo base', tipo_concepto: 'haber' },
  { concepto_id: 2, nombre_concepto: 'Horas extras', tipo_concepto: 'haber' },
  { concepto_id: 3, nombre_concepto: 'Bono de colacion', tipo_concepto: 'haber' },
  { concepto_id: 4, nombre_concepto: 'AFP', tipo_concepto: 'deduccion' },
  { concepto_id: 5, nombre_concepto: 'Salud', tipo_concepto: 'deduccion' },
  { concepto_id: 6, nombre_concepto: 'Impuesto unico', tipo_concepto: 'deduccion' }
];

const users = [
  { usuario_id: 1, empleado_id: 1, nombre: 'Ana Torres', correo_electronico: 'ana.torres@empresa.cl', rol: 'admin_rrhh', activo: true },
  { usuario_id: 2, empleado_id: 4, nombre: 'Diego Soto', correo_electronico: 'diego.soto@empresa.cl', rol: 'nomina', activo: true },
  { usuario_id: 3, empleado_id: 7, nombre: 'Gonzalo Paredes', correo_electronico: 'gonzalo.paredes@empresa.cl', rol: 'jefatura', activo: true },
  { usuario_id: 4, empleado_id: 10, nombre: 'Javiera Nunez', correo_electronico: 'javiera.nunez@empresa.cl', rol: 'empleado', activo: true }
];

const evaluations = [
  {
    evaluacion_id: 1,
    empleado_id: 10,
    evaluador_id: 7,
    fecha_evaluacion: '2026-09-30',
    calificacion: 4.5,
    comentarios: 'Cumple sus metas comerciales y mantiene buena colaboracion con el equipo.'
  },
  {
    evaluacion_id: 2,
    empleado_id: 6,
    evaluador_id: 2,
    fecha_evaluacion: '2026-09-29',
    calificacion: 4.0,
    comentarios: 'Buen avance tecnico; se sugiere reforzar documentacion.'
  }
];

function buildAttendance() {
  const records = [];
  let id = 1;
  const workdays = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07'];
  const exits = ['18:00', '18:00', '17:30', '18:30', '18:00'];

  employees.forEach((employee, employeeIndex) => {
    workdays.forEach((date, dayIndex) => {
      const exit = exits[(dayIndex + employeeIndex) % exits.length];
      const entry = '08:30';
      const start = 8 * 60 + 30;
      const [exitHour, exitMinute] = exit.split(':').map(Number);
      const hours = Math.round(((exitHour * 60 + exitMinute - start) / 60) * 100) / 100;
      const overtime = Math.max(0, Math.round((hours - 8) * 100) / 100);
      const pending = employee.departamento_id === 4;
      records.push({
        asistencia_id: id,
        empleado_id: employee.empleado_id,
        fecha_laboral: date,
        hora_entrada: `${date}T${entry}`,
        hora_salida: `${date}T${exit}`,
        horas_trabajadas: hours,
        horas_extras: overtime,
        estado_validacion: pending ? 'pendiente' : 'aprobado',
        horas_extras_aprobadas: pending ? null : overtime,
        aprobado_por: pending ? null : 1,
        fecha_aprobacion: pending ? null : date
      });
      id += 1;
    });
  });

  return records;
}

export const SEED = {
  departamentos: departments,
  cargos: positions,
  empleados: employees,
  contratos: contracts,
  beneficios: benefits,
  beneficiosEmpleado: employeeBenefits,
  asistencia: buildAttendance(),
  tiposPermiso: permissionTypes,
  solicitudesPermiso: permissionRequests,
  periodosNomina: payrollPeriods,
  conceptosNomina: payrollConcepts,
  liquidaciones: [],
  detallesLiquidacion: [],
  evaluaciones: evaluations,
  usuarios: users,
  solicitudesBanco: [],
  auditoria: []
};
