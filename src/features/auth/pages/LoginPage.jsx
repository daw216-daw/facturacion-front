import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import EuroOutlinedIcon from '@mui/icons-material/EuroOutlined';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../../../styles/ThemeContext';
import { rutaInicioPorRol } from '../../../common/rutasPorRol';
import AppLogo from '../../../common/AppLogo';

const VENTAJAS = [
  {
    icon: <RequestQuoteOutlinedIcon />,
    titulo: 'Presupuestos que se convierten en factura',
    texto: 'Crea el presupuesto, envíalo y factúralo con un clic cuando el cliente lo acepte.',
  },
  {
    icon: <PictureAsPdfOutlinedIcon />,
    titulo: 'PDF listos para enviar',
    texto: 'Compártelos por email o WhatsApp directamente desde la aplicación.',
  },
  {
    icon: <EuroOutlinedIcon />,
    titulo: 'Control de cobros',
    texto: 'Consulta de un vistazo qué está pendiente de facturar y de cobrar.',
  },
];

/* Panel de marca (izquierda en escritorio) */
function PanelMarca() {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: '0 0 46%',
        maxWidth: 620,
        p: { md: 5, lg: 7 },
        color: '#fff',
        background: 'linear-gradient(145deg, #1e88e5 0%, #1565c0 45%, #0d47a1 100%)',
      }}
    >
      {/* Decoración: hojas de documento difuminadas */}
      {[
        { top: '-6%', right: '-8%', rotate: 18, size: 260 },
        { bottom: '-10%', left: '-6%', rotate: -14, size: 220 },
      ].map((d, i) => (
        <Box
          key={i}
          aria-hidden
          sx={{
            position: 'absolute',
            width: d.size,
            height: d.size * 1.3,
            borderRadius: 4,
            border: '2px solid rgba(255,255,255,0.14)',
            bgcolor: 'rgba(255,255,255,0.05)',
            transform: `rotate(${d.rotate}deg)`,
            top: d.top,
            right: d.right,
            bottom: d.bottom,
            left: d.left,
          }}
        />
      ))}

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ position: 'relative' }}>
        <AppLogo size={44} sx={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)', borderRadius: '12px' }} />
        <Typography variant="h6" fontWeight={700} letterSpacing={0.3}>
          Facturación
        </Typography>
      </Stack>

      <Box sx={{ position: 'relative', my: 6 }}>
        <Typography variant="h3" fontWeight={800} lineHeight={1.15} sx={{ fontSize: { md: '2.2rem', lg: '2.7rem' } }}>
          Presupuestos y facturas,
          <br />
          en un solo lugar.
        </Typography>
        <Typography sx={{ mt: 2, opacity: 0.85, maxWidth: 440, fontSize: '1.05rem' }}>
          Gestiona tus clientes, prepara presupuestos claros y emite facturas sin complicaciones.
        </Typography>

        <Stack spacing={2.5} sx={{ mt: 5 }}>
          {VENTAJAS.map((v) => (
            <Stack key={v.titulo} direction="row" spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {v.icon}
              </Box>
              <Box>
                <Typography fontWeight={600}>{v.titulo}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {v.texto}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Typography variant="caption" sx={{ position: 'relative', opacity: 0.7 }}>
        © {new Date().getFullYear()} Facturación
      </Typography>
    </Box>
  );
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Motivo por el que se volvió al login (sesión caducada, usuario desactivado…)
  const [aviso] = useState(() => {
    const mensaje = sessionStorage.getItem('loginMensaje');
    sessionStorage.removeItem('loginMensaje');
    return mensaje;
  });

  // Ya identificado: directo a su panel
  if (user) {
    return <Navigate to={rutaInicioPorRol(user.role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const usuario = await login(email.trim(), password);
      navigate(rutaInicioPorRol(usuario.role), { replace: true });
    } catch (err) {
      const status = err.response?.status;
      // 401 credenciales · 403 usuario desactivado · 429 demasiados intentos · 422 validación
      setError(
        err.response?.data?.message ||
          (status ? 'Credenciales incorrectas' : 'No se pudo conectar con el servidor. Inténtalo de nuevo.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Aviso de Bloq Mayús activado mientras se escribe la contraseña
  const detectarMayusculas = (e) => {
    if (typeof e.getModifierState === 'function') {
      setMayusculas(e.getModifierState('CapsLock'));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <PanelMarca />

      {/* Formulario */}
      <Box
        sx={(t) => ({
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 4 },
          py: { xs: 6, sm: 8 },
          // En móvil y tablet, un toque de color de marca arriba
          background: {
            xs: `linear-gradient(180deg, ${alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.18 : 0.08)} 0%, transparent 38%)`,
            md: 'none',
          },
        })}
      >
        <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          <IconButton
            onClick={toggleTheme}
            sx={{ position: 'absolute', top: { xs: 12, sm: 20 }, right: { xs: 12, sm: 20 } }}
            aria-label="Cambiar tema"
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Logo (solo en móvil y tablet: en escritorio está en el panel de marca) */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 4, display: { xs: 'flex', md: 'none' } }}
          >
            <AppLogo size={44} sx={{ borderRadius: '12px', boxShadow: '0 4px 14px rgba(13,71,161,0.25)' }} />
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                Facturación
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Presupuestos y facturas
              </Typography>
            </Box>
          </Stack>

          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2rem' } }}>
            Bienvenido
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            Inicia sesión para continuar
          </Typography>

          {aviso && !error && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {aviso}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.25}>
              <TextField
                label="Email"
                type="email"
                autoComplete="username"
                autoFocus
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                label="Contraseña"
                type={verPassword ? 'text' : 'password'}
                autoComplete="current-password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={detectarMayusculas}
                onKeyDown={detectarMayusculas}
                onBlur={() => setMayusculas(false)}
                required
                helperText={mayusculas ? 'Bloq Mayús está activado' : ' '}
                slotProps={{
                  formHelperText: { sx: { color: 'warning.main', mt: 0.5 } },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                          <IconButton
                            edge="end"
                            onClick={() => setVerPassword((v) => !v)}
                            onMouseDown={(e) => e.preventDefault()}
                            aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {verPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !email.trim() || !password}
              sx={{
                mt: 1,
                py: 1.4,
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                borderRadius: 2,
                boxShadow: '0 8px 20px rgba(25,118,210,0.28)',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            ¿Has olvidado la contraseña? Pide a un administrador que te la restablezca.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
