import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  Divider,
  Link,
  Snackbar,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';

import {
  getPresupuestoPreview,
  getPresupuestoPdf,
  sendPresupuestoEmail,
  getPresupuestoWhatsappLink,
} from '../services/presupuestos.service';
import { getEstadoConfig, formatEuro, htmlToText } from '../presupuestoEstados';
import PresupuestoForm from './PresupuestoForm';
import ShareDialog from '../../../common/ShareDialog';
import HistorialEnvios from '../../../common/documentPreview/HistorialEnvios';
import { abrirWhatsapp } from '../../../common/whatsapp';
import PresupuestoDocumentSheet from '../components/PresupuestoDocumentSheet';
import { RichText } from '../../../common/documentPreview/DocumentSheet';
import {
  PreviewToolbar,
  PreviewLayout,
  AsideCard,
  AsideRow,
  PreviewSkeleton,
  PreviewError,
} from '../../../common/documentPreview/PreviewShell';

export default function PresupuestoPreview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  const loadPreview = useCallback(async () => {
    const response = await getPresupuestoPreview(id);
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

  const goBack = () => navigate('/admin/presupuestos');

  // Objeto estable: PresupuestoForm recarga sus datos cuando cambia esta referencia
  const presupuestoForm = useMemo(
    () => (data ? { id: Number(id), estado: data.documento.estado, anio: data.documento.anio } : null),
    [data, id]
  );

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

  const {
    documento,
    cliente,
    emisor,
    textos_legales = [],
    factura,
    facturado,
    editable,
    envios = [],
  } = data;

  const estadoConfig = getEstadoConfig({ estado: documento.estado, facturado });
  const hayObservaciones = htmlToText(documento.observaciones ?? '') !== '';
  // Igual que el PDF: solo se imprimen si se marcó "mostrar"
  const observacionesEnPdf = hayObservaciones && !!documento.mostrar_observaciones;
  const busy = pdfLoading || shareLoading;

  const handlePdf = async (download = false) => {
    try {
      setPdfLoading(true);

      const blob = await getPresupuestoPdf(id, { download });
      const pdfUrl = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );

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

  // datos: { email, copia_emisor } o { telefono } (destinatario editable en el diálogo)
  const handleShare = async (channel, datos = {}) => {
    try {
      setShareLoading(true);
      setShareError('');

      if (channel === 'email') {
        const response = await sendPresupuestoEmail(id, datos);
        showFeedback(response.message || 'Presupuesto enviado por email correctamente');
      }

      if (channel === 'whatsapp') {
        await abrirWhatsapp(() => getPresupuestoWhatsappLink(id, datos));
        showFeedback('Se ha abierto WhatsApp con el mensaje: revísalo y pulsa enviar.', 'info');
      }

      setShareOpen(false);
      // Compartir puede pasar el presupuesto a "enviado" y añade una línea al historial
      await loadPreview();
    } catch (error) {
      console.error(error);
      const errores = error.response?.data?.errors;
      // El error se muestra dentro del diálogo (p. ej. "es un teléfono fijo")
      setShareError(
        (errores && Object.values(errores)[0]?.[0]) ||
          error.response?.data?.message ||
          error.message ||
          'No se pudo compartir el presupuesto'
      );
      // Un fallo de email queda en el historial
      loadPreview().catch(() => {});
    } finally {
      setShareLoading(false);
    }
  };

  const handleSaved = async (saved) => {
    await loadPreview();

    if (saved?.requiere_reenvio) {
      showFeedback('Presupuesto actualizado. Reenvíalo para que el cliente tenga la última versión.', 'info');
      setShareOpen(true);
      return;
    }

    showFeedback('Presupuesto guardado correctamente');
  };

  /* ───────────── DOCUMENTO (igual que el PDF) ───────────── */
  const documentoCliente = (
    <PresupuestoDocumentSheet
      documento={documento}
      cliente={cliente}
      emisor={emisor}
      textos_legales={textos_legales}
    />
  );

  /* ───────────── PANEL INTERNO (no lo ve el cliente) ───────────── */
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
            onClick={() => navigate(`/admin/facturas/${factura.id}/preview`)}
            sx={{ mt: 1.5 }}
          >
            Ver factura {factura.numero}/{factura.anio}
          </Button>
        )}

        {!editable && !factura && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Este presupuesto está desactivado y no se puede editar.
          </Typography>
        )}
        {facturado && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Facturado: ya no se puede editar.
          </Typography>
        )}
      </AsideCard>

      <HistorialEnvios envios={envios} />

      <AsideCard title="Cliente">
        <Typography fontWeight={600}>{cliente?.nombre || '—'}</Typography>
        <Typography variant="body2" color="text.secondary">
          {cliente?.email || 'Sin email'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {cliente?.telefono || 'Sin teléfono'}
        </Typography>

        {documento.estado !== 'desactivado' && (
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
        )}
      </AsideCard>

      {hayObservaciones && !observacionesEnPdf && (
        <AsideCard
          title="Observaciones internas"
          action={<Chip size="small" variant="outlined" label="No salen en el PDF" />}
        >
          <RichText html={documento.observaciones} sx={{ color: 'text.primary', fontSize: 14 }} />
        </AsideCard>
      )}

      {observacionesEnPdf && (
        <Alert severity="info" variant="outlined">
          Las observaciones están marcadas para mostrarse en el presupuesto del cliente.
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary" px={0.5}>
        Este panel es interno: el estado y estos datos no aparecen en el PDF.{' '}
        <Link component="button" variant="caption" onClick={() => handlePdf(true)}>
          Descargar el PDF real
        </Link>
      </Typography>
    </>
  );

  return (
    <>
      <PreviewToolbar
        backLabel="Presupuestos"
        onBack={goBack}
        title={`Presupuesto ${documento.numero}/${documento.anio}`}
        chip={<Chip size="small" label={estadoConfig.label} color={estadoConfig.color} />}
        actions={
          <>
            {editable && (
              <Button
                size="small"
                color="warning"
                startIcon={<EditIcon />}
                onClick={() => setFormOpen(true)}
                disabled={busy}
              >
                Editar
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handlePdf(true)}
              disabled={busy}
            >
              Descargar PDF
            </Button>
            {documento.estado !== 'desactivado' && (
              <Button
                size="small"
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={() => setShareOpen(true)}
                disabled={busy}
              >
                Compartir
              </Button>
            )}
          </>
        }
      />

      <PreviewLayout document={documentoCliente} aside={panelInterno} />

      <ShareDialog
        open={shareOpen}
        title="Compartir presupuesto"
        description={
          ['borrador', 'rechazado'].includes(documento.estado)
            ? 'Al compartirlo, el presupuesto pasará a estado "Enviado". ¿Cómo quieres enviar el PDF?'
            : '¿Cómo quieres enviar el PDF?'
        }
        contacto={{ email: cliente?.email, telefono: cliente?.telefono }}
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

      <PresupuestoForm
        open={formOpen}
        presupuesto={presupuestoForm}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
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
