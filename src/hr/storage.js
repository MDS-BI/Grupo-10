import { createSeedData } from '../data/seed.js';
import { readRaw, writeRaw, clearPrefix } from './storage-core.js';
import { logAudit } from './audit.js';
import {
  CURRENCIES,
  EMPLOYMENT_STATES,
  CONTRACT_TYPES,
  PERMISSION_STATES,
  VALIDATION_STATES,
  PAYROLL_STATES,
  assert,
  daysBetweenInclusive,
  formatCLP,
  isBlank,
  isValidDate,
  isValidEmail,
  rangesOverlap,
  toISODate,
  todayISO,
  toNumber
} from './utils.js';

export const KEYS = {
  departamentos: 'hr.departamentos',
  cargos: 'hr.cargos',
  empleados: 'hr.empleados',
  contratosEmpleado: 'hr.contratosEmpleado',
  beneficios: 'hr.beneficios',
  beneficiosEmpleado: 'hr.beneficiosEmpleado',
  registrosAsistencia: 'hr.registrosAsistencia',
  tiposPermiso: 'hr.tiposPermiso',
  solicitudesPermiso: 'hr.solicitudesPermiso',
  periodosNomina: 'hr.periodosNomina',
  conceptosNomina: 'hr.conceptosNomina',
  liquidaciones: 'hr.liquidaciones',
  detallesLiquidacion: 'hr.detallesLiquidacion',
  evaluaciones: 'hr.evaluaciones',
  auditoria: 'hr.auditoria'
};

const ID_FIELDS = {
  departamentos: 'departamento_id',
  cargos: 'cargo_id',
  empleados: 'empleado_id',
  contratosEmpleado: 'contrato_id',
  beneficios: 'beneficio_id',
  beneficiosEmpleado: 'beneficio_empleado_id',
  registrosAsistencia: 'asistencia_id',
  tiposPermiso: 'tipo_permiso_id',
  solicitudesPermiso: 'solicitud_id',
  periodosNomina: 'periodo_id',
  conceptosNomina: 'concepto_id',
  liquidaciones: 'liquidacion_id',
  detallesLiquidacion: 'detalle_id',
  evaluaciones: 'evaluacion_id'
};

const SEED_VERSION_KEY = 'hr.seed.version';
const OVERTIME_DAILY_HOURS = 9;

function seedIfNeeded() {
  if (readRaw(KEYS.departamentos)) return;
  seedAll();
}

export function seedAll() {
  const seed = createSeedData();
  Object.entries(seed).forEach(([name, items]) => {
    writeRaw(KEYS[name], JSON.stringify(items));
  });
  writeRaw(SEED_VERSION_KEY, '1');
}

export function resetStorage() {
  clearPrefix('hr.');
  seedAll();
}

export function clearAllData() {
  clearPrefix('hr.');
}

export function loadCollection(name) {
  seedIfNeeded();
  const value = readRaw(KEYS[name]);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCollection(name, items) {
  writeRaw(KEYS[name], JSON.stringify(items));
}

export function nextId(collection) {
  const field = ID_FIELDS[collection];
  return loadCollection(collection).reduce(
    (max, item) => Math.max(max, Number(item[field]) || 0),
    0
  ) + 1;
}

function normalizeRut(value) {
  return String(value || '')
    .replace(/\./g, '')
    .replace(/\s/g, '')
    .toUpperCase();
}

function normalize(value) {
  return String(value || '').trim();
}

function normalizeKey(value) {
  return normalize(value).toLowerCase();
}

function findById(collection, field, id) {
  return loadCollection(collection).find((item) => Number(item[field]) === Number(id)) || null;
}

function assertExists(collection, field, id, message) {
  const item = findById(collection, field, id);
  assert(item, message);
  return item;
}

function audit(usuario, accion, entidad, entidadId, detalle) {
  return logAudit({ usuario, accion, entidad, entidad_id: entidadId, detalle });
}

function normalizeBankRequest(value) {
  if (!value) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return {
      ...value,
      estado: value.estado || 'Pendiente',
      datos_propuestos: normalize(value.datos_propuestos),
      certificado: normalize(value.certificado),
      fecha_solicitud: value.fecha_solicitud || todayISO(),
      fecha_resolucion: value.fecha_resolucion || null
    };
  }
  if (value === true) {
    return {
      estado: 'Pendiente',
      datos_propuestos: '',
      certificado: '',
      fecha_solicitud: todayISO(),
      fecha_resolucion: null
    };
  }
  return null;
}

export const loadDepartments = () => loadCollection('departamentos');
export const loadPositions = () => loadCollection('cargos');
export const loadEmployees = () => loadCollection('empleados');
export const loadContracts = () => loadCollection('contratosEmpleado');
export const loadBenefits = () => loadCollection('beneficios');
export const loadBenefitEnrollments = () => loadCollection('beneficiosEmpleado');
export const loadAttendance = () => loadCollection('registrosAsistencia');
export const loadPermissionTypes = () => loadCollection('tiposPermiso');
export const loadPermissionRequests = () => loadCollection('solicitudesPermiso');
export const loadPayrollPeriods = () => loadCollection('periodosNomina');
export const loadConcepts = () => loadCollection('conceptosNomina');
export const loadLiquidations = () => loadCollection('liquidaciones');
export const loadLiquidationDetails = () => loadCollection('detallesLiquidacion');
export const loadEvaluations = () => loadCollection('evaluaciones');

export function getDepartment(id) {
  return findById('departamentos', 'departamento_id', id);
}

export function getPosition(id) {
  return findById('cargos', 'cargo_id', id);
}

export function getEmployee(id) {
  return findById('empleados', 'empleado_id', id);
}

export function getContract(id) {
  return findById('contratosEmpleado', 'contrato_id', id);
}

export function getBenefit(id) {
  return findById('beneficios', 'beneficio_id', id);
}

export function getPermissionType(id) {
  return findById('tiposPermiso', 'tipo_permiso_id', id);
}

export function getPermissionRequest(id) {
  return findById('solicitudesPermiso', 'solicitud_id', id);
}

export function getPayrollPeriod(id) {
  return findById('periodosNomina', 'periodo_id', id);
}

export function getConcept(id) {
  return findById('conceptosNomina', 'concepto_id', id);
}

export function getLiquidation(id) {
  return findById('liquidaciones', 'liquidacion_id', id);
}

export function getEvaluation(id) {
  return findById('evaluaciones', 'evaluacion_id', id);
}

export function getDepartmentName(id) {
  return getDepartment(id)?.nombre_departamento || 'Sin departamento';
}

export function getPositionName(id) {
  return getPosition(id)?.nombre_cargo || 'Sin cargo';
}

export function getEmployeeName(id) {
  const employee = getEmployee(id);
  return employee ? `${employee.nombres} ${employee.apellidos}` : 'Sin empleado';
}

export function getEmployeeFull(id) {
  const employee = getEmployee(id);
  if (!employee) return null;
  return {
    ...employee,
    departamento: getDepartment(employee.departamento_id),
    cargo: getPosition(employee.cargo_id),
    supervisor: getEmployee(employee.supervisor_id),
    contrato: getActiveContract(id)
  };
}

export function getDirectReports(employeeId) {
  return loadEmployees().filter((employee) => Number(employee.supervisor_id) === Number(employeeId));
}

export function getActiveContract(employeeId, date = todayISO()) {
  const target = toISODate(date);
  return (
    loadContracts()
      .filter(
        (contract) =>
          Number(contract.empleado_id) === Number(employeeId) &&
          contract.fecha_inicio <= target &&
          (!contract.fecha_fin || contract.fecha_fin >= target)
      )
      .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))[0] || null
  );
}

export function getEmployeeVacationBalance(employeeId) {
  return toNumber(getEmployee(employeeId)?.dias_vacaciones_disponibles, 0);
}

export function adjustVacationBalance(employeeId, delta) {
  const employee = assertExists('empleados', 'empleado_id', employeeId, 'Empleado no encontrado.');
  const nextBalance = Math.max(0, toNumber(employee.dias_vacaciones_disponibles, 0) + delta);
  const employees = loadEmployees().map((item) =>
    Number(item.empleado_id) === Number(employeeId)
      ? { ...item, dias_vacaciones_disponibles: nextBalance }
      : item
  );
  saveCollection('empleados', employees);
  return nextBalance;
}

export function validateDepartment(data, id = null) {
  const codigo = normalize(data.codigo_departamento || data.codigo).toUpperCase();
  const nombre = normalize(data.nombre_departamento || data.nombre);
  assert(codigo, 'El código del departamento es obligatorio.');
  assert(nombre, 'El nombre del departamento es obligatorio.');
  const departments = loadDepartments();
  const duplicateCode = departments.some(
    (item) =>
      Number(item.departamento_id) !== Number(id) &&
      normalizeKey(item.codigo_departamento) === normalizeKey(codigo)
  );
  const duplicateName = departments.some(
    (item) =>
      Number(item.departamento_id) !== Number(id) &&
      normalizeKey(item.nombre_departamento) === normalizeKey(nombre)
  );
  assert(!duplicateCode, 'Ya existe un departamento con ese código.');
  assert(!duplicateName, 'Ya existe un departamento con ese nombre.');
  const jefeId = data.jefe_departamento_id ? Number(data.jefe_departamento_id) : null;
  if (jefeId) {
    assertExists('empleados', 'empleado_id', jefeId, 'La jefatura seleccionada no existe.');
  }
  return {
    empresa_id: Number(data.empresa_id) || 1,
    codigo_departamento: codigo,
    nombre_departamento: nombre,
    jefe_departamento_id: jefeId
  };
}

