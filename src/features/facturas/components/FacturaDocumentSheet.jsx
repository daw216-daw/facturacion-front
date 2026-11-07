import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { formatEuro } from '../../presupuestos/presupuestoEstados';
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
 * La "hoja" de la factura tal y como sale en el PDF (datos congelados al emitirla).
 * La usan tanto la vista previa del admin (FacturaPreview) como el panel de
 * solo lectura del emisor (EmisorFacturaPreview).
 */
export default function FacturaDocumentSheet({ documento, cliente, emisor, textos_legales = [] }) {
  const sumCell = { textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' };
  const hayTrabajos = (documento.descripcion ?? '').replace(/<[^>]*>/g, '').trim() !== '';

  return (
    <DocumentSheet>
      {/* Cabecera: el estado es interno y no se imprime */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <SheetTitle>Factura</SheetTitle>
        <Box sx={{ textAlign: 'right', pt: 0.5 }}>
          <Typography sx={{ color: PAPER.text, whiteSpace: 'nowrap' }}>
            <strong>Nº:</strong> {documento.numero}/{documento.anio}
          </Typography>
          <Typography sx={{ color: PAPER.text, whiteSpace: 'nowrap' }}>
            <strong>Fecha:</strong> {documento.fecha ? dayjs(documento.fecha).format('DD/MM/YYYY') : '—'}
          </Typography>
        </Box>
      </Stack>

      {/* Cliente */}
      <SheetSectionTitle>Datos del cliente</SheetSectionTitle>
      <SheetCard title={cliente?.nombre} sx={{ width: { xs: '100%', sm: '60%' } }}>
        <PartyLines data={cliente} />
      </SheetCard>

      {/* Detalle con totales al final */}
      <SheetSectionTitle>Detalle de la factura</SheetSectionTitle>
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
              color: PAPER.text,
            },
          }}
        >
          <thead>
            <tr>
              <th>Trabajos realizados</th>
              <Box component="th" sx={{ width: 150, textAlign: 'right !important' }}>Importe</Box>
            </tr>
          </thead>
          <tbody>
            {hayTrabajos && (
              <tr>
                <td>
                  <RichText html={documento.descripcion} />
                </td>
                <td />
              </tr>
            )}
            <tr>
              <Box component="td" sx={{ textAlign: 'right', color: '#374151 !important' }}>Base imponible</Box>
              <Box component="td" sx={sumCell}>{formatEuro(documento.base_imponible)}</Box>
            </tr>
            <tr>
              <Box component="td" sx={{ textAlign: 'right', color: '#374151 !important' }}>
                IVA ({documento.iva_porcentaje}%)
              </Box>
              <Box component="td" sx={sumCell}>{formatEuro(documento.iva_importe)}</Box>
            </tr>
            <tr>
              <Box component="td" sx={{ textAlign: 'right', fontWeight: 800, color: `${PAPER.title} !important` }}>
                Total factura
              </Box>
              <Box component="td" sx={{ ...sumCell, fontWeight: 800, fontSize: 17, color: `${PAPER.title} !important` }}>
                {formatEuro(documento.total)}
              </Box>
            </tr>
          </tbody>
        </Box>
      </Box>

      {/* Datos de pago */}
      {emisor?.iban && (
        <Box
          sx={{
            mt: 2,
            border: '1px solid #d1fae5',
            borderRadius: 2,
            px: 1.75,
            py: 1.25,
            bgcolor: '#ecfdf5',
            color: '#065f46',
          }}
        >
          <Typography sx={{ fontSize: 14 }}>
            <strong>Datos de pago:</strong> IBAN{' '}
            <Box component="span" sx={{ fontFamily: 'monospace', fontSize: 15 }}>
              {emisor.iban}
            </Box>
          </Typography>
        </Box>
      )}

      {/* Textos legales elegidos para esta factura */}
      {textos_legales.length > 0 && (
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {textos_legales.map((texto, i) => (
            <SheetCard key={i} soft>
              <RichText html={texto} sx={{ fontSize: 13 }} />
            </SheetCard>
          ))}
        </Stack>
      )}

      <Box sx={{ flexGrow: 1, minHeight: 24 }} />

      {/* Pie con el emisor, como en el PDF */}
      <SheetFooter emisor={emisor} />
    </DocumentSheet>
  );
}
