import axios from 'axios';

// Instancia única de axios. En desarrollo las peticiones a /api
// pasan por el proxy de Vite hacia http://localhost:3000
const api = axios.create({
  baseURL: '/api',
});

// Adjunta el token JWT guardado en localStorage a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401, la sesión ya no es válida: limpiar y volver al login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;
