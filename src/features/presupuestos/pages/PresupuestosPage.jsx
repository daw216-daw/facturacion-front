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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import dayjs from 'dayjs';


import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';

import {
  getPresupuestos,
  enviarPresupuesto,
  aceptarPresupuesto,
  rechazarPresupuesto,
  desactivarPresupuesto,
  facturarPresupuesto,
  sendPresupuestoEmail,
  getPresupuestoWhatsappLink,
} from '../services/presupuestos.service';
import ConfirmActionDialog from '../../../common/ConfirmActionDialog';
import PresupuestoForm from './PresupuestoForm';


export default function PresupuestosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // enviar | aceptar | rechazar | desactivar | facturar
  const [processing, setProcessing] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    severity: 'success',
    message: '',
  });


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

  const actionConfig = {
    enviar: {
      title: 'Enviar presupuesto',
      description: '¿Deseas marcar este presupuesto como enviado y luego compartir su PDF?',
      confirmText: 'Enviar',
      confirmColor: 'primary',
    },
    aceptar: {
      title: 'Aceptar presupuesto',
      description: '¿Deseas marcar este presupuesto como aceptado para poder facturarlo?',
      confirmText: 'Aceptar',
      confirmColor: 'success',
    },
    rechazar: {
      title: 'Rechazar presupuesto',
      description: '¿Deseas marcar este presupuesto como rechazado para revisarlo y permitir su edición?',
      confirmText: 'Rechazar',
      confirmColor: 'error',
    },
    desactivar: {
      title: 'Desactivar presupuesto',
      description: '¿Deseas desactivar este presupuesto? Quedará cerrado y ya no se podrá compartir ni facturar.',
      confirmText: 'Desactivar',
      confirmColor: 'warning',
    },
    facturar: {
      title: 'Facturar presupuesto',
      description: '¿Deseas convertir este presupuesto en factura?',
      confirmText: 'Facturar',
      confirmColor: 'success',
    },
  };

  const currentActionConfig = action
    ? actionConfig[action]
    : actionConfig.enviar;

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

  const handleConfirmAction = async () => {
    if (!selected) return;

    try {
      setProcessing(true);

      if (action === 'enviar') {
        await enviarPresupuesto(selected.id);
        setShareTarget(selected);
      }

      if (action === 'aceptar') {
        await aceptarPresupuesto(selected.id);
        showFeedback('Presupuesto aceptado correctamente');
      }

      if (action === 'rechazar') {
        await rechazarPresupuesto(selected.id);
        showFeedback('Presupuesto rechazado correctamente');
      }

      if (action === 'desactivar') {
        await desactivarPresupuesto(selected.id);
        showFeedback('Presupuesto desactivado correctamente', 'info');
      }

      if (action === 'facturar') {
        await facturarPresupuesto(selected.id);
        showFeedback('Factura generada correctamente');
      }

      loadPresupuestos();
    } catch (e) {
      console.error(e);
      showFeedback(
        e.response?.data?.message || 'Error al procesar el presupuesto',
        'error'
      );
    } finally {
      setProcessing(false);
      setSelected(null);
      setAction(null);
    }
  };

  const handleShare = async (channel) => {
    if (!shareTarget) return;

    try {
      setShareLoading(true);

      if (channel === 'email') {
        const response = await sendPresupuestoEmail(shareTarget.id);
        showFeedback(
          response.message || 'Presupuesto enviado por email correctamente'
        );
      }

      if (channel === 'whatsapp') {
        const response = await getPresupuestoWhatsappLink(shareTarget.id);
        window.open(response.whatsapp_url, '_blank', 'noopener,noreferrer');
      }

      loadPresupuestos();
    } catch (e) {
      console.error(e);
      showFeedback(
        e.response?.data?.message ||
          'No se pudo compartir el presupuesto',
        'error'
      );
    } finally {
      setShareLoading(false);
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
                  : params.value === 'rechazado'
                    ? 'error'
                    : 'warning'
          }
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 240,
      sortable: false,
      renderCell: (params) => (
        <>
          {/* PREVIEW */}
          <Tooltip title="Ver detalle">
            <IconButton
              size="small"
              onClick={() => navigate(`/admin/presupuestos/${params.row.id}/preview`)}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          {/* EDITAR (borrador o rechazado) */}
          {(params.row.estado === 'borrador' || params.row.estado === 'rechazado') && (
            <Tooltip title="Editar presupuesto">
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
            </Tooltip>
          )}

          {/* ENVIAR / COMPARTIR */}
          {['borrador', 'rechazado', 'enviado', 'aceptado'].includes(params.row.estado) && (
            <Tooltip title={
              params.row.estado === 'borrador' || params.row.estado === 'rechazado'
                ? 'Enviar presupuesto'
                : 'Compartir (email / WhatsApp)'
            }>
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  if (params.row.estado === 'borrador' || params.row.estado === 'rechazado') {
                    setSelected(params.row);
                    setAction('enviar');
                    return;
                  }
                  setShareTarget(params.row);
                }}
              >
                <SendIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* ACEPTAR */}
          {params.row.estado === 'enviado' && (
            <Tooltip title="Aceptar presupuesto">
              <IconButton
                size="small"
                color="success"
                onClick={() => {
                  setSelected(params.row);
                  setAction('aceptar');
                }}
              >
                <CheckCircleIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* RECHAZAR */}
          {params.row.estado === 'enviado' && (
            <Tooltip title="Rechazar presupuesto">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setSelected(params.row);
                  setAction('rechazar');
                }}
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* FACTURAR */}
          {params.row.estado === 'aceptado' && (
            <Tooltip title="Convertir en factura">
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
            </Tooltip>
          )}

          {/* DESACTIVAR */}
          {params.row.estado !== 'desactivado' && !params.row.factura && (
            <Tooltip title="Desactivar presupuesto">
              <IconButton
                size="small"
                color="inherit"
                onClick={() => {
                  setSelected(params.row);
                  setAction('desactivar');
                }}
              >
                <BlockIcon />
              </IconButton>
            </Tooltip>
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

              <Stack direction="row" justifyContent="flex-end" flexWrap="wrap">
                <Tooltip title="Ver detalle">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/admin/presupuestos/${p.id}/preview`)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>

                {(p.estado === 'borrador' || p.estado === 'rechazado') && (
                  <Tooltip title="Editar presupuesto">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => {
                        setSelectedPresupuesto(p);
                        setOpenForm(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {['borrador', 'rechazado', 'enviado', 'aceptado'].includes(p.estado) && (
                  <Tooltip title={
                    p.estado === 'borrador' || p.estado === 'rechazado'
                      ? 'Enviar presupuesto'
                      : 'Compartir (email / WhatsApp)'
                  }>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        if (p.estado === 'borrador' || p.estado === 'rechazado') {
                          setSelected(p);
                          setAction('enviar');
                          return;
                        }
                        setShareTarget(p);
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {p.estado === 'enviado' && (
                  <Tooltip title="Aceptar presupuesto">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => {
                        setSelected(p);
                        setAction('aceptar');
                      }}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {p.estado === 'enviado' && (
                  <Tooltip title="Rechazar presupuesto">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelected(p);
                        setAction('rechazar');
                      }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {p.estado === 'aceptado' && (
                  <Tooltip title="Convertir en factura">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => {
                        setSelected(p);
                        setAction('facturar');
                      }}
                    >
                      <ReceiptIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {p.estado !== 'desactivado' && !p.factura && (
                  <Tooltip title="Desactivar presupuesto">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelected(p);
                        setAction('desactivar');
                      }}
                    >
                      <BlockIcon />
                    </IconButton>
                  </Tooltip>
                )}
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
        title={currentActionConfig.title}
        description={currentActionConfig.description}
        confirmText={currentActionConfig.confirmText}
        confirmColor={currentActionConfig.confirmColor}
        onClose={() => {
          setSelected(null);
          setAction(null);
        }}
        onConfirm={handleConfirmAction}
      />

      <Dialog
        open={!!shareTarget}
        onClose={() => !shareLoading && setShareTarget(null)}
      >
        <DialogTitle>Compartir presupuesto</DialogTitle>

        <DialogContent>
          <Typography sx={{ mb: 1.5 }}>
            El presupuesto ya está listo para compartirse. ¿Cómo quieres enviar el PDF?
          </Typography>

          {shareTarget?.cliente?.email && (
            <Typography variant="body2">
              Email cliente: {shareTarget.cliente.email}
            </Typography>
          )}

          {shareTarget?.cliente?.telefono && (
            <Typography variant="body2">
              Teléfono cliente: {shareTarget.cliente.telefono}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setShareTarget(null)}
            disabled={shareLoading}
          >
            Cerrar
          </Button>

          <Button
            startIcon={<EmailIcon />}
            onClick={() => handleShare('email')}
            disabled={shareLoading}
          >
            Enviar email
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={() => handleShare('whatsapp')}
            disabled={shareLoading}
          >
            WhatsApp
          </Button>
        </DialogActions>
      </Dialog>

      <PresupuestoForm
        open={openForm}
        presupuesto={selectedPresupuesto}
        onClose={() => setOpenForm(false)}
        onSaved={loadPresupuestos}
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
