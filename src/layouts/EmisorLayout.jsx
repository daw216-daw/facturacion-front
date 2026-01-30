import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export default function EmisorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Facturación · Emisor
          </Typography>

          <Button color="inherit" onClick={handleLogout}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Bienvenido{user?.name ? `, ${user.name}` : ''}
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Desde aquí puedes crear y gestionar tus presupuestos y facturas.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
