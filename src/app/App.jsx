import { RouterProvider } from 'react-router-dom';
import router from './router';

import { useAuth } from '../features/auth/context/AuthContext';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;



  return <RouterProvider router={router} />;
}
