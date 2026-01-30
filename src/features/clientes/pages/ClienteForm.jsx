import { useEffect, useState } from 'react';
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

import {
  createCliente,
  updateCliente,
} from '../services/clientes.service';

const TIPOS_CLIENTE = [
  { value: 'particular', label: 'Particular' },
  { value: 'comunidad', label: 'Comunidad' },
  { value: 'empresa', label: 'Empresa' },
];

export default function ClienteForm({
  open,
  onClose,
  onSaved,
  cliente = null, // si viene → editar
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [form, setForm] = useState({
    tipo: 'empresa',
    nombre: '',
    nif: '',
    direccion: '',
    cp: '',
    poblacion: '',
    provincia: '',
    email: '',
    telefono: '',
  });

  const [saving, setSaving] = useState(false);

  // 🔄 Cargar datos si es edición
useEffect(() => {
  if (cliente) {
    // EDITAR
    setForm({
      tipo: cliente.tipo || 'empresa',
      nombre: cliente.nombre || '',
      nif: cliente.nif || '',
      direccion: cliente.direccion || '',
      cp: cliente.cp || '',
      poblacion: cliente.poblacion || '',
      provincia: cliente.provincia || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
    });
  } else {
    // NUEVO CLIENTE → reset
    setForm({
      tipo: 'empresa',
      nombre: '',
      nif: '',
      direccion: '',
      cp: '',
      poblacion: '',
      provincia: '',
      email: '',
      telefono: '',
    });
  }
}, [cliente, open]);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      if (cliente) {
        await updateCliente(cliente.id, form);
      } else {
        await createCliente(form);
      }

      onSaved?.(); // refrescar listado
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error al guardar el cliente');
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
      <DialogTitle>
        {cliente ? 'Editar cliente' : 'Nuevo cliente'}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Tipo"
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
            >
              {TIPOS_CLIENTE.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              required
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="NIF"
              name="nif"
              value={form.nif}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="CP"
              name="cp"
              value={form.cp}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Población"
              name="poblacion"
              value={form.poblacion}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
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
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !form.nombre}
        >
          {cliente ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
