// features/facturas/components/EditarFacturaDialog.jsx
// Editar una factura pendiente de cobro (estado "emitida"): fecha, IVA y textos legales.
// Se encarga de llamar al API y avisa al padre con onSaved(facturaActualizada).
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Alert, Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import IvaFechaDialog from '../../../common/IvaFechaDialog';
import TextosLegalesSelector from '../../../common/TextosLegalesSelector';
import AvisoIvaCero from '../../../common/AvisoIvaCero';
import { getFactura, updateFactura } from '../services/facturas.service';
import { getDocumentoTextos } from '../../documentoTextos/services/documentoTextos.service';

/**
 * factura: { id, numero, anio, fecha, base_imponible, iva_porcentaje, cliente? }
 */
export default function EditarFacturaDialog({ open, factura, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [docsDisponibles, setDocsDisponibles] = useState([]);
  const [docsSeleccionados, setDocsSeleccionados] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const facturaId = factura?.id;

  // Textos actuales de la factura + textos de factura activos
  useEffect(() => {
    if (!open || !facturaId) return;

    let cancelado = false;
    setError('');
    setLoadingDocs(true);

    Promise.all([
      getFactura(facturaId),
      getDocumentoTextos({ tipo: 'factura', activos: true }),
    ])
      .then(([full, activos]) => {
        if (cancelado) return;

        const datos = full?.data ?? full;
        const actuales = (datos?.documento_textos ?? [])
          .slice()
          .sort((a, b) => (a.pivot?.orden ?? 0) - (b.pivot?.orden ?? 0));

        // Si un texto ya asignado se desactivó, sigue apareciendo para poder mantenerlo o quitarlo
        const lista = [...(activos ?? [])];
        actuales.forEach((doc) => {
          if (!lista.some((d) => d.id === doc.id)) lista.push(doc);
        });

        setDocsDisponibles(lista);
        setDocsSeleccionados(actuales);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelado) setError('No se pudieron cargar los textos legales de la factura');
      })
      .finally(() => {
        if (!cancelado) setLoadingDocs(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, facturaId]);

  const handleConfirm = async (data) => {
    try {
      setSaving(true);
      setError('');
      const actualizada = await updateFactura(factura.id, {
        ...data,
        documento_texto_ids: docsSeleccionados.map((d) => d.id),
      });
      onSaved?.(actualizada);
      onClose();
    } catch (e) {
      console.error(e);
      const errores = e.response?.data?.errors;
      setError(
        (errores && Object.values(errores)[0]?.[0]) ||
          e.response?.data?.message ||
          'No se pudo actualizar la factura'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <IvaFechaDialog
      open={open && !!factura}
      title="Editar factura"
      maxWidth="sm"
      base={factura?.base_imponible}
      initialIva={Number(factura?.iva_porcentaje ?? 21)}
      initialFecha={factura?.fecha ? dayjs(factura.fecha).format('YYYY-MM-DD') : undefined}
      anioFijo={factura?.anio}
      loading={saving}
      confirmDisabled={loadingDocs}
      error={error}
      confirmText="Guardar cambios"
      confirmIcon={<EditIcon />}
      onClose={handleClose}
      onConfirm={handleConfirm}
      header={
        factura && (
          <>
            <Typography fontWeight={600}>
              Factura {factura.numero}/{factura.anio}
            </Typography>
            {factura.cliente?.nombre && (
              <Typography variant="body2" color="text.secondary">
                {factura.cliente.nombre}
              </Typography>
            )}
          </>
        )
      }
      info={
        <Alert severity="warning" variant="outlined">
          Solo se puede editar mientras está pendiente de cobro. Si el cliente ya la recibió,
          vuelve a enviársela después de guardar.
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
              Textos legales
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
