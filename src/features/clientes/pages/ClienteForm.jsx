import { useEffect, useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Paper,
  Stack,
  Typography,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

import {
  createCliente,
  updateCliente,
} from '../services/clientes.service';
import { ayudaTelefono } from '../../../common/telefonos';

const TIPOS_CLIENTE = [
  { value: 'particular', label: 'Particular', icon: <PersonIcon fontSize="small" /> },
  { value: 'comunidad', label: 'Comunidad', icon: <ApartmentIcon fontSize="small" /> },
  { value: 'empresa', label: 'Empresa', icon: <BusinessIcon fontSize="small" /> },
];

// La etiqueta del nombre cambia según el tipo de cliente
const LABEL_NOMBRE = {
  particular: 'Nombre y apellidos',
  comunidad: 'Nombre de la comunidad',
  empresa: 'Razón social',
};

const FORM_VACIO = {
  tipo: 'empresa',
  nombre: '',
  nif: '',
  direccion: '',
  cp: '',
  poblacion: '',
  provincia: '',
  email: '',
  telefono: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Bloque con título y marca de obligatorio / opcional */
function Seccion({ titulo, opcional = false, descripcion, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="baseline" spacing={1} mb={descripcion ? 0.5 : 2}>
        <Typography
          variant="subtitle2"
          fontWeight={600}
          color="text.secondary"
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          {titulo}
        </Typography>
        <Typography variant="caption" color={opcional ? 'text.disabled' : 'error.main'}>
          {opcional ? '(opcional)' : '(obligatorio)'}
        </Typography>
      </Stack>

      {descripcion && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {descripcion}
        </Typography>
      )}

      {children}
    </Paper>
  );
}

export default function ClienteForm({
  open,
  onClose,
  onSaved,
  cliente = null, // si viene → editar
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [form, setForm] = useState(FORM_VACIO);
  const [errors, setErrors] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [saving, setSaving] = useState(false);

  // 🔄 Cargar datos si es edición, o vaciar si es nuevo
  useEffect(() => {
    if (!open) return;

    setErrors({});
    setErrorGeneral('');

    setForm(
      cliente
        ? {
            tipo: cliente.tipo || 'empresa',
            nombre: cliente.nombre || '',
            nif: cliente.nif || '',
            direccion: cliente.direccion || '',
            cp: cliente.cp || '',
            poblacion: cliente.poblacion || '',
            provincia: cliente.provincia || '',
            email: cliente.email || '',
            telefono: cliente.telefono || '',
          }
        : FORM_VACIO
    );
  }, [cliente, open]);

  const handleChange = (e) => {
    const { name } = e.target;
    const value = name === 'nif' ? e.target.value.toUpperCase() : e.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
    // El error del campo desaparece al corregirlo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTipo = (_, tipo) => {
    if (tipo) setForm((prev) => ({ ...prev, tipo }));
  };

  const validar = () => {
    const nuevos = {};

    if (!form.nombre.trim()) {
      nuevos.nombre = 'El nombre es obligatorio';
    }

    if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
      nuevos.email = 'El email no tiene un formato válido';
    }

    setErrors(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const handleSubmit = async () => {
    if (!validar()) return;

    try {
      setSaving(true);
      setErrorGeneral('');

      if (cliente) {
        await updateCliente(cliente.id, form);
      } else {
        await createCliente(form);
      }

      onSaved?.(); // refrescar listado
      onClose();
    } catch (error) {
      console.error(error);

      // Errores de validación de Laravel → bajo cada campo
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        setErrors(
          Object.fromEntries(
            Object.entries(apiErrors).map(([campo, mensajes]) => [campo, mensajes[0]])
          )
        );
      }

      setErrorGeneral(
        error.response?.data?.message || 'Error al guardar el cliente'
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
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
        {cliente ? 'Editar cliente' : 'Nuevo cliente'}
        <Typography variant="body2" color="text.secondary">
          Los campos marcados con * son obligatorios.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {errorGeneral && (
            <Alert severity="error" onClose={() => setErrorGeneral('')}>
              {errorGeneral}
            </Alert>
          )}

          {/* ───────────── DATOS PRINCIPALES ───────────── */}
          <Seccion titulo="Datos del cliente">
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Tipo de cliente *
                </Typography>
                <ToggleButtonGroup
                  value={form.tipo}
                  exclusive
                  onChange={handleTipo}
                  size="small"
                  color="primary"
                  fullWidth={fullScreen}
                >
                  {TIPOS_CLIENTE.map((tipo) => (
                    <ToggleButton key={tipo.value} value={tipo.value} sx={{ gap: 1, px: 2 }}>
                      {tipo.icon}
                      {tipo.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    fullWidth
                    required
                    autoFocus
                    label={LABEL_NOMBRE[form.tipo] ?? 'Nombre'}
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    error={!!errors.nombre}
                    helperText={errors.nombre || 'Aparece en presupuestos y facturas'}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="NIF / CIF (opcional)"
                    name="nif"
                    value={form.nif}
                    onChange={handleChange}
                    error={!!errors.nif}
                    helperText={errors.nif || 'Necesario para facturar a empresas'}
                    inputProps={{ maxLength: 20 }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Seccion>

          {/* ───────────── DIRECCIÓN ───────────── */}
          <Seccion titulo="Dirección" opcional>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  name="direccion"
                  placeholder="Calle, número, piso, puerta…"
                  value={form.direccion}
                  onChange={handleChange}
                  error={!!errors.direccion}
                  helperText={errors.direccion}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Código postal"
                  name="cp"
                  value={form.cp}
                  onChange={handleChange}
                  error={!!errors.cp}
                  helperText={errors.cp}
                  inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  label="Población"
                  name="poblacion"
                  value={form.poblacion}
                  onChange={handleChange}
                  error={!!errors.poblacion}
                  helperText={errors.poblacion}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Provincia"
                  name="provincia"
                  value={form.provincia}
                  onChange={handleChange}
                  error={!!errors.provincia}
                  helperText={errors.provincia}
                />
              </Grid>
            </Grid>
          </Seccion>

          {/* ───────────── CONTACTO ───────────── */}
          <Seccion
            titulo="Contacto"
            opcional
            descripcion="Se usan para enviar presupuestos y facturas por email o WhatsApp."
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  fullWidth
                  type="tel"
                  label="Teléfono"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  error={!!errors.telefono}
                  // Indica si es móvil (WhatsApp) o fijo, con la misma regla que el API
                  helperText={
                    errors.telefono ||
                    ayudaTelefono(form.telefono)?.texto ||
                    'Móvil para enviar por WhatsApp (los fijos no tienen WhatsApp)'
                  }
                  slotProps={{
                    formHelperText: {
                      sx: { color: !errors.telefono && ayudaTelefono(form.telefono) ? `${ayudaTelefono(form.telefono).severity}.main` : undefined },
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Seccion>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={saving}
        >
          {cliente ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
