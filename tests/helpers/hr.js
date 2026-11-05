import { vi } from 'vitest';

export function setField(form, name, value) {
  const field = form.querySelector(`[name="${name}"]`);
  if (!field) throw new Error(`No existe el campo ${name}`);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  return field;
}

export function submit(form) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

export function click(element) {
  if (!element) throw new Error('Elemento no encontrado para click');
  element.click();
}

export function byText(selector, text) {
  return [...document.querySelectorAll(selector)].find((element) =>
    element.textContent.includes(text)
  );
}

export async function bootApp(role = 'admin_rrhh', usuarioId = null) {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  document.body.innerHTML = '<div id="app"></div><div id="toast-region"></div>';
  window.location.hash = '';

  const storage = await import('../../src/hr/storage.js');
  storage.clearAll();

  const app = await import('../../src/app.js');
  app.initApp(document.getElementById('app'));

  const auth = await import('../../src/hr/auth.js');
  const users = auth.listUsers();
  const target = usuarioId
    ? users.find((user) => String(user.usuario_id) === String(usuarioId))
    : users.find((user) => user.rol === role);
  if (!target) throw new Error(`No hay usuario demo para el rol ${role}`);

  const loginButton = document.querySelector(`[data-login="${target.usuario_id}"]`);
  if (!loginButton) throw new Error('No se encontro el boton de login demo');
  loginButton.click();

  return { app, auth, storage, target, users };
}

export async function reloadApp() {
  const app = await import('../../src/app.js');
  app.initApp(document.getElementById('app'));
  return app;
}
