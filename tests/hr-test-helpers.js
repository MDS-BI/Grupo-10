export function sessionFor(role = 'admin', empleadoId = null) {
  const names = {
    admin: 'Administrador de RRHH',
    payroll: 'Felipe Vera',
    supervisor: 'Ana Torres',
    employee: 'Bruno Díaz'
  };
  return {
    usuario_id: role === 'admin' ? 1 : role === 'payroll' ? 2 : role === 'supervisor' ? 3 : 5,
    email: {
      admin: 'admin@empresa.cl',
      payroll: 'felipe.vera@empresa.cl',
      supervisor: 'ana.torres@empresa.cl',
      employee: 'bruno.diaz@empresa.cl'
    }[role],
    nombre: names[role],
    rol: role,
    empleado_id:
      empleadoId === null
        ? { admin: null, payroll: 6, supervisor: 1, employee: 2 }[role]
        : empleadoId,
    iniciada: new Date().toISOString()
  };
}

export function contextFor(session, overrides = {}) {
  return {
    session,
    route: overrides.route || 'panel',
    id: overrides.id || null,
    params: overrides.params || new URLSearchParams(),
    navigate: overrides.navigate || (() => {}),
    refresh: overrides.refresh || (() => {}),
    roleLabel: () => session.rol,
    ...overrides
  };
}

export function mount(html) {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  return document.getElementById('root');
}

export function submit(form) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

export function change(input, value) {
  input.value = value;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
