import api from '../../../lib/api';

/**
 * Obtener series
 */
export async function getSeries() {
  const response = await api.get('/series');
  return response.data;
}

/**
 * Crear serie
 */
export async function createSerie(data) {
  const response = await api.post('/series', data);
  return response.data;
}
