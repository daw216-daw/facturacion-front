// features/correos/pages/CorreosPage.jsx
// "Vista de correos": lista de presupuestos y facturas y, al elegir uno, el correo
// exactamente como lo recibiría el cliente. No envía nada.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';

import { getEmailPreview } from '../services/correos.service';
import { getPresupuestos, getPresupuestoPdf } from '../../presupuestos/services/presupuestos.service';
import { getFacturas, getFacturaPdf } from '../../facturas/services/facturas.service';
import { getEstadoConfig, formatEuro } from '../../presupuestos/presupuestoEstados';
import { getEstadoFacturaConfig } from '../../facturas/facturaEstados';

const POR_PAGINA = 15;

/* Fila "De: …" de la cabecera del correo */
function CampoCorreo({ etiqueta, valor }) {
  if (!valor) return null;
  return (
    <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 96, flexShrink: 0 }}>
        {etiqueta}
      </Typography>
      <Typography variant="body2" sx={{ minWidth: 0, wordBreak: 'break-word' }}>
        {valor}
      </Typography>
    </Stack>
  );
}

export default function CorreosPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [tipo, setTipo] = useState('presupuesto');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagina, setPagina] = useState(1);

  const [documentos, setDocumentos] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargandoLista, setCargandoLista] = useState(true);

  const [seleccionado, setSeleccionado] = useState(null);
  const [correo, setCorreo] = useState(null);
  const [cargandoCorreo, setCargandoCorreo] = useState(false);
  const [vista, setVista] = useState('html'); // html | texto
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState(false);

  /* ───────── Lista ───────── */
  const cargarLista = useCallback(() => {
    setCargandoLista(true);
    const pedir = tipo === 'factura' ? getFacturas : getPresupuestos;

    pedir({ page: pagina, per_page: POR_PAGINA, search: debouncedSearch })
      .then((res) => {
        setDocumentos(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch((e) => {
        console.error(e);
        setError('No se pudo cargar la lista');
      })
      .finally(() => setCargandoLista(false));
  }, [tipo, pagina, debouncedSearch]);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  useEffect(() => {
    if (search === debouncedSearch) return undefined;
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagina(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  const cambiarTipo = (_, nuevo) => {
    setTipo(nuevo);
    setPagina(1);
    setSeleccionado(null);
    setCorreo(null);
    setError('');
  };

  /* ───────── Correo ───────── */
  const verCorreo = async (doc) => {
    setSeleccionado(doc);
    setCorreo(null);
    setError('');
    setVista('html');
    setCargandoCorreo(true);

    try {
      setCorreo(await getEmailPreview(tipo, doc.id));
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || 'No se pudo generar la vista del correo');
    } finally {
      setCargandoCorreo(false);
    }
  };

  // Abre el HTML del correo en una pestaña nueva
  const abrirEnPestana = () => {
    if (!correo?.html) return;
    const url = URL.createObjectURL(new Blob([correo.html], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const descargarPdf = async () => {
    if (!seleccionado) return;
    try {
      setDescargando(true);
      const blob = tipo === 'factura'
        ? await getFacturaPdf(seleccionado.id, { download: true })
        : await getPresupuestoPdf(seleccionado.id, { download: true });
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = correo?.adjunto || `${tipo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      console.error(e);
      setError('No se pudo descargar el PDF');
    } finally {
      setDescargando(false);
    }
  };

  const estadoDe = useMemo(
    () => (doc) => (tipo === 'factura' ? getEstadoFacturaConfig(doc.estado) : getEstadoConfig(doc)),
    [tipo]
  );

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  // En móvil: o la lista o el correo
  const mostrarLista = !isMobile || !seleccionado;
  const mostrarCorreo = !isMobile || !!seleccionado;

  /* ───────── Render ───────── */
  const lista = (
    <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Tabs value={tipo} onChange={cambiarTipo} variant="fullWidth">
        <Tab value="presupuesto" label="Presupuestos" />
        <Tab value="factura" label="Facturas" />
      </Tabs>
      <Divider />

      <Box sx={{ p: 1.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar por nº o cliente…"
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
        />
      </Box>

      {cargandoLista ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : documentos.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>
          No hay {tipo === 'factura' ? 'facturas' : 'presupuestos'}
        </Typography>
      ) : (
        <List disablePadding sx={{ overflowY: 'auto', maxHeight: { md: 'calc(100vh - 330px)' } }}>
          {documentos.map((doc) => {
            const estado = estadoDe(doc);
            return (
              <ListItemButton
                key={doc.id}
                selected={seleccionado?.id === doc.id}
                onClick={() => verCorreo(doc)}
                divider
                sx={{ alignItems: 'flex-start', py: 1.25 }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Typography fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {doc.numero}/{doc.anio}
                    </Typography>
                    <Chip size="small" label={estado.label} color={estado.color} variant="outlined" />
                  </Stack>
                  <Typography variant="body2" noWrap>
                    {doc.cliente?.nombre || '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {doc.fecha ? dayjs(doc.fecha).format('DD/MM/YYYY') : ''} · {formatEuro(doc.total)}
                    {doc.cliente?.email ? '' : ' · sin email'}
                  </Typography>
                </Box>
              </ListItemButton>
            );
          })}
        </List>
      )}

      {totalPaginas > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Pagination count={totalPaginas} page={pagina} onChange={(_, p) => setPagina(p)} size="small" />
        </Box>
      )}
    </Paper>
  );

  const panelCorreo = (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, minHeight: 400 }}>
      {isMobile && (
        <Button startIcon={<ArrowBackIcon />} onClick={() => setSeleccionado(null)} sx={{ mb: 1 }}>
          Volver a la lista
        </Button>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!seleccionado && (
        <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 10, color: 'text.secondary' }}>
          <MarkEmailReadOutlinedIcon sx={{ fontSize: 56 }} />
          <Typography>Elige un {tipo === 'factura' ? 'factura' : 'presupuesto'} para ver su correo</Typography>
        </Stack>
      )}

      {seleccionado && cargandoCorreo && (
        <Stack spacing={1.5}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="45%" />
          <Skeleton variant="rounded" height={500} />
        </Stack>
      )}

      {seleccionado && correo && !cargandoCorreo && (
        <>
          {/* Cabecera como en un cliente de correo */}
          <Typography variant="h6" fontWeight={700} sx={{ wordBreak: 'break-word', mb: 1 }}>
            {correo.asunto}
          </Typography>
          <Stack spacing={0.5} sx={{ mb: 1.5 }}>
            <CampoCorreo etiqueta="De" valor={correo.de} />
            <CampoCorreo etiqueta="Para" valor={correo.para} />
            <CampoCorreo etiqueta="Responder a" valor={correo.responder_a} />
          </Stack>

          {!seleccionado.cliente?.email && (
            <Alert severity="info" sx={{ mb: 1.5 }}>
              El cliente no tiene email: se muestra una dirección de ejemplo. Al compartir podrás escribir una.
            </Alert>
          )}

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mb: 1.5 }}>
            <Tooltip title="Descargar el PDF que va adjunto">
              <Chip
                icon={<PictureAsPdfIcon />}
                label={descargando ? 'Descargando…' : correo.adjunto}
                onClick={descargarPdf}
                disabled={descargando}
                variant="outlined"
                color="error"
              />
            </Tooltip>

            <Box sx={{ flexGrow: 1 }} />

            <ToggleButtonGroup
              size="small"
              exclusive
              value={vista}
              onChange={(_, v) => v && setVista(v)}
            >
              <ToggleButton value="html">Correo</ToggleButton>
              <ToggleButton value="texto">Texto plano</ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title="Abrir el correo en una pestaña nueva">
              <Button size="small" startIcon={<OpenInNewIcon />} onClick={abrirEnPestana}>
                Abrir
              </Button>
            </Tooltip>
          </Stack>

          {vista === 'html' ? (
            <Box
              component="iframe"
              title={correo.asunto}
              srcDoc={correo.html}
              // Sin scripts: el correo se muestra como un cliente de correo (solo HTML y estilos)
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              sx={{
                width: '100%',
                height: { xs: 700, md: 'calc(100vh - 320px)' },
                minHeight: 600,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: '#fff',
              }}
            />
          ) : (
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                whiteSpace: 'pre-wrap',
                fontSize: 14,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'action.hover',
                fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
              }}
            >
              {correo.texto}
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Vista previa: no se ha enviado nada. El enlace al PDF del correo caduca a los {correo.enlace_dias} días.
          </Typography>
        </>
      )}
    </Paper>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">Vista de correos</Typography>
        <Typography variant="body2" color="text.secondary">
          Cómo recibirá el cliente el email de cada presupuesto y factura. No se envía nada.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '340px minmax(0, 1fr)', lg: '380px minmax(0, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        {mostrarLista && lista}
        {mostrarCorreo && panelCorreo}
      </Box>
    </Box>
  );
}
