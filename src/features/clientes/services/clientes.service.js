import api from '../../../lib/api';

/**
 * Obtener clientes (listado)
 * Soporta:
 * - paginación
 * - búsqueda
 * - solo activos
 */
export async function getClientes(params = {}) {
  const response = await api.get('/clientes', {
    params: {
      per_page: params.per_page || 10,
      page: params.page || 1,
      search: params.search || '',
      solo_activos: params.solo_activos ?? false,
    },
  });

  return response.data;
}

/**
 * Obtener un cliente por ID
 */
export async function getCliente(id) {
  const response = await api.get(`/clientes/${id}`);
  return response.data.data;
}

/**
 * Crear cliente
 */
export async function createCliente(data) {
  const response = await api.post('/clientes', data);
  return response.data.data;
}

/**
 * Actualizar cliente
 */
export async function updateCliente(id, data) {
  const response = await api.put(`/clientes/${id}`, data);
  return response.data.data;
}

/**
 * Desactivar cliente (soft delete)
 */
export async function deleteCliente(id) {
  const response = await api.delete(`/clientes/${id}`);
  return response.data;
}

export async function reactivateCliente(id) {
  const response = await api.put(`/clientes/${id}`, {
    activo: true,
  });
  return response.data.data;
}

export async function getClientesSelect() {
  const response = await api.get('/clientes', {
    params: { solo_activos: true },
  });
  return response.data.data ?? response.data;
}
