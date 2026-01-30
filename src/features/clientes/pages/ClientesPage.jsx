import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  IconButton,
} from '@mui/material';

import { getClientes } from '../services/clientes.service';
import ClienteCard from './ClienteCard';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmActionDialog from './ConfirmActionDialog';
import { deleteCliente } from '../services/clientes.service';
import { reactivateCliente } from '../services/clientes.service';
import RestoreIcon from '@mui/icons-material/Restore';



import ClienteForm from './ClienteForm';

export default function ClientesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [openForm, setOpenForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [openReactivate, setOpenReactivate] = useState(false);
  const [clienteToReactivate, setClienteToReactivate] = useState(null);
  const [reactivating, setReactivating] = useState(false);



  const loadClientes = () => {
    setLoading(true);
    getClientes().then((result) => {
      setRows(result.data);
      setMeta(result.meta);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadClientes();
  }, []);
  const handleDelete = async () => {
    if (!clienteToDelete) return;

    try {
      setDeleting(true);
      await deleteCliente(clienteToDelete.id);
      setOpenDelete(false);
      setClienteToDelete(null);
      loadClientes(); // refrescar listado
    } catch (error) {
      console.error(error);
      alert('Error al desactivar el cliente');
    } finally {
      setDeleting(false);
    }
  };

  const handleReactivate = async () => {
    if (!clienteToReactivate) return;

    try {
      setReactivating(true);
      await reactivateCliente(clienteToReactivate.id);
      setOpenReactivate(false);
      setClienteToReactivate(null);
      loadClientes();
    } catch (error) {
      console.error(error);
      alert('Error al reactivar el cliente');
    } finally {
      setReactivating(false);
    }
  };




  const columnsDesktop = [
    // { field: 'id', headerName: 'ID', width: 100 },
    { field: 'tipo', headerName: 'Tipo', width: 100 },
    { field: 'nif', headerName: 'NIF', width: 140 },
    { field: 'nombre', headerName: 'Nombre', minWidth: 200, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 200, flex: 1 },
    { field: 'telefono', headerName: 'Teléfono', minWidth: 150 },
    { field: 'direccion', headerName: 'Dirección', minWidth: 220 },
    { field: 'provincia', headerName: 'Provincia', minWidth: 140 },
    { field: 'poblacion', headerName: 'Ciudad', minWidth: 140 },
    { field: 'activo', headerName: 'Activo', width: 90, type: 'boolean' },
  ];

  const columnsTablet = [
    // { field: 'id', headerName: 'ID', width: 100 },
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'telefono', headerName: 'Teléfono', width: 150 },
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
              setSelectedCliente(params.row);
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
                setClienteToDelete(params.row);
                setOpenDelete(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          ) : (
            <IconButton
              size="small"
              color="success"
              onClick={() => {
                setClienteToReactivate(params.row);
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
        <Typography variant="h5">
          Clientes
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedCliente(null);
            setOpenForm(true);
          }}
        >
          Nuevo cliente
        </Button>
      </Box>



      {/* MOBILE → CARDS */}
      {isMobile && (
        <Stack spacing={2}>
          {rows.map((cliente) => (
            <ClienteCard
              cliente={cliente}
              onEdit={(c) => {
                setSelectedCliente(c);
                setOpenForm(true);
              }}
              onDelete={(c) => {
                setClienteToDelete(c);
                setOpenDelete(true);
              }}
              onReactivate={(c) => {
                setClienteToReactivate(c);
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
            // columns={columnsWithActions}
            />
          </Box>
        </Box>
      )}
      <ClienteForm
        open={openForm}
        cliente={selectedCliente}
        onClose={() => setOpenForm(false)}
        onSaved={loadClientes}
      />
     <ConfirmActionDialog
  open={openDelete}
  loading={deleting}
  title="Desactivar cliente"
  description={`¿Seguro que deseas desactivar a "${clienteToDelete?.nombre}"?`}
  confirmText="Desactivar"
  confirmColor="error"
  onClose={() => setOpenDelete(false)}
  onConfirm={handleDelete}
/>

  <ConfirmActionDialog
  open={openReactivate}
  loading={reactivating}
  title="Reactivar cliente"
  description={`¿Deseas reactivar a "${clienteToReactivate?.nombre}"?`}
  confirmText="Reactivar"
  confirmColor="success"
  onClose={() => setOpenReactivate(false)}
  onConfirm={handleReactivate}
/>

    </Box>

  );

}
