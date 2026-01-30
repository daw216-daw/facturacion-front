
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export default function RequireRole({ allowed }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
