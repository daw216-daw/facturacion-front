// features/presupuestos/services/presupuestos.service.js
import api from '../../../lib/api';

export async function getPresupuestoPreview(id) {
  const response = await api.get(`/presupuestos/${id}/preview`);
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

/**
 * Convertir presupuesto en factura
 */
export async function facturarPresupuesto(id) {
  const response = await api.post(`/presupuestos/${id}/facturar`);
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
