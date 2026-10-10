// features/facturas/facturaEstados.js
// Etiqueta y color de cada estado de factura (enum BD: emitida | pagada | vencida)

export const ESTADOS_FACTURA = {
  emitida: { label: 'Pendiente de cobro', color: 'warning' },
  pagada: { label: 'Pagada', color: 'success' },
  vencida: { label: 'Vencida', color: 'error' },
};

export function getEstadoFacturaConfig(estado) {
  return ESTADOS_FACTURA[estado] ?? { label: estado ?? '', color: 'default' };
}
