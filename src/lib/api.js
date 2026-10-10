import axios from 'axios';

// URL del API: VITE_API_BASE_URL en .env (desarrollo) o .env.production (build de producción)
const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  // Sin la variable el build apuntaría a ningún sitio: se avisa en consola
  console.error('Falta VITE_API_BASE_URL en el .env del front (p. ej. https://api.midominio.com/api)');
}

const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
});

// 🔐 Interceptor: añade el token a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🚨 Interceptor de respuesta: sesión caducada o usuario desactivado → al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // El propio login devuelve 401 con credenciales incorrectas: ese error lo muestra LoginPage
    const esLogin = error.config?.url?.endsWith('/login');

    if (status === 401 && !esLogin) {
      localStorage.removeItem('token');
      const mensaje = error.response?.data?.message;
      if (mensaje) sessionStorage.setItem('loginMensaje', mensaje);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
