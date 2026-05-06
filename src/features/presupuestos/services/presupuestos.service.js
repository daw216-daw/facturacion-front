// features/presupuestos/services/presupuestos.service.js
import api from '../../../lib/api';

export async function getPresupuestoPreview(id) {
  const response = await api.get(`/presupuestos/${id}/preview`);
  return response.data;
}

export async function getPresupuestoPdf(id, { download = false } = {}) {
  const response = await api.get(`/presupuestos/${id}/pdf`, {
    params: download ? { download: 1 } : {},
    responseType: 'blob',
  });

  return response.data;
}

export async function sendPresupuestoEmail(id, data = {}) {
  const response = await api.post(`/presupuestos/${id}/enviar-email`, data);
  return response.data;
}

export async function getPresupuestoWhatsappLink(id, data = {}) {
  const response = await api.post(`/presupuestos/${id}/compartir-whatsapp`, data);
  return response.data;
}

/**
 * Obtener presupuestos (listado)
 */
export async function getPresupuestos(params = {}) {
  const response = await api.get('/presupuestos', {
    params: {
      per_page: params.per_page || 10,
      page: params.page || 1,
    },
  });

  return response.data;
}


/**
 * Enviar presupuesto
 */
export async function enviarPresupuesto(id) {
  const response = await api.post(`/presupuestos/${id}/enviar`);
  return response.data;
}

export async function aceptarPresupuesto(id) {
  const response = await api.post(`/presupuestos/${id}/aceptar`);
  return response.data;
}

export async function rechazarPresupuesto(id) {
  const response = await api.post(`/presupuestos/${id}/rechazar`);
  return response.data;
}

export async function desactivarPresupuesto(id) {
  const response = await api.post(`/presupuestos/${id}/desactivar`);
  return response.data;
}

/**
 * Convertir presupuesto en factura
 */
export async function facturarPresupuesto(id) {
  const response = await api.post(`/presupuestos/${id}/facturar`);
  return response.data;
}

export async function getPresupuesto(id) {
  const response = await api.get(`/presupuestos/${id}`);
  return response.data;
}

export async function createPresupuesto(data) {
  const response = await api.post('/presupuestos', data);
  return response.data.data ?? response.data;
}

/**
 * Actualizar presupuesto (solo si está en borrador)
 */
export async function updatePresupuesto(id, data) {
  const response = await api.put(`/presupuestos/${id}`, data);
  return response.data;
}

