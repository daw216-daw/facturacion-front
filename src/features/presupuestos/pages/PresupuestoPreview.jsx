import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  Grid,
} from '@mui/material';
import { getPresupuestoPreview } from '../services/presupuestos.service';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Button } from '@mui/material';


export default function PresupuestoPreview() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    getPresupuestoPreview(id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <CircularProgress />;
  if (!data) return <Typography>Error al cargar el documento</Typography>;

  const { documento, cliente, emisor, texto_legal } = data;

  return (
 <>
      <Box sx={{ maxWidth: 900, mx: 'auto', mb: 2 }}>
  <Button
    startIcon={<ArrowBackIcon />}
    onClick={() => navigate('/admin/presupuestos')}
  >
    Volver a presupuestos
  </Button>
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

      {/* ───────────── TEXTO LEGAL ───────────── */}
      {texto_legal?.trim() && (
        <Box
          sx={{ mt: 4, fontSize: 14 }}
          dangerouslySetInnerHTML={{ __html: texto_legal }}
        />
      )}
    </Paper>
  </>
  );
 
}
