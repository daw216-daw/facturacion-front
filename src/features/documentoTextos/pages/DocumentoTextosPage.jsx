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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { getDocumentoTextos } from '../services/documentoTextos.service';
import DocumentoTextoForm from '../components/DocumentoTextoForm';
import DocumentoTextoPreview from '../components/DocumentoTextoPreview';
import { getTituloDoc } from '../../../common/TextosLegalesSelector';

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
  const [verTexto, setVerTexto] = useState(null); // texto cuyo contenido se muestra completo
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
      field: 'titulo',
      headerName: 'Título / contenido',
      flex: 1,
      minWidth: 260,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minWidth: 0, lineHeight: 1.3 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {getTituloDoc(params.row)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {stripHtml(params.row.contenido) || '—'}
          </Typography>
        </Box>
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
      headerName: 'Acciones',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Ver contenido">
            <IconButton size="small" onClick={() => setVerTexto(params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              color="primary"
              onClick={() => setSelected(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
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
          onClick={() => setSelected({ tipo: 'presupuesto', titulo: '', contenido: '', activo: true })}
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
          rowHeight={60}
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

                <Typography variant="subtitle2" fontWeight={600} mt={1}>
                  {getTituloDoc(item)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
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
                  startIcon={<VisibilityIcon />}
                  onClick={() => setVerTexto(item)}
                >
                  Ver
                </Button>
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

      {/* VER CONTENIDO */}
      <Dialog open={!!verTexto} onClose={() => setVerTexto(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {verTexto && getTituloDoc(verTexto)}
          {verTexto && (
            <Stack direction="row" spacing={1} mt={0.5}>
              <TipoChip tipo={verTexto.tipo} />
              <ActivoChip activo={verTexto.activo} />
            </Stack>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {verTexto && <DocumentoTextoPreview html={verTexto.contenido} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerTexto(null)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setSelected(verTexto);
              setVerTexto(null);
            }}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>

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
