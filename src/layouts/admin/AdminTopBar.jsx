import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Tooltip,
  Divider,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';



export default function AdminTopBar({
  user,
  mode,
  onToggleTheme,
  onLogout,
  onMenuClick,
  showMenuIcon,
  showCollapseIcon,
  onToggleSidebar,
  collapsed,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    onLogout();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: 1201 }}>
      <Toolbar>

        {/* MENU HAMBURGUESA (MÓVIL) */}
        {showMenuIcon && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {/* COLLAPSE SIDEBAR (DESKTOP) */}
        {showCollapseIcon && (
          <Tooltip title={collapsed ? 'Expandir menú' : 'Contraer menú'}>
            <IconButton
              color="inherit"
              onClick={onToggleSidebar}
              sx={{ mr: 1 }}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        )}


        {/* TÍTULO: corto en móvil para que no empuje los iconos fuera de pantalla */}
        <Typography
          variant="h6"
          noWrap
          sx={{
            flexGrow: 1,
            minWidth: 0,
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Panel de administración
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            Facturación
          </Box>
        </Typography>

        {/* DARK / LIGHT */}
        <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
          <IconButton color="inherit" onClick={onToggleTheme}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>

        {/* AVATAR + MENU */}
        <Tooltip title="Cuenta">
          <IconButton
            color="inherit"
            onClick={handleOpenMenu}
            sx={{ ml: 1 }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
              }}
            >
              {user?.name?.[0]?.toUpperCase() || <PersonIcon />}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* MENU */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleCloseMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {/* Datos de la sesión (solo lectura) */}
          <Box sx={{ px: 2, py: 1, maxWidth: 280 }}>
            <Typography variant="subtitle2" noWrap>{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{user?.email}</Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role === 'admin' ? 'Administrador' : user?.role}
            </Typography>
          </Box>
          <Divider />

          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Cerrar sesión
          </MenuItem>
        </Menu>

      </Toolbar>
    </AppBar>
  );
}

