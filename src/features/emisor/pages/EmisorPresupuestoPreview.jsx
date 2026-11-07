import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Chip, Divider, Snackbar, Typography } from '@mui/material';
import dayjs from 'dayjs';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptIcon from '@mui/icons-material/Receipt';

import { getMiPresupuestoPreview, getMiPresupuestoPdf } from '../services/emisorPresupuestos.service';
import { getEstadoConfig, formatEuro } from '../../presupuestos/presupuestoEstados';
import PresupuestoDocumentSheet from '../../presupuestos/components/PresupuestoDocumentSheet';
import {
  PreviewToolbar,
  PreviewLayout,
  AsideCard,
  AsideRow,
  PreviewSkeleton,
  PreviewError,
} from '../../../common/documentPreview/PreviewShell';

export default function EmisorPresupuestoPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, severity: 'success', message: '' });

  const loadPreview = useCallback(async () => {
    const response = await getMiPresupuestoPreview(id);
    setData(response);
    return response;
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadPreview()
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [loadPreview]);

  const showFeedback = (message, severity = 'success') => setFeedback({ open: true, severity, message });

  const goBack = () => navigate('/emisor/presupuestos');

  if (loading) return <PreviewSkeleton />;
  if (!data) {
    return (
      <PreviewError
        message="No se pudo cargar el presupuesto"
        backLabel="Volver a presupuestos"
        onBack={goBack}
      />
    );
  }

  const { documento, cliente, emisor, textos_legales = [], factura, facturado } = data;
  const estadoConfig = getEstadoConfig({ estado: documento.estado, facturado });

  const handlePdf = async (download = false) => {
    try {
      setPdfLoading(true);
      const blob = await getMiPresupuestoPdf(id, { download });
      const pdfUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));

      if (download) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `presupuesto-${documento.anio}-${String(documento.numero).padStart(4, '0')}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      }

      window.setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 60000);
    } catch (error) {
      console.error(error);
      showFeedback('No se pudo generar el PDF del presupuesto', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const documentoCliente = (
    <PresupuestoDocumentSheet documento={documento} cliente={cliente} emisor={emisor} textos_legales={textos_legales} />
  );

  const panelInterno = (
    <AsideCard title="Resumen">
      <AsideRow label="Estado">
        <Chip size="small" label={estadoConfig.label} color={estadoConfig.color} />
      </AsideRow>
      <AsideRow label="Número">
        <Typography variant="body2" fontWeight={600}>{documento.numero}/{documento.anio}</Typography>
      </AsideRow>
      <AsideRow label="Fecha">
        <Typography variant="body2">
          {documento.fecha ? dayjs(documento.fecha).format('DD/MM/YYYY') : '—'}
        </Typography>
      </AsideRow>
      <Divider sx={{ my: 1 }} />
      <AsideRow label="Importe">
        <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatEuro(documento.total)}
        </Typography>
      </AsideRow>

      {factura && (
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          startIcon={<ReceiptIcon />}
          onClick={() => navigate(`/emisor/facturas/${factura.id}`)}
          sx={{ mt: 1.5 }}
        >
          Ver factura {factura.numero}/{factura.anio}
        </Button>
      )}
    </AsideCard>
  );

  return (
    <>
      <PreviewToolbar
        backLabel="Presupuestos"
        onBack={goBack}
        topOffset={0}
        title={`Presupuesto ${documento.numero}/${documento.anio}`}
        chip={<Chip size="small" label={estadoConfig.label} color={estadoConfig.color} />}
        actions={
          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handlePdf(true)}
            disabled={pdfLoading}
          >
            Descargar PDF
          </Button>
        }
      />

      <PreviewLayout document={documentoCliente} aside={panelInterno} asideTop={16} />

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={feedback.severity} variant="filled" sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
