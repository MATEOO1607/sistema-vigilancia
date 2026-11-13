import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import Header from '../components/Header.jsx';
import MapaDenuncias from '../components/MapaDenuncias.jsx';
import { mostrarEstado, colorEstado, formatearFecha } from '../utils/formato.js';

const ESTADOS = ['Recibida', 'En proceso', 'Resuelta', 'Reincidente', 'Descartada'];

// Estados que exigen observación (misma regla del backend)
const OBSERVACION_OBLIGATORIA = ['Resuelta', 'Descartada'];

export default function Admin() {
  const [denuncias, setDenuncias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [denunciaEditar, setDenunciaEditar] = useState(null);
  const [denunciaDetalle, setDenunciaDetalle] = useState(null);

  const cargarDenuncias = useCallback(async (estado = filtroEstado) => {
    setCargando(true);
    setError('');
    try {
      const { data } = await api.get('/denuncias', {
        params: estado ? { estado } : undefined,
      });
      setDenuncias(data.denuncias);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al cargar las denuncias');
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado]);

  useEffect(() => {
    cargarDenuncias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado]);

  // Indicadores calculados en base a las denuncias cargadas de la API
  const indicadores = useMemo(
    () => ({
      total: denuncias.length,
      pendientes: denuncias.filter((d) => d.estado === 'Recibida').length,
      resueltas: denuncias.filter((d) => d.estado === 'Resuelta').length,
    }),
    [denuncias],
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <Header titulo="Panel Administrativo" />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Dashboard de indicadores (CU04) */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-5 text-white shadow-lg">
            <p className="text-sm font-medium text-blue-100">📋 Total Denuncias</p>
            <p className="mt-1 text-4xl font-bold">{indicadores.total}</p>
            <p className="mt-1 text-xs text-blue-200">Registradas en el sistema</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-5 text-white shadow-lg">
            <p className="text-sm font-medium text-amber-100">⏳ Pendientes</p>
            <p className="mt-1 text-4xl font-bold">{indicadores.pendientes}</p>
            <p className="mt-1 text-xs text-amber-200">En estado "Recibida"</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg">
            <p className="text-sm font-medium text-emerald-100">✅ Resueltas</p>
            <p className="mt-1 text-4xl font-bold">{indicadores.resueltas}</p>
            <p className="mt-1 text-xs text-emerald-200">En estado "Resuelta"</p>
          </div>
        </section>

        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="filtro" className="text-sm font-medium text-slate-700">
            Filtrar por estado:
          </label>
          <select
            id="filtro"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {cargando ? (
          <p className="text-slate-500">Cargando…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Denunciante</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {denuncias.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No hay denuncias {filtroEstado ? `con estado "${filtroEstado}"` : 'registradas'}.
                    </td>
                  </tr>
                )}
                {denuncias.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{d.codigo_unico}</td>
                    <td className="px-4 py-3 text-slate-700">{d.tipo_incidencia}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(d.estado)}`}>
                        {mostrarEstado(d.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{d.denunciante?.nombre}</td>
                    <td className="px-4 py-3 text-slate-500">{formatearFecha(d.fecha_hora)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDenunciaDetalle(d)}
                          className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                        >
                          Ver Detalles
                        </button>
                        <button
                          onClick={() => setDenunciaEditar(d)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Actualizar Estado
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold text-slate-800">Mapa de Denuncias</h2>
          <MapaDenuncias denuncias={denuncias} />
        </section>
      </main>

      {denunciaEditar && (
        <ModalActualizarEstado
          denuncia={denunciaEditar}
          onCerrar={() => setDenunciaEditar(null)}
          onGuardada={() => {
            setDenunciaEditar(null);
            cargarDenuncias();
          }}
        />
      )}

      {denunciaDetalle && (
        <ModalDetalles denuncia={denunciaDetalle} onCerrar={() => setDenunciaDetalle(null)} />
      )}
    </div>
  );
}

function ModalDetalles({ denuncia, onCerrar }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-slate-800">Detalles de la Denuncia</h3>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="font-medium text-slate-500">Código</dt>
            <dd className="font-mono font-semibold text-slate-800">{denuncia.codigo_unico}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="font-medium text-slate-500">Fecha</dt>
            <dd className="text-slate-700">{formatearFecha(denuncia.fecha_hora)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="font-medium text-slate-500">Tipo</dt>
            <dd className="text-slate-700">{denuncia.tipo_incidencia}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="font-medium text-slate-500">Estado</dt>
            <dd>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colorEstado(denuncia.estado)}`}>
                {mostrarEstado(denuncia.estado)}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="font-medium text-slate-500">Denunciante</dt>
            <dd className="text-slate-700">{denuncia.denunciante?.nombre}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
            <dt className="font-medium text-slate-500">Coordenadas</dt>
            <dd className="font-mono text-slate-700">
              {Number(denuncia.latitud).toFixed(6)}, {Number(denuncia.longitud).toFixed(6)}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-slate-500">Descripción</p>
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            {denuncia.descripcion}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onCerrar}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalActualizarEstado({ denuncia, onCerrar, onGuardada }) {
  const [estado, setEstado] = useState(mostrarEstado(denuncia.estado));
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');

    // Validación en el frontend de la misma regla del backend
    if (OBSERVACION_OBLIGATORIA.includes(estado) && !observacion.trim()) {
      setError(`La observación es obligatoria cuando el estado es "${estado}"`);
      return;
    }

    setGuardando(true);
    try {
      await api.put(`/denuncias/${denuncia.id}/estado`, {
        estado,
        observacion: observacion.trim() || undefined,
      });
      onGuardada();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al actualizar el estado');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-bold text-slate-800">Actualizar Estado</h3>
        <p className="mb-4 text-sm text-slate-500">
          Denuncia <span className="font-mono font-semibold">{denuncia.codigo_unico}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label htmlFor="estado" className="mb-1 block text-sm font-medium text-slate-700">
              Nuevo estado
            </label>
            <select
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="observacion" className="mb-1 block text-sm font-medium text-slate-700">
              Observación
              {OBSERVACION_OBLIGATORIA.includes(estado) && (
                <span className="ml-1 text-xs font-semibold text-red-600">(obligatoria para {estado})</span>
              )}
            </label>
            <textarea
              id="observacion"
              rows={3}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Detalle del cambio de estado"
            />
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
              disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
