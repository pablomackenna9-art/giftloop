// La identidad se establece solamente después de validar la sesión.
let activeUserId = '';
export function setStorageUser(id: string) { activeUserId = id; }
export function storageKey(key: string) {
  if (!activeUserId) throw new Error('Debes iniciar sesión para acceder a tus datos.');
  return `gl:${activeUserId}:${key}`;
}
export function readUserData<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(storageKey(key)) ?? 'null') ?? fallback; }
  catch { return fallback; }
}
export function writeUserData(key: string, value: unknown) {
  localStorage.setItem(storageKey(key), JSON.stringify(value));
}
