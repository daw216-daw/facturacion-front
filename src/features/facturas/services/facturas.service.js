import api from '../../../lib/api';

// params: page, per_page, estado (emitida|pagada|vencida), search (nº, nº/año o cliente)
// Respuesta: paginación Laravel ({ data, total, current_page, … })
export async function getFacturas(params = {}) {
  const response = await api.get('/facturas', {
    params: {
      per_page: params.per_page || 10,
      page: params.page || 1,
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
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

/**
 * Editar IVA y fecha (solo facturas pendientes de cobro; la fecha debe ser del mismo año)
 * data: { iva_porcentaje, fecha }
 */
export async function updateFactura(id, data) {
  const response = await api.put(`/facturas/${id}`, data);
  return response.data;
}

export async function marcarFacturaPagada(id) {
  const response = await api.post(`/facturas/${id}/pagar`);
  return response.data;
}

export async function getFacturaPdf(id, { download = false } = {}) {
  const response = await api.get(`/facturas/${id}/pdf`, {
    params: download ? { download: 1 } : {},
    responseType: 'blob',
  });
  return response.data;
}

export async function sendFacturaEmail(id, data = {}) {
  const response = await api.post(`/facturas/${id}/enviar-email`, data);
  return response.data;
}

export async function getFacturaWhatsappLink(id, data = {}) {
  const response = await api.post(`/facturas/${id}/compartir-whatsapp`, data);
  return response.data;
}
