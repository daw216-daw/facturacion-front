// common/ShareDialog.jsx
// Compartir el PDF de un presupuesto o una factura por email o WhatsApp.
// - Email y teléfono vienen del cliente pero se pueden cambiar para este envío (no cambia su ficha).
// - WhatsApp solo con móviles: un fijo desactiva el botón.
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

import { ayudaTelefono, puedeWhatsapp } from './telefonos';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Props:
 * - contacto: { email, telefono } del cliente (valores iniciales)
 * - emisorEmail: si existe, se ofrece "enviarme una copia"
 * - onEmail({ email, copia_emisor }) · onWhatsapp({ telefono })  (devuelven promesas)
 * - error: mensaje del API para mostrar dentro del diálogo
 */
export default function ShareDialog({
  open,
  title = 'Compartir documento',
  description = '¿Cómo quieres enviar el PDF?',
  contacto,
  emisorEmail,
  loading = false,
  error,
  onClose,
  onEmail,
  onWhatsapp,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [copiaEmisor, setCopiaEmisor] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(contacto?.email ?? '');
      setTelefono(contacto?.telefono ?? '');
      setCopiaEmisor(false);
    }
  }, [open, contacto?.email, contacto?.telefono]);

  const emailValido = EMAIL_REGEX.test(email.trim());
  const ayudaTel = ayudaTelefono(telefono);
  const whatsappPermitido = puedeWhatsapp(telefono);
  const emailCambiado = (contacto?.email ?? '') !== email.trim();
  const telefonoCambiado = (contacto?.telefono ?? '') !== telefono.trim();

  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Typography sx={{ mb: 2 }}>{description}</Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* EMAIL */}
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" color="text.secondary">
            Por email (PDF adjunto)
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="email"
            label="Email de destino"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!email && !emailValido}
            helperText={
              !email
                ? 'El cliente no tiene email: escribe uno para enviarlo'
                : !emailValido
                  ? 'Email no válido'
                  : emailCambiado
                    ? 'Solo para este envío: la ficha del cliente no cambia'
                    : ' '
            }
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
          {emisorEmail && (
            <FormControlLabel
              sx={{ mt: -1 }}
              control={
                <Checkbox
                  size="small"
                  checked={copiaEmisor}
                  onChange={(e) => setCopiaEmisor(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  Enviarme una copia oculta a {emisorEmail}
                </Typography>
              }
            />
          )}
          <Box>
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              onClick={() => onEmail({ email: email.trim(), copia_emisor: copiaEmisor })}
              disabled={loading || !emailValido}
            >
              {loading ? 'Enviando…' : 'Enviar por email'}
            </Button>
          </Box>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {/* WHATSAPP */}
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" color="text.secondary">
            Por WhatsApp (mensaje con enlace al PDF)
          </Typography>
          <TextField
            fullWidth
            size="small"
            type="tel"
            label="Móvil de destino"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            error={ayudaTel?.severity === 'error'}
            helperText={
              ayudaTel
                ? `${ayudaTel.texto}${telefonoCambiado ? ' · solo para este envío' : ''}`
                : 'Sin número: WhatsApp se abrirá para que elijas el contacto'
            }
            slotProps={{
              formHelperText: {
                sx: {
                  color: ayudaTel ? `${ayudaTel.severity}.main` : undefined,
                },
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIphoneIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box>
            <Button
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
              onClick={() => onWhatsapp({ telefono: telefono.trim() })}
              disabled={loading || !whatsappPermitido}
            >
              Abrir WhatsApp
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Se abrirá WhatsApp con el mensaje preparado: revisa y pulsa enviar. El enlace al PDF caduca a los 7 días.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
