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
  Alert,
} from '@mui/material';

import {
  createUser,
  updateUser,
} from '../services/users.service';

const ROLES = [
  { value: 'admin', label: 'Administrador (acceso completo al panel)' },
  { value: 'emisor', label: 'Emisor (panel de emisor, sin acceso al panel de administración)' },
];

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'emisor',
};

export default function UserForm({
  open,
  onClose,
  onSaved,
  user = null, // editar si viene
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 🔄 cargar datos si es edición / reset si es nuevo
  useEffect(() => {
    setErrorMsg('');
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'emisor',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [user, open]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setErrorMsg('');

      const payload = { ...form };
      if (!payload.password) delete payload.password; // no cambiar pass si está vacío

      if (user) {
        await updateUser(user.id, payload);
      } else {
        await createUser(payload);
      }

      onSaved?.();
      handleClose();
    } catch (e) {
      console.error(e);
      // Mensaje del API (validación en español) o genérico
      const errores = e.response?.data?.errors;
      setErrorMsg(
        (errores && Object.values(errores)[0]?.[0]) ||
          e.response?.data?.message ||
          'Error al guardar el usuario'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {user ? 'Editar usuario' : 'Nuevo usuario'}
      </DialogTitle>

      <DialogContent dividers>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              fullWidth
              required
              label="Nombre"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              required
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              type="password"
              label={user ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              helperText={
                user
                  ? 'Déjala vacía para no cambiarla. Si la cambias, se cerrarán sus sesiones abiertas.'
                  : 'Mínimo 8 caracteres'
              }
            />
          </Grid>

          <Grid size={12}>
            <TextField
              select
              fullWidth
              label="Rol"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              {ROLES.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving || !form.name || !form.email}
        >
          {user ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
