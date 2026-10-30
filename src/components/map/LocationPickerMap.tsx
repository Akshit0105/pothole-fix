import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Create a custom teal civic pin icon to avoid broken asset URL issues in Leaflet
const createPinIcon = () =>
  L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: #087f8c;
        border: 2px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0, 100, 111, 0.35);
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-family: 'Material Symbols Outlined';
          font-size: 18px;
          line-height: 1;
        ">alt_route</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });

// Create a prominent red destination pin for repair work orders
const createRedDestinationPinIcon = () =>
  L.divIcon({
    className: 'destination-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: #ef4444;
        border: 2.5px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.45);
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-family: 'Material Symbols Outlined';
          font-size: 19px;
          line-height: 1;
        ">location_on</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

interface LocationPickerMapProps {
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
  zoom?: number;
}

// Click and drag event handler component
const MapClickHandler: React.FC<{
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ onPositionChange }) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Auto-recenter controller component to synchronize Leaflet view with incoming props
const RecenterMapController: React.FC<{ position: [number, number]; zoom?: number }> = ({
  position,
  zoom = 15,
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, zoom);
  }, [map, position, zoom]);
  return null;
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  position,
  onPositionChange,
  zoom = 15,
}) => {
  const pinIcon = useMemo(() => createPinIcon(), []);

  return (
    <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-outline-variant/30 relative z-0">
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <RecenterMapController position={position} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPositionChange={onPositionChange} />
        <Marker
          position={position}
          icon={pinIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              onPositionChange(pos.lat, pos.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
};

export const ReportLocationMap: React.FC<{
  position: [number, number];
  address?: string;
  reportId?: string;
  zoom?: number;
  interactive?: boolean;
}> = ({ position, address, reportId, zoom = 15, interactive = true }) => {
  const pinIcon = useMemo(() => createRedDestinationPinIcon(), []);

  return (
    <div className="w-full h-full min-h-[200px] rounded-xl overflow-hidden border border-outline-variant/30 relative z-0">
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        className="w-full h-full"
      >
        <RecenterMapController position={position} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={pinIcon}>
          {(reportId || address) && (
            <Popup>
              <div className="p-1 min-w-[150px] space-y-0.5">
                {reportId && (
                  <p className="font-bold text-xs text-rose-600 font-mono">
                    Repair Site #{reportId}
                  </p>
                )}
                {address && <p className="font-medium text-xs text-slate-800">{address}</p>}
                <p className="font-mono text-[10px] text-slate-500">
                  {position[0].toFixed(5)}° N, {position[1].toFixed(5)}° E
                </p>
              </div>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
};
