import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';

import { getSeries } from '../services/series.service';
import SerieForm from './SerieForm';

const TIPOS = {
  presupuesto: { label: 'Presupuesto', color: 'primary' },
  factura: { label: 'Factura', color: 'secondary' },
};

function TipoChip({ tipo }) {
  const config = TIPOS[tipo] ?? { label: tipo, color: 'default' };
  return <Chip size="small" variant="outlined" label={config.label} color={config.color} />;
}

export default function SeriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const anioActual = new Date().getFullYear();

  const loadSeries = () => {
    setLoading(true);
    getSeries()
      .then((data) => setRows(Array.isArray(data) ? data : data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSeries();
  }, []);

  // Hace falta una serie de presupuesto y otra de factura para el año en curso
  const faltan = ['presupuesto', 'factura'].filter(
    (tipo) => !rows.some((s) => s.tipo === tipo && Number(s.anio) === anioActual)
  );

  const columns = [
    { field: 'tipo', headerName: 'Tipo', width: 160, renderCell: (params) => <TipoChip tipo={params.value} /> },
    { field: 'anio', headerName: 'Año', width: 120 },
    { field: 'ultimo_numero', headerName: 'Último número', flex: 1, minWidth: 140 },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="h5">Series</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          {isMobile ? 'Nueva' : 'Nueva serie'}
        </Button>
      </Box>

      {!loading && faltan.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Falta la serie de {faltan.join(' y ')} de {anioActual}: sin ella no se pueden numerar documentos de este año.
        </Alert>
      )}

      {/* MÓVIL → TARJETAS */}
      {isMobile && (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {rows.length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={3}>
                No hay series
              </Typography>
            )}
            {rows.map((serie) => (
              <Paper key={serie.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TipoChip tipo={serie.tipo} />
                    <Typography fontWeight={600}>{serie.anio}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Último nº: <strong>{serie.ultimo_numero}</strong>
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )
      )}

      {/* TABLET / ESCRITORIO → TABLA */}
      {!isMobile && (
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          localeText={{ noRowsLabel: 'No hay series' }}
          sx={{ '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' } }}
        />
      )}

      <SerieForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSaved={loadSeries}
      />
    </Box>
  );
}
