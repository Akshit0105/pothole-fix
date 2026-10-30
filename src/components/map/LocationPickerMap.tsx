import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  position,
  onPositionChange,
  zoom = 15,
}) => {
  const pinIcon = useMemo(() => createPinIcon(), []);

  return (
    <div className="w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-outline-variant/30 shadow-inner relative z-0">
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
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
            dragend(e) {
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
  zoom?: number;
}> = ({ position, zoom = 15 }) => {
  const pinIcon = useMemo(() => createPinIcon(), []);

  return (
    <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-outline-variant/30 relative z-0">
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={pinIcon} />
      </MapContainer>
    </div>
  );
};
