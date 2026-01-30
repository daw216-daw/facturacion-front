import { createBrowserRouter, Navigate } from 'react-router-dom';

import LoginPage from '../features/auth/pages/LoginPage';
import RequireAuth from '../guards/RequireAuth';
import RequireRole from '../guards/RequireRole';

import AdminLayout from '../layouts/admin/AdminLayout';
import EmisorLayout from '../layouts/EmisorLayout';

import Dashboard from './Dashboard';
import EmisorDashboard from './EmisorDashboard';
import ClientesPage from '../features/clientes/pages/ClientesPage';
import UsersPage from '../features/users/pages/UsersPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/unauthorized',
    element: <h2>No tienes permisos para acceder a esta sección</h2>,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole allowed={['admin']} />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <Dashboard /> },
              { path: 'clientes', element: <ClientesPage /> },
              { path: 'users', element: <UsersPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole allowed={['emisor']} />,
        children: [
          {
            path: 'emisor',
            element: <EmisorLayout />,
            children: [
              { index: true, element: <EmisorDashboard /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
