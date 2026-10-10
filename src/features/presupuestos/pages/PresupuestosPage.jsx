import { useCallback, useEffect, useState } from 'react';
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
  Snackbar,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Link,
  Pagination,
  Paper,
  CircularProgress,
} from '@mui/material';
import dayjs from 'dayjs';

import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

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
import { getEmisores } from '../../emisores/services/emisores.service';
import ConfirmActionDialog from '../../../common/ConfirmActionDialog';
import PresupuestoForm from './PresupuestoForm';
import FacturarDialog from '../components/FacturarDialog';
import ShareDialog from '../../../common/ShareDialog';
import { abrirWhatsapp } from '../../../common/whatsapp';
import {
  FILTROS_ESTADO,
  getEstadoConfig,
  getEstadoVisual,
  formatEuro,
  htmlToText,
} from '../presupuestoEstados';

/**
 * Siguiente paso natural según el estado visual.
 * Se muestra como botón visible; el resto de acciones va en el menú ⋮.
 */
function getAccionPrincipal(row) {
  switch (getEstadoVisual(row)) {
    case 'borrador':
    case 'rechazado':
      return { action: 'enviar', label: 'Enviar', tooltip: 'Enviar el PDF por email o WhatsApp (pasará a "Enviado")', icon: <SendIcon fontSize="small" />, color: 'primary' };
    case 'enviado':
      return { action: 'aceptar', label: 'Aceptar', tooltip: 'El cliente lo ha aceptado: quedará pendiente de facturar', icon: <CheckCircleIcon fontSize="small" />, color: 'success' };
    case 'aceptado':
      return { action: 'facturar', label: 'Facturar', tooltip: 'Crear la factura eligiendo fecha, IVA y textos legales', icon: <ReceiptIcon fontSize="small" />, color: 'secondary' };
    case 'facturado':
      return { action: 'ver_factura', label: 'Factura', tooltip: 'Ver la factura de este presupuesto', icon: <ReceiptIcon fontSize="small" />, color: 'secondary' };
    default:
      return null;
  }
}

/**
 * Acciones secundarias del menú ⋮ (la principal no se repite).
 */
function getAccionesMenu(row) {
  const estado = getEstadoVisual(row);
  const principal = getAccionPrincipal(row)?.action;

  const acciones = [
    { action: 'ver', label: 'Ver detalle', icon: <VisibilityIcon fontSize="small" /> },
  ];

  if (row.editable) {
    acciones.push({ action: 'editar', label: 'Editar', icon: <EditIcon fontSize="small" /> });
  }

  if (['enviado', 'aceptado', 'facturado'].includes(estado)) {
    acciones.push({ action: 'compartir', label: 'Compartir (email / WhatsApp)', icon: <ShareIcon fontSize="small" /> });
  }

  if (estado === 'enviado') {
    acciones.push({ action: 'rechazar', label: 'Marcar como rechazado', icon: <CancelIcon fontSize="small" color="error" /> });
  }

  if (estado !== 'desactivado' && estado !== 'facturado') {
    acciones.push({ divider: true });
    acciones.push({ action: 'desactivar', label: 'Desactivar', icon: <BlockIcon fontSize="small" /> });
  }

  return acciones.filter((a) => a.divider || a.action !== principal);
}

const actionConfig = {
  enviar: {
    title: 'Enviar presupuesto',
    description: '¿Deseas marcar este presupuesto como enviado y luego compartir su PDF?',
    confirmText: 'Enviar',
    confirmColor: 'primary',
  },
  aceptar: {
    title: 'Aceptar presupuesto',
    description: '¿El cliente ha aceptado este presupuesto? Quedará pendiente de facturar.',
    confirmText: 'Aceptar',
    confirmColor: 'success',
  },
  rechazar: {
    title: 'Rechazar presupuesto',
    description: '¿El cliente ha rechazado este presupuesto? Podrás editarlo y volver a enviarlo.',
    confirmText: 'Rechazar',
    confirmColor: 'error',
  },
  desactivar: {
    title: 'Desactivar presupuesto',
    description: '¿Deseas desactivar este presupuesto? Quedará cerrado y ya no se podrá editar, compartir ni facturar.',
    confirmText: 'Desactivar',
    confirmColor: 'warning',
  },
  facturar: {
    title: 'Facturar presupuesto',
    description: '¿Deseas convertir este presupuesto en factura? Una vez facturado ya no se podrá editar.',
    confirmText: 'Facturar',
    confirmColor: 'success',
  },
};

