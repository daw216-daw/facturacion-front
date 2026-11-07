import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import { useAuth } from '../features/auth/context/AuthContext';
import { getMisPresupuestos } from '../features/emisor/services/emisorPresupuestos.service';
import { getMisFacturas } from '../features/emisor/services/emisorFacturas.service';

export default function EmisorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      getMisPresupuestos({ per_page: 1 }),
      getMisFacturas({ per_page: 1, estado: 'emitida' }),
    ])
      .then(([presupuestos, facturas]) => {
        if (cancelado) return;
        setResumen({
          presupuestosPendientes: presupuestos?.contadores?.aceptado ?? 0,
          facturasPendientes: facturas?.total ?? 0,
        });
      })
      .catch((e) => console.error(e))
      .finally(() => !cancelado && setLoading(false));

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Bienvenido{user?.name ? `, ${user.name}` : ''}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {user?.emisor?.nombre
          ? `Aquí puedes ver los presupuestos y facturas de ${user.emisor.nombre}.`
          : 'Aquí puedes ver tus presupuestos y facturas.'}
      </Typography>

      {loading ? (
        <CircularProgress size={28} />
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardActionArea onClick={() => navigate('/emisor/presupuestos')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RequestQuoteIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {resumen?.presupuestosPendientes ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Presupuestos pendientes de facturar
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined">
              <CardActionArea onClick={() => navigate('/emisor/facturas')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ReceiptLongIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {resumen?.facturasPendientes ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Facturas pendientes de cobro
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
