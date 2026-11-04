const memory = new Map();

function hasLocalStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

export function readRaw(key) {
  if (hasLocalStorage()) return localStorage.getItem(key);
  return memory.has(key) ? memory.get(key) : null;
}

export function writeRaw(key, value) {
  if (hasLocalStorage()) {
    localStorage.setItem(key, value);
    return;
  }
  memory.set(key, value);
}

export function removeRaw(key) {
  if (hasLocalStorage()) {
    localStorage.removeItem(key);
    return;
  }
  memory.delete(key);
}

export function clearPrefix(prefix = 'hr.') {
  if (hasLocalStorage()) {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
    return;
  }
  [...memory.keys()]
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => memory.delete(key));
}
