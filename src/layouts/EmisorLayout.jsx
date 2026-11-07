import { useMemo } from 'react';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

import { useAuth } from '../features/auth/context/AuthContext';
import { useThemeMode } from '../styles/ThemeContext';
import { getTheme } from '../styles/theme';

const PESTANAS = [
  { value: '/emisor', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { value: '/emisor/presupuestos', label: 'Presupuestos', icon: <RequestQuoteIcon fontSize="small" /> },
  { value: '/emisor/facturas', label: 'Facturas', icon: <ReceiptLongIcon fontSize="small" /> },
];

export default function EmisorLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useThemeMode();

  // Paleta propia (distinta de la del panel de administración), solo para este layout y sus rutas hijas
  const emisorTheme = useMemo(() => getTheme(mode, 'emisor'), [mode]);
  const outerTheme = useTheme();
  const isMobile = useMediaQuery(outerTheme.breakpoints.down('sm'));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Pestaña activa: la más específica cuya ruta coincide con la actual
  const pestanaActiva = PESTANAS
    .filter((p) => location.pathname === p.value || location.pathname.startsWith(`${p.value}/`))
    .sort((a, b) => b.value.length - a.value.length)[0]?.value ?? '/emisor';

  return (
    <ThemeProvider theme={emisorTheme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="primary" sx={{ zIndex: 1 }}>
          <Toolbar sx={{ gap: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
              {isMobile ? 'Emisor' : 'Facturación · Panel del emisor'}
            </Typography>

            <IconButton color="inherit" size="small" onClick={toggleTheme}>
              {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>

            <Button color="inherit" size="small" onClick={handleLogout}>
              {isMobile ? <LogoutIcon fontSize="small" /> : 'Salir'}
            </Button>
          </Toolbar>

          <Tabs
            value={pestanaActiva}
            onChange={(_, value) => navigate(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            textColor="inherit"
            sx={{
              bgcolor: 'primary.dark',
              minHeight: 44,
              '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600 },
              '& .MuiTabs-indicator': { bgcolor: 'secondary.main', height: 3 },
            }}
          >
            {PESTANAS.map((pestana) => (
              <Tab key={pestana.value} value={pestana.value} label={pestana.label} icon={pestana.icon} iconPosition="start" />
            ))}
          </Tabs>
        </AppBar>

        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
