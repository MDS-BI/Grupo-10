import {
  getDepartmentName,
  getDirectReports,
  getEmployee,
  getPositionName,
  loadDepartments,
  loadEmployees,
  loadPositions
} from './storage.js';

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function employeeVisible(employee, session) {
  if (!session) return false;
  if (['admin', 'payroll'].includes(session.rol)) return true;
  if (Number(employee.empleado_id) === Number(session.empleado_id)) return true;
  if (session.rol === 'supervisor') {
    return getDirectReports(session.empleado_id).some(
      (report) => Number(report.empleado_id) === Number(employee.empleado_id)
    );
  }
  return false;
}

export function searchEmployees(query, session) {
  const term = normalize(query);
  return loadEmployees()
    .filter((employee) => employeeVisible(employee, session))
    .filter((employee) => {
      if (!term) return true;
      return [
        employee.nombres,
        employee.apellidos,
        employee.rut,
        employee.email,
        getDepartmentName(employee.departamento_id),
        getPositionName(employee.cargo_id)
      ]
        .map(normalize)
        .some((value) => value.includes(term));
    });
}

export function searchAll(query, session) {
  const term = normalize(query);
  if (!term) return [];
  const results = [];
  searchEmployees(query, session)
    .slice(0, 8)
    .forEach((employee) => {
      results.push({
        tipo: 'empleado',
        id: employee.empleado_id,
        titulo: `${employee.nombres} ${employee.apellidos}`,
        subtitulo: `${employee.rut} · ${getDepartmentName(employee.departamento_id)} · ${getPositionName(employee.cargo_id)}`,
        ruta: 'empleados'
      });
    });

  if (['admin', 'payroll', 'supervisor'].includes(session?.rol)) {
    loadDepartments()
      .filter((department) =>
        [department.nombre_departamento, department.codigo_departamento]
          .map(normalize)
          .some((value) => value.includes(term))
      )
      .slice(0, 4)
      .forEach((department) => {
        results.push({
          tipo: 'departamento',
          id: department.departamento_id,
          titulo: department.nombre_departamento,
          subtitulo: `Código ${department.codigo_departamento}`,
          ruta: 'departamentos'
        });
      });
  }

  if (['admin', 'payroll'].includes(session?.rol)) {
    loadPositions()
      .filter((position) =>
        [position.nombre_cargo, position.nivel_jerarquia]
          .map(normalize)
          .some((value) => value.includes(term))
      )
      .slice(0, 4)
      .forEach((position) => {
        results.push({
          tipo: 'cargo',
          id: position.cargo_id,
          titulo: position.nombre_cargo,
          subtitulo: `${position.nivel_jerarquia} · ${getDepartmentName(position.departamento_id)}`,
          ruta: 'cargos'
        });
      });
  }

  return results.slice(0, 12);
}

export function filterAndSortEmployees(employees, { search = '', departmentId = '', status = '', sort = 'nombre' } = {}) {
  const term = normalize(search);
  const filtered = employees.filter((employee) => {
    const matchesSearch =
      !term ||
      [employee.nombres, employee.apellidos, employee.rut, employee.email]
        .map(normalize)
        .some((value) => value.includes(term));
    const matchesDepartment =
      !departmentId || Number(employee.departamento_id) === Number(departmentId);
    const matchesStatus = !status || employee.estado === status;
    return matchesSearch && matchesDepartment && matchesStatus;
  });
  return filtered.sort((a, b) => {
    if (sort === 'salario') return 0;
    if (sort === 'antiguedad') return a.fecha_contratacion.localeCompare(b.fecha_contratacion);
    return `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`);
  });
}

export function visibleEmployee(employeeId, session) {
  const employee = getEmployee(employeeId);
  return Boolean(employee && employeeVisible(employee, session));
}
