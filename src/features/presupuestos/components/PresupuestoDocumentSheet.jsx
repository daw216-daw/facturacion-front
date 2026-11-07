import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { formatEuro, htmlToText } from '../presupuestoEstados';
import {
  DocumentSheet,
  SheetTitle,
  SheetSectionTitle,
  SheetCard,
  SheetFooter,
  RichText,
  PartyLines,
  PAPER,
} from '../../../common/documentPreview/DocumentSheet';

/**
 * La "hoja" del presupuesto tal y como sale en el PDF.
 * La usan tanto la vista previa del admin (PresupuestoPreview) como el panel
 * de solo lectura del emisor (EmisorPresupuestoPreview).
 */
export default function PresupuestoDocumentSheet({ documento, cliente, emisor, textos_legales = [] }) {
  const hayObservaciones = htmlToText(documento.observaciones ?? '') !== '';
  // Igual que el PDF: solo se imprimen si se marcó "mostrar"
  const observacionesEnPdf = hayObservaciones && !!documento.mostrar_observaciones;

  return (
    <DocumentSheet watermark={documento.estado === 'borrador' ? 'BORRADOR' : null}>
      {/* Cabecera */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <SheetTitle>Presupuesto</SheetTitle>
        {documento.fecha && (
          <Typography sx={{ pt: 1, color: PAPER.text, whiteSpace: 'nowrap' }}>
            <strong>Fecha:</strong> {dayjs(documento.fecha).format('DD/MM/YYYY')}
          </Typography>
        )}
      </Stack>

      {/* Cliente */}
      <SheetSectionTitle>Datos del cliente</SheetSectionTitle>
      <SheetCard title={cliente?.nombre} sx={{ width: { xs: '100%', sm: '60%' } }}>
        <PartyLines data={cliente} />
      </SheetCard>

      {/* Detalle */}
      <SheetSectionTitle>Detalle del presupuesto</SheetSectionTitle>
      <Box sx={{ overflowX: 'auto' }}>
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            '& th': {
              bgcolor: PAPER.header,
              color: '#fff',
              textAlign: 'left',
              p: 1.25,
              fontSize: 12,
              fontWeight: 700,
            },
            '& td': {
              border: `1px solid ${PAPER.border}`,
              p: 1.25,
              verticalAlign: 'top',
            },
          }}
        >
          <thead>
            <tr>
              <th>Trabajos a realizar</th>
              <Box component="th" sx={{ width: 150, textAlign: 'right !important' }}>Importe</Box>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <RichText html={documento.descripcion} />
              </td>
              <td />
            </tr>
            <tr>
              <Box component="td" sx={{ textAlign: 'right', fontWeight: 700, color: '#374151' }}>
                Total presupuesto
              </Box>
              <Box
                component="td"
                sx={{
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  fontWeight: 800,
                  fontSize: 17,
                  color: PAPER.title,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatEuro(documento.total)}
              </Box>
            </tr>
          </tbody>
        </Box>
      </Box>

      {/* Observaciones: solo si se marcó "mostrar en el presupuesto" */}
      {observacionesEnPdf && (
        <Box sx={{ mt: 1 }}>
          <SheetSectionTitle>Observaciones</SheetSectionTitle>
          <SheetCard soft>
            <RichText html={documento.observaciones} />
          </SheetCard>
        </Box>
      )}

      {/* Textos legales */}
      {textos_legales.length > 0 && (
        <Stack spacing={1.5} sx={{ mt: 3.5, mb: 3 }}>
          {textos_legales.map((texto, i) => (
            <SheetCard key={i} soft>
              <RichText html={texto} sx={{ fontSize: 13 }} />
            </SheetCard>
          ))}
        </Stack>
      )}

      <Box sx={{ flexGrow: 1, minHeight: 24 }} />

      {/* Pie con el emisor */}
      <SheetFooter emisor={emisor} />
    </DocumentSheet>
  );
}
