/** Convierte el estado interno ("En_proceso") a texto legible ("En proceso") */
export function mostrarEstado(estado) {
  return (estado ?? '').replaceAll('_', ' ');
}

/** Colores de badge por estado (clases de Tailwind) */
export function colorEstado(estado) {
  const colores = {
    Recibida: 'bg-blue-100 text-blue-800',
    En_proceso: 'bg-amber-100 text-amber-800',
    Resuelta: 'bg-green-100 text-green-800',
    Reincidente: 'bg-purple-100 text-purple-800',
    Descartada: 'bg-gray-100 text-gray-600',
  };
  return colores[estado] ?? 'bg-gray-100 text-gray-600';
}

/** Formatea una fecha ISO a texto legible en español */
export function formatearFecha(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
