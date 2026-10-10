// common/rutasPorRol.js
// Pantalla de inicio de cada rol (tras el login, o al entrar en / estando ya identificado)

export function rutaInicioPorRol(role) {
  if (role === 'admin') return '/admin';
  if (role === 'emisor') return '/emisor';
  return '/unauthorized';
}
