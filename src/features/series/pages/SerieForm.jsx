import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import { createSerie } from '../services/series.service';

export default function SerieForm({ open, onClose, onSaved }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [form, setForm] = useState({
    tipo: 'presupuesto',
    anio: new Date().getFullYear(),
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await createSerie(form);
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al crear la serie');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Nueva serie</DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Tipo"
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
            >
              <MenuItem value="presupuesto">Presupuesto</MenuItem>
              <MenuItem value="factura">Factura</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="Año"
              name="anio"
              value={form.anio}
              onChange={handleChange}
              inputProps={{ min: 2000 }}
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
          Crear serie
        </Button>
      </DialogActions>
    </Dialog>
  );
}
