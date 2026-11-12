import { Navigate } from 'react-router-dom';
import { useAuth, rutaSegunRol } from '../context/AuthContext.jsx';

/**
 * Protege una ruta: si no hay token redirige al login.
 * Si se pasan `roles`, el usuario debe tener uno de ellos
 * (si no, lo manda a la pantalla que le corresponde).
 */
export default function RutaProtegida({ roles, children }) {
  const { token, usuario } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario?.rol)) {
    return <Navigate to={rutaSegunRol(usuario?.rol)} replace />;
  }

  return children;
}
