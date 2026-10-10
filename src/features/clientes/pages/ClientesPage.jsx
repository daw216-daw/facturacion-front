import { useCallback, useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Pagination,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';

import { getClientes, deleteCliente, reactivateCliente } from '../services/clientes.service';
import ClienteCard from './ClienteCard';
import ConfirmActionDialog from './ConfirmActionDialog';
import ClienteForm from './ClienteForm';

const TIPOS = { particular: 'Particular', comunidad: 'Comunidad', empresa: 'Empresa' };

export default function ClientesPage() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Columnas completas solo en pantallas grandes; en tablet y portátil pequeño, las básicas
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));

  const [openForm, setOpenForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [clienteToReactivate, setClienteToReactivate] = useState(null);
  const [reactivating, setReactivating] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, severity: 'success', message: '' });

  const showFeedback = (message, severity = 'success') => setFeedback({ open: true, severity, message });

  const loadClientes = useCallback(() => {
    setLoading(true);
    getClientes({
      page: paginationModel.page + 1,
      per_page: paginationModel.pageSize,
      search: debouncedSearch,
    })
      .then((result) => {
        setRows(result.data ?? []);
        setRowCount(result.meta?.total ?? 0);
      })
      .catch((e) => {
        console.error(e);
        showFeedback('No se pudieron cargar los clientes', 'error');
      })
      .finally(() => setLoading(false));
  }, [paginationModel, debouncedSearch]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  // Búsqueda con retardo
  useEffect(() => {
    if (search === debouncedSearch) return undefined;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const editar = (cliente) => {
    setSelectedCliente(cliente);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;

    try {
      setDeleting(true);
      await deleteCliente(clienteToDelete.id);
      showFeedback('Cliente desactivado', 'info');
      setClienteToDelete(null);
      loadClientes();
    } catch (error) {
      console.error(error);
      showFeedback(error.response?.data?.message || 'Error al desactivar el cliente', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleReactivate = async () => {
    if (!clienteToReactivate) return;

    try {
      setReactivating(true);
      await reactivateCliente(clienteToReactivate.id);
      showFeedback('Cliente reactivado');
      setClienteToReactivate(null);
      loadClientes();
    } catch (error) {
      console.error(error);
      showFeedback(error.response?.data?.message || 'Error al reactivar el cliente', 'error');
    } finally {
      setReactivating(false);
    }
  };

  const columnasBasicas = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ minWidth: 0, lineHeight: 1.3 }}>
          <Typography variant="body2" fontWeight={500} noWrap>{params.value}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {[TIPOS[params.row.tipo], params.row.nif].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
      ),
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 160 },
    { field: 'telefono', headerName: 'Teléfono', width: 130 },
  ];

  const columnasExtra = [
    { field: 'poblacion', headerName: 'Población', width: 140 },
    { field: 'provincia', headerName: 'Provincia', width: 130 },
  ];

  const columns = [
    ...columnasBasicas,
    ...(isWide ? columnasExtra : []),
    { field: 'activo', headerName: 'Activo', width: 80, type: 'boolean' },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Editar cliente">
            <IconButton size="small" onClick={() => editar(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>

          {params.row.activo ? (
            <Tooltip title="Desactivar cliente (no se borra)">
              <IconButton size="small" color="error" onClick={() => setClienteToDelete(params.row)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Reactivar cliente">
              <IconButton size="small" color="success" onClick={() => setClienteToReactivate(params.row)}>
                <RestoreIcon />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

  const totalPaginas = Math.max(1, Math.ceil(rowCount / paginationModel.pageSize));

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
        <Typography variant="h5">Clientes</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => editar(null)}
        >
          {isMobile ? 'Nuevo' : 'Nuevo cliente'}
        </Button>
      </Box>

      <TextField
        size="small"
        fullWidth
        placeholder="Buscar por nombre, NIF, email o población…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
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

      {/* MÓVIL → TARJETAS */}
      {isMobile && (
        <>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {!loading && rows.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No hay clientes
            </Typography>
          )}

          <Stack spacing={2}>
            {!loading && rows.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onEdit={editar}
                onDelete={setClienteToDelete}
                onReactivate={setClienteToReactivate}
              />
            ))}
          </Stack>

          {totalPaginas > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPaginas}
                page={paginationModel.page + 1}
                onChange={(_, page) => setPaginationModel((prev) => ({ ...prev, page: page - 1 }))}
                size="small"
              />
            </Box>
          )}
        </>
      )}

      {/* TABLET / ESCRITORIO → TABLA (las columnas se adaptan al ancho) */}
      {!isMobile && (
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          autoHeight
          rowHeight={56}
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          disableColumnSorting
          disableColumnMenu
          localeText={{ noRowsLabel: 'No hay clientes' }}
          getRowClassName={(params) => (params.row.activo ? '' : 'fila-inactiva')}
          sx={{
            '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
            '& .fila-inactiva': { opacity: 0.55 },
          }}
        />
      )}

      <ClienteForm
        open={openForm}
        cliente={selectedCliente}
        onClose={() => setOpenForm(false)}
        onSaved={() => {
          loadClientes();
          showFeedback('Cliente guardado');
        }}
      />

      <ConfirmActionDialog
        open={!!clienteToDelete}
        loading={deleting}
        title="Desactivar cliente"
        description={`¿Seguro que deseas desactivar a "${clienteToDelete?.nombre}"? No se borra: sus presupuestos y facturas se conservan.`}
        confirmText="Desactivar"
        confirmColor="error"
        onClose={() => setClienteToDelete(null)}
        onConfirm={handleDelete}
      />

      <ConfirmActionDialog
        open={!!clienteToReactivate}
        loading={reactivating}
        title="Reactivar cliente"
        description={`¿Deseas reactivar a "${clienteToReactivate?.nombre}"?`}
        confirmText="Reactivar"
        confirmColor="success"
        onClose={() => setClienteToReactivate(null)}
        onConfirm={handleReactivate}
      />

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== 'clickaway' && setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
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
