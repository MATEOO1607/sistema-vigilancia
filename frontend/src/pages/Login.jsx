import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth, rutaSegunRol } from '../context/AuthContext.jsx';

export default function Login() {
  const { guardarSesion } = useAuth();
  const navigate = useNavigate();

  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const { data } = await api.post('/auth/login', {
        identificador: identificador.trim(),
        contrasena,
      });
      guardarSesion(data.token, data.usuario);
      navigate(rutaSegunRol(data.usuario.rol), { replace: true });
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">
          Sistema de Vigilancia Ciudadana
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Inicia sesión para continuar
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label htmlFor="identificador" className="mb-1 block text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              id="identificador"
              type="email"
              required
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label htmlFor="contrasena" className="mb-1 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-blue-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
