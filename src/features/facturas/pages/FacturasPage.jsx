import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import PaidIcon from '@mui/icons-material/Paid';

import {
  getFacturas,
  marcarFacturaPagada,
} from '../services/facturas.service';
import ConfirmActionDialog from '../../../common/ConfirmActionDialog';
import FacturaForm from './FacturaForm';

export default function FacturasPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const loadFacturas = () => {
    setLoading(true);
    getFacturas()
      .then((result) => {
        setRows(result.data ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFacturas();
  }, []);

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

  const columns = [
    {
      field: 'numero_compuesto',
      headerName: 'Nº',
      width: 130,
      renderCell: (params) => (
        <>
          {params.row
            ? `${params.row.numero}/${params.row.anio}`
            : ''}
        </>
      ),
    },
    {
      field: 'cliente',
      headerName: 'Cliente',
      flex: 1,
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

        return `Presupuesto ${params.row.presupuesto?.numero || ''}/${params.row.presupuesto?.anio || ''}`;
      },
    },
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 120,
      renderCell: (params) => params.value || '',
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
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={params.value === 'pagada' ? 'success' : 'warning'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            onClick={() => navigate(`/admin/facturas/${params.row.id}/preview`)}
          >
            <VisibilityIcon />
          </IconButton>

          {params.row.estado === 'emitida' && (
            <IconButton
              size="small"
              color="success"
              onClick={() => setSelectedFactura(params.row)}
            >
              <PaidIcon />
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
        <Typography variant="h5">Facturas</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Nueva factura
        </Button>
      </Box>

      {isMobile && (
        <Stack spacing={2}>
          {rows.map((factura) => (
            <Box
              key={factura.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography fontWeight={600}>
                {factura.numero}/{factura.anio}
              </Typography>
              <Typography>{factura.cliente?.nombre}</Typography>
              <Typography>{Number(factura.total).toFixed(2)} €</Typography>
              <Chip size="small" label={factura.estado} sx={{ mt: 1 }} />

              <Stack direction="row" justifyContent="flex-end">
                <IconButton
                  size="small"
                  onClick={() => navigate(`/admin/facturas/${factura.id}/preview`)}
                >
                  <VisibilityIcon />
                </IconButton>

                {factura.estado === 'emitida' && (
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => setSelectedFactura(factura)}
                  >
                    <PaidIcon />
                  </IconButton>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

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
