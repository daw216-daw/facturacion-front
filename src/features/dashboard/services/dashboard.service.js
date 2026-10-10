// features/dashboard/services/dashboard.service.js
import api from '../../../lib/api';

/**
 * Resumen del dashboard admin: conteos e importes por tabla
 * { presupuestos, facturas, clientes, emisores, usuarios, documento_textos, series }
 */
export async function getDashboard() {
  const { data } = await api.get('/dashboard');
  return data;
}
