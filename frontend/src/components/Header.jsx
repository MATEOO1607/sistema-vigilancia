import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header({ titulo }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  function salir() {
    cerrarSesion();
    navigate('/login');
  }

  return (
    <header className="flex items-center justify-between bg-slate-800 px-6 py-4 text-white">
      <div>
        <h1 className="text-lg font-bold">{titulo}</h1>
        <p className="text-sm text-slate-300">
          {usuario?.nombre} · {usuario?.rol}
        </p>
      </div>
      <button
        onClick={salir}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
      >
        Cerrar Sesión
      </button>
    </header>
  );
}
