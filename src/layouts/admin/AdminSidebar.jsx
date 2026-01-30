import {
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from '@mui/material';

import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';

import { useNavigate } from 'react-router-dom';

const drawerWidth = 220;
const collapsedWidth = 64;

export default function AdminSidebar({
  isMobile,
  mobileOpen,
  onClose,
  collapsed,
}) {
  const navigate = useNavigate();

  const content = (
    <>
      <Toolbar />

      <List>
        <Tooltip title="Dashboard" placement="right" disableHoverListener={!collapsed}>
          <ListItemButton
            onClick={() => {
              navigate('/admin');
              onClose?.();
            }}
            sx={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2 }}>
              <DashboardIcon />
            </ListItemIcon>

            {!collapsed && <ListItemText primary="Dashboard" />}
          </ListItemButton>
        </Tooltip>

        <Tooltip title="Clientes" placement="right" disableHoverListener={!collapsed}>
          <ListItemButton
            onClick={() => {
              navigate('/admin/clientes');
              onClose?.();
            }}
            sx={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2 }}>
              <PeopleIcon />
            </ListItemIcon>

            {!collapsed && <ListItemText primary="Clientes" />}
          </ListItemButton>
        </Tooltip>
        {/* Agregar users */}
        <Tooltip title="Usuarios" placement="right" disableHoverListener={!collapsed}>
          <ListItemButton
            onClick={() => {
              navigate('/admin/users');
              onClose?.();
            }}
            sx={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2 }}>
              <PeopleIcon />
            </ListItemIcon>

            {!collapsed && <ListItemText primary="Usuarios" />}
          </ListItemButton>
        </Tooltip>
      </List>
    </>
  );

  return (
    <>
      {/* MOBILE */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            [`& .MuiDrawer-paper`]: { width: drawerWidth },
          }}
        >
          {content}
        </Drawer>
      )}

      {/* DESKTOP */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: collapsed ? collapsedWidth : drawerWidth,
            [`& .MuiDrawer-paper`]: {
              width: collapsed ? collapsedWidth : drawerWidth,
              transition: 'width 0.2s',
              overflowX: 'hidden',
            },
          }}
        >
          {content}
        </Drawer>
      )}
    </>
  );
}
