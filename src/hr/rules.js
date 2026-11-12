import {
  daysBetweenInclusive,
  isDateWithin,
  isValidEmail,
  isValidISODate,
  rangesOverlap,
  todayISO
} from './utils.js';
import { findById, loadCollection } from './storage.js';

export const VACATION_ALLOWANCE = 15;
export const MIN_STAFF_RATIO = 0.6;
export const VALID_CURRENCIES = ['CLP', 'USD', 'UF'];
export const CONTRACT_TYPES = ['Indefinido', 'Plazo fijo', 'Honorarios'];
export const EMPLOYEE_STATES = ['Activo', 'Con licencia', 'Desvinculado'];
export const REQUEST_STATES = ['Pendiente', 'Aprobada', 'Rechazada'];

function result(errors) {
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateDepartment(data, options = {}) {
  const departments = options.departments || loadCollection('departamentos');
  const editingId = options.editingId ?? null;
  const errors = {};
  const name = String(data.nombre_departamento || '').trim();
  const code = String(data.codigo_departamento || '').trim().toUpperCase();

  if (!name) errors.nombre_departamento = 'El nombre del departamento es obligatorio.';
  if (!code) errors.codigo_departamento = 'El codigo del departamento es obligatorio.';

  const duplicateCode = departments.some(
    (department) =>
      String(department.departamento_id) !== String(editingId) &&
      String(department.codigo_departamento || '').toUpperCase() === code
  );
  if (code && duplicateCode) errors.codigo_departamento = 'Ya existe un departamento con ese codigo.';

  const duplicateName = departments.some(
    (department) =>
      String(department.departamento_id) !== String(editingId) &&
      String(department.nombre_departamento || '').trim().toLowerCase() === name.toLowerCase()
  );
  if (name && duplicateName) errors.nombre_departamento = 'Ya existe un departamento con ese nombre.';

  return result(errors);
}

export function activeEmployeesOfDepartment(departmentId, employees = loadCollection('empleados')) {
  return employees.filter(
    (employee) =>
      String(employee.departamento_id) === String(departmentId) && employee.estado_laboral === 'Activo'
  );
}

export function canDeleteDepartment(departmentId, options = {}) {
  const employees = options.employees || loadCollection('empleados');
  const active = activeEmployeesOfDepartment(departmentId, employees);
  if (active.length > 0) {
    return {
      allowed: false,
      reason: `El departamento tiene ${active.length} empleado(s) activo(s). Reasignalos antes de eliminarlo.`,
      active
    };
  }
  return { allowed: true, reason: '', active };
}

export function validatePosition(data, options = {}) {
  const positions = options.positions || loadCollection('cargos');
  const editingId = options.editingId ?? null;
  const errors = {};
  const name = String(data.nombre_cargo || '').trim();
  const grade = String(data.nivel_grado || '').trim();

  if (!name) errors.nombre_cargo = 'El nombre del cargo es obligatorio.';
  if (!grade) errors.nivel_grado = 'El nivel de grado es obligatorio.';

  const duplicate = positions.some(
    (position) =>
      String(position.cargo_id) !== String(editingId) &&
      String(position.nombre_cargo || '').trim().toLowerCase() === name.toLowerCase()
  );
  if (name && duplicate) errors.nombre_cargo = 'Ya existe un cargo con ese nombre.';

  return result(errors);
}

export function isContractActiveOn(contract, date) {
  if (!contract || !contract.fecha_inicio) return false;
  const reference = date || todayISO();
  return isDateWithin(reference, contract.fecha_inicio, contract.fecha_fin || null);
}

export function activeContractFor(employeeId, date, contracts = loadCollection('contratos')) {
  return (
    contracts.find(
      (contract) =>
        String(contract.empleado_id) === String(employeeId) && isContractActiveOn(contract, date)
    ) || null
  );
}

export function positionHasActiveContracts(positionId, options = {}) {
  const employees = options.employees || loadCollection('empleados');
  const contracts = options.contracts || loadCollection('contratos');
  const employeeIds = employees
    .filter((employee) => String(employee.cargo_id) === String(positionId))
    .map((employee) => String(employee.empleado_id));
  return contracts.some(
    (contract) => employeeIds.includes(String(contract.empleado_id)) && isContractActiveOn(contract)
  );
}

export function directSubordinates(supervisorId, employees = loadCollection('empleados')) {
  return employees.filter((employee) => String(employee.supervisor_id) === String(supervisorId));
}

export function createsSupervisionCycle(employeeId, supervisorId, employees) {
  if (!supervisorId) return false;
  let current = employees.find((employee) => String(employee.empleado_id) === String(supervisorId));
  const visited = new Set();
  while (current) {
    if (String(current.empleado_id) === String(employeeId)) return true;
    if (visited.has(String(current.empleado_id))) return true;
    visited.add(String(current.empleado_id));
    current = employees.find(
      (employee) => String(employee.empleado_id) === String(current.supervisor_id)
    );
  }
  return false;
}

export function validateEmployee(data, options = {}) {
  const employees = options.employees || loadCollection('empleados');
  const departments = options.departments || loadCollection('departamentos');
  const positions = options.positions || loadCollection('cargos');
  const editingId = options.editingId ?? null;
  const errors = {};

  if (!String(data.nombres || '').trim()) errors.nombres = 'Los nombres son obligatorios.';
  if (!String(data.apellidos || '').trim()) errors.apellidos = 'Los apellidos son obligatorios.';
  const rut = String(data.rut || '').trim();
  if (!rut) {
    errors.rut = 'El RUT es obligatorio.';
  } else {
    const duplicate = employees.some(
      (employee) =>
        String(employee.empleado_id) !== String(editingId) &&
        String(employee.rut || '').trim().toLowerCase() === rut.toLowerCase()
    );
    if (duplicate) errors.rut = 'Ya existe un empleado con ese RUT.';
  }
  if (!isValidEmail(data.correo_electronico)) {
    errors.correo_electronico = 'El correo electronico no es valido.';
  } else {
    const duplicate = employees.some(
      (employee) =>
        String(employee.empleado_id) !== String(editingId) &&
        String(employee.correo_electronico || '').toLowerCase() ===
          String(data.correo_electronico).toLowerCase()
    );
    if (duplicate) errors.correo_electronico = 'Ya existe un empleado con ese correo.';
  }
  if (!isValidISODate(data.fecha_contratacion)) {
    errors.fecha_contratacion = 'La fecha de contratacion no es valida.';
  }
  if (!EMPLOYEE_STATES.includes(data.estado_laboral)) {
    errors.estado_laboral = 'El estado laboral no es valido.';
  }
  if (!departments.some((department) => String(department.departamento_id) === String(data.departamento_id))) {
    errors.departamento_id = 'Debe seleccionar un departamento valido.';
  }
  if (!positions.some((position) => String(position.cargo_id) === String(data.cargo_id))) {
    errors.cargo_id = 'Debe seleccionar un cargo valido.';
  }
  if (data.supervisor_id) {
    if (String(data.supervisor_id) === String(editingId)) {
      errors.supervisor_id = 'Un empleado no puede ser su propio supervisor.';
    } else if (!employees.some((employee) => String(employee.empleado_id) === String(data.supervisor_id))) {
      errors.supervisor_id = 'El supervisor seleccionado no existe.';
    } else if (createsSupervisionCycle(editingId, data.supervisor_id, employees)) {
      errors.supervisor_id = 'La asignacion genera un ciclo de supervision.';
    }
  }

  return result(errors);
}

export function validateContract(data, options = {}) {
  const contracts = options.contracts || loadCollection('contratos');
  const employees = options.employees || loadCollection('empleados');
  const editingId = options.editingId ?? null;
  const errors = {};

  const employee = employees.find((item) => String(item.empleado_id) === String(data.empleado_id));
  if (!employee) errors.empleado_id = 'Debe seleccionar un empleado valido.';
  if (!CONTRACT_TYPES.includes(data.tipo_contrato)) {
    errors.tipo_contrato = 'El tipo de contrato no es valido.';
  }
  if (!isValidISODate(data.fecha_inicio)) {
    errors.fecha_inicio = 'La fecha de inicio no es valida.';
  }
  if (data.fecha_fin && !isValidISODate(data.fecha_fin)) {
    errors.fecha_fin = 'La fecha de termino no es valida.';
  }
  if (data.fecha_fin && data.fecha_inicio && data.fecha_fin < data.fecha_inicio) {
    errors.fecha_fin = 'La fecha de termino debe ser igual o posterior a la fecha de inicio.';
  }
  if (!Number.isFinite(Number(data.salario_base)) || Number(data.salario_base) <= 0) {
    errors.salario_base = 'El salario base debe ser mayor que cero.';
  }
  if (!VALID_CURRENCIES.includes(data.codigo_moneda)) {
    errors.codigo_moneda = 'La moneda no es valida.';
  }

  if (data.empleado_id && data.fecha_inicio) {
    const overlapping = contracts.find(
      (contract) =>
        String(contract.contrato_id) !== String(editingId) &&
        String(contract.empleado_id) === String(data.empleado_id) &&
        rangesOverlap(
          data.fecha_inicio,
          data.fecha_fin || null,
          contract.fecha_inicio,
          contract.fecha_fin || null
        )
    );
    if (overlapping) {
      errors.empleado_id = 'El empleado ya tiene un contrato vigente superpuesto.';
    }
  }

  return result(errors);
}

function approvedDaysForEmployee(employeeId, requests, typeIds, year) {
  return requests
    .filter(
      (request) =>
        String(request.empleado_id) === String(employeeId) &&
        request.estado === 'Aprobada' &&
        typeIds.includes(String(request.tipo_permiso_id))
    )
    .reduce((total, request) => {
      if (!request.fecha_inicio || !request.fecha_fin) return total;
      if (request.fecha_inicio.slice(0, 4) !== String(year)) return total;
      return total + daysBetweenInclusive(request.fecha_inicio, request.fecha_fin);
    }, 0);
}

export function vacationBalance(employeeId, year, options = {}) {
  const requests = options.requests || loadCollection('solicitudesPermiso');
  const types = options.types || loadCollection('tiposPermiso');
  const vacationTypeIds = types
    .filter((type) => type.nombre_tipo_permiso === 'Vacaciones')
    .map((type) => String(type.tipo_permiso_id));
  const used = approvedDaysForEmployee(employeeId, requests, vacationTypeIds, year);
  return Math.max(0, VACATION_ALLOWANCE - used);
}

export function validatePermissionRequest(data, options = {}) {
  const requests = options.requests || loadCollection('solicitudesPermiso');
  const employees = options.employees || loadCollection('empleados');
  const types = options.types || loadCollection('tiposPermiso');
  const errors = {};

  const employee = employees.find((item) => String(item.empleado_id) === String(data.empleado_id));
  if (!employee) errors.empleado_id = 'El empleado solicitante no existe.';
  const type = types.find((item) => String(item.tipo_permiso_id) === String(data.tipo_permiso_id));
  if (!type) errors.tipo_permiso_id = 'Debe seleccionar un tipo de permiso valido.';
  if (!isValidISODate(data.fecha_inicio)) errors.fecha_inicio = 'La fecha de inicio no es valida.';
  if (!isValidISODate(data.fecha_fin)) errors.fecha_fin = 'La fecha de termino no es valida.';
  if (data.fecha_inicio && data.fecha_fin && data.fecha_fin < data.fecha_inicio) {
    errors.fecha_fin = 'La fecha de termino debe ser igual o posterior a la fecha de inicio.';
  }

  if (data.empleado_id && data.fecha_inicio && data.fecha_fin) {
    const overlapping = requests.find(
      (request) =>
        String(request.empleado_id) === String(data.empleado_id) &&
        ['Pendiente', 'Aprobada'].includes(request.estado) &&
        rangesOverlap(data.fecha_inicio, data.fecha_fin, request.fecha_inicio, request.fecha_fin)
    );
    if (overlapping) {
      errors.fecha_inicio = 'El empleado ya tiene una solicitud pendiente o aprobada en ese periodo.';
    }

    if (type && type.nombre_tipo_permiso === 'Vacaciones') {
      const year = Number(data.fecha_inicio.slice(0, 4));
      const balance = vacationBalance(data.empleado_id, year, { requests, types });
      const requestedDays = daysBetweenInclusive(data.fecha_inicio, data.fecha_fin);
      if (requestedDays > balance) {
        errors.fecha_fin = `Saldo insuficiente: dispone de ${balance} dia(s) de vacaciones.`;
      }
    }
  }

  return result(errors);
}

export function staffingConflict(request, options = {}) {
  const employees = options.employees || loadCollection('empleados');
  const requests = options.requests || loadCollection('solicitudesPermiso');
  const employee = employees.find(
    (item) => String(item.empleado_id) === String(request.empleado_id)
  );
  if (!employee) return { conflict: true, reason: 'El empleado no existe.' };

  const departmentEmployees = employees.filter(
    (item) =>
      String(item.departamento_id) === String(employee.departamento_id) &&
      item.estado_laboral === 'Activo' &&
      String(item.empleado_id) !== String(request.empleado_id)
  );
  const onLeave = departmentEmployees.filter((peer) =>
    requests.some(
      (other) =>
        String(other.empleado_id) === String(peer.empleado_id) &&
        other.estado === 'Aprobada' &&
        String(other.solicitud_permiso_id) !== String(request.solicitud_permiso_id) &&
        rangesOverlap(request.fecha_inicio, request.fecha_fin, other.fecha_inicio, other.fecha_fin)
    )
  ).length;

  const activeTotal = departmentEmployees.length + 1;
  const remaining = Math.max(0, activeTotal - onLeave - 1);
  const required = Math.ceil(activeTotal * MIN_STAFF_RATIO);
  if (remaining < required) {
    return {
      conflict: true,
      reason: `La aprobacion dejaria ${remaining} colaborador(es) activo(s) en el area; se requieren al menos ${required}.`
    };
  }
  if (employee.estado_laboral !== 'Activo') {
    return { conflict: true, reason: 'Solo se pueden aprobar permisos de colaboradores activos.' };
  }
  return { conflict: false, reason: '' };
}

export function validateAttendance(data, options = {}) {
  const records = options.records || loadCollection('asistencia');
  const employees = options.employees || loadCollection('empleados');
  const editingId = options.editingId ?? null;
  const errors = {};

  const employee = employees.find((item) => String(item.empleado_id) === String(data.empleado_id));
  if (!employee) {
    errors.empleado_id = 'Debe seleccionar un empleado valido.';
  } else if (employee.estado_laboral === 'Desvinculado') {
    errors.empleado_id = 'No se puede registrar asistencia para un empleado desvinculado.';
  }
  if (!isValidISODate(data.fecha_laboral)) {
    errors.fecha_laboral = 'La fecha laboral no es valida.';
  } else if (data.fecha_laboral > todayISO()) {
    errors.fecha_laboral = 'No se puede registrar asistencia de una fecha futura.';
  }
  if (!data.hora_entrada) errors.hora_entrada = 'La hora de entrada es obligatoria.';
  if (!data.hora_salida) errors.hora_salida = 'La hora de salida es obligatoria.';
  if (data.hora_entrada && data.hora_salida && data.hora_salida <= data.hora_entrada) {
    errors.hora_salida = 'La hora de salida debe ser posterior a la hora de entrada.';
  }

  if (data.empleado_id && data.fecha_laboral) {
    const duplicate = records.find(
      (record) =>
        String(record.asistencia_id) !== String(editingId) &&
        String(record.empleado_id) === String(data.empleado_id) &&
        record.fecha_laboral === data.fecha_laboral
    );
    if (duplicate) {
      errors.fecha_laboral = 'La jornada de ese colaborador ya esta registrada para esa fecha.';
    }
  }

  return result(errors);
}

export function validateBenefit(data, options = {}) {
  const benefits = options.benefits || loadCollection('beneficios');
  const editingId = options.editingId ?? null;
  const errors = {};
  if (!String(data.nombre_beneficio || '').trim()) {
    errors.nombre_beneficio = 'El nombre del beneficio es obligatorio.';
  }
  if (!String(data.proveedor || '').trim()) errors.proveedor = 'El proveedor es obligatorio.';
  if (!Number.isFinite(Number(data.costo)) || Number(data.costo) < 0) {
    errors.costo = 'El costo debe ser un numero mayor o igual a cero.';
  }
  const duplicate = benefits.some(
    (benefit) =>
      String(benefit.beneficio_id) !== String(editingId) &&
      String(benefit.nombre_beneficio || '').trim().toLowerCase() ===
        String(data.nombre_beneficio || '').trim().toLowerCase()
  );
  if (duplicate) errors.nombre_beneficio = 'Ya existe un beneficio con ese nombre.';
  return result(errors);
}

export function validateEnrollment(data, options = {}) {
  const enrollments = options.enrollments || loadCollection('beneficiosEmpleado');
  const employees = options.employees || loadCollection('empleados');
  const benefits = options.benefits || loadCollection('beneficios');
  const errors = {};
  if (!employees.some((employee) => String(employee.empleado_id) === String(data.empleado_id))) {
    errors.empleado_id = 'Debe seleccionar un colaborador valido.';
  }
  if (!benefits.some((benefit) => String(benefit.beneficio_id) === String(data.beneficio_id))) {
    errors.beneficio_id = 'Debe seleccionar un beneficio valido.';
  }
  if (!isValidISODate(data.fecha_inscripcion)) {
    errors.fecha_inscripcion = 'La fecha de inscripcion no es valida.';
  }
  const duplicate = enrollments.some(
    (enrollment) =>
      String(enrollment.empleado_id) === String(data.empleado_id) &&
      String(enrollment.beneficio_id) === String(data.beneficio_id) &&
      enrollment.estado !== 'finalizada'
  );
  if (duplicate) errors.beneficio_id = 'El colaborador ya tiene una inscripcion activa en ese beneficio.';
  return result(errors);
}

export function benefitHasActiveEnrollments(benefitId, enrollments = loadCollection('beneficiosEmpleado')) {
  return enrollments.some(
    (enrollment) =>
      String(enrollment.beneficio_id) === String(benefitId) && enrollment.estado !== 'finalizada'
  );
}

export function validateEvaluation(data, options = {}) {
  const employees = options.employees || loadCollection('empleados');
  const evaluatorId = options.evaluatorId;
  const errors = {};
  const employee = employees.find((item) => String(item.empleado_id) === String(data.empleado_id));
  if (!employee) {
    errors.empleado_id = 'Debe seleccionar un colaborador valido.';
  } else if (String(employee.supervisor_id) !== String(evaluatorId)) {
    errors.empleado_id = 'Solo puede evaluar a sus subordinados directos.';
  }
  if (!isValidISODate(data.fecha_evaluacion)) {
    errors.fecha_evaluacion = 'La fecha de evaluacion no es valida.';
  }
  const grade = Number(data.calificacion);
  if (!Number.isFinite(grade) || grade < 1 || grade > 5) {
    errors.calificacion = 'La calificacion debe estar entre 1.00 y 5.00.';
  }
  return result(errors);
}

export function validateBankRequest(data, options = {}) {
  const requests = options.requests || loadCollection('solicitudesBanco');
  const errors = {};
  if (!String(data.banco || '').trim()) errors.banco = 'El banco es obligatorio.';
  if (!String(data.numero_cuenta || '').trim()) errors.numero_cuenta = 'La cuenta bancaria es obligatoria.';
  const pending = requests.some(
    (request) =>
      String(request.empleado_id) === String(data.empleado_id) && request.estado === 'Pendiente'
  );
  if (pending) errors.empleado_id = 'Ya existe una solicitud bancaria pendiente para este colaborador.';
  return result(errors);
}

export function employeeHasHistory(employeeId, options = {}) {
  const contracts = options.contracts || loadCollection('contratos');
  const liquidations = options.liquidations || loadCollection('liquidaciones');
  const evaluations = options.evaluations || loadCollection('evaluaciones');
  return {
    contracts: contracts.some((contract) => String(contract.empleado_id) === String(employeeId)),
    liquidations: liquidations.some((liquidation) => String(liquidation.empleado_id) === String(employeeId)),
    evaluations: evaluations.some((evaluation) => String(evaluation.empleado_id) === String(employeeId))
  };
}

export function canDeleteEmployee(employeeId, options = {}) {
  const history = employeeHasHistory(employeeId, options);
  if (history.liquidations) {
    return { allowed: false, reason: 'El colaborador tiene liquidaciones historicas y no puede eliminarse.' };
  }
  if (history.contracts) {
    return { allowed: false, reason: 'El colaborador tiene contratos registrados. Finalice el vinculo en lugar de eliminarlo.' };
  }
  return { allowed: true, reason: '' };
}

export function pendingBankRequests(options = {}) {
  return (options.requests || loadCollection('solicitudesBanco')).filter(
    (request) => request.estado === 'Pendiente'
  );
}

export function getDepartmentName(departmentId, departments = loadCollection('departamentos')) {
  return (
    departments.find(
      (department) => String(department.departamento_id) === String(departmentId)
    )?.nombre_departamento || 'Sin departamento'
  );
}

export function employeeName(employeeId, employees = loadCollection('empleados')) {
  const employee = employees.find((item) => String(item.empleado_id) === String(employeeId));
  return employee ? `${employee.nombres} ${employee.apellidos}` : 'Sin asignar';
}

export function latestPeriod(options = {}) {
  const periods = options.periods || loadCollection('periodosNomina');
  return [...periods].sort((a, b) => (a.fin_periodo < b.fin_periodo ? 1 : -1))[0] || null;
}

export function lookupEmployee(employeeId) {
  return findById('empleados', employeeId);
}
