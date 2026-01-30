import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  IconButton,
  Button,
  Chip,
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

import UserCard from './UserCard';
import UserForm from './UserForm';
import ConfirmActionDialog from '../../../common/ConfirmActionDialog';

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);

  const [openForm, setOpenForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [openDeactivate, setOpenDeactivate] = useState(false);
  const [openReactivate, setOpenReactivate] = useState(false);
  const [userToAction, setUserToAction] = useState(null);
  const [processing, setProcessing] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const loadUsers = () => {
    setLoading(true);
    getUsers().then((result) => {
      setRows(result.data);
      setMeta(result.meta);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* ---------------- COLUMNS ---------------- */

  const columnsDesktop = [
    { field: 'name', headerName: 'Nombre', minWidth: 200, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 220, flex: 1 },
    {
      field: 'role',
      headerName: 'Rol',
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={params.value === 'admin' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'activo',
      headerName: 'Activo',
      width: 90,
      type: 'boolean',
    },
  ];

  const columnsTablet = [
    { field: 'name', headerName: 'Nombre', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'activo', headerName: 'Activo', width: 90, type: 'boolean' },
  ];

  const columns = isTablet ? columnsTablet : columnsDesktop;

  const columnsWithActions = [
    ...columns,
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedUser(params.row);
              setOpenForm(true);
            }}
          >
            <EditIcon />
          </IconButton>

          {params.row.activo ? (
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setUserToAction(params.row);
                setOpenDeactivate(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          ) : (
            <IconButton
              size="small"
              color="success"
              onClick={() => {
                setUserToAction(params.row);
                setOpenReactivate(true);
              }}
            >
              <RestoreIcon />
            </IconButton>
          )}
        </>
      ),
    },
  ];

  /* ---------------- HANDLERS ---------------- */

  const handleDeactivate = async () => {
    if (!userToAction) return;
    try {
      setProcessing(true);
      await deleteUser(userToAction.id);
      loadUsers();
    } finally {
      setProcessing(false);
      setOpenDeactivate(false);
    }
  };

  const handleReactivate = async () => {
    if (!userToAction) return;
    try {
      setProcessing(true);
      await reactivateUser(userToAction.id);
      loadUsers();
    } finally {
      setProcessing(false);
      setOpenReactivate(false);
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <Box sx={{ width: '100%' }}>
      {/* HEADER */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h5">Usuarios</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedUser(null);
            setOpenForm(true);
          }}
        >
          Nuevo usuario
        </Button>
      </Box>

      {/* MOBILE → CARDS */}
      {isMobile && (
        <Stack spacing={2}>
          {rows.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={(u) => {
                setSelectedUser(u);
                setOpenForm(true);
              }}
              onDeactivate={(u) => {
                setUserToAction(u);
                setOpenDeactivate(true);
              }}
              onReactivate={(u) => {
                setUserToAction(u);
                setOpenReactivate(true);
              }}
            />
          ))}
        </Stack>
      )}

      {/* DESKTOP / TABLET → DATAGRID */}
      {!isMobile && (
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: 900 }}>
            <DataGrid
              rows={rows}
              columns={columnsWithActions}
              loading={loading}
              autoHeight
              pageSizeOptions={[10]}
              disableRowSelectionOnClick
            />
          </Box>
        </Box>
      )}

      {/* FORM */}
      <UserForm
        open={openForm}
        user={selectedUser}
        onClose={() => setOpenForm(false)}
        onSaved={loadUsers}
      />

      {/* CONFIRM DESACTIVATE */}
      <ConfirmActionDialog
        open={openDeactivate}
        loading={processing}
        title="Desactivar usuario"
        description={`¿Deseas desactivar a "${userToAction?.name}"?`}
        confirmText="Desactivar"
        confirmColor="error"
        onClose={() => setOpenDeactivate(false)}
        onConfirm={handleDeactivate}
      />

      {/* CONFIRM REACTIVATE */}
      <ConfirmActionDialog
        open={openReactivate}
        loading={processing}
        title="Reactivar usuario"
        description={`¿Deseas reactivar a "${userToAction?.name}"?`}
        confirmText="Reactivar"
        confirmColor="success"
        onClose={() => setOpenReactivate(false)}
        onConfirm={handleReactivate}
      />
    </Box>
  );
}
