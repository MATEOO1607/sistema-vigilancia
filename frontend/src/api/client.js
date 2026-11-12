import axios from 'axios';

// En producción, VITE_API_URL apunta al backend de Render (SIN /api al final,
// ej: https://sistema-vigilancia.onrender.com). En desarrollo usa localhost.
// El sufijo /api se agrega aquí porque las rutas del backend viven bajo /api.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Instancia única de axios
const api = axios.create({
  baseURL: `${API_BASE}/api`,
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
