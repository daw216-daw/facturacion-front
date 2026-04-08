import api from '../../../lib/api';

export async function getFacturas(params = {}) {
  const response = await api.get('/facturas', {
    params: {
      per_page: params.per_page || 10,
      page: params.page || 1,
    },
  });

  return response.data;
}

export async function getFactura(id) {
  const response = await api.get(`/facturas/${id}`);
  return response.data;
}

export async function getFacturaPreview(id) {
  const response = await api.get(`/facturas/${id}/preview`);
  return response.data;
}

export async function createFactura(data) {
  const response = await api.post('/facturas', data);
  return response.data.data ?? response.data;
}

export async function marcarFacturaPagada(id) {
  const response = await api.post(`/facturas/${id}/pagar`);
  return response.data;
}
