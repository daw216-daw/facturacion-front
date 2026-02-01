import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

import { getEmisores } from '../services/emisores.service';
import EmisorForm from './EmisorForm';
import EmisorCard from '../components/EmisorCard';

export default function EmisoresPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedEmisor, setSelectedEmisor] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const loadEmisores = () => {
    setLoading(true);
    getEmisores()
      .then(setRows)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEmisores();
  }, []);

  const columns = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'nif', headerName: 'NIF', width: 150 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'telefono', headerName: 'Teléfono', width: 150 },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => {
            setSelectedEmisor(params.row);
            setOpenForm(true);
          }}
        >
          <EditIcon />
        </IconButton>
      ),
    },
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
        <Typography variant="h5">Emisores</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedEmisor(null);
            setOpenForm(true);
          }}
        >
          Nuevo emisor
        </Button>
      </Box>

      {/* MOBILE */}
      {isMobile && (
        <Stack spacing={2}>
          {rows.map((emisor) => (
            <EmisorCard
              key={emisor.id}
              emisor={emisor}
              onEdit={() => {
                setSelectedEmisor(emisor);
                setOpenForm(true);
              }}
            />
          ))}
        </Stack>
      )}

      {/* DESKTOP */}
      {!isMobile && (
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
        />
      )}

      <EmisorForm
        open={openForm}
        emisor={selectedEmisor}
        onClose={() => setOpenForm(false)}
        onSaved={loadEmisores}
      />
    </Box>
  );
}
