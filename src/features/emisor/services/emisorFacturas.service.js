// features/emisor/services/emisorFacturas.service.js
// Panel del emisor: solo lectura de SUS facturas (API las filtra por su emisor_id).
import api from '../../../lib/api';

export async function getMisFacturas(params = {}) {
  const response = await api.get('/emisor/facturas', {
    params: {
      per_page: params.per_page || 10,
      page: params.page || 1,
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });

  return response.data;
}

export async function getMiFacturaPreview(id) {
  const response = await api.get(`/emisor/facturas/${id}/preview`);
  return response.data;
}

export async function getMiFacturaPdf(id, { download = false } = {}) {
  const response = await api.get(`/emisor/facturas/${id}/pdf`, {
    params: download ? { download: 1 } : {},
    responseType: 'blob',
  });

  return response.data;
}
