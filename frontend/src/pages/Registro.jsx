import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth, rutaSegunRol } from '../context/AuthContext.jsx';

export default function Registro() {
  const { guardarSesion } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: '', identificador: '', contrasena: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  function actualizar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');

    if (form.nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }
    if (form.contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setEnviando(true);
    try {
      const datos = {
        nombre: form.nombre.trim(),
        identificador: form.identificador.trim(),
        contrasena: form.contrasena,
      };
      await api.post('/auth/register', datos);

      // Auto-login con las mismas credenciales y redirección según rol
      try {
        const { data } = await api.post('/auth/login', {
          identificador: datos.identificador,
          contrasena: datos.contrasena,
        });
        guardarSesion(data.token, data.usuario);
        navigate(rutaSegunRol(data.usuario.rol), { replace: true });
        return;
      } catch {
        // Si el auto-login falla, al menos llevamos al login normal
        navigate('/login');
        return;
      }
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al registrar el usuario');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Crear cuenta</h1>
        <p className="mb-6 text-sm text-slate-500">
          Regístrate para poder enviar denuncias
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-slate-700">
              Nombre completo
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              value={form.nombre}
              onChange={actualizar}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label htmlFor="identificador" className="mb-1 block text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              id="identificador"
              name="identificador"
              type="email"
              required
              value={form.identificador}
              onChange={actualizar}
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
              name="contrasena"
              type="password"
              required
              value={form.contrasena}
              onChange={actualizar}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? 'Registrando…' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
