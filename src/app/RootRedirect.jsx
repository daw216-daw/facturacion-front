// app/RootRedirect.jsx
// "/" → panel según el rol si hay sesión, si no al login
import { Navigate } from 'react-router-dom';

import { useAuth } from '../features/auth/context/AuthContext';
import { rutaInicioPorRol } from '../common/rutasPorRol';

export default function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? rutaInicioPorRol(user.role) : '/login'} replace />;
}
