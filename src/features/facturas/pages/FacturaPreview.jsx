import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  Divider,
  Snackbar,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import EuroIcon from '@mui/icons-material/Euro';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import EditIcon from '@mui/icons-material/Edit';

import {
  getFacturaPreview,
  marcarFacturaPagada,
  getFacturaPdf,
  sendFacturaEmail,
  getFacturaWhatsappLink,
} from '../services/facturas.service';
import { getEstadoFacturaConfig } from '../facturaEstados';
import { formatEuro } from '../../presupuestos/presupuestoEstados';
import ConfirmActionDialog from '../../../common/ConfirmActionDialog';
import ShareDialog from '../../../common/ShareDialog';
import HistorialEnvios from '../../../common/documentPreview/HistorialEnvios';
import { abrirWhatsapp } from '../../../common/whatsapp';
import EditarFacturaDialog from '../components/EditarFacturaDialog';
import FacturaDocumentSheet from '../components/FacturaDocumentSheet';
import {
  PreviewToolbar,
  PreviewLayout,
  AsideCard,
  AsideRow,
  PreviewSkeleton,
  PreviewError,
} from '../../../common/documentPreview/PreviewShell';

export default function FacturaPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [confirmPay, setConfirmPay] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareError, setShareError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  const loadPreview = useCallback(async () => {
    const response = await getFacturaPreview(id);
    setData(response);
    return response;
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadPreview()
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [loadPreview]);

  const showFeedback = (message, severity = 'success') => {
    setFeedback({ open: true, severity, message });
  };

  const handleCloseFeedback = (_, reason) => {
    if (reason === 'clickaway') return;
    setFeedback((prev) => ({ ...prev, open: false }));
  };

  const goBack = () => navigate('/admin/facturas');

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

  const { documento, cliente, emisor, textos_legales = [], origen, envios = [] } = data;
  // Para compartir se usa el contacto ACTUAL del cliente (la factura guarda una copia congelada)
  const contacto = data.contacto ?? { email: cliente?.email, telefono: cliente?.telefono };
  const estadoConfig = getEstadoFacturaConfig(documento.estado);
  const busy = pdfLoading || paying || shareLoading;

  const handleMarkAsPaid = async () => {
    try {
      setPaying(true);
      await marcarFacturaPagada(id);
      await loadPreview();
      showFeedback('Factura marcada como pagada correctamente');
    } catch (error) {
      console.error(error);
      showFeedback(
        error.response?.data?.message || 'No se pudo marcar la factura como pagada',
        'error'
      );
    } finally {
      setPaying(false);
      setConfirmPay(false);
    }
  };

  const handlePdf = async (download = false) => {
    try {
      setPdfLoading(true);
      const blob = await getFacturaPdf(id, { download });
      const pdfUrl = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );

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

  // datos: { email, copia_emisor } o { telefono } (destinatario editable en el diálogo)
  const handleShare = async (channel, datos = {}) => {
    try {
      setShareLoading(true);
      setShareError('');

      if (channel === 'email') {
        const response = await sendFacturaEmail(id, datos);
        showFeedback(response.message || 'Factura enviada por email correctamente');
      }

      if (channel === 'whatsapp') {
        await abrirWhatsapp(() => getFacturaWhatsappLink(id, datos));
        showFeedback('Se ha abierto WhatsApp con el mensaje: revísalo y pulsa enviar.', 'info');
      }

      setShareOpen(false);
      await loadPreview();
    } catch (error) {
      console.error(error);
      const errores = error.response?.data?.errors;
      setShareError(
        (errores && Object.values(errores)[0]?.[0]) ||
          error.response?.data?.message ||
          error.message ||
          'No se pudo compartir la factura'
      );
      loadPreview().catch(() => {});
    } finally {
      setShareLoading(false);
    }
  };

  /* ───────────── DOCUMENTO (igual que el PDF) ───────────── */
  const documentoCliente = (
    <FacturaDocumentSheet
      documento={documento}
      cliente={cliente}
      emisor={emisor}
      textos_legales={textos_legales}
    />
  );

  /* ───────────── PANEL INTERNO ───────────── */
  const panelInterno = (
    <>
      <AsideCard title="Resumen">
        <AsideRow label="Estado">
          <Chip size="small" label={estadoConfig.label} color={estadoConfig.color} />
        </AsideRow>
        <AsideRow label="Número">
          <Typography variant="body2" fontWeight={600}>
            {documento.numero}/{documento.anio}
          </Typography>
        </AsideRow>
        <AsideRow label="Fecha">
          <Typography variant="body2">
            {documento.fecha ? dayjs(documento.fecha).format('DD/MM/YYYY') : '—'}
          </Typography>
        </AsideRow>
        {/* Dato interno: ya no se imprime en la factura */}
        <AsideRow label="Origen">
          <Typography variant="body2">
            {origen ? `Generada desde presupuesto ${origen.numero}/${origen.anio}` : 'Factura manual'}
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

        {documento.estado === 'emitida' && (
          <Button
            fullWidth
            variant="outlined"
            color="warning"
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
            disabled={busy}
            sx={{ mt: 1.5 }}
          >
            Editar factura
          </Button>
        )}

        {documento.estado === 'emitida' && (
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<EuroIcon />}
            onClick={() => setConfirmPay(true)}
            disabled={busy}
            sx={{ mt: 1.5 }}
          >
            Marcar como pagada
          </Button>
        )}

        {origen && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<RequestQuoteIcon />}
            onClick={() => navigate(`/admin/presupuestos/${origen.id}/preview`)}
            sx={{ mt: 1 }}
          >
            Ver presupuesto {origen.numero}/{origen.anio}
          </Button>
        )}
      </AsideCard>

      <HistorialEnvios envios={envios} />

      <AsideCard title="Cliente">
        <Typography fontWeight={600}>{cliente?.nombre || '—'}</Typography>
        <Typography variant="body2" color="text.secondary">
          {contacto?.email || 'Sin email'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {contacto?.telefono || 'Sin teléfono'}
        </Typography>

        <Button
          fullWidth
          size="small"
          startIcon={<ShareIcon />}
          onClick={() => setShareOpen(true)}
          disabled={busy}
          sx={{ mt: 1.5 }}
        >
          Compartir con el cliente
        </Button>
      </AsideCard>
    </>
  );

  return (
    <>
      <PreviewToolbar
        backLabel="Facturas"
        onBack={goBack}
        title={`Factura ${documento.numero}/${documento.anio}`}
        chip={<Chip size="small" label={estadoConfig.label} color={estadoConfig.color} />}
        actions={
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handlePdf(true)}
              disabled={busy}
            >
              Descargar PDF
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={() => setShareOpen(true)}
              disabled={busy}
            >
              Compartir
            </Button>
          </>
        }
      />

      <PreviewLayout document={documentoCliente} aside={panelInterno} />

      <ShareDialog
        open={shareOpen}
        title="Compartir factura"
        description="¿Cómo quieres enviar la factura?"
        contacto={contacto}
        emisorEmail={emisor?.email}
        loading={shareLoading}
        error={shareError}
        onClose={() => {
          setShareOpen(false);
          setShareError('');
        }}
        onEmail={(datos) => handleShare('email', datos)}
        onWhatsapp={(datos) => handleShare('whatsapp', datos)}
      />

      <EditarFacturaDialog
        open={editOpen}
        factura={{ id: Number(id), ...documento, cliente }}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          await loadPreview();
          showFeedback('Factura actualizada. Si el cliente ya la tenía, vuelve a enviársela.', 'info');
        }}
      />

      <ConfirmActionDialog
        open={confirmPay}
        loading={paying}
        title="Marcar factura como pagada"
        description={`¿Confirmas que se ha cobrado la factura ${documento.numero}/${documento.anio} por ${formatEuro(documento.total)}?`}
        confirmText="Marcar pagada"
        confirmColor="success"
        onClose={() => setConfirmPay(false)}
        onConfirm={handleMarkAsPaid}
      />

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedback.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
}
