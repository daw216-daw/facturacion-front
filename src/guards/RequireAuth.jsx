
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
