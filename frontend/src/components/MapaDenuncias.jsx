import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { mostrarEstado } from '../utils/formato.js';

// Los assets por defecto de Leaflet se pierden con el bundler: los registramos a mano
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl: iconShadow,
});

// Centro inicial: Santa Cruz de la Sierra, Bolivia
const CENTRO_INICIAL = [-17.7833, -63.1821];
const ZOOM_INICIAL = 12;

// Marcador individual: al hacer clic, el mapa vuela hasta sus coordenadas con zoom más cercano
function MarcadorDenuncia({ denuncia }) {
  const map = useMap();
  const posicion = [Number(denuncia.latitud), Number(denuncia.longitud)];

  return (
    <Marker
      position={posicion}
      eventHandlers={{ click: () => map.flyTo(posicion, 16) }}
    >
      <Popup>
        <strong>{denuncia.codigo_unico}</strong>
        <br />
        {denuncia.tipo_incidencia}
        <br />
        {mostrarEstado(denuncia.estado)}
      </Popup>
    </Marker>
  );
}

/**
 * Mapa con marcadores en las coordenadas de las denuncias.
 * `denuncias`: array con { id, codigo_unico, tipo_incidencia, estado, latitud, longitud }
 */
export default function MapaDenuncias({ denuncias = [] }) {
  const conCoordenadas = denuncias.filter(
    (d) => d.latitud != null && d.longitud != null,
  );

  return (
    <MapContainer
      center={CENTRO_INICIAL}
      zoom={ZOOM_INICIAL}
      className="h-96 w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {conCoordenadas.map((d) => (
        <MarcadorDenuncia key={d.id} denuncia={d} />
      ))}
    </MapContainer>
  );
}
