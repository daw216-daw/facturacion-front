import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { createFactura } from '../services/facturas.service';
import { getClientesSelect } from '../../clientes/services/clientes.service';
import { getEmisores } from '../../emisores/services/emisores.service';
import { getPresupuestos } from '../../presupuestos/services/presupuestos.service';
import { formatEuro, htmlToText } from '../../presupuestos/presupuestoEstados';
import FormSection from '../../../common/FormSection';
import DocumentoTextoEditor from '../../../common/DocumentoTextoEditor';
import TextosLegalesSelector, { textosPorDefecto } from '../../../common/TextosLegalesSelector';
import AvisoIvaCero from '../../../common/AvisoIvaCero';
import { getDocumentoTextos } from '../../documentoTextos/services/documentoTextos.service';

const IVA_HABITUALES = [21, 10, 4, 0];

const initialForm = () => ({
  presupuesto_id: '',
  cliente_id: '',
  emisor_id: '',
  fecha: dayjs().format('YYYY-MM-DD'),
  descripcion: '',
  base_imponible: '',
  iva_porcentaje: 21,
  iban: '',
});

/* Fila del resumen de importes */
function ImporteRow({ label, value, total = false }) {
  return (
    <Stack direction="row" justifyContent="space-between" py={total ? 0.5 : 0.25}>
      <Typography variant={total ? 'subtitle1' : 'body2'} fontWeight={total ? 700 : 400} color={total ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography
        variant={total ? 'h6' : 'body2'}
        fontWeight={total ? 700 : 500}
        sx={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default function FacturaForm({
  open,
  onClose,
  onSaved,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [clientes, setClientes] = useState([]);
  const [emisores, setEmisores] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [docsDisponibles, setDocsDisponibles] = useState([]);
  const [docsSeleccionados, setDocsSeleccionados] = useState([]);
  const [modo, setModo] = useState('presupuesto'); // presupuesto | manual
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open) return;

    let cancelado = false;
    setErrorMessage('');
    setFieldErrors({});
    setForm(initialForm());
    setLoadingData(true);

    Promise.all([
      getClientesSelect(),
      getEmisores(),
      // 'aceptado' en el API ya excluye los facturados (pendientes de facturar)
      getPresupuestos({ per_page: 100, estado: 'aceptado' }),
      getDocumentoTextos({ tipo: 'factura', activos: true }),
    ])
      .then(([clientesResult, emisoresResult, presupuestosResult, docsResult]) => {
        if (cancelado) return;

        // Textos legales de factura: el primero viene marcado (salvo los de "IVA 0 %", que se añaden a mano)
        const docs = docsResult ?? [];
        setDocsDisponibles(docs);
        setDocsSeleccionados(textosPorDefecto(docs));

        const pendientes = (presupuestosResult?.data ?? presupuestosResult ?? []).filter(
          (presupuesto) => presupuesto.estado === 'aceptado' && !presupuesto.facturado
        );

        const listaEmisores = emisoresResult?.data ?? emisoresResult ?? [];

        setClientes(clientesResult ?? []);
        setEmisores(listaEmisores);
        setPresupuestos(pendientes);
        // Sin presupuestos pendientes, se empieza directamente en factura manual
        setModo(pendientes.length > 0 ? 'presupuesto' : 'manual');

        if (pendientes.length === 0 && listaEmisores.length === 1) {
          setForm((prev) => ({
            ...prev,
            emisor_id: listaEmisores[0].id,
            iban: listaEmisores[0].iban || '',
          }));
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelado) setErrorMessage('No se pudieron cargar los datos para crear la factura');
      })
      .finally(() => {
        if (!cancelado) setLoadingData(false);
      });

    return () => {
      cancelado = true;
    };
  }, [open]);

  const presupuestoSeleccionado = useMemo(
    () => presupuestos.find((p) => String(p.id) === String(form.presupuesto_id)) ?? null,
    [presupuestos, form.presupuesto_id]
  );

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => String(c.id) === String(form.cliente_id)) ?? null,
    [clientes, form.cliente_id]
  );

  // Mismo cálculo que el API: IVA redondeado a 2 decimales
  const base = Number(form.base_imponible) || 0;
  const ivaPct = Number(form.iva_porcentaje) || 0;
  const ivaImporte = Math.round(base * ivaPct) / 100;
  const total = base + ivaImporte;

  const limpiarError = (name) => {
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleChange = (e) => {
    const { name } = e.target;
    const value = name === 'iban' ? e.target.value.toUpperCase() : e.target.value;
    limpiarError(name);

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'emisor_id' && !prev.presupuesto_id) {
        const emisorSeleccionado = emisores.find(
          (emisor) => String(emisor.id) === String(value)
        );

        if (emisorSeleccionado?.iban) {
          next.iban = emisorSeleccionado.iban;
        }
      }

      return next;
    });
  };

  // Al elegir presupuesto se rellenan cliente, emisor, base e IBAN (igual que antes)
  const seleccionarPresupuesto = (presupuesto) => {
    limpiarError('presupuesto_id');

    setForm((prev) => {
      if (!presupuesto) {
        return {
          ...prev,
          presupuesto_id: '',
          cliente_id: '',
          emisor_id: '',
          descripcion: '',
          base_imponible: '',
          iban: '',
        };
      }

      return {
        ...prev,
        presupuesto_id: presupuesto.id,
        cliente_id: presupuesto.cliente_id,
        emisor_id: presupuesto.emisor_id,
        // Los trabajos del presupuesto pasan a ser los "Trabajos realizados" (editables)
        descripcion: presupuesto.descripcion || '',
        base_imponible: presupuesto.total,
        iban: presupuesto.emisor?.iban || '',
      };
    });
  };

  const handleModo = (_, nuevo) => {
    if (!nuevo || nuevo === modo) return;
    setModo(nuevo);
    setFieldErrors({});
    seleccionarPresupuesto(null);

    // Manual con un solo emisor: preseleccionado con su IBAN
    if (nuevo === 'manual' && emisores.length === 1) {
      setForm((prev) => ({
        ...prev,
        emisor_id: emisores[0].id,
        iban: emisores[0].iban || '',
      }));
    }
  };

  const validar = () => {
    const errores = {};

    if (modo === 'presupuesto' && !form.presupuesto_id) {
      errores.presupuesto_id = 'Selecciona el presupuesto a facturar';
    }
    if (modo === 'manual') {
      if (!form.cliente_id) errores.cliente_id = 'Selecciona un cliente';
      if (!form.emisor_id) errores.emisor_id = 'Selecciona un emisor';
      if (form.base_imponible === '' || Number(form.base_imponible) < 0) {
        errores.base_imponible = 'Indica una base imponible válida';
      }
    }
    if (!htmlToText(form.descripcion)) errores.descripcion = 'Describe los trabajos realizados';
    if (!form.fecha) errores.fecha = 'Indica la fecha';
    if (form.iva_porcentaje === '' || Number(form.iva_porcentaje) < 0 || !Number.isInteger(Number(form.iva_porcentaje))) {
      errores.iva_porcentaje = 'El IVA debe ser un número entero';
    }

    setFieldErrors(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) {
      setErrorMessage('Revisa los campos marcados en rojo');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      await createFactura({
        ...form,
        presupuesto_id: form.presupuesto_id || null,
        documento_texto_ids: docsSeleccionados.map((d) => d.id),
      });

      onSaved?.();
      onClose();
    } catch (error) {
      console.error(error);
      const errores = error.response?.data?.errors;

      if (errores) {
        setFieldErrors(
          Object.fromEntries(Object.entries(errores).map(([campo, msgs]) => [campo, msgs[0]]))
        );
      }

      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.presupuesto_id?.[0] ||
          'No se pudo crear la factura'
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

  const emisorNombre = emisores.find((e) => String(e.id) === String(form.emisor_id))?.nombre;

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
        Nueva factura
        <Typography variant="body2" color="text.secondary">
          Los campos marcados con * son obligatorios.
        </Typography>
      </DialogTitle>

      {loadingData && <LinearProgress />}

      <DialogContent sx={{ pt: 3, bgcolor: 'background.default' }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          {/* 1 · ORIGEN */}
          <FormSection
            step={1}
            title="Origen de la factura"
            description="Factura un presupuesto aceptado (recomendado) o crea una factura manual."
          >
            <ToggleButtonGroup
              exclusive
              value={modo}
              onChange={handleModo}
              color="primary"
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="presupuesto" sx={{ gap: 1 }} disabled={presupuestos.length === 0}>
                <RequestQuoteIcon fontSize="small" />
                Desde presupuesto ({presupuestos.length})
              </ToggleButton>
              <ToggleButton value="manual" sx={{ gap: 1 }}>
                <EditNoteIcon fontSize="small" />
                Factura manual
              </ToggleButton>
            </ToggleButtonGroup>

            {modo === 'presupuesto' && (
              <>
                <Autocomplete
                  options={presupuestos}
                  value={presupuestoSeleccionado}
                  onChange={(_, nuevo) => seleccionarPresupuesto(nuevo)}
                  getOptionLabel={(p) => (p ? `${p.numero}/${p.anio} · ${p.cliente?.nombre ?? ''}` : '')}
                  isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                  noOptionsText="No hay presupuestos aceptados pendientes de facturar"
                  disabled={loadingData}
                  renderOption={(props, p) => {
                    const { key, ...rest } = props;
                    return (
                      <Box component="li" key={key} {...rest}>
                        <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ width: '100%' }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {p.numero}/{p.anio} · {p.cliente?.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {htmlToText(p.descripcion)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {formatEuro(p.total)}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Presupuesto aceptado"
                      required
                      placeholder="Busca por nº o cliente…"
                      error={!!fieldErrors.presupuesto_id}
                      helperText={fieldErrors.presupuesto_id || 'Solo aparecen los aceptados que aún no tienen factura'}
                    />
                  )}
                />

                {presupuestoSeleccionado && (
                  <Paper variant="outlined" sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover' }}>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Cliente</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {presupuestoSeleccionado.cliente?.nombre}
                        </Typography>
                        {presupuestoSeleccionado.cliente?.nif && (
                          <Typography variant="caption" color="text.secondary">
                            NIF: {presupuestoSeleccionado.cliente.nif}
                          </Typography>
                        )}
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Emisor</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {presupuestoSeleccionado.emisor?.nombre ?? emisorNombre}
                        </Typography>
                      </Grid>
                      <Grid size={12}>
                        <Typography variant="caption" color="text.secondary">
                          Cliente, emisor y base imponible se toman del presupuesto y no se pueden cambiar aquí.
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </>
            )}

            {modo === 'manual' && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Autocomplete
                    options={clientes}
                    value={clienteSeleccionado}
                    onChange={(_, nuevo) => {
                      limpiarError('cliente_id');
                      setForm((prev) => ({ ...prev, cliente_id: nuevo?.id ?? '' }));
                    }}
                    getOptionLabel={(c) => c?.nombre ?? ''}
                    isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
                    noOptionsText="No hay clientes con ese nombre"
                    disabled={loadingData}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Cliente"
                        required
                        placeholder="Escribe para buscar…"
                        error={!!fieldErrors.cliente_id}
                        helperText={
                          fieldErrors.cliente_id ||
                          (clienteSeleccionado && !clienteSeleccionado.nif ? 'Este cliente no tiene NIF' : ' ')
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
                    {emisores.map((emisor) => (
                      <MenuItem key={emisor.id} value={emisor.id}>
                        {emisor.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            )}
          </FormSection>

          {/* 2 · TRABAJOS REALIZADOS */}
          <FormSection
            step={2}
            title="Trabajos realizados"
            description={
              modo === 'presupuesto'
                ? 'Se copian del presupuesto. Puedes ajustarlos si lo realizado difiere de lo presupuestado.'
                : 'Aparecen en la factura dentro de la tabla de detalle.'
            }
          >
            <DocumentoTextoEditor
              value={form.descripcion}
              onChange={(html) => {
                limpiarError('descripcion');
                setForm((prev) => ({ ...prev, descripcion: html }));
              }}
              placeholder="Describe los trabajos realizados…"
              error={!!fieldErrors.descripcion}
            />
            {fieldErrors.descripcion && (
              <Typography variant="caption" color="error" display="block" mt={0.5}>
                {fieldErrors.descripcion}
              </Typography>
            )}
          </FormSection>

          {/* 3 · FECHA E IMPORTES */}
          <FormSection step={3} title="Fecha e importes">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de la factura"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    required
                    error={!!fieldErrors.fecha}
                    helperText={
                      fieldErrors.fecha ||
                      `Se numerará con la serie de facturas de ${form.fecha ? dayjs(form.fecha).year() : 'su año'}`
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label="Base imponible"
                    name="base_imponible"
                    value={form.base_imponible}
                    onChange={handleChange}
                    required
                    disabled={modo === 'presupuesto'}
                    error={!!fieldErrors.base_imponible}
                    helperText={
                      fieldErrors.base_imponible ||
                      (modo === 'presupuesto' ? 'Importe del presupuesto' : 'Importe sin IVA')
                    }
                    slotProps={{
                      htmlInput: { min: 0, step: '0.01' },
                      input: { endAdornment: <InputAdornment position="end">€</InputAdornment> },
                    }}
                  />

                  <Box>
                    <TextField
                      fullWidth
                      type="number"
                      label="IVA"
                      name="iva_porcentaje"
                      value={form.iva_porcentaje}
                      onChange={handleChange}
                      required
                      error={!!fieldErrors.iva_porcentaje}
                      helperText={fieldErrors.iva_porcentaje}
                      slotProps={{
                        htmlInput: { min: 0, step: 1 },
                        input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
                      }}
                    />
                    <Stack direction="row" spacing={1} mt={1}>
                      {IVA_HABITUALES.map((pct) => (
                        <Chip
                          key={pct}
                          size="small"
                          label={`${pct}%`}
                          color={Number(form.iva_porcentaje) === pct ? 'primary' : 'default'}
                          variant={Number(form.iva_porcentaje) === pct ? 'filled' : 'outlined'}
                          onClick={() => {
                            limpiarError('iva_porcentaje');
                            setForm((prev) => ({ ...prev, iva_porcentaje: pct }));
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Con IVA 0 % hay que indicar el motivo con un texto legal */}
                  <AvisoIvaCero
                    iva={form.iva_porcentaje === '' ? null : Number(form.iva_porcentaje)}
                    disponibles={docsDisponibles}
                    seleccionados={docsSeleccionados}
                    onChange={setDocsSeleccionados}
                  />
                </Stack>
              </Grid>

              {/* Resumen calculado */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Resumen
                  </Typography>
                  <ImporteRow label="Base imponible" value={formatEuro(base)} />
                  <ImporteRow label={`IVA (${ivaPct}%)`} value={formatEuro(ivaImporte)} />
                  <Divider sx={{ my: 1 }} />
                  <ImporteRow label="Total" value={formatEuro(total)} total />
                </Paper>
              </Grid>
            </Grid>
          </FormSection>

          {/* 4 · DATOS DE PAGO */}
          <FormSection
            step={4}
            title="Datos de pago"
            optional
            description="El IBAN aparece en la factura para que el cliente sepa dónde pagar. Se rellena con el del emisor."
          >
            <TextField
              fullWidth
              label="IBAN"
              name="iban"
              value={form.iban}
              onChange={handleChange}
              placeholder="ES00 0000 0000 0000 0000 0000"
              error={!!fieldErrors.iban}
              helperText={fieldErrors.iban}
              slotProps={{ htmlInput: { style: { fontFamily: 'monospace' } } }}
            />
          </FormSection>

          {/* 5 · TEXTOS LEGALES */}
          <FormSection
            step={5}
            title="Textos legales"
            optional
            description="Elige los textos según el tipo de cliente (particular, comunidad, empresa) y ordénalos con las flechas."
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
              emptyText="No hay textos legales activos para facturas. Puedes crearlos en Textos legales."
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
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {presupuestoSeleccionado?.cliente?.nombre || clienteSeleccionado?.nombre || 'Sin cliente'}
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
            {formatEuro(total)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={saving || loadingData}
          >
            {saving ? 'Creando…' : 'Crear factura'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
