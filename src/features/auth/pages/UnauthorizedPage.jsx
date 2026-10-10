// features/auth/pages/UnauthorizedPage.jsx
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { rutaInicioPorRol } from '../../../common/rutasPorRol';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const inicio = user ? rutaInicioPorRol(user.role) : '/login';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <LockIcon color="warning" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No tienes permisos para acceder a esta sección
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Si crees que es un error, contacta con un administrador.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
            {inicio !== '/unauthorized' && (
              <Button variant="contained" onClick={() => navigate(inicio, { replace: true })}>
                Ir a mi inicio
              </Button>
            )}
            {user && (
              <Button onClick={handleLogout}>
                Cerrar sesión
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
