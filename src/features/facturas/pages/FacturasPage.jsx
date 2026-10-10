import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Pagination,
  Paper,
  TextField,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import EuroIcon from '@mui/icons-material/Euro';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

import {
  getFacturas,
  marcarFacturaPagada,
} from '../services/facturas.service';
import ConfirmActionDialog from '../../../common/ConfirmActionDialog';
import dayjs from 'dayjs';
import { getEstadoFacturaConfig, ESTADOS_FACTURA } from '../facturaEstados';
import { formatEuro } from '../../presupuestos/presupuestoEstados';
import FacturaForm from './FacturaForm';
import EditarFacturaDialog from '../components/EditarFacturaDialog';

export default function FacturasPage() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // factura pendiente a la que cambiar IVA/fecha
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  const theme = useTheme();
  // Tarjetas en móvil y tablet; tabla desde 900px. Emisor y origen solo en pantallas grandes.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const navigate = useNavigate();

  const loadFacturas = useCallback(() => {
    setLoading(true);
    getFacturas({
      page: paginationModel.page + 1,
      per_page: paginationModel.pageSize,
      estado: estadoFiltro,
      search: debouncedSearch,
    })
      .then((result) => {
        setRows(result.data ?? []);
        setRowCount(result.total ?? 0);
      })
      .catch((e) => {
        console.error(e);
        setFeedback({ open: true, severity: 'error', message: 'No se pudieron cargar las facturas' });
      })
      .finally(() => setLoading(false));
  }, [paginationModel, estadoFiltro, debouncedSearch]);

  useEffect(() => {
    loadFacturas();
  }, [loadFacturas]);

  // Búsqueda con retardo
  useEffect(() => {
    if (search === debouncedSearch) return undefined;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

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
    if (!selectedFactura) return;

    try {
      setProcessing(true);
      await marcarFacturaPagada(selectedFactura.id);
      showFeedback('Factura marcada como pagada correctamente');
      loadFacturas();
    } catch (error) {
      console.error(error);
      showFeedback(
        error.response?.data?.message || 'No se pudo marcar la factura como pagada',
        'error'
      );
    } finally {
      setProcessing(false);
      setSelectedFactura(null);
    }
  };

  const verFactura = (factura) => navigate(`/admin/facturas/${factura.id}/preview`);

  // Estado clicable: abre la vista de la factura
  const renderEstadoChip = (factura, sx) => {
    const config = getEstadoFacturaConfig(factura.estado);
    return (
      <Tooltip title={`${config.label} · Ver factura ${factura.numero}/${factura.anio}`}>
        <Chip
          size="small"
          label={config.label}
          color={config.color}
          clickable
          onClick={(e) => {
            e.stopPropagation();
            verFactura(factura);
          }}
          sx={sx}
        />
      </Tooltip>
    );
  };

  // Acciones con tooltip que explica cada una
  const renderAcciones = (factura) => (
    <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
      <Tooltip title="Ver factura (vista previa, PDF y compartir)">
        <IconButton size="small" onClick={() => verFactura(factura)}>
          <VisibilityIcon />
        </IconButton>
      </Tooltip>

      {factura.estado === 'emitida' && (
        <Tooltip title="Editar factura (fecha, IVA y textos legales)">
          <IconButton
            size="small"
            color="warning"
            onClick={() => setEditTarget(factura)}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      )}

      {factura.estado === 'emitida' && (
        <Tooltip title="Marcar como pagada (ya no se podrá editar)">
          <IconButton
            size="small"
            color="success"
            onClick={() => setSelectedFactura(factura)}
          >
            <EuroIcon />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  const columns = [
    {
      field: 'numero_compuesto',
      headerName: 'Nº',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ lineHeight: 1.3 }}>
          <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {params.row.numero}/{params.row.anio}
          </Typography>
          {!isWide && params.row.fecha && (
            <Typography variant="caption" color="text.secondary" display="block">
              {dayjs(params.row.fecha).format('DD/MM/YYYY')}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'cliente',
      headerName: 'Cliente',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => params.row?.cliente?.nombre || '',
    },
    {
      field: 'emisor',
      headerName: 'Emisor',
      flex: 1,
      renderCell: (params) => params.row?.emisor?.nombre || '',
    },
    {
      field: 'origen',
      headerName: 'Origen',
      width: 180,
      renderCell: (params) => {
        if (!params.row?.presupuesto_id) return 'Manual';

        return (
          <Link
            component="button"
            variant="body2"
            underline="hover"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/presupuestos/${params.row.presupuesto_id}/preview`);
            }}
          >
            Presupuesto {params.row.presupuesto?.numero || ''}/{params.row.presupuesto?.anio || ''}
          </Link>
        );
      },
    },
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 120,
      // El API devuelve ISO (2026-10-09T00:00:00.000000Z): se muestra como 09/10/2026
      renderCell: (params) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY') : '',
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) =>
        params.value != null ? formatEuro(params.value) : '',
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => renderEstadoChip(params.row),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      renderCell: (params) => renderAcciones(params.row),
    },
  ];

  // En portátiles pequeños se ocultan emisor y origen para que la tabla quepa sin scroll
  const columnasVisibles = columns.filter((c) => isWide || !['emisor', 'origen', 'fecha'].includes(c.field));
  const totalPaginas = Math.max(1, Math.ceil(rowCount / paginationModel.pageSize));

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h5">Facturas</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Nueva factura
        </Button>
      </Box>

      {/* FILTROS */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar por nº (3 o 3/2026) o cliente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1.5 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {[['', 'Todas'], ...Object.entries(ESTADOS_FACTURA).map(([k, v]) => [k, v.label])].map(([valor, label]) => (
            <Chip
              key={valor || 'todas'}
              size="small"
              label={label}
              color={estadoFiltro === valor ? 'primary' : 'default'}
              variant={estadoFiltro === valor ? 'filled' : 'outlined'}
              onClick={() => {
                setEstadoFiltro(valor);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
            />
          ))}
        </Stack>
      </Paper>

      {isMobile && loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {isMobile && !loading && rows.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={3}>
          No hay facturas
        </Typography>
      )}

      {isMobile && !loading && (
        <Stack spacing={2}>
          {rows.map((factura) => (
            <Box
              key={factura.id}
              onClick={() => verFactura(factura)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                cursor: 'pointer',
              }}
            >
              <Typography fontWeight={600}>
                {factura.numero}/{factura.anio}
              </Typography>
              <Typography>{factura.cliente?.nombre}</Typography>
              {factura.fecha && (
                <Typography variant="body2" color="text.secondary">
                  {dayjs(factura.fecha).format('DD/MM/YYYY')}
                </Typography>
              )}
              <Typography fontWeight={600}>{formatEuro(factura.total)}</Typography>
              {renderEstadoChip(factura, { mt: 1 })}

              <Stack direction="row" justifyContent="flex-end">
                {renderAcciones(factura)}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      {isMobile && totalPaginas > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPaginas}
            page={paginationModel.page + 1}
            onChange={(_, page) => setPaginationModel((prev) => ({ ...prev, page: page - 1 }))}
            size="small"
          />
        </Box>
      )}

      {!isMobile && (
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box>
            <DataGrid
              rows={rows}
              columns={columnasVisibles}
              loading={loading}
              autoHeight
              paginationMode="server"
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              disableColumnSorting
              disableColumnMenu
              localeText={{ noRowsLabel: 'No hay facturas' }}
              rowHeight={56}
              disableRowSelectionOnClick
              // Clic en la fila → vista de la factura (como en presupuestos)
              onRowClick={(params) => verFactura(params.row)}
              sx={{
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
              }}
            />
          </Box>
        </Box>
      )}

      <EditarFacturaDialog
        open={!!editTarget}
        factura={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          loadFacturas();
          showFeedback('Factura actualizada correctamente');
        }}
      />

      <FacturaForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSaved={() => {
          loadFacturas();
          showFeedback('Factura creada correctamente');
        }}
      />

      <ConfirmActionDialog
        open={!!selectedFactura}
        loading={processing}
        title="Marcar factura como pagada"
        description={`¿Deseas marcar como pagada la factura ${selectedFactura?.numero}/${selectedFactura?.anio}?`}
        confirmText="Marcar pagada"
        confirmColor="success"
        onClose={() => setSelectedFactura(null)}
        onConfirm={handleMarkAsPaid}
      />

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
    </Box>
  );
}
