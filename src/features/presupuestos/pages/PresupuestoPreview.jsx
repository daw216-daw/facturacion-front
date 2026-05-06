import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  Grid,
  Button,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  getPresupuestoPreview,
  getPresupuestoPdf,
  sendPresupuestoEmail,
  getPresupuestoWhatsappLink,
} from '../services/presupuestos.service';
import dayjs from 'dayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';


export default function PresupuestoPreview() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    severity: 'success',
    message: '',
  });
  const navigate = useNavigate();

  const loadPreview = async () => {
    const response = await getPresupuestoPreview(id);
    setData(response);
    return response;
  };

  useEffect(() => {
    loadPreview().finally(() => setLoading(false));
  }, [id]);

  const showFeedback = (message, severity = 'success') => {
    setFeedback({
      open: true,
      severity,
      message,
    });
  };

  const handleCloseFeedback = (_, reason) => {
    if (reason === 'clickaway') return;

    setFeedback((prev) => ({
      ...prev,
      open: false,
    }));
  };

  if (loading) return <CircularProgress />;
  if (!data) return <Typography>Error al cargar el documento</Typography>;

  const { documento, cliente, emisor, textos_legales = [] } = data;

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
        link.download = `presupuesto-${documento.numero}-${documento.anio}.pdf`;
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

  const handleShare = async (channel) => {
    try {
      setShareLoading(true);

      if (channel === 'email') {
        const response = await sendPresupuestoEmail(id);
        showFeedback(
          response.message || 'Presupuesto enviado por email correctamente'
        );
      }

      if (channel === 'whatsapp') {
        const response = await getPresupuestoWhatsappLink(id);
        window.open(response.whatsapp_url, '_blank', 'noopener,noreferrer');
      }

      await loadPreview();
    } catch (error) {
      console.error(error);
      showFeedback(
        error.response?.data?.message ||
          'No se pudo compartir el presupuesto',
        'error'
      );
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          maxWidth: 900,
          mx: 'auto',
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/presupuestos')}
        >
          Volver a presupuestos
        </Button>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => handlePdf(false)}
            disabled={pdfLoading || shareLoading}
          >
            Ver PDF
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={<DownloadIcon />}
            onClick={() => handlePdf(true)}
            disabled={pdfLoading || shareLoading}
          >
            Descargar PDF
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<EmailIcon />}
            onClick={() => handleShare('email')}
            disabled={pdfLoading || shareLoading}
          >
            Enviar email
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={() => handleShare('whatsapp')}
            disabled={pdfLoading || shareLoading}
          >
            WhatsApp
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      {/* ───────────── CABECERA ───────────── */}
 

      <Box mb={3}>
        <Typography variant="h4" fontWeight={600}>
          Presupuesto {documento.numero}/{documento.anio}
        </Typography>

        {documento.fecha && (
          <Typography variant="subtitle1">
            Fecha: {dayjs(documento.fecha).format('DD/MM/YYYY')}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* ───────────── EMISOR / CLIENTE ───────────── */}
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>
            Emisor
          </Typography>

          {emisor?.nombre && <Typography>{emisor.nombre}</Typography>}
          {emisor?.nif && <Typography>{emisor.nif}</Typography>}
          {emisor?.email && <Typography>{emisor.email}</Typography>}
          {emisor?.telefono && <Typography>{emisor.telefono}</Typography>}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>
            Cliente
          </Typography>

          {cliente?.nombre && <Typography>{cliente.nombre}</Typography>}
          {cliente?.nif && <Typography>{cliente.nif}</Typography>}
          {cliente?.direccion && <Typography>{cliente.direccion}</Typography>}
          {(cliente?.cp || cliente?.poblacion) && (
            <Typography>
              {cliente.cp} {cliente.poblacion}
              {cliente.provincia ? `, ${cliente.provincia}` : ''}
            </Typography>
          )}
          {cliente?.email && <Typography>{cliente.email}</Typography>}
          {cliente?.telefono && <Typography>{cliente.telefono}</Typography>}
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* ───────────── DESCRIPCIÓN ───────────── */}
      {documento.descripcion?.trim() && (
        <>
          <Typography variant="h6" gutterBottom>
            Trabajos a realizar:
          </Typography>

          <Box
            sx={{ mb: 3 }}
            dangerouslySetInnerHTML={{ __html: documento.descripcion }}
          />

          <Divider sx={{ my: 3 }} />
        </>
      )}

      {/* ───────────── OBSERVACIONES ───────────── */}
      {documento.observaciones?.trim() && (
        <>
          <Typography variant="h6" gutterBottom>
            Observaciones internas:
          </Typography>

          <Box
            sx={{ mb: 3 }}
            dangerouslySetInnerHTML={{ __html: documento.observaciones }}
          />

          <Divider sx={{ my: 3 }} />
        </>
      )}

      {/* ───────────── TOTAL ───────────── */}
      {documento.total && (
        <>
          <Typography variant="h5" fontWeight={600}>
            PRECIO DE MANO DE OBRA Y MATERIALES: {documento.total} €
          </Typography>

          <Divider sx={{ my: 3 }} />
        </>
      )}

      {/* ───────────── TEXTOS LEGALES ───────────── */}
      {textos_legales.map((texto, i) => (
        <Box
          key={i}
          sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: 14 }}
          dangerouslySetInnerHTML={{ __html: texto }}
        />
      ))}
    </Paper>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
