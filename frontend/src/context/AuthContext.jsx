import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

/** Ruta principal según el rol del usuario */
export function rutaSegunRol(rol) {
  return rol === 'Ciudadano' ? '/ciudadano' : '/admin';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario'));
    } catch {
      return null;
    }
  });

  function guardarSesion(nuevoToken, nuevoUsuario) {
    localStorage.setItem('token', nuevoToken);
    localStorage.setItem('usuario', JSON.stringify(nuevoUsuario));
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  }

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ token, usuario, guardarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
