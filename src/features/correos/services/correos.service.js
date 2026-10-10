// features/correos/services/correos.service.js
import api from '../../../lib/api';

/**
 * Vista previa del correo que recibiría el cliente (no envía nada).
 * tipo: 'presupuesto' | 'factura'
 * Respuesta: { asunto, de, para, responder_a, adjunto, enlace_dias, html, texto }
 */
export async function getEmailPreview(tipo, id) {
  const ruta = tipo === 'factura' ? 'facturas' : 'presupuestos';
  const { data } = await api.get(`/${ruta}/${id}/email-preview`);
  return data;
}
