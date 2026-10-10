import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  useTheme,
  useMediaQuery,
  Typography,
  Box,
  FormControlLabel,
  Stack,
  Alert,
  Autocomplete,
  InputAdornment,
  Chip,
  LinearProgress,
  Switch,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { createPresupuesto, updatePresupuesto, getPresupuesto } from '../services/presupuestos.service';
import { getClientesSelect } from '../../clientes/services/clientes.service';
import { getEmisores } from '../../emisores/services/emisores.service';
import { getDocumentoTextos } from '../../documentoTextos/services/documentoTextos.service';
import DocumentoTextoEditor from '../../../common/DocumentoTextoEditor';
import FormSection from '../../../common/FormSection';
import TextosLegalesSelector from '../../../common/TextosLegalesSelector';
import { getEstadoConfig, formatEuro, htmlToText } from '../presupuestoEstados';

const formVacio = () => ({
  cliente_id: '',
  emisor_id: '',
  fecha: dayjs().format('YYYY-MM-DD'),
  total: '',
  descripcion: '',
  observaciones: '',
  mostrar_observaciones: false,
});

export default function PresupuestoForm({
  open,
  onClose,
  onSaved,
  presupuesto = null,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [clientes, setClientes] = useState([]);
  const [emisores, setEmisores] = useState([]);
  const [docsDisponibles, setDocsDisponibles] = useState([]);
  const [docsSeleccionados, setDocsSeleccionados] = useState([]);
  const [form, setForm] = useState(formVacio);
  const [meta, setMeta] = useState(null); // { numero, anio } al editar
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // El cliente ya tiene una versión: tras guardar habrá que reenviarlo
  const yaEnviado = ['enviado', 'aceptado'].includes(presupuesto?.estado);
  const anioNumeracion = presupuesto?.anio ?? meta?.anio;

  useEffect(() => {
    if (!open) return;

    let cancelado = false;
    setError('');
    setFieldErrors({});
    setMeta(null);
    setLoadingData(true);

    const cargaComun = Promise.all([
      getClientesSelect(),
      getEmisores(),
      getDocumentoTextos({ tipo: 'presupuesto', activos: true }),
    ]);

    const cargaPresupuesto = presupuesto ? getPresupuesto(presupuesto.id) : Promise.resolve(null);

    Promise.all([cargaComun, cargaPresupuesto])
      .then(([[clientesResult, emisoresResult, docsResult], full]) => {
        if (cancelado) return;

        const listaClientes = [...(clientesResult ?? [])];
        const listaEmisores = emisoresResult?.data ?? emisoresResult ?? [];

        // Si el cliente del presupuesto está desactivado no viene en la lista: se añade para no perderlo
        if (full?.cliente && !listaClientes.some((c) => String(c.id) === String(full.cliente_id))) {
          listaClientes.push(full.cliente);
        }

        setClientes(listaClientes);
        setEmisores(listaEmisores);
        setDocsDisponibles(docsResult ?? []);

        if (full) {
          setMeta({ numero: full.numero, anio: full.anio });
          setForm({
            cliente_id: full.cliente_id,
            emisor_id: full.emisor_id,
            fecha: full.fecha ? dayjs(full.fecha).format('YYYY-MM-DD') : '',
            total: full.total,
            descripcion: full.descripcion || '',
            observaciones: full.observaciones || '',
            mostrar_observaciones: !!full.mostrar_observaciones,
          });

          setDocsSeleccionados(
            (full.documento_textos ?? [])
              .slice()
              .sort((a, b) => (a.pivot?.orden ?? 0) - (b.pivot?.orden ?? 0))
          );
        } else {
          // Nuevo: fecha de hoy y, si solo hay un emisor, preseleccionado
          setForm({
            ...formVacio(),
            emisor_id: listaEmisores.length === 1 ? listaEmisores[0].id : '',
          });
          setDocsSeleccionados([]);
        }
      })
      .catch((e) => {
        console.error(e);
        if (!cancelado) setError('No se pudieron cargar los datos del formulario');
      })
      .finally(() => {
        if (!cancelado) setLoadingData(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open, presupuesto]);

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => String(c.id) === String(form.cliente_id)) ?? null,
    [clientes, form.cliente_id]
  );

  const setCampo = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleChange = (e) => setCampo(e.target.name, e.target.value);

  /* ───────────── Validación y guardado ───────────── */
  const validar = () => {
    const errores = {};

    if (!form.cliente_id) errores.cliente_id = 'Selecciona un cliente';
    if (!form.emisor_id) errores.emisor_id = 'Selecciona un emisor';
    if (!form.fecha) errores.fecha = 'Indica la fecha';
    if (form.fecha && anioNumeracion && dayjs(form.fecha).year() !== Number(anioNumeracion)) {
      errores.fecha = `Debe ser del año ${anioNumeracion}`;
    }
    if (form.total === '' || Number(form.total) < 0 || Number.isNaN(Number(form.total))) {
      errores.total = 'Indica un importe válido';
    }
    if (!htmlToText(form.descripcion)) {
      errores.descripcion = 'Describe los trabajos a realizar';
    }

    setFieldErrors(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) {
      setError('Revisa los campos marcados en rojo');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...form,
        documento_texto_ids: docsSeleccionados.map((d) => d.id),
      };

      const saved = presupuesto
        ? await updatePresupuesto(presupuesto.id, payload)
        : await createPresupuesto(payload);

      onSaved?.(saved);
      onClose();
    } catch (e) {
      console.error(e);
      const errores = e.response?.data?.errors;

      if (errores) {
        setFieldErrors(
          Object.fromEntries(Object.entries(errores).map(([campo, msgs]) => [campo, msgs[0]]))
        );
      }

      setError(
        (errores && Object.values(errores)[0]?.[0]) ||
          e.response?.data?.message ||
          'Error al guardar el presupuesto'
      );
    } finally {
      setSaving(false);
    }
  };

  // Evita perder lo escrito por un clic fuera del diálogo
  const handleDialogClose = (_, reason) => {
    if (reason === 'backdropClick' || saving) return;
    onClose();
  };

  const estadoConfig = presupuesto ? getEstadoConfig(presupuesto) : null;

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <span>
            {presupuesto
              ? `Editar presupuesto${meta ? ` ${meta.numero}/${meta.anio}` : ''}`
              : 'Nuevo presupuesto'}
          </span>
          {estadoConfig && (
            <Chip size="small" label={estadoConfig.label} color={estadoConfig.color} />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Los campos marcados con * son obligatorios.
        </Typography>
      </DialogTitle>

      {loadingData && <LinearProgress />}

      <DialogContent sx={{ pt: 3, bgcolor: 'background.default' }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {yaEnviado && (
            <Alert severity="warning">
              El cliente ya recibió este presupuesto. Después de guardar los cambios,
              reenvíalo para que tenga la última versión.
            </Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* 1 · CLIENTE Y EMISOR */}
          <FormSection step={1} title="Cliente y emisor">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Autocomplete
                  options={clientes}
                  value={clienteSeleccionado}
                  onChange={(_, nuevo) => setCampo('cliente_id', nuevo?.id ?? '')}
                  getOptionLabel={(c) => c?.nombre ?? ''}
                  isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                  noOptionsText="No hay clientes con ese nombre"
                  disabled={loadingData}
                  renderOption={(props, c) => {
                    const { key, ...rest } = props;
                    return (
                      <Box component="li" key={key} {...rest}>
                        <Box>
                          <Typography variant="body2">{c.nombre}</Typography>
                          {(c.nif || c.poblacion) && (
                            <Typography variant="caption" color="text.secondary">
                              {[c.nif, c.poblacion].filter(Boolean).join(' · ')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente"
                      required
                      placeholder="Escribe para buscar…"
                      error={!!fieldErrors.cliente_id}
                      helperText={
                        fieldErrors.cliente_id ||
                        (clienteSeleccionado && !clienteSeleccionado.email && !clienteSeleccionado.telefono
                          ? 'Este cliente no tiene email ni teléfono para enviarle el presupuesto'
                          : ' ')
                      }
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  select
                  fullWidth
                  label="Emisor"
                  name="emisor_id"
                  value={form.emisor_id}
                  onChange={handleChange}
                  required
                  disabled={loadingData}
                  error={!!fieldErrors.emisor_id}
                  helperText={fieldErrors.emisor_id || ' '}
                >
                  {emisores.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </FormSection>

          {/* 2 · FECHA E IMPORTE */}
          <FormSection step={2} title="Fecha e importe">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                  disabled={loadingData}
                  error={!!fieldErrors.fecha}
                  helperText={
                    fieldErrors.fecha ||
                    (anioNumeracion
                      ? `Debe ser del año ${anioNumeracion} (el de su numeración)`
                      : `Se numerará con la serie de ${form.fecha ? dayjs(form.fecha).year() : 'su año'}`)
                  }
                  slotProps={{
                    inputLabel: { shrink: true },
                    // El número pertenece a la serie de su año: al editar no se puede cambiar de año
                    htmlInput: anioNumeracion
                      ? { min: `${anioNumeracion}-01-01`, max: `${anioNumeracion}-12-31` }
                      : undefined,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Importe (mano de obra y materiales)"
                  name="total"
                  value={form.total}
                  onChange={handleChange}
                  required
                  disabled={loadingData}
                  error={!!fieldErrors.total}
                  helperText={
                    fieldErrors.total ||
                    (form.total !== '' ? `${formatEuro(form.total)} · sin IVA` : 'Sin IVA')
                  }
                  slotProps={{
                    htmlInput: { min: 0, step: '0.01' },
                    input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                  }}
                />
              </Grid>
            </Grid>
          </FormSection>

          {/* 3 · TRABAJOS A REALIZAR */}
          <FormSection
            step={3}
            title="Trabajos a realizar"
            description="Aparece en el PDF dentro de la tabla de detalle del presupuesto."
          >
            <DocumentoTextoEditor
              value={form.descripcion}
              onChange={(html) => setCampo('descripcion', html)}
              placeholder="Describe los trabajos: materiales, mano de obra, plazos…"
              error={!!fieldErrors.descripcion}
            />
            {fieldErrors.descripcion && (
              <Typography variant="caption" color="error" display="block" mt={0.5}>
                {fieldErrors.descripcion}
              </Typography>
            )}
          </FormSection>

          {/* 4 · OBSERVACIONES */}
          <FormSection
            step={4}
            title="Observaciones"
            optional
            description="Por defecto son notas internas. Activa el interruptor si quieres que el cliente las vea en el presupuesto."
            action={
              <Chip
                size="small"
                variant="outlined"
                icon={form.mostrar_observaciones ? <VisibilityIcon /> : <VisibilityOffIcon />}
                label={form.mostrar_observaciones ? 'Visible en el PDF' : 'Solo interno'}
                color={form.mostrar_observaciones ? 'info' : 'default'}
              />
            }
          >
            <DocumentoTextoEditor
              value={form.observaciones}
              onChange={(html) => setCampo('observaciones', html)}
              placeholder="Notas sobre el presupuesto (opcional)…"
              minHeight={120}
            />

            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Switch
                  checked={form.mostrar_observaciones}
                  onChange={(e) => setCampo('mostrar_observaciones', e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  Mostrar las observaciones en el presupuesto (PDF que recibe el cliente)
                </Typography>
              }
            />
          </FormSection>

          {/* 5 · TEXTOS LEGALES */}
          <FormSection
            step={5}
            title="Textos legales"
            optional
            description="Marca los textos que aparecerán al final del PDF y ordénalos con las flechas."
            action={
              docsSeleccionados.length > 0 && (
                <Chip size="small" color="primary" label={`${docsSeleccionados.length} seleccionado${docsSeleccionados.length > 1 ? 's' : ''}`} />
              )
            }
          >
            <TextosLegalesSelector
              disponibles={docsDisponibles}
              value={docsSeleccionados}
              onChange={setDocsSeleccionados}
              emptyText="No hay textos legales activos para presupuestos."
            />
          </FormSection>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {/* Resumen rápido de lo que se va a guardar */}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {clienteSeleccionado?.nombre || 'Sin cliente'}
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
            {form.total !== '' ? formatEuro(form.total) : '— €'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || loadingData}
            size="large"
          >
            {saving ? 'Guardando…' : presupuesto ? 'Guardar cambios' : 'Crear presupuesto'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
