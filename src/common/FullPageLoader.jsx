// common/FullPageLoader.jsx
// Pantalla de carga a página completa (comprobando la sesión, permisos…)
import { Box, CircularProgress, Typography } from '@mui/material';

export default function FullPageLoader({ texto = 'Cargando…' }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <CircularProgress />
      <Typography color="text.secondary">{texto}</Typography>
    </Box>
  );
}
