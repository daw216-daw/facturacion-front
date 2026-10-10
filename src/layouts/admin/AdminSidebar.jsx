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
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';


import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 220;
const collapsedWidth = 64;

export default function AdminSidebar({
  isMobile,
  mobileOpen,
  onClose,
  collapsed,
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Sección activa: /admin exacto para el dashboard; el resto también en sus subrutas (preview…)
  const isActive = (ruta) => (ruta === '/admin' ? pathname === '/admin' : pathname.startsWith(ruta));

  const content = (
    <>
      <Toolbar />

      <List>
        <Tooltip title="Dashboard" placement="right" disableHoverListener={!collapsed}>
          <ListItemButton
            selected={isActive('/admin')}
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
            selected={isActive('/admin/clientes')}
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
            selected={isActive('/admin/users')}
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
              <ManageAccountsIcon />
            </ListItemIcon>

            {!collapsed && <ListItemText primary="Usuarios" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip
          title="Presupuestos"
          placement="right"
          disableHoverListener={!collapsed}
        >
          <ListItemButton
            selected={isActive('/admin/presupuestos')}
            onClick={() => {
              navigate('/admin/presupuestos');
              onClose?.();
            }}
            sx={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2 }}>
              <RequestQuoteIcon />
            </ListItemIcon>

            {!collapsed && <ListItemText primary="Presupuestos" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip
          title="Facturas"
          placement="right"
          disableHoverListener={!collapsed}
        >
          <ListItemButton
            selected={isActive('/admin/facturas')}
            onClick={() => {
              navigate('/admin/facturas');
              onClose?.();
            }}
            sx={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2 }}>
              <ReceiptLongIcon />
            </ListItemIcon>

            {!collapsed && <ListItemText primary="Facturas" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip
          title="Emisores"
          placement="right"
          disableHoverListener={!collapsed}
        >
          <ListItemButton
            selected={isActive('/admin/emisores')}
            onClick={() => {
              navigate('/admin/emisores');
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

            {!collapsed && <ListItemText primary="Emisores" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip title="Series" placement="right" disableHoverListener={!collapsed}>
          <ListItemButton
            selected={isActive('/admin/series')}
            onClick={() => {
              navigate('/admin/series');
              onClose?.();
            }}
            sx={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2 }}>
              <FormatListNumberedIcon />
            </ListItemIcon>

            {!collapsed && <ListItemText primary="Series" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip
          title="Textos de documentos"
          placement="right"
          disableHoverListener={!collapsed}
        >
          <ListItemButton
            selected={isActive('/admin/documento-textos')}
            onClick={() => {
              navigate('/admin/documento-textos');
              onClose?.();
            }}
            sx={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2 }}>
              <RequestQuoteIcon />
            </ListItemIcon>

            {!collapsed && <ListItemText primary="Textos de documentos" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip
          title="Vista de correos"
          placement="right"
          disableHoverListener={!collapsed}
        >
          <ListItemButton
            selected={isActive('/admin/correos')}
            onClick={() => {
              navigate('/admin/correos');
              onClose?.();
            }}
            sx={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2 }}>
              <MarkEmailReadOutlinedIcon />
            </ListItemIcon>

            {!collapsed && <ListItemText primary="Vista de correos" />}
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
