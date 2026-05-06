import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

import { getDocumentoTextos } from '../services/documentoTextos.service';
import DocumentoTextoForm from '../components/DocumentoTextoForm';

function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
}

function TipoChip({ tipo }) {
  return (
    <Chip
      label={tipo === 'presupuesto' ? 'Presupuesto' : 'Factura'}
      color={tipo === 'presupuesto' ? 'primary' : 'success'}
      size="small"
      variant="outlined"
    />
  );
}

function ActivoChip({ activo }) {
  return activo ? (
    <Chip
      icon={<CheckCircleOutlineIcon />}
      label="Activo"
      color="success"
      size="small"
      variant="filled"
    />
  ) : (
    <Chip
      icon={<CancelOutlinedIcon />}
      label="Inactivo"
      color="default"
      size="small"
      variant="outlined"
    />
  );
}

export default function DocumentoTextosPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDocumentoTextos();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    {
      field: 'id',
      headerName: '#',
      width: 60,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 140,
      renderCell: (params) => <TipoChip tipo={params.value} />,
    },
    {
      field: 'contenido',
      headerName: 'Contenido',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title={stripHtml(params.value).slice(0, 200)} placement="top">
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {stripHtml(params.value) || '—'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'activo',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => <ActivoChip activo={params.value} />,
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Editar">
          <IconButton
            size="small"
            color="primary"
            onClick={() => setSelected(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* HEADER */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Textos legales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configura los textos legales que aparecerán en presupuestos y facturas
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setSelected({ tipo: 'presupuesto', contenido: '', activo: true })}
        >
          Nuevo texto legal
        </Button>
      </Box>

      {/* DESKTOP — DataGrid */}
      {!isMobile && (
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={{
            '& .MuiDataGrid-cell': { alignItems: 'center' },
            '& .MuiDataGrid-row:hover': { cursor: 'default' },
          }}
        />
      )}

      {/* MOBILE — Cards */}
      {isMobile && (
        <Stack spacing={2}>
          {rows.map((item) => (
            <Card key={item.id} variant="outlined">
              <CardContent sx={{ pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Stack direction="row" spacing={1}>
                    <TipoChip tipo={item.tipo} />
                    <ActivoChip activo={item.activo} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    #{item.id}
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {stripHtml(item.contenido) || '—'}
                </Typography>
              </CardContent>

              <Divider />

              <CardActions sx={{ justifyContent: 'flex-end', px: 2 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setSelected(item)}
                >
                  Editar
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {/* MODAL */}
      {selected && (
        <DocumentoTextoForm
          texto={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            loadData();
          }}
        />
      )}
    </Box>
  );
}
