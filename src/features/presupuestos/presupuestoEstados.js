// features/presupuestos/presupuestoEstados.js
// Estado "visual" del presupuesto: el API no guarda "facturado",
// lo calcula a partir de la factura asociada (campo `facturado`).

export const ESTADOS_PRESUPUESTO = {
  borrador: { label: 'Borrador', color: 'default' },
  enviado: { label: 'Enviado', color: 'info' },
  aceptado: { label: 'Aceptado', color: 'success' },
  facturado: { label: 'Facturado', color: 'secondary' },
  rechazado: { label: 'Rechazado', color: 'error' },
  desactivado: { label: 'Desactivado', color: 'default' },
};

// Orden de los filtros rápidos del listado
export const FILTROS_ESTADO = [
  { value: '', label: 'Todos', contador: 'todos' },
  { value: 'borrador', label: 'Borrador', contador: 'borrador' },
  { value: 'enviado', label: 'Enviado', contador: 'enviado' },
  { value: 'aceptado', label: 'Pendiente de facturar', contador: 'aceptado' },
  { value: 'facturado', label: 'Facturado', contador: 'facturado' },
  { value: 'rechazado', label: 'Rechazado', contador: 'rechazado' },
  { value: 'desactivado', label: 'Desactivado', contador: 'desactivado' },
];

export function getEstadoVisual(presupuesto) {
  if (!presupuesto) return 'borrador';
  return presupuesto.facturado ? 'facturado' : presupuesto.estado;
}

export function getEstadoConfig(presupuesto) {
  return ESTADOS_PRESUPUESTO[getEstadoVisual(presupuesto)] ?? {
    label: presupuesto?.estado ?? '',
    color: 'default',
  };
}

const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export function formatEuro(value) {
  if (value == null || value === '') return '';
  return euroFormatter.format(Number(value));
}

// Texto plano de un HTML de TipTap, para resúmenes en el listado
export function htmlToText(html = '') {
  return html
    .replace(/<\/(p|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
