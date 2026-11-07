// features/emisor/services/emisorPresupuestos.service.js
// Panel del emisor: solo lectura de SUS presupuestos (API los filtra por su emisor_id).
import api from '../../../lib/api';

export async function getMisPresupuestos(params = {}) {
  const response = await api.get('/emisor/presupuestos', {
    params: {
      per_page: params.per_page || 10,
      page: params.page || 1,
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });

  return response.data;
}

export async function getMiPresupuestoPreview(id) {
  const response = await api.get(`/emisor/presupuestos/${id}/preview`);
  return response.data;
}

export async function getMiPresupuestoPdf(id, { download = false } = {}) {
  const response = await api.get(`/emisor/presupuestos/${id}/pdf`, {
    params: download ? { download: 1 } : {},
    responseType: 'blob',
  });

  return response.data;
}
