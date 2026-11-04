import {
  can,
  getDemoUsers,
  resetUserRoles,
  roleLabel,
  updateUserRole
} from '../auth.js';
import { getEmployeeName } from '../storage.js';
import {
  badge,
  emptyState,
  escapeHtml,
  pageHeader,
  query,
  queryAll,
  sectionCard,
  select,
  showToast,
  table
} from './ui.js';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador de RRHH' },
  { value: 'payroll', label: 'Encargado de Nómina' },
  { value: 'supervisor', label: 'Jefatura / Supervisor' },
  { value: 'employee', label: 'Empleado' },
  { value: '', label: 'Sin rol asignado' }
];

export function render(context) {
  if (!can('users.manage', context.session)) {
    return emptyState('Acceso restringido', 'Solo administración puede gestionar usuarios y roles.');
  }
  const rows = getDemoUsers().map((user) => {
    const roleSelect = select(`rol_${user.usuario_id}`, ROLE_OPTIONS, user.rol);
    return `<tr>
      <td>
        <strong>${escapeHtml(user.nombre)}</strong>
        <small>${escapeHtml(user.email)}</small>
      </td>
      <td>${badge(roleLabel(user.rol))}</td>
      <td>${user.empleado_id ? escapeHtml(getEmployeeName(user.empleado_id)) : '<span class="muted">Sin ficha</span>'}</td>
      <td>${roleSelect}</td>
      <td class="table-actions">
        <button type="button" class="btn btn--primary btn--sm" data-save-role="${user.usuario_id}">Aplicar rol</button>
      </td>
    </tr>`;
  });

  return `
    ${pageHeader(
      'Usuarios y roles',
      'Asigna el rol de cada cuenta de demostración. Los cambios rigen desde el siguiente inicio de sesión.',
      '<button type="button" class="btn btn--ghost btn--sm" id="reset-user-roles">Restablecer roles</button>'
    )}
    ${sectionCard(
      'Cuentas de acceso',
      table(['Usuario', 'Rol actual', 'Ficha asociada', 'Nuevo rol', 'Acciones'], rows)
    )}
    <p class="muted">Un usuario sin rol no puede iniciar sesión. Los cambios de rol quedan registrados en auditoría.</p>
  `;
}

export function bind(root, context) {
  if (!can('users.manage', context.session)) return;
  queryAll('[data-save-role]', root).forEach((button) => {
    button.addEventListener('click', () => {
      const usuarioId = button.dataset.saveRole;
      const roleSelect = query(`select[name="rol_${usuarioId}"]`, root);
      try {
        const updated = updateUserRole(usuarioId, roleSelect.value, context.session.email);
        showToast(`Rol de ${updated.nombre} actualizado a ${roleLabel(updated.rol)}.`);
        context.refresh();
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });
  query('#reset-user-roles', root)?.addEventListener('click', () => {
    if (!window.confirm('¿Restablecer los roles de demostración?')) return;
    resetUserRoles(context.session.email);
    showToast('Roles restablecidos.', 'info');
    context.refresh();
  });
}
