import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Chip, Divider, Snackbar, Typography } from '@mui/material';
import dayjs from 'dayjs';
import DownloadIcon from '@mui/icons-material/Download';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

import { getMiFacturaPreview, getMiFacturaPdf } from '../services/emisorFacturas.service';
import { getEstadoFacturaConfig } from '../../facturas/facturaEstados';
import { formatEuro } from '../../presupuestos/presupuestoEstados';
import FacturaDocumentSheet from '../../facturas/components/FacturaDocumentSheet';
import {
  PreviewToolbar,
  PreviewLayout,
  AsideCard,
  AsideRow,
  PreviewSkeleton,
  PreviewError,
} from '../../../common/documentPreview/PreviewShell';

export default function EmisorFacturaPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, severity: 'success', message: '' });

  const loadPreview = useCallback(async () => {
    const response = await getMiFacturaPreview(id);
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

  const goBack = () => navigate('/emisor/facturas');

  if (loading) return <PreviewSkeleton />;
  if (!data) {
    return (
      <PreviewError
        message="No se pudo cargar la factura"
        backLabel="Volver a facturas"
        onBack={goBack}
      />
    );
  }

  const { documento, cliente, emisor, textos_legales = [], origen } = data;
  const estadoConfig = getEstadoFacturaConfig(documento.estado);

  const handlePdf = async (download = false) => {
    try {
      setPdfLoading(true);
      const blob = await getMiFacturaPdf(id, { download });
      const pdfUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));

      if (download) {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `factura-${documento.anio}-${String(documento.numero).padStart(4, '0')}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      }

      window.setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 60000);
    } catch (error) {
      console.error(error);
      showFeedback('No se pudo generar el PDF de la factura', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const documentoCliente = (
    <FacturaDocumentSheet documento={documento} cliente={cliente} emisor={emisor} textos_legales={textos_legales} />
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
      <AsideRow label="Base imponible">
        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatEuro(documento.base_imponible)}
        </Typography>
      </AsideRow>
      <AsideRow label={`IVA ${documento.iva_porcentaje}%`}>
        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatEuro(documento.iva_importe)}
        </Typography>
      </AsideRow>
      <AsideRow label="Total">
        <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatEuro(documento.total)}
        </Typography>
      </AsideRow>

      {origen && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<RequestQuoteIcon />}
          onClick={() => navigate(`/emisor/presupuestos/${origen.id}`)}
          sx={{ mt: 1.5 }}
        >
          Ver presupuesto {origen.numero}/{origen.anio}
        </Button>
      )}
    </AsideCard>
  );

  return (
    <>
      <PreviewToolbar
        backLabel="Facturas"
        onBack={goBack}
        topOffset={0}
        title={`Factura ${documento.numero}/${documento.anio}`}
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