export default function PresupuestosPage() {
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [contadores, setContadores] = useState({});
  const [loading, setLoading] = useState(true);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [variosEmisores, setVariosEmisores] = useState(false);

  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // enviar | aceptar | rechazar | desactivar | facturar
  const [processing, setProcessing] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [menu, setMenu] = useState({ anchor: null, row: null });
  const [feedback, setFeedback] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  const theme = useTheme();
  // Tarjetas en móvil y tablet; tabla desde 900px. La fecha va en su columna solo en pantallas grandes.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const navigate = useNavigate();

  const loadPresupuestos = useCallback(() => {
    setLoading(true);
    getPresupuestos({
      page: paginationModel.page + 1,
      per_page: paginationModel.pageSize,
      estado: estadoFiltro,
      search: debouncedSearch,
    })
      .then((result) => {
        setRows(result.data ?? []);
        setRowCount(result.total ?? 0);
        setContadores(result.contadores ?? {});
      })
      .catch((e) => {
        console.error(e);
        showFeedback('No se pudieron cargar los presupuestos', 'error');
      })
      .finally(() => setLoading(false));
  }, [paginationModel, estadoFiltro, debouncedSearch]);

  useEffect(() => {
    loadPresupuestos();
  }, [loadPresupuestos]);

  // Búsqueda con retardo para no lanzar una petición por tecla
  useEffect(() => {
    if (search === debouncedSearch) return undefined;

    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  // La columna Emisor solo aporta si hay más de uno
  useEffect(() => {
    getEmisores()
      .then((emisores) => setVariosEmisores((emisores?.length ?? 0) > 1))
      .catch(() => setVariosEmisores(true));
  }, []);

  const currentActionConfig = action
    ? actionConfig[action]
    : actionConfig.enviar;

  function showFeedback(message, severity = 'success') {
    setFeedback({
      open: true,
      severity,
      message,
    });
  }

  const handleCloseFeedback = (_, reason) => {
    if (reason === 'clickaway') return;

    setFeedback((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const handleEstadoFiltro = (value) => {
    setEstadoFiltro(value);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const runAction = (accion, row) => {
    setMenu({ anchor: null, row: null });

    switch (accion) {
      case 'ver':
        navigate(`/admin/presupuestos/${row.id}/preview`);
        return;
      case 'ver_factura':
        if (row.factura?.id) navigate(`/admin/facturas/${row.factura.id}/preview`);
        return;
      case 'editar':
        setSelectedPresupuesto(row);
        setOpenForm(true);
        return;
      case 'compartir':
      case 'enviar':
        // El API lo marca como "enviado" solo cuando el envío sale bien
        setShareTarget(row);
        return;
      default:
        setSelected(row);
        setAction(accion);
    }
  };

  const handleConfirmAction = async (facturaData = {}) => {
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
        await facturarPresupuesto(selected.id, facturaData);
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

  // datos: { email, copia_emisor } o { telefono } (destinatario editable en el diálogo)
  const handleShare = async (channel, datos = {}) => {
    if (!shareTarget) return;

    try {
      setShareLoading(true);
      setShareError('');

      if (channel === 'email') {
        const response = await sendPresupuestoEmail(shareTarget.id, datos);
        showFeedback(response.message || 'Presupuesto enviado por email correctamente');
      }

      if (channel === 'whatsapp') {
        await abrirWhatsapp(() => getPresupuestoWhatsappLink(shareTarget.id, datos));
        showFeedback('Se ha abierto WhatsApp con el mensaje: revísalo y pulsa enviar.', 'info');
      }

      setShareTarget(null);
      loadPresupuestos();
    } catch (e) {
      console.error(e);
      const errores = e.response?.data?.errors;
      // Se muestra dentro del diálogo (p. ej. "es un teléfono fijo")
      setShareError(
        (errores && Object.values(errores)[0]?.[0]) ||
          e.response?.data?.message ||
          e.message ||
          'No se pudo compartir el presupuesto'
      );
    } finally {
      setShareLoading(false);
    }
  };

  // Tras editar un presupuesto que el cliente ya tenía, se ofrece reenviarlo
  const handleSaved = (saved) => {
    loadPresupuestos();

    if (saved?.requiere_reenvio) {
      showFeedback('Presupuesto actualizado. Reenvíalo para que el cliente tenga la última versión.', 'info');
      setShareTarget(saved);
      return;
    }

    showFeedback('Presupuesto guardado correctamente');
  };

  /* ───────────── Piezas reutilizadas en desktop y mobile ───────────── */

  const renderEstadoChip = (row) => {
    const config = getEstadoConfig(row);
    const desactivado = getEstadoVisual(row) === 'desactivado';

    // Facturado → abre su factura; cualquier otro estado → abre el presupuesto
    const verFactura = row.facturado && row.factura?.id;
    const tooltip = verFactura
      ? `Facturado · Ver factura ${row.factura.numero}/${row.factura.anio}`
      : `${config.label} · Ver presupuesto ${row.numero}/${row.anio}`;

    return (
      <Tooltip title={tooltip}>
        <Chip
          size="small"
          label={config.label}
          color={config.color}
          variant={desactivado ? 'outlined' : 'filled'}
          clickable
          onClick={(e) => {
            e.stopPropagation();
            runAction(verFactura ? 'ver_factura' : 'ver', row);
          }}
          sx={{ fontWeight: 500 }}
        />
      </Tooltip>
    );
  };

  // Segunda línea bajo el cliente: enlace a la factura o resumen de trabajos
  const renderResumen = (row) => {
    if (row.facturado && row.factura) {
      return (
        <Link
          component="button"
          variant="caption"
          underline="hover"
          color="secondary"
          onClick={(e) => {
            e.stopPropagation();
            runAction('ver_factura', row);
          }}
        >
          ↳ Factura {row.factura.numero}/{row.factura.anio}
        </Link>
      );
    }

    const resumen = htmlToText(row.descripcion);
    if (!resumen) return null;

    return (
      <Typography
        variant="caption"
        color="text.secondary"
        noWrap
        title={resumen}
        sx={{ display: 'block' }}
      >
        {resumen}
      </Typography>
    );
  };

  const renderAcciones = (row) => {
    const principal = getAccionPrincipal(row);

    return (
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        justifyContent="flex-end"
        onClick={(e) => e.stopPropagation()}
      >
        {principal && (
          <Tooltip title={principal.tooltip}>
            <Button
              size="small"
              variant="outlined"
              color={principal.color}
              startIcon={principal.icon}
              onClick={() => runAction(principal.action, row)}
              sx={{ minWidth: 0, whiteSpace: 'nowrap' }}
            >
              {principal.label}
            </Button>
          </Tooltip>
        )}

        <Tooltip title="Más acciones: ver, editar, compartir, rechazar o desactivar">
          <IconButton
            size="small"
            onClick={(e) => setMenu({ anchor: e.currentTarget, row })}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  };

  const columns = [
    {
      field: 'numero',
      headerName: 'Nº',
      width: 100,
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
      headerName: 'Cliente / trabajos',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', minWidth: 0, lineHeight: 1.3 }}>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.row.cliente?.nombre || '—'}
          </Typography>
          {renderResumen(params.row)}
        </Box>
      ),
    },
    ...(variosEmisores
      ? [{
          field: 'emisor',
          headerName: 'Emisor',
          width: 160,
          renderCell: (params) => params.row?.emisor?.nombre || '',
        }]
      : []),
    ...(isWide
      ? [{
          field: 'fecha',
          headerName: 'Fecha',
          width: 110,
          renderCell: (params) =>
            params.value
              ? dayjs(params.value).format('DD/MM/YYYY')
              : '',
        }]
      : []),
    {
      field: 'total',
      headerName: 'Importe',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatEuro(params.value)}
        </Typography>
      ),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => renderEstadoChip(params.row),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 160,
      align: 'right',
      renderCell: (params) => renderAcciones(params.row),
    },
  ];

  const totalPaginas = Math.max(1, Math.ceil(rowCount / paginationModel.pageSize));

  return (
    <Box sx={{ width: '100%' }}>
      {/* ───────────── CABECERA ───────────── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography variant="h5">Presupuestos</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedPresupuesto(null);
            setOpenForm(true);
          }}
        >
          {isMobile ? 'Nuevo' : 'Nuevo presupuesto'}
        </Button>
      </Box>

      {/* ───────────── FILTROS ───────────── */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar por nº, cliente o trabajos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1.5 }}
        />

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {FILTROS_ESTADO.map((filtro) => {
            const activo = estadoFiltro === filtro.value;
            return (
              <Chip
                key={filtro.value || 'todos'}
                label={`${filtro.label} (${contadores[filtro.contador] ?? 0})`}
                color={activo ? 'primary' : 'default'}
                variant={activo ? 'filled' : 'outlined'}
                onClick={() => handleEstadoFiltro(filtro.value)}
                size="small"
              />
            );
          })}
        </Stack>
      </Paper>

      {/* ───────────── MOBILE ───────────── */}
      {isMobile && (
        <>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {!loading && rows.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No hay presupuestos
            </Typography>
          )}

          <Stack spacing={1.5}>
            {!loading && rows.map((p) => {
              const desactivado = getEstadoVisual(p) === 'desactivado';
              return (
                <Paper
                  key={p.id}
                  variant="outlined"
                  onClick={() => runAction('ver', p)}
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    opacity: desactivado ? 0.55 : 1,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {p.numero}/{p.anio}
                    </Typography>
                    {renderEstadoChip(p)}
                  </Stack>

                  <Typography variant="body2" fontWeight={500} noWrap>
                    {p.cliente?.nombre || '—'}
                  </Typography>
                  {renderResumen(p)}

                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      {p.fecha ? dayjs(p.fecha).format('DD/MM/YYYY') : ''}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatEuro(p.total)}
                    </Typography>
                  </Stack>

                  <Divider sx={{ my: 1 }} />
                  {renderAcciones(p)}
                </Paper>
              );
            })}
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

      {/* ───────────── DESKTOP ───────────── */}
      {!isMobile && (
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Box>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              autoHeight
              rowHeight={60}
              paginationMode="server"
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              disableColumnSorting
              disableColumnMenu
              onRowClick={(params) => runAction('ver', params.row)}
              getRowClassName={(params) =>
                getEstadoVisual(params.row) === 'desactivado' ? 'fila-desactivada' : ''
              }
              localeText={{ noRowsLabel: 'No hay presupuestos' }}
              sx={{
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },
                '& .fila-desactivada': { opacity: 0.55 },
              }}
            />
          </Box>
        </Box>
      )}

      {/* ───────────── MENÚ ⋮ ───────────── */}
      <Menu
        anchorEl={menu.anchor}
        open={!!menu.anchor}
        onClose={() => setMenu({ anchor: null, row: null })}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {menu.row && getAccionesMenu(menu.row).map((item, i) =>
          item.divider ? (
            <Divider key={`divider-${i}`} />
          ) : (
            <MenuItem key={item.action} onClick={() => runAction(item.action, menu.row)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          )
        )}
      </Menu>

      {/* Facturar tiene su propio diálogo para elegir IVA y fecha */}
      <FacturarDialog
        open={action === 'facturar'}
        presupuesto={selected}
        loading={processing}
        onClose={() => {
          setSelected(null);
          setAction(null);
        }}
        onConfirm={handleConfirmAction}
      />

      <ConfirmActionDialog
        open={!!action && action !== 'facturar'}
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

      <ShareDialog
        open={!!shareTarget}
        title={shareTarget ? `Compartir presupuesto ${shareTarget.numero}/${shareTarget.anio}` : 'Compartir presupuesto'}
        description={
          ['borrador', 'rechazado'].includes(shareTarget?.estado)
            ? 'Al enviarlo, el presupuesto pasará a estado "Enviado". ¿Cómo quieres enviar el PDF?'
            : '¿Cómo quieres enviar el PDF?'
        }
        contacto={{ email: shareTarget?.cliente?.email, telefono: shareTarget?.cliente?.telefono }}
        emisorEmail={shareTarget?.emisor?.email}
        loading={shareLoading}
        error={shareError}
        onClose={() => {
          setShareTarget(null);
          setShareError('');
        }}
        onEmail={(datos) => handleShare('email', datos)}
        onWhatsapp={(datos) => handleShare('whatsapp', datos)}
      />

      <PresupuestoForm
        open={openForm}
        presupuesto={selectedPresupuesto}
        onClose={() => setOpenForm(false)}
        onSaved={handleSaved}
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
