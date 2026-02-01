import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';

import { getSeries } from '../services/series.service';
import SerieForm from './SerieForm';

export default function SeriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const loadSeries = () => {
    setLoading(true);
    getSeries()
      .then(setRows)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const columns = [
    { field: 'tipo', headerName: 'Tipo', width: 150 },
    { field: 'anio', headerName: 'Año', width: 120 },
    { field: 'ultimo_numero', headerName: 'Último número', width: 160 },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h5">Series</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Nueva serie
        </Button>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[10]}
      />

      <SerieForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSaved={loadSeries}
      />
    </Box>
  );
}
