import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Ciudadano from './pages/Ciudadano.jsx';
import Admin from './pages/Admin.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import { useAuth, rutaSegunRol } from './context/AuthContext.jsx';

export default function App() {
  const { token, usuario } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to={rutaSegunRol(usuario?.rol)} replace /> : <Login />}
      />
      <Route
        path="/registro"
        element={token ? <Navigate to={rutaSegunRol(usuario?.rol)} replace /> : <Registro />}
      />
      <Route
        path="/ciudadano"
        element={
          <RutaProtegida roles={['Ciudadano']}>
            <Ciudadano />
          </RutaProtegida>
        }
      />
      <Route
        path="/admin"
        element={
          <RutaProtegida roles={['Operador', 'Admin']}>
            <Admin />
          </RutaProtegida>
        }
      />
      <Route
        path="*"
        element={<Navigate to={token ? rutaSegunRol(usuario?.rol) : '/login'} replace />}
      />
    </Routes>
  );
}
