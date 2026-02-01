import api from '../../../lib/api';

/**
 * Listado de emisores
 */
export async function getEmisores() {
  const response = await api.get('/emisores');
  return response.data;
}

/**
 * Crear emisor
 */
export async function createEmisor(data) {
  const response = await api.post('/emisores', data);
  return response.data;
}

/**
 * Actualizar emisor
 */
export async function updateEmisor(id, data) {
  const response = await api.put(`/emisores/${id}`, data);
  return response.data;
}