export function createDepartment(data, usuario = 'sistema') {
  const record = {
    departamento_id: nextId('departamentos'),
    ...validateDepartment(data)
  };
  saveCollection('departamentos', [...loadDepartments(), record]);
  audit(usuario, 'crear', 'departamento', record.departamento_id, record.nombre_departamento);
  return record;
}

export function updateDepartment(id, data, usuario = 'sistema') {
  const existing = assertExists('departamentos', 'departamento_id', id, 'Departamento no encontrado.');
  const record = {
    ...existing,
    ...validateDepartment(data, id),
    departamento_id: existing.departamento_id
  };
  saveCollection(
    'departamentos',
    loadDepartments().map((item) =>
      Number(item.departamento_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'departamento', id, record.nombre_departamento);
  return record;
}

export function deleteDepartment(id, usuario = 'sistema') {
  assertExists('departamentos', 'departamento_id', id, 'Departamento no encontrado.');
  const employees = loadEmployees().filter(
    (employee) => Number(employee.departamento_id) === Number(id)
  );
  const positions = loadPositions().filter(
    (position) => Number(position.departamento_id) === Number(id)
  );
  assert(
    employees.length === 0,
    `No se puede eliminar: hay ${employees.length} empleado(s) asignado(s). Reasígnalos primero.`
  );
  assert(
    positions.length === 0,
    `No se puede eliminar: hay ${positions.length} cargo(s) asociado(s). Reasígnalos primero.`
  );
  saveCollection(
    'departamentos',
    loadDepartments().filter((item) => Number(item.departamento_id) !== Number(id))
  );
  audit(usuario, 'eliminar', 'departamento', id, 'Departamento eliminado');
  return true;
}

export function reassignDepartment(fromId, toId, usuario = 'sistema') {
  assert(Number(fromId) !== Number(toId), 'El departamento destino debe ser distinto.');
  assertExists('departamentos', 'departamento_id', fromId, 'Departamento origen no encontrado.');
  assertExists('departamentos', 'departamento_id', toId, 'Departamento destino no encontrado.');
  const moved = loadEmployees().filter(
    (employee) => Number(employee.departamento_id) === Number(fromId)
  ).length;
  const employees = loadEmployees().map((employee) =>
    Number(employee.departamento_id) === Number(fromId)
      ? { ...employee, departamento_id: Number(toId) }
      : employee
  );
  const positions = loadPositions().map((position) =>
    Number(position.departamento_id) === Number(fromId)
      ? { ...position, departamento_id: Number(toId) }
      : position
  );
  saveCollection('empleados', employees);
  saveCollection('cargos', positions);
  audit(usuario, 'reasignar', 'departamento', fromId, `Empleados reasignados al departamento ${toId}`);
  return { moved };
}

export function validatePosition(data, id = null) {
  const nombre = normalize(data.nombre_cargo || data.nombre);
  const nivel = normalize(data.nivel_jerarquia || data.nivel);
  const departamentoId = Number(data.departamento_id);
  assert(nombre, 'El nombre del cargo es obligatorio.');
  assert(nivel, 'El nivel jerárquico es obligatorio.');
  const department = assertExists(
    'departamentos',
    'departamento_id',
    departamentoId,
    'El departamento seleccionado no existe.'
  );
  const duplicate = loadPositions().some(
    (item) =>
      Number(item.cargo_id) !== Number(id) &&
      Number(item.departamento_id) === departamentoId &&
      normalizeKey(item.nombre_cargo) === normalizeKey(nombre)
  );
  assert(!duplicate, 'Ya existe un cargo con ese nombre en el departamento.');
  return {
    nombre_cargo: nombre,
    nivel_jerarquia: nivel,
    departamento_id: department.departamento_id
  };
}

export function createPosition(data, usuario = 'sistema') {
  const record = { cargo_id: nextId('cargos'), ...validatePosition(data) };
  saveCollection('cargos', [...loadPositions(), record]);
  audit(usuario, 'crear', 'cargo', record.cargo_id, record.nombre_cargo);
  return record;
}

export function updatePosition(id, data, usuario = 'sistema') {
  const existing = assertExists('cargos', 'cargo_id', id, 'Cargo no encontrado.');
  const record = { ...existing, ...validatePosition(data, id), cargo_id: existing.cargo_id };
  saveCollection(
    'cargos',
    loadPositions().map((item) => (Number(item.cargo_id) === Number(id) ? record : item))
  );
  audit(usuario, 'actualizar', 'cargo', id, record.nombre_cargo);
  return record;
}

export function deletePosition(id, usuario = 'sistema') {
  assertExists('cargos', 'cargo_id', id, 'Cargo no encontrado.');
  const employees = loadEmployees().filter((employee) => Number(employee.cargo_id) === Number(id));
  assert(
    employees.length === 0,
    `No se puede eliminar: hay ${employees.length} empleado(s) con este cargo.`
  );
  saveCollection(
    'cargos',
    loadPositions().filter((item) => Number(item.cargo_id) !== Number(id))
  );
  audit(usuario, 'eliminar', 'cargo', id, 'Cargo eliminado');
  return true;
}

function supervisorCreatesCycle(employeeId, supervisorId) {
  let current = getEmployee(supervisorId);
  const visited = new Set();
  while (current) {
    if (Number(current.empleado_id) === Number(employeeId)) return true;
    if (visited.has(Number(current.empleado_id))) return true;
    visited.add(Number(current.empleado_id));
    current = current.supervisor_id ? getEmployee(current.supervisor_id) : null;
  }
  return false;
}

export function validateEmployee(data, id = null) {
  const rut = normalize(data.rut);
  const nombres = normalize(data.nombres);
  const apellidos = normalize(data.apellidos);
  const email = normalize(data.email).toLowerCase();
  const fechaContratacion = toISODate(data.fecha_contratacion);
  const fechaNacimiento = data.fecha_nacimiento ? toISODate(data.fecha_nacimiento) : '';
  const estado = normalize(data.estado) || 'Activo';
  const departamentoId = Number(data.departamento_id);
  const cargoId = Number(data.cargo_id);
  const supervisorId = data.supervisor_id ? Number(data.supervisor_id) : null;

  assert(rut, 'El RUT es obligatorio.');
  assert(nombres, 'Los nombres son obligatorios.');
  assert(apellidos, 'Los apellidos son obligatorios.');
  assert(isValidEmail(email), 'El correo electrónico no es válido.');
  assert(isValidDate(fechaContratacion), 'La fecha de contratación no es válida.');
  if (fechaNacimiento) {
    assert(isValidDate(fechaNacimiento), 'La fecha de nacimiento no es válida.');
    assert(fechaNacimiento < todayISO(), 'La fecha de nacimiento debe ser anterior a hoy.');
  }
  assert(EMPLOYMENT_STATES.includes(estado), 'El estado del empleado no es válido.');
  const department = assertExists(
    'departamentos',
    'departamento_id',
    departamentoId,
    'El departamento seleccionado no existe.'
  );
  const position = assertExists(
    'cargos',
    'cargo_id',
    cargoId,
    'El cargo seleccionado no existe.'
  );
  assert(
    Number(position.departamento_id) === Number(department.departamento_id),
    'El cargo debe pertenecer al departamento seleccionado.'
  );

  const employees = loadEmployees();
  const duplicateRut = employees.some(
    (item) =>
      Number(item.empleado_id) !== Number(id) && normalizeRut(item.rut) === normalizeRut(rut)
  );
  const duplicateEmail = employees.some(
    (item) =>
      Number(item.empleado_id) !== Number(id) && normalizeKey(item.email) === normalizeKey(email)
  );
  assert(!duplicateRut, 'Ya existe un empleado con ese RUT.');
  assert(!duplicateEmail, 'Ya existe un empleado con ese correo electrónico.');

  if (supervisorId) {
    assert(Number(supervisorId) !== Number(id), 'Un empleado no puede ser su propio supervisor.');
    const supervisor = assertExists(
      'empleados',
      'empleado_id',
      supervisorId,
      'El supervisor seleccionado no existe.'
    );
    const supervisorDepartment = getDepartment(supervisor.departamento_id);
    assert(
      !supervisorDepartment ||
        Number(supervisorDepartment.empresa_id) === Number(department.empresa_id),
      'El supervisor debe pertenecer a la misma organización.'
    );
    if (id) {
      assert(
        !supervisorCreatesCycle(id, supervisorId),
        'La jerarquía de supervisión generaría un ciclo.'
      );
    }
  }

  const documentos = Array.isArray(data.documentos_legales)
    ? data.documentos_legales.map(normalize).filter(Boolean)
    : [];
  return {
    rut,
    nombres,
    apellidos,
    fecha_nacimiento: fechaNacimiento || null,
    email,
    telefono: normalize(data.telefono),
    direccion: normalize(data.direccion),
    fecha_contratacion: fechaContratacion,
    estado,
    departamento_id: departamentoId,
    cargo_id: cargoId,
    supervisor_id: supervisorId,
    datos_bancarios: normalize(data.datos_bancarios),
    solicitud_bancaria: normalizeBankRequest(data.solicitud_bancaria),
    documentos_legales: documentos,
    dias_vacaciones_disponibles: Math.max(
      0,
      toNumber(data.dias_vacaciones_disponibles, 0)
    )
  };
}

export function createEmployee(data, usuario = 'sistema') {
  const record = { empleado_id: nextId('empleados'), ...validateEmployee(data) };
  saveCollection('empleados', [...loadEmployees(), record]);
  audit(usuario, 'crear', 'empleado', record.empleado_id, `${record.nombres} ${record.apellidos}`);
  return record;
}

export function updateEmployee(id, data, usuario = 'sistema') {
  const existing = assertExists('empleados', 'empleado_id', id, 'Empleado no encontrado.');
  const record = {
    ...existing,
    ...validateEmployee({ ...existing, ...data }, id),
    empleado_id: existing.empleado_id
  };
  saveCollection(
    'empleados',
    loadEmployees().map((item) =>
      Number(item.empleado_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'empleado', id, `${record.nombres} ${record.apellidos}`);
  if (
    existing.datos_bancarios !== record.datos_bancarios ||
    JSON.stringify(existing.solicitud_bancaria || null) !==
      JSON.stringify(record.solicitud_bancaria || null)
  ) {
    audit(
      usuario,
      'actualizar_datos_bancarios',
      'empleado',
      id,
      `Datos bancarios de ${record.nombres} ${record.apellidos}`
    );
  }
  return record;
}

export function updateEmployeeContact(id, data, usuario = 'sistema') {
  const existing = assertExists('empleados', 'empleado_id', id, 'Empleado no encontrado.');
  const proposedBank = normalize(data.nuevo_datos_bancarios || data.datos_bancarios);
  let bankRequest = existing.solicitud_bancaria || null;
  if (proposedBank && proposedBank !== existing.datos_bancarios) {
    assert(
      !bankRequest || bankRequest.estado !== 'Pendiente',
      'Ya existe una solicitud bancaria pendiente; espera su resolución antes de enviar otra.'
    );
    const certificado = normalize(data.certificado);
    assert(
      certificado,
      'Debes adjuntar el certificado o documento de respaldo del cambio bancario.'
    );
    bankRequest = {
      estado: 'Pendiente',
      datos_propuestos: proposedBank,
      certificado,
      fecha_solicitud: todayISO(),
      fecha_resolucion: null
    };
  }
  return updateEmployee(
    id,
    {
      telefono: data.telefono ?? existing.telefono,
      direccion: data.direccion ?? existing.direccion,
      email: data.email ?? existing.email,
      datos_bancarios: existing.datos_bancarios,
      solicitud_bancaria: bankRequest,
      documentos_legales: data.documentos_legales ?? existing.documentos_legales
    },
    usuario
  );
}

export function resolveBankRequest(employeeId, decision, usuario = 'sistema') {
  const employee = assertExists('empleados', 'empleado_id', employeeId, 'Empleado no encontrado.');
  const request = employee.solicitud_bancaria;
  assert(
    request && request.estado === 'Pendiente',
    'No hay una solicitud bancaria pendiente para este empleado.'
  );
  assert(
    ['Aprobada', 'Rechazada'].includes(decision),
    'La decisión de la solicitud bancaria no es válida.'
  );
  const approved = decision === 'Aprobada';
  assert(
    !approved || normalize(request.datos_propuestos),
    'La solicitud bancaria no contiene datos propuestos.'
  );
  const record = {
    ...employee,
    datos_bancarios: approved ? request.datos_propuestos : employee.datos_bancarios,
    solicitud_bancaria: {
      ...request,
      estado: decision,
      fecha_resolucion: todayISO()
    }
  };
  saveCollection(
    'empleados',
    loadEmployees().map((item) =>
      Number(item.empleado_id) === Number(employeeId) ? record : item
    )
  );
  audit(
    usuario,
    approved ? 'aprobar_datos_bancarios' : 'rechazar_datos_bancarios',
    'empleado',
    employeeId,
    `${record.nombres} ${record.apellidos}`
  );
  return record;
}

export function deleteEmployee(id, usuario = 'sistema') {
  assertExists('empleados', 'empleado_id', id, 'Empleado no encontrado.');
  const contracts = loadContracts().filter((item) => Number(item.empleado_id) === Number(id));
  const liquidations = loadLiquidations().filter(
    (item) => Number(item.empleado_id) === Number(id)
  );
  const reports = getDirectReports(id);
  const evaluations = loadEvaluations().filter(
    (item) =>
      Number(item.empleado_id) === Number(id) || Number(item.evaluador_id) === Number(id)
  );
  assert(contracts.length === 0, 'No se puede eliminar: el empleado tiene contratos registrados.');
  assert(
    liquidations.length === 0,
    'No se puede eliminar: el empleado tiene liquidaciones históricas.'
  );
  assert(reports.length === 0, 'No se puede eliminar: el empleado tiene personas a cargo.');
  assert(
    evaluations.length === 0,
    'No se puede eliminar: el empleado tiene evaluaciones históricas.'
  );
  saveCollection(
    'empleados',
    loadEmployees().filter((item) => Number(item.empleado_id) !== Number(id))
  );
  saveCollection(
    'registrosAsistencia',
    loadAttendance().filter((item) => Number(item.empleado_id) !== Number(id))
  );
  saveCollection(
    'solicitudesPermiso',
    loadPermissionRequests().filter((item) => Number(item.empleado_id) !== Number(id))
  );
  saveCollection(
    'beneficiosEmpleado',
    loadBenefitEnrollments().filter((item) => Number(item.empleado_id) !== Number(id))
  );
  audit(usuario, 'eliminar', 'empleado', id, 'Empleado eliminado');
  return true;
}

export function buildContractText(employee, contract) {
  const department = getDepartment(employee.departamento_id);
  const position = getPosition(employee.cargo_id);
  const end = contract.fecha_fin || 'indefinida';
  return [
    `Contrato de trabajo ${contract.tipo_contrato.toLowerCase()}`,
    '',
    `En Santiago, entre la empresa y ${employee.nombres} ${employee.apellidos}, RUT ${employee.rut},`,
    `se acuerda el siguiente contrato para desempeñar el cargo de ${position?.nombre_cargo || 'sin cargo'}`,
    `en el departamento de ${department?.nombre_departamento || 'sin departamento'}.`,
    '',
    `Tipo de contrato: ${contract.tipo_contrato}.`,
    `Fecha de inicio: ${contract.fecha_inicio}.`,
    `Fecha de término: ${end}.`,
    `Remuneración base: ${formatCLP(contract.salario_base)} ${contract.moneda}.`,
    '',
    'Ambas partes declaran aceptar las condiciones legales y laborales vigentes.'
  ].join('\n');
}

export function validateContract(data, id = null) {
  const empleadoId = Number(data.empleado_id);
  const empleado = assertExists('empleados', 'empleado_id', empleadoId, 'El empleado no existe.');
  const tipo = normalize(data.tipo_contrato);
  const fechaInicio = toISODate(data.fecha_inicio);
  const fechaFin = data.fecha_fin ? toISODate(data.fecha_fin) : null;
  const salario = toNumber(data.salario_base);
  const moneda = normalize(data.moneda) || 'CLP';
  assert(CONTRACT_TYPES.includes(tipo), 'El tipo de contrato no es válido.');
  assert(isValidDate(fechaInicio), 'La fecha de inicio no es válida.');
  if (tipo === 'Plazo fijo') {
    assert(Boolean(fechaFin), 'El contrato a plazo fijo debe tener fecha de término.');
  }
  if (fechaFin) {
    assert(isValidDate(fechaFin), 'La fecha de término no es válida.');
    assert(fechaFin >= fechaInicio, 'La fecha de término debe ser posterior al inicio.');
  }
  assert(salario > 0, 'El salario base debe ser mayor que cero.');
  assert(CURRENCIES.includes(moneda), 'La moneda no es válida.');

  const overlap = loadContracts().some(
    (contract) =>
      Number(contract.contrato_id) !== Number(id) &&
      Number(contract.empleado_id) === empleadoId &&
      rangesOverlap(fechaInicio, fechaFin, contract.fecha_inicio, contract.fecha_fin)
  );
  assert(!overlap, 'El contrato se superpone con otro contrato del empleado.');

  return {
    empleado_id: empleadoId,
    tipo_contrato: tipo,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    salario_base: salario,
    moneda,
    texto_contrato:
      normalize(data.texto_contrato) || buildContractText(empleado, { ...data, tipo_contrato: tipo })
  };
}

export function createContract(data, usuario = 'sistema') {
  const record = { contrato_id: nextId('contratosEmpleado'), ...validateContract(data) };
  saveCollection('contratosEmpleado', [...loadContracts(), record]);
  audit(usuario, 'crear', 'contrato', record.contrato_id, `Empleado ${record.empleado_id}`);
  return record;
}

export function updateContract(id, data, usuario = 'sistema') {
  const existing = assertExists('contratosEmpleado', 'contrato_id', id, 'Contrato no encontrado.');
  const record = {
    ...existing,
    ...validateContract({ ...existing, ...data }, id),
    contrato_id: existing.contrato_id
  };
  saveCollection(
    'contratosEmpleado',
    loadContracts().map((item) =>
      Number(item.contrato_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'contrato', id, `Empleado ${record.empleado_id}`);
  if (Number(existing.salario_base) !== Number(record.salario_base)) {
    audit(
      usuario,
      'actualizar_salario',
      'contrato',
      id,
      `Empleado ${record.empleado_id}: ${existing.salario_base} → ${record.salario_base}`
    );
  }
  return record;
}

export function deleteContract(id, usuario = 'sistema') {
  assertExists('contratosEmpleado', 'contrato_id', id, 'Contrato no encontrado.');
  saveCollection(
    'contratosEmpleado',
    loadContracts().filter((item) => Number(item.contrato_id) !== Number(id))
  );
  audit(usuario, 'eliminar', 'contrato', id, 'Contrato eliminado');
  return true;
}

export function validateBenefit(data, id = null) {
  const nombre = normalize(data.nombre_beneficio || data.nombre);
  const proveedor = normalize(data.proveedor);
  const costo = toNumber(data.costo);
  const estado = normalize(data.estado) || 'Activo';
  assert(nombre, 'El nombre del beneficio es obligatorio.');
  assert(proveedor, 'El proveedor es obligatorio.');
  assert(costo >= 0, 'El costo no puede ser negativo.');
  assert(['Activo', 'Inactivo'].includes(estado), 'El estado del beneficio no es válido.');
  const duplicate = loadBenefits().some(
    (item) =>
      Number(item.beneficio_id) !== Number(id) &&
      normalizeKey(item.nombre_beneficio) === normalizeKey(nombre)
  );
  assert(!duplicate, 'Ya existe un beneficio con ese nombre.');
  return { nombre_beneficio: nombre, proveedor, costo, estado };
}

export function createBenefit(data, usuario = 'sistema') {
  const record = { beneficio_id: nextId('beneficios'), ...validateBenefit(data) };
  saveCollection('beneficios', [...loadBenefits(), record]);
  audit(usuario, 'crear', 'beneficio', record.beneficio_id, record.nombre_beneficio);
  return record;
}

export function updateBenefit(id, data, usuario = 'sistema') {
  const existing = assertExists('beneficios', 'beneficio_id', id, 'Beneficio no encontrado.');
  const record = {
    ...existing,
    ...validateBenefit({ ...existing, ...data }, id),
    beneficio_id: existing.beneficio_id
  };
  saveCollection(
    'beneficios',
    loadBenefits().map((item) =>
      Number(item.beneficio_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'beneficio', id, record.nombre_beneficio);
  return record;
}

export function deleteBenefit(id, usuario = 'sistema') {
  assertExists('beneficios', 'beneficio_id', id, 'Beneficio no encontrado.');
  const enrollments = loadBenefitEnrollments().filter(
    (item) => Number(item.beneficio_id) === Number(id)
  );
  assert(
    enrollments.length === 0,
    'No se puede eliminar: el beneficio tiene empleados inscritos.'
  );
  saveCollection(
    'beneficios',
    loadBenefits().filter((item) => Number(item.beneficio_id) !== Number(id))
  );
  audit(usuario, 'eliminar', 'beneficio', id, 'Beneficio eliminado');
  return true;
}

export function validateBenefitEnrollment(data, id = null) {
  const empleadoId = Number(data.empleado_id);
  const beneficioId = Number(data.beneficio_id);
  const empleado = assertExists('empleados', 'empleado_id', empleadoId, 'El empleado no existe.');
  const beneficio = assertExists(
    'beneficios',
    'beneficio_id',
    beneficioId,
    'El beneficio no existe.'
  );
  assert(beneficio.estado === 'Activo', 'El beneficio debe estar activo.');
  const fechaInicio = toISODate(data.fecha_inicio);
  const fechaFin = data.fecha_fin ? toISODate(data.fecha_fin) : null;
  assert(isValidDate(fechaInicio), 'La fecha de inicio no es válida.');
  if (fechaFin) {
    assert(isValidDate(fechaFin), 'La fecha de término no es válida.');
    assert(fechaFin >= fechaInicio, 'La fecha de término debe ser posterior al inicio.');
  }
  const duplicate = loadBenefitEnrollments().some(
    (item) =>
      Number(item.beneficio_empleado_id) !== Number(id) &&
      Number(item.empleado_id) === empleadoId &&
      Number(item.beneficio_id) === beneficioId &&
      item.estado === 'Activo'
  );
  assert(!duplicate, 'El empleado ya tiene una inscripción activa a este beneficio.');
  const estado = fechaFin && fechaFin < todayISO() ? 'Finalizado' : 'Activo';
  return {
    empleado_id: empleado.empleado_id,
    beneficio_id: beneficio.beneficio_id,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    estado: data.estado === 'Finalizado' || estado === 'Finalizado' ? 'Finalizado' : 'Activo'
  };
}

export function createBenefitEnrollment(data, usuario = 'sistema') {
  const record = {
    beneficio_empleado_id: nextId('beneficiosEmpleado'),
    ...validateBenefitEnrollment(data)
  };
  saveCollection('beneficiosEmpleado', [...loadBenefitEnrollments(), record]);
  audit(
    usuario,
    'crear',
    'beneficio_empleado',
    record.beneficio_empleado_id,
    `Empleado ${record.empleado_id}`
  );
  return record;
}

export function updateBenefitEnrollment(id, data, usuario = 'sistema') {
  const existing = assertExists(
    'beneficiosEmpleado',
    'beneficio_empleado_id',
    id,
    'Inscripción no encontrada.'
  );
  const record = {
    ...existing,
    ...validateBenefitEnrollment({ ...existing, ...data }, id),
    beneficio_empleado_id: existing.beneficio_empleado_id
  };
  saveCollection(
    'beneficiosEmpleado',
    loadBenefitEnrollments().map((item) =>
      Number(item.beneficio_empleado_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'beneficio_empleado', id, `Empleado ${record.empleado_id}`);
  return record;
}

export function endBenefitEnrollment(id, fechaFin = todayISO(), usuario = 'sistema') {
  const existing = assertExists(
    'beneficiosEmpleado',
    'beneficio_empleado_id',
    id,
    'Inscripción no encontrada.'
  );
  const end = toISODate(fechaFin);
  assert(isValidDate(end), 'La fecha de término no es válida.');
  assert(end >= existing.fecha_inicio, 'La fecha de término debe ser posterior al inicio.');
  const record = { ...existing, fecha_fin: end, estado: 'Finalizado' };
  saveCollection(
    'beneficiosEmpleado',
    loadBenefitEnrollments().map((item) =>
      Number(item.beneficio_empleado_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'finalizar', 'beneficio_empleado', id, end);
  return record;
}

export function deleteBenefitEnrollment(id, usuario = 'sistema') {
  assertExists(
    'beneficiosEmpleado',
    'beneficio_empleado_id',
    id,
    'Inscripción no encontrada.'
  );
  saveCollection(
    'beneficiosEmpleado',
    loadBenefitEnrollments().filter(
      (item) => Number(item.beneficio_empleado_id) !== Number(id)
    )
  );
  audit(usuario, 'eliminar', 'beneficio_empleado', id, 'Inscripción eliminada');
  return true;
}

export function getBenefitCostForEmployee(employeeId, periodStart, periodEnd) {
  const start = toISODate(periodStart);
  const end = toISODate(periodEnd);
  const totalDays = daysBetweenInclusive(start, end);
  if (!totalDays) return 0;
  return loadBenefitEnrollments()
    .filter(
      (enrollment) =>
        Number(enrollment.empleado_id) === Number(employeeId) &&
        enrollment.estado === 'Activo' &&
        rangesOverlap(enrollment.fecha_inicio, enrollment.fecha_fin, start, end)
    )
    .reduce((total, enrollment) => {
      const benefit = getBenefit(enrollment.beneficio_id);
      if (!benefit) return total;
      const overlapStart = enrollment.fecha_inicio > start ? enrollment.fecha_inicio : start;
      const overlapEnd =
        !enrollment.fecha_fin || enrollment.fecha_fin < end ? enrollment.fecha_fin || end : end;
      const overlapDays = daysBetweenInclusive(overlapStart, overlapEnd);
      return total + (toNumber(benefit.costo) * overlapDays) / totalDays;
    }, 0);
}

export function getBenefitCostByDepartment(periodStart, periodEnd) {
  const departments = loadDepartments();
  return departments.map((department) => {
    const employees = loadEmployees().filter(
      (employee) => Number(employee.departamento_id) === Number(department.departamento_id)
    );
    const cost = employees.reduce(
      (total, employee) =>
        total + getBenefitCostForEmployee(employee.empleado_id, periodStart, periodEnd),
      0
    );
    return {
      departamento_id: department.departamento_id,
      nombre_departamento: department.nombre_departamento,
      costo: Math.round(cost)
    };
  });
}

export function validatePermissionType(data, id = null) {
  const nombre = normalize(data.nombre_tipo || data.nombre);
  const dias = toNumber(data.dias_anuales);
  assert(nombre, 'El nombre del tipo de permiso es obligatorio.');
  assert(dias >= 0, 'Los días anuales no pueden ser negativos.');
  const duplicate = loadPermissionTypes().some(
    (item) =>
      Number(item.tipo_permiso_id) !== Number(id) &&
      normalizeKey(item.nombre_tipo) === normalizeKey(nombre)
  );
  assert(!duplicate, 'Ya existe un tipo de permiso con ese nombre.');
  return {
    nombre_tipo: nombre,
    es_remunerado: Boolean(data.es_remunerado),
    dias_anuales: dias
  };
}

export function createPermissionType(data, usuario = 'sistema') {
  const record = { tipo_permiso_id: nextId('tiposPermiso'), ...validatePermissionType(data) };
  saveCollection('tiposPermiso', [...loadPermissionTypes(), record]);
  audit(usuario, 'crear', 'tipo_permiso', record.tipo_permiso_id, record.nombre_tipo);
  return record;
}

export function updatePermissionType(id, data, usuario = 'sistema') {
  const existing = assertExists(
    'tiposPermiso',
    'tipo_permiso_id',
    id,
    'Tipo de permiso no encontrado.'
  );
  const record = {
    ...existing,
    ...validatePermissionType({ ...existing, ...data }, id),
    tipo_permiso_id: existing.tipo_permiso_id
  };
  saveCollection(
    'tiposPermiso',
    loadPermissionTypes().map((item) =>
      Number(item.tipo_permiso_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'tipo_permiso', id, record.nombre_tipo);
  return record;
}

export function deletePermissionType(id, usuario = 'sistema') {
  assertExists('tiposPermiso', 'tipo_permiso_id', id, 'Tipo de permiso no encontrado.');
  const requests = loadPermissionRequests().filter(
    (item) => Number(item.tipo_permiso_id) === Number(id)
  );
  assert(
    requests.length === 0,
    'No se puede eliminar: el tipo de permiso tiene solicitudes asociadas.'
  );
  saveCollection(
    'tiposPermiso',
    loadPermissionTypes().filter((item) => Number(item.tipo_permiso_id) !== Number(id))
  );
  audit(usuario, 'eliminar', 'tipo_permiso', id, 'Tipo de permiso eliminado');
  return true;
}

function isVacationType(type) {
  return normalizeKey(type?.nombre_tipo).includes('vacacion');
}

function hasPermissionOverlap(employeeId, start, end, excludeId = null) {
  return loadPermissionRequests().some(
    (request) =>
      Number(request.solicitud_id) !== Number(excludeId) &&
      Number(request.empleado_id) === Number(employeeId) &&
      ['Pendiente', 'Aprobada'].includes(request.estado) &&
      rangesOverlap(start, end, request.fecha_inicio, request.fecha_fin)
  );
}

export function validatePermissionRequest(data, id = null) {
  const empleadoId = Number(data.empleado_id);
  const tipoId = Number(data.tipo_permiso_id);
  const empleado = assertExists('empleados', 'empleado_id', empleadoId, 'El empleado no existe.');
  const tipo = assertExists(
    'tiposPermiso',
    'tipo_permiso_id',
    tipoId,
    'El tipo de permiso no existe.'
  );
  const fechaInicio = toISODate(data.fecha_inicio);
  const fechaFin = toISODate(data.fecha_fin || data.fecha_inicio);
  assert(isValidDate(fechaInicio), 'La fecha de inicio no es válida.');
  assert(isValidDate(fechaFin), 'La fecha de término no es válida.');
  assert(fechaFin >= fechaInicio, 'La fecha de término debe ser posterior al inicio.');
  const dias = daysBetweenInclusive(fechaInicio, fechaFin);
  assert(dias > 0, 'La solicitud debe abarcar al menos un día.');
  assert(
    !hasPermissionOverlap(empleadoId, fechaInicio, fechaFin, id),
    'Ya existe una solicitud pendiente o aprobada que se superpone con estas fechas.'
  );
  if (isVacationType(tipo)) {
    assert(
      dias <= toNumber(empleado.dias_vacaciones_disponibles, 0),
      `Saldo insuficiente: dispones de ${empleado.dias_vacaciones_disponibles} día(s).`
    );
  }
  return {
    empleado_id: empleadoId,
    tipo_permiso_id: tipo.tipo_permiso_id,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    dias_solicitados: dias,
    estado: PERMISSION_STATES.includes(data.estado) ? data.estado : 'Pendiente',
    fecha_solicitud: toISODate(data.fecha_solicitud) || todayISO(),
    comentario_aprobacion: normalize(data.comentario_aprobacion)
  };
}

export function createPermissionRequest(data, usuario = 'sistema') {
  const record = {
    solicitud_id: nextId('solicitudesPermiso'),
    ...validatePermissionRequest({ ...data, estado: 'Pendiente' })
  };
  saveCollection('solicitudesPermiso', [...loadPermissionRequests(), record]);
  audit(usuario, 'crear', 'solicitud_permiso', record.solicitud_id, `Empleado ${record.empleado_id}`);
  return record;
}

export function updatePermissionRequest(id, data, usuario = 'sistema') {
  const existing = assertExists(
    'solicitudesPermiso',
    'solicitud_id',
    id,
    'Solicitud no encontrada.'
  );
  assert(existing.estado === 'Pendiente', 'Solo se pueden editar solicitudes pendientes.');
  const record = {
    ...existing,
    ...validatePermissionRequest({ ...existing, ...data }, id),
    solicitud_id: existing.solicitud_id,
    estado: 'Pendiente'
  };
  saveCollection(
    'solicitudesPermiso',
    loadPermissionRequests().map((item) =>
      Number(item.solicitud_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'solicitud_permiso', id, `Empleado ${record.empleado_id}`);
  return record;
}

export function cancelPermissionRequest(id, employeeId, usuario = 'sistema') {
  const request = assertExists(
    'solicitudesPermiso',
    'solicitud_id',
    id,
    'Solicitud no encontrada.'
  );
  assert(Number(request.empleado_id) === Number(employeeId), 'Solo puedes cancelar tus solicitudes.');
  assert(request.estado === 'Pendiente', 'Solo se pueden cancelar solicitudes pendientes.');
  saveCollection(
    'solicitudesPermiso',
    loadPermissionRequests().filter((item) => Number(item.solicitud_id) !== Number(id))
  );
  audit(usuario, 'cancelar', 'solicitud_permiso', id, 'Solicitud cancelada');
  return true;
}

function activeEmployeesInDepartment(departmentId) {
  return loadEmployees().filter(
    (employee) =>
      Number(employee.departamento_id) === Number(departmentId) &&
      employee.estado === 'Activo'
  );
}

function approvedOverlapsInDepartment(departmentId, start, end, excludeId) {
  const employeeIds = new Set(
    activeEmployeesInDepartment(departmentId).map((employee) => Number(employee.empleado_id))
  );
  return loadPermissionRequests().filter(
    (request) =>
      Number(request.solicitud_id) !== Number(excludeId) &&
      request.estado === 'Aprobada' &&
      employeeIds.has(Number(request.empleado_id)) &&
      rangesOverlap(start, end, request.fecha_inicio, request.fecha_fin)
  );
}

export function canApprovePermission(request, approverId, role = 'supervisor') {
  const employee = getEmployee(request.empleado_id);
  return (
    role === 'admin' ||
    (employee && Number(employee.supervisor_id) === Number(approverId))
  );
}

export function approvePermissionRequest(
  id,
  approverId,
  comentario = '',
  role = 'supervisor',
  usuario = 'sistema'
) {
  const request = assertExists(
    'solicitudesPermiso',
    'solicitud_id',
    id,
    'Solicitud no encontrada.'
  );
  assert(request.estado === 'Pendiente', 'La solicitud ya fue procesada.');
  assert(
    canApprovePermission(request, approverId, role),
    'Solo la jefatura directa o un administrador puede aprobar esta solicitud.'
  );
  const employee = getEmployee(request.empleado_id);
  const department = getDepartment(employee.departamento_id);
  const type = getPermissionType(request.tipo_permiso_id);
  if (isVacationType(type)) {
    assert(
      request.dias_solicitados <= toNumber(employee.dias_vacaciones_disponibles, 0),
      `Saldo insuficiente: el empleado dispone de ${employee.dias_vacaciones_disponibles} día(s).`
    );
  }
  const overlapping = approvedOverlapsInDepartment(
    employee.departamento_id,
    request.fecha_inicio,
    request.fecha_fin,
    request.solicitud_id
  );
  const activeCount = activeEmployeesInDepartment(employee.departamento_id).length;
  assert(
    overlapping.length < activeCount - 1 ||
      (overlapping.length === 0 && activeCount > 1),
    `No se puede aprobar: el departamento ${department?.nombre_departamento || ''} quedaría sin dotación mínima.`
  );
  const updated = {
    ...request,
    estado: 'Aprobada',
    aprobado_por: approverId || usuario,
    fecha_resolucion: todayISO(),
    comentario_aprobacion: normalize(comentario)
  };
  saveCollection(
    'solicitudesPermiso',
    loadPermissionRequests().map((item) =>
      Number(item.solicitud_id) === Number(id) ? updated : item
    )
  );
  if (isVacationType(type)) {
    adjustVacationBalance(
      employee.empleado_id,
      -toNumber(request.dias_solicitados, 0)
    );
  }
  audit(usuario, 'aprobar', 'solicitud_permiso', id, comentario);
  return updated;
}

export function rejectPermissionRequest(
  id,
  approverId,
  comentario = '',
  role = 'supervisor',
  usuario = 'sistema'
) {
  const request = assertExists(
    'solicitudesPermiso',
    'solicitud_id',
    id,
    'Solicitud no encontrada.'
  );
  assert(request.estado === 'Pendiente', 'La solicitud ya fue procesada.');
  assert(
    canApprovePermission(request, approverId, role),
    'Solo la jefatura directa o un administrador puede rechazar esta solicitud.'
  );
  const motivo = normalize(comentario);
  assert(motivo, 'El comentario es obligatorio para rechazar una solicitud.');
  const updated = {
    ...request,
    estado: 'Rechazada',
    aprobado_por: approverId || usuario,
    fecha_resolucion: todayISO(),
    comentario_aprobacion: motivo
  };
  saveCollection(
    'solicitudesPermiso',
    loadPermissionRequests().map((item) =>
      Number(item.solicitud_id) === Number(id) ? updated : item
    )
  );
  audit(usuario, 'rechazar', 'solicitud_permiso', id, comentario);
  return updated;
}

export function getPermissionRequestsForEmployee(employeeId) {
  return loadPermissionRequests()
    .filter((item) => Number(item.empleado_id) === Number(employeeId))
    .sort((a, b) => b.fecha_solicitud.localeCompare(a.fecha_solicitud));
}

export function getPermissionRequestsForSupervisor(supervisorId) {
  const reportIds = new Set(getDirectReports(supervisorId).map((item) => Number(item.empleado_id)));
  return loadPermissionRequests()
    .filter(
      (item) =>
        reportIds.has(Number(item.empleado_id)) && item.estado === 'Pendiente'
    )
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
}

function timeToMinutes(time) {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  return hours * 60 + minutes;
}

export function computeWorkedHours(entry, exit) {
  const minutes = timeToMinutes(exit) - timeToMinutes(entry);
  return Math.round((minutes / 60) * 100) / 100;
}

export function validateAttendance(data, id = null) {
  const empleadoId = Number(data.empleado_id);
  const empleado = assertExists('empleados', 'empleado_id', empleadoId, 'El empleado no existe.');
  assert(empleado.estado === 'Activo', 'Solo se puede registrar asistencia de empleados activos.');
  const fecha = toISODate(data.fecha_laboral);
  const entrada = normalize(data.hora_entrada);
  const salida = normalize(data.hora_salida);
  assert(isValidDate(fecha), 'La fecha laboral no es válida.');
  assert(fecha <= todayISO(), 'No se puede registrar asistencia para una fecha futura.');
  assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(entrada), 'La hora de entrada no es válida.');
  assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(salida), 'La hora de salida no es válida.');
  const hours = computeWorkedHours(entrada, salida);
  assert(hours > 0, 'La hora de salida debe ser posterior a la de entrada.');
  const duplicate = loadAttendance().some(
    (item) =>
      Number(item.asistencia_id) !== Number(id) &&
      Number(item.empleado_id) === empleadoId &&
      item.fecha_laboral === fecha
  );
  assert(!duplicate, 'Ya existe un registro de asistencia para ese empleado y fecha.');
  const estado = VALIDATION_STATES.includes(data.estado_validacion)
    ? data.estado_validacion
    : 'Pendiente';
  const overtime = Math.max(0, hours - OVERTIME_DAILY_HOURS);
  return {
    empleado_id: empleadoId,
    fecha_laboral: fecha,
    hora_entrada: entrada,
    hora_salida: salida,
    horas_trabajadas: hours,
    horas_extras: Math.round(overtime * 100) / 100,
    estado_validacion: estado,
    validado_por: data.validado_por ? Number(data.validado_por) : null
  };
}

export function createAttendance(data, usuario = 'sistema') {
  const record = { asistencia_id: nextId('registrosAsistencia'), ...validateAttendance(data) };
  saveCollection('registrosAsistencia', [...loadAttendance(), record]);
  audit(usuario, 'crear', 'asistencia', record.asistencia_id, `Empleado ${record.empleado_id}`);
  return record;
}

export function updateAttendance(id, data, usuario = 'sistema') {
  const existing = assertExists(
    'registrosAsistencia',
    'asistencia_id',
    id,
    'Registro de asistencia no encontrado.'
  );
  const merged = { ...existing, ...data };
  const record = {
    ...existing,
    ...validateAttendance(merged, id),
    asistencia_id: existing.asistencia_id,
    estado_validacion:
      existing.estado_validacion === 'Aprobado' ? 'Pendiente' : merged.estado_validacion,
    validado_por: existing.estado_validacion === 'Aprobado' ? null : existing.validado_por
  };
  saveCollection(
    'registrosAsistencia',
    loadAttendance().map((item) =>
      Number(item.asistencia_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'asistencia', id, `Empleado ${record.empleado_id}`);
  return record;
}

export function validateAttendanceRecord(
  id,
  estado,
  validatorId,
  role = 'supervisor',
  usuario = 'sistema'
) {
  const record = assertExists(
    'registrosAsistencia',
    'asistencia_id',
    id,
    'Registro de asistencia no encontrado.'
  );
  assert(['Aprobado', 'Rechazado'].includes(estado), 'El estado de validación no es válido.');
  assert(record.estado_validacion === 'Pendiente', 'El registro ya fue validado.');
  assert(role === 'admin' || role === 'supervisor', 'No tienes permisos para validar asistencia.');
  assert(
    Number(record.empleado_id) !== Number(validatorId),
    'No puedes validar tu propia asistencia.'
  );
  const employee = getEmployee(record.empleado_id);
  assert(
    role === 'admin' || Number(employee?.supervisor_id) === Number(validatorId),
    'Solo puedes validar la asistencia de tu equipo directo.'
  );
  const updated = {
    ...record,
    estado_validacion: estado,
    validado_por: Number(validatorId)
  };
  saveCollection(
    'registrosAsistencia',
    loadAttendance().map((item) =>
      Number(item.asistencia_id) === Number(id) ? updated : item
    )
  );
  audit(usuario, 'validar', 'asistencia', id, estado);
  return updated;
}

export function getPendingValidationsForSupervisor(supervisorId) {
  const reportIds = new Set(getDirectReports(supervisorId).map((item) => Number(item.empleado_id)));
  return loadAttendance()
    .filter(
      (record) =>
        reportIds.has(Number(record.empleado_id)) &&
        record.estado_validacion === 'Pendiente'
    )
    .sort((a, b) => b.fecha_laboral.localeCompare(a.fecha_laboral));
}

export function getApprovedOvertime(employeeId, start, end) {
  return loadAttendance()
    .filter(
      (record) =>
        Number(record.empleado_id) === Number(employeeId) &&
        record.estado_validacion === 'Aprobado' &&
        record.fecha_laboral >= toISODate(start) &&
        record.fecha_laboral <= toISODate(end)
    )
    .reduce((total, record) => total + toNumber(record.horas_extras), 0);
}

export function getAttendanceSummary(employeeId, start, end) {
  const records = loadAttendance().filter(
    (record) =>
      Number(record.empleado_id) === Number(employeeId) &&
      record.fecha_laboral >= toISODate(start) &&
      record.fecha_laboral <= toISODate(end)
  );
  return {
    dias: records.length,
    horas_trabajadas: records.reduce(
      (total, record) => total + toNumber(record.horas_trabajadas),
      0
    ),
    horas_extras: records
      .filter((record) => record.estado_validacion === 'Aprobado')
      .reduce((total, record) => total + toNumber(record.horas_extras), 0),
    pendientes: records.filter((record) => record.estado_validacion === 'Pendiente').length
  };
}

export function validatePayrollPeriod(data, id = null) {
  const inicio = toISODate(data.fecha_inicio);
  const fin = toISODate(data.fecha_fin);
  assert(isValidDate(inicio), 'La fecha de inicio del período no es válida.');
  assert(isValidDate(fin), 'La fecha de fin del período no es válida.');
  assert(fin >= inicio, 'La fecha de fin debe ser posterior al inicio.');
  const overlap = loadPayrollPeriods().some(
    (period) =>
      Number(period.periodo_id) !== Number(id) &&
      rangesOverlap(inicio, fin, period.fecha_inicio, period.fecha_fin)
  );
  assert(!overlap, 'El período se superpone con otro período de nómina.');
  const estado = PAYROLL_STATES.includes(data.estado) ? data.estado : 'Borrador';
  return {
    fecha_inicio: inicio,
    fecha_fin: fin,
    estado,
    fecha_generacion: toISODate(data.fecha_generacion) || todayISO()
  };
}

export function createPayrollPeriod(data, usuario = 'sistema') {
  const record = { periodo_id: nextId('periodosNomina'), ...validatePayrollPeriod(data) };
  saveCollection('periodosNomina', [...loadPayrollPeriods(), record]);
  audit(usuario, 'crear', 'periodo_nomina', record.periodo_id, `${record.fecha_inicio} / ${record.fecha_fin}`);
  return record;
}

export function updatePayrollPeriod(id, data, usuario = 'sistema') {
  const existing = assertExists('periodosNomina', 'periodo_id', id, 'Período no encontrado.');
  assert(existing.estado === 'Borrador', 'Solo se pueden editar períodos en borrador.');
  const record = {
    ...existing,
    ...validatePayrollPeriod({ ...existing, ...data }, id),
    periodo_id: existing.periodo_id
  };
  saveCollection(
    'periodosNomina',
    loadPayrollPeriods().map((item) =>
      Number(item.periodo_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'periodo_nomina', id, `${record.fecha_inicio} / ${record.fecha_fin}`);
  return record;
}

export function deletePayrollPeriod(id, usuario = 'sistema') {
  const existing = assertExists('periodosNomina', 'periodo_id', id, 'Período no encontrado.');
  assert(existing.estado === 'Borrador', 'Solo se pueden eliminar períodos en borrador.');
  const liquidations = loadLiquidations().filter(
    (item) => Number(item.periodo_id) === Number(id)
  );
  assert(
    liquidations.length === 0,
    'No se puede eliminar: el período tiene liquidaciones asociadas.'
  );
  saveCollection(
    'periodosNomina',
    loadPayrollPeriods().filter((item) => Number(item.periodo_id) !== Number(id))
  );
  audit(usuario, 'eliminar', 'periodo_nomina', id, 'Período eliminado');
  return true;
}

export function setPayrollPeriodState(id, estado, usuario = 'sistema', role = 'admin') {
  const existing = assertExists('periodosNomina', 'periodo_id', id, 'Período no encontrado.');
  assert(PAYROLL_STATES.includes(estado), 'El estado del período no es válido.');
  const order = PAYROLL_STATES.indexOf(existing.estado);
  const nextOrder = PAYROLL_STATES.indexOf(estado);
  const reopening = existing.estado === 'Cerrado' && estado === 'Aprobado';
  assert(
    nextOrder >= order || reopening,
    'Solo se puede reabrir un período cerrado al estado Aprobado.'
  );
  assert(
    !reopening || role === 'admin',
    'Solo un administrador puede reabrir un período cerrado.'
  );
  const record = { ...existing, estado };
  saveCollection(
    'periodosNomina',
    loadPayrollPeriods().map((item) =>
      Number(item.periodo_id) === Number(id) ? record : item
    )
  );
  audit(usuario, reopening ? 'reabrir' : 'cambiar_estado', 'periodo_nomina', id, estado);
  return record;
}

export function validateConcept(data, id = null) {
  const nombre = normalize(data.nombre_concepto || data.nombre);
  const tipoRaw = normalizeKey(data.tipo_concepto || data.tipo);
  const tipo = tipoRaw.startsWith('h') ? 'Haber' : tipoRaw.startsWith('d') ? 'Deducción' : '';
  const porcentaje = data.porcentaje === null || data.porcentaje === '' || data.porcentaje === undefined
    ? null
    : toNumber(data.porcentaje);
  const montoFijo = data.monto_fijo === null || data.monto_fijo === '' || data.monto_fijo === undefined
    ? null
    : toNumber(data.monto_fijo);
  assert(nombre, 'El nombre del concepto es obligatorio.');
  assert(tipo, 'El tipo de concepto debe ser Haber o Deducción.');
  if (porcentaje !== null) {
    assert(porcentaje >= 0 && porcentaje <= 100, 'El porcentaje debe estar entre 0 y 100.');
  }
  if (montoFijo !== null) {
    assert(montoFijo >= 0, 'El monto fijo no puede ser negativo.');
  }
  assert(
    porcentaje === null || montoFijo === null,
    'Un concepto no puede tener porcentaje y monto fijo a la vez.'
  );
  const duplicate = loadConcepts().some(
    (item) =>
      Number(item.concepto_id) !== Number(id) &&
      normalizeKey(item.nombre_concepto) === normalizeKey(nombre)
  );
  assert(!duplicate, 'Ya existe un concepto con ese nombre.');
  return {
    nombre_concepto: nombre,
    tipo_concepto: tipo,
    porcentaje,
    monto_fijo: montoFijo
  };
}

export function createConcept(data, usuario = 'sistema') {
  const record = { concepto_id: nextId('conceptosNomina'), ...validateConcept(data) };
  saveCollection('conceptosNomina', [...loadConcepts(), record]);
  audit(usuario, 'crear', 'concepto_nomina', record.concepto_id, record.nombre_concepto);
  return record;
}

export function updateConcept(id, data, usuario = 'sistema') {
  const existing = assertExists('conceptosNomina', 'concepto_id', id, 'Concepto no encontrado.');
  const record = {
    ...existing,
    ...validateConcept({ ...existing, ...data }, id),
    concepto_id: existing.concepto_id
  };
  saveCollection(
    'conceptosNomina',
    loadConcepts().map((item) =>
      Number(item.concepto_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'concepto_nomina', id, record.nombre_concepto);
  return record;
}

export function deleteConcept(id, usuario = 'sistema') {
  assertExists('conceptosNomina', 'concepto_id', id, 'Concepto no encontrado.');
  const details = loadLiquidationDetails().filter(
    (item) => Number(item.concepto_id) === Number(id)
  );
  assert(
    details.length === 0,
    'No se puede eliminar: el concepto está usado en liquidaciones.'
  );
  saveCollection(
    'conceptosNomina',
    loadConcepts().filter((item) => Number(item.concepto_id) !== Number(id))
  );
  audit(usuario, 'eliminar', 'concepto_nomina', id, 'Concepto eliminado');
  return true;
}

export function saveLiquidationWithDetails(liquidation, details, usuario = 'sistema') {
  const period = assertExists(
    'periodosNomina',
    'periodo_id',
    liquidation.periodo_id,
    'El período de nómina no existe.'
  );
  assert(period.estado !== 'Cerrado', 'El período está cerrado y no admite cambios.');
  const employee = assertExists(
    'empleados',
    'empleado_id',
    liquidation.empleado_id,
    'El empleado no existe.'
  );
  assert(Array.isArray(details) && details.length > 0, 'La liquidación debe tener detalles.');
  const totalHaberes = details
    .filter((detail) => getConcept(detail.concepto_id)?.tipo_concepto === 'Haber')
    .reduce((total, detail) => total + toNumber(detail.monto), 0);
  const totalDeducciones = details
    .filter((detail) => getConcept(detail.concepto_id)?.tipo_concepto === 'Deducción')
    .reduce((total, detail) => total + toNumber(detail.monto), 0);
  const neto = totalHaberes - totalDeducciones;
  assert(
    Math.abs(toNumber(liquidation.total_haberes) - totalHaberes) < 0.01,
    'El total de haberes no coincide con el detalle.'
  );
  assert(
    Math.abs(toNumber(liquidation.total_deducciones) - totalDeducciones) < 0.01,
    'El total de deducciones no coincide con el detalle.'
  );
  assert(
    Math.abs(toNumber(liquidation.salario_neto) - neto) < 0.01,
    'El salario neto no coincide con haberes menos deducciones.'
  );
  const liquidations = loadLiquidations();
  const existing = liquidations.find(
    (item) =>
      Number(item.periodo_id) === Number(liquidation.periodo_id) &&
      Number(item.empleado_id) === Number(liquidation.empleado_id)
  );
  const liquidationId = existing?.liquidacion_id || nextId('liquidaciones');
  const record = {
    ...liquidation,
    liquidacion_id: liquidationId,
    salario_base: toNumber(liquidation.salario_base),
    total_haberes: totalHaberes,
    total_deducciones: totalDeducciones,
    salario_neto: neto,
    fecha_generacion: toISODate(liquidation.fecha_generacion) || todayISO(),
    estado: liquidation.estado || period.estado
  };
  let allDetails = loadLiquidationDetails().filter(
    (detail) => Number(detail.liquidacion_id) !== Number(liquidationId)
  );
  let nextDetailId = allDetails.reduce(
    (max, detail) => Math.max(max, Number(detail.detalle_id) || 0),
    0
  ) + 1;
  details.forEach((detail) => {
    allDetails = [
      ...allDetails,
      {
        detalle_id: nextDetailId,
        liquidacion_id: liquidationId,
        concepto_id: Number(detail.concepto_id),
        monto: toNumber(detail.monto)
      }
    ];
    nextDetailId += 1;
  });
  saveCollection(
    'liquidaciones',
    existing
      ? liquidations.map((item) =>
          Number(item.liquidacion_id) === Number(liquidationId) ? record : item
        )
      : [...liquidations, record]
  );
  saveCollection('detallesLiquidacion', allDetails);
  audit(
    usuario,
    existing ? 'actualizar' : 'crear',
    'liquidacion',
    liquidationId,
    `Empleado ${employee.empleado_id}`
  );
  return record;
}

export function getLiquidationsForPeriod(periodId) {
  return loadLiquidations().filter(
    (item) => Number(item.periodo_id) === Number(periodId)
  );
}

export function getLiquidationDetails(liquidationId) {
  return loadLiquidationDetails().filter(
    (item) => Number(item.liquidacion_id) === Number(liquidationId)
  );
}

export function getLiquidationsForEmployee(employeeId) {
  return loadLiquidations()
    .filter((item) => Number(item.empleado_id) === Number(employeeId))
    .sort((a, b) => b.fecha_generacion.localeCompare(a.fecha_generacion));
}

export function getPayrollCostByDepartment(periodId) {
  const departments = loadDepartments();
  const liquidations = getLiquidationsForPeriod(periodId);
  return departments.map((department) => {
    const employeeIds = new Set(
      loadEmployees()
        .filter((employee) => Number(employee.departamento_id) === Number(department.departamento_id))
        .map((employee) => Number(employee.empleado_id))
    );
    const departmentLiquidations = liquidations.filter((liquidation) =>
      employeeIds.has(Number(liquidation.empleado_id))
    );
    return {
      departamento_id: department.departamento_id,
      nombre_departamento: department.nombre_departamento,
      empleados: departmentLiquidations.length,
      total_haberes: departmentLiquidations.reduce(
        (total, item) => total + toNumber(item.total_haberes),
        0
      ),
      total_deducciones: departmentLiquidations.reduce(
        (total, item) => total + toNumber(item.total_deducciones),
        0
      ),
      total_neto: departmentLiquidations.reduce(
        (total, item) => total + toNumber(item.salario_neto),
        0
      )
    };
  });
}

export function getEmployeeBenefitEnrollments(employeeId) {
  return loadBenefitEnrollments().filter(
    (item) => Number(item.empleado_id) === Number(employeeId)
  );
}

export function getActiveBenefitEnrollments(employeeId) {
  return getEmployeeBenefitEnrollments(employeeId).filter(
    (item) => item.estado === 'Activo'
  );
}

export function validateEvaluation(data, id = null) {
  const empleadoId = Number(data.empleado_id);
  const evaluadorId = Number(data.evaluador_id);
  const empleado = assertExists('empleados', 'empleado_id', empleadoId, 'El empleado no existe.');
  assertExists('empleados', 'empleado_id', evaluadorId, 'El evaluador no existe.');
  assert(
    Number(empleado.supervisor_id) === evaluadorId,
    'Solo la jefatura directa puede evaluar al empleado.'
  );
  const fecha = toISODate(data.fecha_evaluacion);
  assert(isValidDate(fecha), 'La fecha de evaluación no es válida.');
  assert(fecha <= todayISO(), 'La fecha de evaluación no puede ser futura.');
  const rawCalificacion = Number(data.calificacion);
  assert(
    Number.isFinite(rawCalificacion) && rawCalificacion >= 1 && rawCalificacion <= 5,
    'La calificación debe ser un número entre 1.00 y 5.00.'
  );
  const calificacion = Math.round(rawCalificacion * 100) / 100;
  const comentarios = normalize(data.comentarios);
  const objetivos = normalize(data.objetivos);
  assert(comentarios, 'Los comentarios de la evaluación son obligatorios.');
  assert(objetivos, 'Los objetivos de la evaluación son obligatorios.');
  const duplicate = loadEvaluations().some(
    (item) =>
      Number(item.evaluacion_id) !== Number(id) &&
      Number(item.empleado_id) === empleadoId &&
      item.fecha_evaluacion === fecha
  );
  assert(!duplicate, 'Ya existe una evaluación para ese empleado en esa fecha.');
  return {
    empleado_id: empleadoId,
    evaluador_id: evaluadorId,
    fecha_evaluacion: fecha,
    calificacion,
    comentarios,
    objetivos
  };
}

export function createEvaluation(data, usuario = 'sistema') {
  const record = { evaluacion_id: nextId('evaluaciones'), ...validateEvaluation(data) };
  saveCollection('evaluaciones', [...loadEvaluations(), record]);
  audit(usuario, 'crear', 'evaluacion', record.evaluacion_id, `Empleado ${record.empleado_id}`);
  return record;
}

export function updateEvaluation(id, data, usuario = 'sistema') {
  const existing = assertExists('evaluaciones', 'evaluacion_id', id, 'Evaluación no encontrada.');
  const record = {
    ...existing,
    ...validateEvaluation({ ...existing, ...data }, id),
    evaluacion_id: existing.evaluacion_id
  };
  saveCollection(
    'evaluaciones',
    loadEvaluations().map((item) =>
      Number(item.evaluacion_id) === Number(id) ? record : item
    )
  );
  audit(usuario, 'actualizar', 'evaluacion', id, `Empleado ${record.empleado_id}`);
  return record;
}

export function deleteEvaluation(id, usuario = 'sistema') {
  assertExists('evaluaciones', 'evaluacion_id', id, 'Evaluación no encontrada.');
  saveCollection(
    'evaluaciones',
    loadEvaluations().filter((item) => Number(item.evaluacion_id) !== Number(id))
  );
  audit(usuario, 'eliminar', 'evaluacion', id, 'Evaluación eliminada');
  return true;
}

export function getEvaluationsForEmployee(employeeId) {
  return loadEvaluations()
    .filter((item) => Number(item.empleado_id) === Number(employeeId))
    .sort((a, b) => b.fecha_evaluacion.localeCompare(a.fecha_evaluacion));
}

export function getEvaluationsForSupervisor(supervisorId) {
  return loadEvaluations()
    .filter((item) => Number(item.evaluador_id) === Number(supervisorId))
    .sort((a, b) => b.fecha_evaluacion.localeCompare(a.fecha_evaluacion));
}

export function getDashboardMetrics() {
  const employees = loadEmployees();
  const activeEmployees = employees.filter((employee) => employee.estado === 'Activo');
  const today = todayISO();
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEnd = `${today.slice(0, 7)}-${String(
    new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate()
  ).padStart(2, '0')}`;
  const monthDays = daysBetweenInclusive(monthStart, monthEnd);
  const absenceDays = loadPermissionRequests()
    .filter((request) => request.estado === 'Aprobada')
    .reduce((total, request) => {
      const start = request.fecha_inicio > monthStart ? request.fecha_inicio : monthStart;
      const end = request.fecha_fin < monthEnd ? request.fecha_fin : monthEnd;
      return end < start ? total : total + daysBetweenInclusive(start, end);
    }, 0);
  const absenceRate =
    activeEmployees.length && monthDays
      ? Math.round((absenceDays / (activeEmployees.length * monthDays)) * 1000) / 10
      : 0;
  const periods = loadPayrollPeriods().sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
  const latestCalculated = periods.find((period) => period.estado !== 'Borrador') || periods[0];
  const liquidations = latestCalculated
    ? getLiquidationsForPeriod(latestCalculated.periodo_id)
    : [];
  const evaluations = loadEvaluations();
  const averageRating = evaluations.length
    ? evaluations.reduce((total, item) => total + toNumber(item.calificacion), 0) /
      evaluations.length
    : 0;
  return {
    activeEmployees: activeEmployees.length,
    totalEmployees: employees.length,
    departments: loadDepartments().length,
    positions: loadPositions().length,
    pendingPermissions: loadPermissionRequests().filter(
      (request) => request.estado === 'Pendiente'
    ).length,
    pendingValidations: loadAttendance().filter(
      (record) => record.estado_validacion === 'Pendiente'
    ).length,
    absenceDays,
    absenceRate,
    activeBenefits: loadBenefitEnrollments().filter(
      (enrollment) => enrollment.estado === 'Activo'
    ).length,
    latestPeriod: latestCalculated || null,
    latestPayrollCost: liquidations.reduce(
      (total, item) => total + toNumber(item.total_neto),
      0
    ),
    averageRating: Math.round(averageRating * 10) / 10
  };
}
