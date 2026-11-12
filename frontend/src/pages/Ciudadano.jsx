import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import api from '../api/client.js';
import Header from '../components/Header.jsx';
import { mostrarEstado, colorEstado, formatearFecha } from '../utils/formato.js';

const TIPOS_INCIDENCIA = ['Microbasural', 'Quema', 'Residuos especiales', 'Otro'];

export default function Ciudadano() {
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargarDenuncias = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const { data } = await api.get('/denuncias/mis-denuncias');
      setDenuncias(data.denuncias);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al cargar tus denuncias');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDenuncias();
  }, [cargarDenuncias]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Header titulo="Panel Ciudadano" />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => setModalAbierto(true)}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow hover:bg-blue-700 sm:w-auto sm:px-10"
          >
            + Nueva Denuncia
          </button>
        </div>

        <h2 className="mb-3 text-xl font-bold text-slate-800">Mis Denuncias</h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {cargando ? (
          <p className="text-slate-500">Cargando…</p>
        ) : denuncias.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-slate-500 shadow">
            Todavía no has registrado denuncias.
          </p>
        ) : (
          <ul className="space-y-3">
            {denuncias.map((d) => (
              <li key={d.id} className="rounded-xl bg-white p-4 shadow">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-slate-800">{d.codigo_unico}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(d.estado)}`}>
                    {mostrarEstado(d.estado)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{d.descripcion}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-slate-500">
                  <span>Tipo: {d.tipo_incidencia}</span>
                  <span>{formatearFecha(d.fecha_hora)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {modalAbierto && (
        <ModalNuevaDenuncia
          onCerrar={() => setModalAbierto(false)}
          onGuardada={cargarDenuncias}
        />
      )}
    </div>
  );
}

// Centro de Santa Cruz de la Sierra (fallback si el GPS falla o es rechazado)
const SANTA_CRUZ = [-17.7833, -63.1821];

function ModalNuevaDenuncia({ onCerrar, onGuardada }) {
  const [form, setForm] = useState({
    descripcion: '',
    tipo_incidencia: 'Microbasural',
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajeUbicacion, setMensajeUbicacion] = useState(
    'Mueve el mapa para ubicar exactamente el problema',
  );
  const [gpsFallido, setGpsFallido] = useState(false);
  const mapRef = useRef(null);

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setGpsFallido(true);
      setMensajeUbicacion(
        'No pudimos obtener tu GPS exacto. Por favor, arrastra el mapa con tu dedo hasta el lugar exacto del problema',
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsFallido(false);
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16);
        setMensajeUbicacion('Ubicación detectada: arrastra el mapa para afinar el pin si hace falta');
      },
      () => {
        setGpsFallido(true);
        mapRef.current?.flyTo(SANTA_CRUZ, 14);
        setMensajeUbicacion(
          'No pudimos obtener tu GPS exacto. Por favor, arrastra el mapa con tu dedo hasta el lugar exacto del problema',
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  // Al abrir el modal, intenta detectar la ubicación del usuario
  useEffect(() => {
    usarMiUbicacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function actualizar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');

    if (form.descripcion.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres');
      return;
    }

    // La coordenadas salen del CENTRO actual del mapa (pin fijo)
    const centro = mapRef.current?.getCenter();
    if (!centro) {
      setError('El mapa aún está cargando, espera un momento');
      return;
    }
    const latitud = Number(centro.lat.toFixed(7));
    const longitud = Number(centro.lng.toFixed(7));

    setEnviando(true);
    try {
      await api.post('/denuncias', {
        descripcion: form.descripcion.trim(),
        tipo_incidencia: form.tipo_incidencia,
        latitud,
        longitud,
      });
      onGuardada();
      onCerrar();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al registrar la denuncia');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-slate-800">Nueva Denuncia</h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-slate-700">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              required
              value={form.descripcion}
              onChange={actualizar}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Describe lo que ocurrió (mínimo 10 caracteres)"
            />
          </div>

          <div>
            <label htmlFor="tipo_incidencia" className="mb-1 block text-sm font-medium text-slate-700">
              Tipo de incidencia
            </label>
            <select
              id="tipo_incidencia"
              name="tipo_incidencia"
              value={form.tipo_incidencia}
              onChange={actualizar}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              {TIPOS_INCIDENCIA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ubicacion" className="mb-1 block text-sm font-medium text-slate-700">
              Ubicación
            </label>
            {gpsFallido ? (
              <div className="mb-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
                ⚠️ {mensajeUbicacion}
              </div>
            ) : (
              <p className="mb-2 text-xs text-slate-500">{mensajeUbicacion}</p>
            )}
            <button
              type="button"
              onClick={usarMiUbicacion}
              className="mb-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              📍 Usar mi ubicación actual
            </button>
            <div id="ubicacion" className="relative overflow-hidden rounded-lg">
              <MapContainer
                ref={mapRef}
                center={SANTA_CRUZ}
                zoom={14}
                className="h-64 w-full"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </MapContainer>
              {/* Pin fijo en el centro del mapa: el usuario arrastra el mapa, no el pin */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-full">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" aria-hidden="true">
                  <path d="M12 1C7.9 1 4.5 4.4 4.5 8.5c0 5.6 6.7 12.7 7 13 .3-.3 7-7.4 7-13C18.5 4.4 16.1 1 12 1z" />
                  <circle cx="12" cy="8.5" r="2.5" fill="#fff" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {enviando ? 'Enviando…' : 'Enviar denuncia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
