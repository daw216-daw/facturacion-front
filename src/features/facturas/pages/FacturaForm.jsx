import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { createFactura } from '../services/facturas.service';
import { getClientesSelect } from '../../clientes/services/clientes.service';
import { getEmisores } from '../../emisores/services/emisores.service';
import { getPresupuestos } from '../../presupuestos/services/presupuestos.service';

const initialForm = {
  presupuesto_id: '',
  cliente_id: '',
  emisor_id: '',
  fecha: dayjs().format('YYYY-MM-DD'),
  base_imponible: '',
  iva_porcentaje: 21,
  iban: '',
};

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
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open) return;

    setErrorMessage('');
    setForm(initialForm);

    Promise.all([
      getClientesSelect(),
      getEmisores(),
      getPresupuestos({ per_page: 100 }),
    ])
      .then(([clientesResult, emisoresResult, presupuestosResult]) => {
        setClientes(clientesResult);
        setEmisores(emisoresResult?.data ?? emisoresResult);
        setPresupuestos(
          (presupuestosResult?.data ?? presupuestosResult).filter(
            (presupuesto) => presupuesto.estado === 'aceptado' && !presupuesto.factura
          )
        );
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage('No se pudieron cargar los datos para crear la factura');
      });
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'presupuesto_id') {
        if (!value) {
          return {
            ...next,
            cliente_id: '',
            emisor_id: '',
            base_imponible: '',
            iban: '',
          };
        }

        const presupuestoSeleccionado = presupuestos.find(
          (presupuesto) => String(presupuesto.id) === String(value)
        );

        if (presupuestoSeleccionado) {
          next.cliente_id = presupuestoSeleccionado.cliente_id;
          next.emisor_id = presupuestoSeleccionado.emisor_id;
          next.base_imponible = presupuestoSeleccionado.total;
          next.iban = presupuestoSeleccionado.emisor?.iban || '';
        }
      }

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

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setErrorMessage('');

      await createFactura({
        ...form,
        presupuesto_id: form.presupuesto_id || null,
      });

      onSaved?.();
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.message ||
          error.response?.data?.errors?.presupuesto_id?.[0] ||
          'No se pudo crear la factura'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Nueva factura</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {errorMessage && (
            <Grid item xs={12}>
              <Alert severity="error">{errorMessage}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Datos de facturación
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Presupuesto aceptado (opcional)"
                    name="presupuesto_id"
                    value={form.presupuesto_id}
                    onChange={handleChange}
                    helperText="Si eliges un presupuesto aceptado, se rellenarán los datos automáticamente"
                  >
                    <MenuItem value="">Sin presupuesto</MenuItem>
                    {presupuestos.map((presupuesto) => (
                      <MenuItem key={presupuesto.id} value={presupuesto.id}>
                        {presupuesto.numero}/{presupuesto.anio} · {presupuesto.cliente?.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha"
                    name="fecha"
                    InputLabelProps={{ shrink: true }}
                    value={form.fecha}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Cliente"
                    name="cliente_id"
                    value={form.cliente_id}
                    onChange={handleChange}
                    required
                    disabled={!!form.presupuesto_id}
                  >
                    {clientes.map((cliente) => (
                      <MenuItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Emisor"
                    name="emisor_id"
                    value={form.emisor_id}
                    onChange={handleChange}
                    required
                    disabled={!!form.presupuesto_id}
                  >
                    {emisores.map((emisor) => (
                      <MenuItem key={emisor.id} value={emisor.id}>
                        {emisor.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Base imponible (€)"
                    name="base_imponible"
                    value={form.base_imponible}
                    onChange={handleChange}
                    required
                    disabled={!!form.presupuesto_id}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="IVA (%)"
                    name="iva_porcentaje"
                    value={form.iva_porcentaje}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="IBAN"
                    name="iban"
                    value={form.iban}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
        >
          Crear factura
        </Button>
      </DialogActions>
    </Dialog>
  );
}
