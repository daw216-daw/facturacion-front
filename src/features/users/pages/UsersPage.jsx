import { useCallback, useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Pagination,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';

import {
  getUsers,
  deleteUser,
  reactivateUser,
} from '../services/users.service';
import { useAuth } from '../../auth/context/AuthContext';

import UserCard from './UserCard';
import UserForm from './UserForm';
import ConfirmActionDialog from '../../../common/ConfirmActionDialog';

const ROLES = { admin: 'Administrador', emisor: 'Emisor' };

export default function UsersPage() {
  const { user: usuarioActual } = useAuth();

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const [openForm, setOpenForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [userToAction, setUserToAction] = useState(null);
  const [accion, setAccion] = useState(null); // 'desactivar' | 'reactivar'
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, severity: 'success', message: '' });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const showFeedback = (message, severity = 'success') => setFeedback({ open: true, severity, message });

  const loadUsers = useCallback(() => {
    setLoading(true);
    getUsers({ page: paginationModel.page + 1, per_page: paginationModel.pageSize })
      .then((result) => {
        setRows(result.data ?? []);
        setRowCount(result.meta?.total ?? 0);
      })
      .catch((e) => {
        console.error(e);
        showFeedback('No se pudieron cargar los usuarios', 'error');
      })
      .finally(() => setLoading(false));
  }, [paginationModel]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const esYo = (u) => u?.id === usuarioActual?.id;

  const editar = (u) => {
    setSelectedUser(u);
    setOpenForm(true);
  };

  const pedirAccion = (u, tipo) => {
    setUserToAction(u);
    setAccion(tipo);
  };

  const cerrarAccion = () => {
    setUserToAction(null);
    setAccion(null);
  };

  const handleConfirm = async () => {
    if (!userToAction) return;
    try {
      setProcessing(true);
      if (accion === 'desactivar') {
        await deleteUser(userToAction.id);
        showFeedback('Usuario desactivado: se han cerrado sus sesiones', 'info');
      } else {
        await reactivateUser(userToAction.id);
        showFeedback('Usuario reactivado');
      }
      loadUsers();
    } catch (e) {
      console.error(e);
      const errores = e.response?.data?.errors;
      showFeedback(
        (errores && Object.values(errores)[0]?.[0]) || e.response?.data?.message || 'No se pudo completar la acción',
        'error'
      );
    } finally {
      setProcessing(false);
      cerrarAccion();
    }
  };

  /* ---------------- COLUMNAS ---------------- */

  const columns = [
    {
      field: 'name',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500} noWrap>
          {params.value}
          {esYo(params.row) && (
            <Typography component="span" variant="caption" color="text.secondary" ml={1}>
              (tú)
            </Typography>
          )}
        </Typography>
      ),
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'role',
      headerName: 'Rol',
      width: 140,
      renderCell: (params) => (
        <Chip
          size="small"
          label={ROLES[params.value] ?? params.value}
          color={params.value === 'admin' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'emisor',
      headerName: 'Emisor asociado',
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => {
        if (params.row.role !== 'emisor') {
          return <Typography variant="body2" color="text.disabled">—</Typography>;
        }
        return (
          <Typography variant="body2" color={params.row.emisor ? 'text.primary' : 'warning.main'} noWrap>
            {params.row.emisor?.nombre ?? 'Sin asignar'}
          </Typography>
        );
      },
    },
    { field: 'activo', headerName: 'Activo', width: 80, type: 'boolean' },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Editar usuario">
            <IconButton size="small" onClick={() => editar(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>

          {params.row.activo ? (
            !esYo(params.row) && (
              <Tooltip title="Desactivar usuario (cierra sus sesiones)">
                <IconButton size="small" color="error" onClick={() => pedirAccion(params.row, 'desactivar')}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )
          ) : (
            <Tooltip title="Reactivar usuario">
              <IconButton size="small" color="success" onClick={() => pedirAccion(params.row, 'reactivar')}>
                <RestoreIcon />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

  const totalPaginas = Math.max(1, Math.ceil(rowCount / paginationModel.pageSize));

  /* ---------------- RENDER ---------------- */

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
        <Typography variant="h5">Usuarios</Typography>

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => editar(null)}>
          {isMobile ? 'Nuevo' : 'Nuevo usuario'}
        </Button>
      </Box>

      {/* MÓVIL → TARJETAS */}
      {isMobile && (
        <>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          <Stack spacing={2}>
            {!loading && rows.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onEdit={editar}
                onDeactivate={(x) => (esYo(x) ? showFeedback('No puedes desactivar tu propio usuario', 'warning') : pedirAccion(x, 'desactivar'))}
                onReactivate={(x) => pedirAccion(x, 'reactivar')}
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

      {/* TABLET / ESCRITORIO → TABLA */}
      {!isMobile && (
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
          disableRowSelectionOnClick
          disableColumnSorting
          disableColumnMenu
          localeText={{ noRowsLabel: 'No hay usuarios' }}
          getRowClassName={(params) => (params.row.activo ? '' : 'fila-inactiva')}
          sx={{
            '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
            '& .fila-inactiva': { opacity: 0.55 },
          }}
        />
      )}

      <UserForm
        open={openForm}
        user={selectedUser}
        onClose={() => setOpenForm(false)}
        onSaved={() => {
          loadUsers();
          showFeedback('Usuario guardado');
        }}
      />

      <ConfirmActionDialog
        open={!!accion}
        loading={processing}
        title={accion === 'desactivar' ? 'Desactivar usuario' : 'Reactivar usuario'}
        description={
          accion === 'desactivar'
            ? `¿Deseas desactivar a "${userToAction?.name}"? No podrá iniciar sesión y se cerrarán sus sesiones abiertas.`
            : `¿Deseas reactivar a "${userToAction?.name}"?`
        }
        confirmText={accion === 'desactivar' ? 'Desactivar' : 'Reactivar'}
        confirmColor={accion === 'desactivar' ? 'error' : 'success'}
        onClose={cerrarAccion}
        onConfirm={handleConfirm}
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
