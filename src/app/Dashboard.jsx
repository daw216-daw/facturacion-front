import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import BusinessIcon from '@mui/icons-material/Business';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import GavelIcon from '@mui/icons-material/Gavel';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

import { getDashboard } from '../features/dashboard/services/dashboard.service';
import { ESTADOS_PRESUPUESTO, formatEuro } from '../features/presupuestos/presupuestoEstados';
import { ESTADOS_FACTURA } from '../features/facturas/facturaEstados';

/* Tarjeta de indicador principal */
function KpiCard({ icon, label, value, detail, color = 'primary', onClick }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s',
        '&:hover': onClick ? { borderColor: `${color}.main` } : undefined,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Box sx={{ color: `${color}.main`, display: 'flex' }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
      </Stack>

      <Typography variant="h5" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>

      {detail && (
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      )}
    </Paper>
  );
}

/* Desglose por estado: chip + nº de registros + importe */
function DesgloseEstados({ title, estados, datos, onVer }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        {onVer && (
          <Button size="small" onClick={onVer}>
            Ver todos
          </Button>
        )}
      </Stack>

      <Stack divider={<Divider flexItem />}>
        {Object.entries(estados).map(([estado, config]) => (
          <Stack
            key={estado}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            py={1}
          >
            <Chip
              size="small"
              label={config.label}
              color={config.color}
              variant={estado === 'desactivado' ? 'outlined' : 'filled'}
            />
            <Stack direction="row" spacing={2} alignItems="baseline">
              <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {datos?.[estado]?.total ?? 0}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 110, textAlign: 'right' }}
              >
                {formatEuro(datos?.[estado]?.importe ?? 0)}
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

/* Tarjeta pequeña de configuración */
function MiniCard({ icon, label, value, detail, onClick }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{ p: 1.5, height: '100%', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {label}{detail ? ` · ${detail}` : ''}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => {
        console.error(e);
        setError('No se pudieron cargar los datos del panel');
      })
      .finally(() => setLoading(false));
  }, []);

  const { presupuestos, facturas, clientes, emisores, usuarios, documento_textos: textos, series } = data ?? {};
  const pendienteCobro = facturas?.por_estado?.emitida;

  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
          mb: 2,
        }}
      >
        Panel
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {data && (
        <Stack spacing={2}>
          {/* ───────────── INDICADORES PRINCIPALES ───────────── */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                icon={<RequestQuoteIcon />}
                label="Presupuestos"
                value={presupuestos.total}
                detail={`${formatEuro(presupuestos.importe)} presupuestado`}
                onClick={() => navigate('/admin/presupuestos')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                icon={<ReceiptLongIcon />}
                label="Facturas"
                value={facturas.total}
                detail={`${formatEuro(facturas.importe)} facturado`}
                color="secondary"
                onClick={() => navigate('/admin/facturas')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                icon={<HourglassBottomIcon />}
                label="Pendiente de cobro"
                value={formatEuro(pendienteCobro?.importe ?? 0)}
                detail={`${pendienteCobro?.total ?? 0} facturas emitidas sin pagar`}
                color="warning"
                onClick={() => navigate('/admin/facturas')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                icon={<PeopleIcon />}
                label="Clientes"
                value={clientes.total}
                detail={`${clientes.activos} activos`}
                color="success"
                onClick={() => navigate('/admin/clientes')}
              />
            </Grid>
          </Grid>

          {/* ───────────── DESGLOSE POR ESTADO ───────────── */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <DesgloseEstados
                title="Presupuestos por estado"
                estados={ESTADOS_PRESUPUESTO}
                datos={presupuestos.por_estado}
                onVer={() => navigate('/admin/presupuestos')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <DesgloseEstados
                title="Facturas por estado"
                estados={ESTADOS_FACTURA}
                datos={facturas.por_estado}
                onVer={() => navigate('/admin/facturas')}
              />
              <Typography variant="caption" color="text.secondary" display="block" mt={1} px={0.5}>
                {facturas.desde_presupuesto} de {facturas.total} facturas generadas desde un presupuesto
              </Typography>
            </Grid>
          </Grid>

          {/* ───────────── CONFIGURACIÓN ───────────── */}
          <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Configuración
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <MiniCard
                icon={<BusinessIcon />}
                label="Emisores"
                value={emisores.total}
                onClick={() => navigate('/admin/emisores')}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MiniCard
                icon={<ManageAccountsIcon />}
                label="Usuarios"
                value={usuarios.total}
                detail={`${usuarios.activos} activos`}
                onClick={() => navigate('/admin/users')}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MiniCard
                icon={<GavelIcon />}
                label="Textos legales"
                value={textos.total}
                detail={`${textos.activos} activos`}
                onClick={() => navigate('/admin/documento-textos')}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <MiniCard
                icon={<FormatListNumberedIcon />}
                label="Series"
                value={series.total}
                detail={`${series.anio_actual} de ${new Date().getFullYear()}`}
                onClick={() => navigate('/admin/series')}
              />
            </Grid>
          </Grid>

          {/* Hace falta una serie de presupuesto y otra de factura por año */}
          {series.anio_actual < 2 && (
            <Alert severity="warning">
              Faltan series de numeración para {new Date().getFullYear()}: se necesita una de presupuesto y otra de factura para poder emitirlos este año.
            </Alert>
          )}
        </Stack>
      )}
    </Box>
  );
}
