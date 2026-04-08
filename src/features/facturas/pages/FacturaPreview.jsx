import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaidIcon from '@mui/icons-material/Paid';
import dayjs from 'dayjs';

import {
  getFacturaPreview,
  marcarFacturaPagada,
} from '../services/facturas.service';

export default function FacturaPreview() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    severity: 'success',
    message: '',
  });
  const navigate = useNavigate();

  const loadPreview = async () => {
    const response = await getFacturaPreview(id);
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
    }
  };

  if (loading) return <CircularProgress />;
  if (!data) return <Typography>Error al cargar la factura</Typography>;

  const { documento, cliente, emisor, texto_legal, origen } = data;

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
          onClick={() => navigate('/admin/facturas')}
        >
          Volver a facturas
        </Button>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {documento.estado === 'emitida' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PaidIcon />}
              onClick={handleMarkAsPaid}
              disabled={paying}
            >
              Marcar pagada
            </Button>
          )}
        </Stack>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
        <Box mb={3}>
          <Typography variant="h4" fontWeight={600}>
            Factura {documento.numero}/{documento.anio}
          </Typography>

          <Stack direction="row" spacing={1} mt={1} alignItems="center">
            <Chip
              size="small"
              label={documento.estado}
              color={documento.estado === 'pagada' ? 'success' : 'warning'}
            />

            {documento.fecha && (
              <Typography variant="subtitle1">
                Fecha: {dayjs(documento.fecha).format('DD/MM/YYYY')}
              </Typography>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>
              Emisor
            </Typography>

            {emisor?.nombre && <Typography>{emisor.nombre}</Typography>}
            {emisor?.nif && <Typography>{emisor.nif}</Typography>}
            {emisor?.email && <Typography>{emisor.email}</Typography>}
            {emisor?.telefono && <Typography>{emisor.telefono}</Typography>}
            {emisor?.iban && <Typography>IBAN: {emisor.iban}</Typography>}
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

        {origen && (
          <>
            <Typography variant="h6" gutterBottom>
              Origen
            </Typography>
            <Typography sx={{ mb: 3 }}>
              Generada desde presupuesto {origen.numero}/{origen.anio}
            </Typography>
            <Divider sx={{ my: 3 }} />
          </>
        )}

        <Typography variant="h6" gutterBottom>
          Resumen económico
        </Typography>

        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography>Base imponible: {documento.base_imponible} €</Typography>
          <Typography>IVA ({documento.iva_porcentaje}%): {documento.iva_importe} €</Typography>
          <Typography variant="h5" fontWeight={600}>
            Total: {documento.total} €
          </Typography>
        </Stack>

        {texto_legal?.trim() && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box
              sx={{ mt: 4, fontSize: 14 }}
              dangerouslySetInnerHTML={{ __html: texto_legal }}
            />
          </>
        )}
      </Paper>

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
