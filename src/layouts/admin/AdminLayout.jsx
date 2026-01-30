import { Box, Toolbar, useMediaQuery } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

import { useThemeMode } from '../../styles/ThemeContext';
import { useAuth } from '../../features/auth/context/AuthContext';

import AdminTopBar from './AdminTopBar';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>

      <AdminTopBar
        user={user}
        mode={mode}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onMenuClick={() => setMobileOpen(true)}
        onToggleSidebar={() => setCollapsed(prev => !prev)}
        showMenuIcon={isMobile}
        showCollapseIcon={!isMobile}
        collapsed={collapsed}
      />

      <AdminSidebar
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        collapsed={collapsed}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: '100%',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
