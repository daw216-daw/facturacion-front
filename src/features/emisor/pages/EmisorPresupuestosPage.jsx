import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import dayjs from 'dayjs';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';

import { getMisPresupuestos } from '../services/emisorPresupuestos.service';
import { FILTROS_ESTADO, getEstadoConfig, formatEuro, htmlToText } from '../../presupuestos/presupuestoEstados';

export default function EmisorPresupuestosPage() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [feedback, setFeedback] = useState({ open: false, severity: 'error', message: '' });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const loadPresupuestos = useCallback(() => {
    setLoading(true);
    getMisPresupuestos({
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
        setFeedback({ open: true, severity: 'error', message: 'No se pudieron cargar los presupuestos' });
      })
      .finally(() => setLoading(false));
  }, [paginationModel, estadoFiltro, debouncedSearch]);

  // Mismo patrón que FacturasPage.jsx/PresupuestosPage.jsx (admin): cargar en el montaje y
  // cuando cambian filtros/paginación. La regla set-state-in-effect es experimental y aquí
  // da un falso positivo (el mismo patrón, en un componente con más hooks, no lo dispara).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPresupuestos();
  }, [loadPresupuestos]);

  // Búsqueda con retardo
  useEffect(() => {
    if (search === debouncedSearch) return undefined;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const verPresupuesto = (presupuesto) => navigate(`/emisor/presupuestos/${presupuesto.id}`);

  const renderEstadoChip = (presupuesto, sx) => {
    const config = getEstadoConfig(presupuesto);
    return <Chip size="small" label={config.label} color={config.color} sx={sx} />;
  };

  const columns = [
    {
      field: 'numero_compuesto',
      headerName: 'Nº',
      width: 110,
      renderCell: (params) => (
        <Box sx={{ lineHeight: 1.3 }}>
          <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {params.row.numero}/{params.row.anio}
          </Typography>
          {params.row.fecha && (
            <Typography variant="caption" color="text.secondary" display="block">
              {dayjs(params.row.fecha).format('DD/MM/YYYY')}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'cliente',
      headerName: 'Cliente / trabajos',
      flex: 1,
      minWidth: 220,
      renderCell: (params) => (
        <Box sx={{ lineHeight: 1.3, py: 0.5 }}>
          <Typography variant="body2" noWrap>{params.row.cliente?.nombre || ''}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {htmlToText(params.row.descripcion ?? '')}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'total',
      headerName: 'Importe',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (params.value != null ? formatEuro(params.value) : ''),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 150,
      renderCell: (params) => renderEstadoChip(params.row),
    },
    {
      field: 'actions',
      headerName: 'Ver',
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="Ver presupuesto">
          <IconButton size="small" onClick={() => verPresupuesto(params.row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const totalPaginas = Math.max(1, Math.ceil(rowCount / paginationModel.pageSize));

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Mis presupuestos</Typography>

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
          {FILTROS_ESTADO.map(({ value, label }) => (
            <Chip
              key={value || 'todos'}
              size="small"
              label={label}
              color={estadoFiltro === value ? 'primary' : 'default'}
              variant={estadoFiltro === value ? 'filled' : 'outlined'}
              onClick={() => {
                setEstadoFiltro(value);
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
          No hay presupuestos
        </Typography>
      )}

      {isMobile && !loading && (
        <Stack spacing={2}>
          {rows.map((presupuesto) => (
            <Box
              key={presupuesto.id}
              onClick={() => verPresupuesto(presupuesto)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                cursor: 'pointer',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography fontWeight={600}>{presupuesto.numero}/{presupuesto.anio}</Typography>
                {renderEstadoChip(presupuesto)}
              </Stack>
              <Typography>{presupuesto.cliente?.nombre}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {htmlToText(presupuesto.descripcion ?? '')}
              </Typography>
              {presupuesto.fecha && (
                <Typography variant="body2" color="text.secondary">
                  {dayjs(presupuesto.fecha).format('DD/MM/YYYY')}
                </Typography>
              )}
              <Typography fontWeight={600}>{formatEuro(presupuesto.total)}</Typography>
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
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            autoHeight
            paginationMode="server"
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            disableColumnSorting
            disableColumnMenu
            disableRowSelectionOnClick
            rowHeight={56}
            localeText={{ noRowsLabel: 'No hay presupuestos' }}
            onRowClick={(params) => verPresupuesto(params.row)}
            sx={{
              '& .MuiDataGrid-row': { cursor: 'pointer' },
              '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
            }}
          />
        </Box>
      )}

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={feedback.severity} variant="filled" sx={{ width: '100%' }}>
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
