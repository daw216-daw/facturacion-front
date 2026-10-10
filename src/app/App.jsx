import { RouterProvider } from 'react-router-dom';
import router from './router';

import { useAuth } from '../features/auth/context/AuthContext';
import FullPageLoader from '../common/FullPageLoader';

export default function App() {
  const { loading } = useAuth();

  if (loading) return <FullPageLoader texto="Comprobando la sesión…" />;

  return <RouterProvider router={router} />;
}
