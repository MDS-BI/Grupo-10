// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { getDemoUsers, login, logout } from '../../src/hr/auth.js';
import { loadAudit } from '../../src/hr/audit.js';
import { resetStorage } from '../../src/hr/storage.js';
import * as users from '../../src/hr/components/users.js';
import { contextFor, mount, sessionFor } from '../hr-test-helpers.js';

beforeEach(() => {
  resetStorage();
  logout();
});

describe('administración de usuarios', () => {
  it('permite asignar rol y lo aplica en el siguiente acceso', () => {
    const context = contextFor(sessionFor('admin'), { route: 'usuarios' });
    const root = mount(users.render(context));
    expect(root.textContent).toContain('Usuarios y roles');
    users.bind(root, context);
    const roleSelect = root.querySelector('select[name="rol_5"]');
    roleSelect.value = 'supervisor';
    root.querySelector('[data-save-role="5"]').click();
    expect(getDemoUsers().find((user) => user.usuario_id === 5).rol).toBe('supervisor');
    expect(loadAudit().some((entry) => entry.accion === 'cambiar_rol')).toBe(true);
    logout();
    expect(login('bruno.diaz@empresa.cl', 'empleado123').rol).toBe('supervisor');
  });
});
