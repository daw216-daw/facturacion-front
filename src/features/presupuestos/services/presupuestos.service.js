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
 * Obtener presupuestos (listado paginado en el API)
 * params: page, per_page, estado (incluye 'facturado'), search
 * Respuesta: { data, current_page, per_page, total, last_page, ..., contadores }
 */
export async function getPresupuestos(params = {}) {
  const response = await api.get('/presupuestos', {
    params: {
      per_page: params.per_page || 10,
      page: params.page || 1,
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
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
// data opcional: { iva_porcentaje, fecha }. Sin ellos el API usa 21 % y hoy
export async function facturarPresupuesto(id, data = {}) {
  const response = await api.post(`/presupuestos/${id}/facturar`, data);
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
 * Actualizar presupuesto (si no está facturado ni desactivado)
 * Devuelve el presupuesto + requiere_reenvio (true si ya estaba enviado/aceptado)
 */
export async function updatePresupuesto(id, data) {
  const response = await api.put(`/presupuestos/${id}`, data);
  return response.data;
}

