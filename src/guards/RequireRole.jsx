
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import FullPageLoader from '../common/FullPageLoader';

export default function RequireRole({ allowed }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
