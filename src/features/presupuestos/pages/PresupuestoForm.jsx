import { useEffect, useState } from 'react';
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
  Divider,
  Paper,
} from '@mui/material';

import { createPresupuesto, updatePresupuesto } from '../services/presupuestos.service';
import { getClientesSelect } from '../../clientes/services/clientes.service';
import { getEmisores } from '../../emisores/services/emisores.service';
import DocumentoTextoEditor from '../../../common/DocumentoTextoEditor';

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
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    cliente_id: '',
    emisor_id: '',
    fecha: '',
    total: '',
    descripcion: '',
    observaciones: '',
  });

  /* ───────────── CARGA ───────────── */
  useEffect(() => {
    if (!open) return;

    getClientesSelect().then(setClientes);
    getEmisores().then(setEmisores);

    if (presupuesto) {
      setForm({
        cliente_id: presupuesto.cliente_id,
        emisor_id: presupuesto.emisor_id,
        fecha: presupuesto.fecha
          ? dayjs(presupuesto.fecha).format('YYYY-MM-DD')
          : '',
        total: presupuesto.total,
        descripcion: presupuesto.descripcion || '',
        observaciones: presupuesto.observaciones || '',
      });
    }
  }, [open, presupuesto]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ───────────── GUARDAR ───────────── */
  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (presupuesto) {
        await updatePresupuesto(presupuesto.id, form);
      } else {
        await createPresupuesto(form);
      }

      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al guardar el presupuesto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        {presupuesto ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>

          {/* ───────────── DATOS GENERALES ───────────── */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Datos generales
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Emisor"
                    name="emisor_id"
                    value={form.emisor_id}
                    onChange={handleChange}
                    required
                  >
                    {emisores.map((e) => (
                      <MenuItem key={e.id} value={e.id}>
                        {e.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Cliente"
                    name="cliente_id"
                    value={form.cliente_id}
                    onChange={handleChange}
                    required
                  >
                    {clientes.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
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

                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Total (€)"
                    name="total"
                    value={form.total}
                    onChange={handleChange}
                    required
                  />
                </Grid>

                {/* ESTADO (SOLO LECTURA EN EDICIÓN) */}
                {presupuesto && (
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Estado"
                      value={presupuesto.estado}
                      disabled
                    />
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* ───────────── DESCRIPCIÓN ───────────── */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Descripción / trabajos a realizar
              </Typography>

              <DocumentoTextoEditor
                value={form.descripcion}
                onChange={(html) =>
                  setForm((prev) => ({ ...prev, descripcion: html }))
                }
              />
            </Paper>
          </Grid>

          {/* ───────────── OBSERVACIONES ───────────── */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Observaciones internas
              </Typography>

              <DocumentoTextoEditor
                value={form.observaciones}
                onChange={(html) =>
                  setForm((prev) => ({ ...prev, observaciones: html }))
                }
              />
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
          size="large"
        >
          {presupuesto ? 'Guardar cambios' : 'Crear presupuesto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
