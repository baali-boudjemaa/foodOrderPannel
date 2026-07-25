import { useCallback, useMemo, useState } from 'react';
import Map, { Marker, type MapLayerMouseEvent } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Riyadh, Saudi Arabia — sensible default center for this platform.
const DEFAULT_CENTER = { latitude: 24.7136, longitude: 46.6753 };

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [viewState, setViewState] = useState({
    latitude: latitude ?? DEFAULT_CENTER.latitude,
    longitude: longitude ?? DEFAULT_CENTER.longitude,
    zoom: latitude !== null ? 14 : 10,
  });

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      onChange(e.lngLat.lat, e.lngLat.lng);
    },
    [onChange]
  );

  const markerPosition = useMemo(
    () => (latitude !== null && longitude !== null ? { latitude, longitude } : null),
    [latitude, longitude]
  );

  if (!MAPBOX_TOKEN) {
    // No map token configured — this is a normal setup state, not an error.
    return null;
  }

  return (
    <div className="rounded-xl overflow-hidden border h-64">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
      >
        {markerPosition && (
          <Marker latitude={markerPosition.latitude} longitude={markerPosition.longitude} anchor="bottom">
            <span className="text-2xl">📍</span>
          </Marker>
        )}
      </Map>
    </div>
  );
}

export const isMapAvailable = !!MAPBOX_TOKEN;
