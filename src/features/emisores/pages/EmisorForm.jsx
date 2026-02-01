import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { createEmisor, updateEmisor } from '../services/emisores.service';

export default function EmisorForm({ open, onClose, onSaved, emisor }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const EMPTY_FORM = {
    nombre: '',
    nif: '',
    direccion: '',
    cp: '',
    poblacion: '',
    provincia: '',
    email: '',
    telefono: '',
    iban: '',
  };

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (emisor) {
      // SOLO campos editables
      setForm({
        nombre: emisor.nombre ?? '',
        nif: emisor.nif ?? '',
        direccion: emisor.direccion ?? '',
        cp: emisor.cp ?? '',
        poblacion: emisor.poblacion ?? '',
        provincia: emisor.provincia ?? '',
        email: emisor.email ?? '',
        telefono: emisor.telefono ?? '',
        iban: emisor.iban ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [emisor, open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (emisor) {
        await updateEmisor(emisor.id, form);
      } else {
        await createEmisor(form);
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al guardar el emisor');
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
      <DialogTitle>{emisor ? 'Editar emisor' : 'Nuevo emisor'}</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="NIF"
              name="nif"
              value={form.nif}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="CP"
              name="cp"
              value={form.cp}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Población"
              name="poblacion"
              value={form.poblacion}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Provincia"
              name="provincia"
              value={form.provincia}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="IBAN"
              name="iban"
              value={form.iban}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
