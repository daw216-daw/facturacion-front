import api from '../../../lib/api';

/**
 * Obtener usuarios (listado)
 * Soporta:
 * - paginación
 * - búsqueda (name / email)
 * - filtro por rol
 * - solo activos
 */
export async function getUsers(params = {}) {
  const response = await api.get('/users', {
    params: {
      per_page: params.per_page || 10,
      page: params.page || 1,
      search: params.search || '',
      role: params.role || null,
      solo_activos: params.solo_activos ?? false,
    },
  });

  return response.data; // { data, meta }
}

/**
 * Obtener un usuario por ID
 */
export async function getUser(id) {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
}

/**
 * Crear usuario
 */
export async function createUser(data) {
  const response = await api.post('/users', data);
  return response.data.data;
}

/**
 * Actualizar usuario
 */
export async function updateUser(id, data) {
  const response = await api.put(`/users/${id}`, data);
  return response.data.data;
}

/**
 * Desactivar usuario (soft delete)
 */
export async function deleteUser(id) {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}

/**
 * Reactivar usuario
 */
export async function reactivateUser(id) {
  const response = await api.put(`/users/${id}`, {
    activo: true,
  });
  return response.data.data;
}
