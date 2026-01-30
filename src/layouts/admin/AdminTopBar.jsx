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
          <IconButton
            color="inherit"
            onClick={onToggleSidebar}
            sx={{ mr: 1 }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}


        {/* TÍTULO */}
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' },
            whiteSpace: 'nowrap',
          }}
        >
          Panel de administración
        </Typography>

        {/* DARK / LIGHT */}
        <IconButton color="inherit" onClick={onToggleTheme}>
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

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
          <MenuItem disabled>
            {user?.name}
          </MenuItem>

          <MenuItem onClick={handleCloseMenu}>
            <PersonIcon fontSize="small" sx={{ mr: 1 }} />
            Mi cuenta
          </MenuItem>

          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Cerrar sesión
          </MenuItem>
        </Menu>

      </Toolbar>
    </AppBar>
  );
}

