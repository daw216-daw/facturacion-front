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
  Alert,
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
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setErrorMsg('');
      await createSerie(form);
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      // Mensaje del API (validación en español) o genérico
      const errores = error.response?.data?.errors;
      setErrorMsg(
        (errores && Object.values(errores)[0]?.[0]) ||
          error.response?.data?.message ||
          'Error al crear la serie'
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
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Nueva serie</DialogTitle>

      <DialogContent dividers>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={12}>
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

          <Grid size={12}>
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
