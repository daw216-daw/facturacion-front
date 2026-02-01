import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Stack,
  IconButton,
  Chip,
  Button,
} from '@mui/material';
import dayjs from 'dayjs';


import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditIcon from '@mui/icons-material/Edit';


import { getPresupuestos, enviarPresupuesto, facturarPresupuesto } from '../services/presupuestos.service';
import ConfirmActionDialog from '../../../common/ConfirmActionDialog';
import PresupuestoForm from './PresupuestoForm';


export default function PresupuestosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // enviar | facturar
  const [processing, setProcessing] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState(null);


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const loadPresupuestos = () => {
    setLoading(true);
    getPresupuestos()
      .then((result) => {
        setRows(result.data);
      })
      .finally(() => setLoading(false));
  };
  // console.log("lo que llega desde la api ", rows);

  useEffect(() => {
    loadPresupuestos();
  }, []);

  const handleConfirmAction = async () => {
    if (!selected) return;

    try {
      setProcessing(true);

      if (action === 'enviar') {
        await enviarPresupuesto(selected.id);
      }

      if (action === 'facturar') {
        await facturarPresupuesto(selected.id);
      }

      loadPresupuestos();
    } catch (e) {
      console.error(e);
      alert('Error al procesar el presupuesto');
    } finally {
      setProcessing(false);
      setSelected(null);
      setAction(null);
    }
  };

  const columns = [
    {
      field: 'numero_compuesto',
      headerName: 'Nº',
      width: 120,
      renderCell: (params) => (
        <>
          {params.row
            ? `${params.row.numero}/${params.row.anio}`
            : ''}
        </>
      ),
    }
    ,
    {
      field: 'cliente',
      headerName: 'Cliente',
      flex: 1,
      renderCell: (params) =>
        params.row?.cliente?.nombre || '',
    },
    {
      field: 'emisor',
      headerName: 'Emisor',
      flex: 1,
      renderCell: (params) =>
        params.row?.emisor?.nombre || '',
    }
    ,
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 120,
      renderCell: (params) =>
        params.value
          ? dayjs(params.value).format('DD/MM/YYYY')
          : '',
    },
    {
      field: 'total',
      headerName: 'Total (€)',
      width: 120,
      renderCell: (params) =>
        params.value != null
          ? `${Number(params.value).toFixed(2)} €`
          : '',
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={
            params.value === 'borrador'
              ? 'default'
              : params.value === 'enviado'
                ? 'info'
                : params.value === 'aceptado'
                  ? 'success'
                  : 'error'
          }
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <>
          {/* PREVIEW */}
          <IconButton
            size="small"
            onClick={() =>
              navigate(`/admin/presupuestos/${params.row.id}/preview`)
            }
          >
            <VisibilityIcon />
          </IconButton>

          {/* EDITAR (solo borrador) */}
          {params.row.estado === 'borrador' && (
            <IconButton
              size="small"
              color="warning"
              onClick={() => {
                setSelectedPresupuesto(params.row);
                setOpenForm(true);
              }}
            >
              <EditIcon />
            </IconButton>
          )}

          {/* ENVIAR */}
          {params.row.estado === 'borrador' && (
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setSelected(params.row);
                setAction('enviar');
              }}
            >
              <SendIcon />
            </IconButton>
          )}

          {/* FACTURAR */}
          {params.row.estado === 'aceptado' && (
            <IconButton
              size="small"
              color="success"
              onClick={() => {
                setSelected(params.row);
                setAction('facturar');
              }}
            >
              <ReceiptIcon />
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
        <Typography variant="h5">Presupuestos</Typography>

        <Button
          variant="contained"
          onClick={() => {
            setSelectedPresupuesto(null);
            setOpenForm(true);
          }}
        >
          Nuevo presupuesto
        </Button>

      </Box>

      {/* MOBILE */}
      {isMobile && (
        <Stack spacing={2}>
          {rows.map((p) => (
            <Box
              key={p.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography fontWeight={600}>
                {p.numero}/{p.anio}
              </Typography>
              <Typography>{p.cliente?.nombre}</Typography>
              <Typography>{p.total} €</Typography>
              <Chip size="small" label={p.estado} sx={{ mt: 1 }} />

              <Stack direction="row" justifyContent="flex-end">
                <IconButton
                  size="small"
                  onClick={() =>
                    navigate(`/admin/presupuestos/${p.id}/preview`)
                  }
                >
                  <VisibilityIcon />
                </IconButton>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      {/* DESKTOP */}
      {!isMobile && (
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box sx={{ minWidth: 900 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              autoHeight
              pageSizeOptions={[10]}
              disableRowSelectionOnClick
            />
          </Box>
        </Box>
      )}

      <ConfirmActionDialog
        open={!!action}
        loading={processing}
        title={
          action === 'enviar'
            ? 'Enviar presupuesto'
            : 'Facturar presupuesto'
        }
        description={
          action === 'enviar'
            ? '¿Deseas enviar este presupuesto al cliente?'
            : '¿Deseas convertir este presupuesto en factura?'
        }
        confirmText={action === 'enviar' ? 'Enviar' : 'Facturar'}
        confirmColor={action === 'enviar' ? 'primary' : 'success'}
        onClose={() => {
          setSelected(null);
          setAction(null);
        }}
        onConfirm={handleConfirmAction}
      />
      <PresupuestoForm
        open={openForm}
        presupuesto={selectedPresupuesto}
        onClose={() => setOpenForm(false)}
        onSaved={loadPresupuestos}
      />

    </Box>

  );
}
