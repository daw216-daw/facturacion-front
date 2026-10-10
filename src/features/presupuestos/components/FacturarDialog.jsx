// features/presupuestos/components/FacturarDialog.jsx
// Confirmación para convertir un presupuesto aceptado en factura,
// eligiendo fecha, tipo de IVA (por defecto hoy y 21 %) y textos legales de la factura.
import { useEffect, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';

import IvaFechaDialog from '../../../common/IvaFechaDialog';
import TextosLegalesSelector, { textosPorDefecto } from '../../../common/TextosLegalesSelector';
import AvisoIvaCero from '../../../common/AvisoIvaCero';
import { getDocumentoTextos } from '../../documentoTextos/services/documentoTextos.service';

export default function FacturarDialog({ open, presupuesto, loading = false, onClose, onConfirm }) {
  const [docsDisponibles, setDocsDisponibles] = useState([]);
  const [docsSeleccionados, setDocsSeleccionados] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelado = false;
    setLoadingDocs(true);

    getDocumentoTextos({ tipo: 'factura', activos: true })
      .then((docs) => {
        if (cancelado) return;
        const lista = docs ?? [];
        setDocsDisponibles(lista);
        // El primero viene marcado (salvo los de "IVA 0 %", que se añaden a mano)
        setDocsSeleccionados(textosPorDefecto(lista));
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (!cancelado) setLoadingDocs(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open]);

  return (
    <IvaFechaDialog
      open={open}
      title="Facturar presupuesto"
      maxWidth="sm"
      base={presupuesto?.total}
      loading={loading}
      confirmDisabled={loadingDocs}
      confirmText="Crear factura"
      confirmIcon={<ReceiptIcon />}
      onClose={onClose}
      onConfirm={(data) =>
        onConfirm({ ...data, documento_texto_ids: docsSeleccionados.map((d) => d.id) })
      }
      header={
        presupuesto && (
          <>
            <Typography fontWeight={600}>
              Presupuesto {presupuesto.numero}/{presupuesto.anio}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {presupuesto.cliente?.nombre}
            </Typography>
          </>
        )
      }
      info={
        <Alert severity="info" variant="outlined">
          Los trabajos del presupuesto se copiarán a la factura como "Trabajos realizados".
          Una vez facturado, el presupuesto ya no se podrá editar.
        </Alert>
      }
    >
      {({ iva }) => (
        <>
          <AvisoIvaCero
            iva={iva}
            disponibles={docsDisponibles}
            seleccionados={docsSeleccionados}
            onChange={setDocsSeleccionados}
          />
          <Box>
            <Typography variant="subtitle2" mb={1}>
              Textos legales de la factura
            </Typography>
            <TextosLegalesSelector
              compact
              disponibles={docsDisponibles}
              value={docsSeleccionados}
              onChange={setDocsSeleccionados}
              emptyText={loadingDocs ? 'Cargando…' : 'No hay textos legales activos para facturas.'}
            />
          </Box>
        </>
      )}
    </IvaFechaDialog>
  );
}
