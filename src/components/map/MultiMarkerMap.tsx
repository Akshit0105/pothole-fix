import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import type { PotholeReport } from '../../types';

interface MultiMarkerMapProps {
  reports: PotholeReport[];
  center?: [number, number];
  zoom?: number;
}

const createStatusPin = (status: string) => {
  let color = '#087f8c'; // default teal
  if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') color = '#ef4444'; // Red
  else if (status === 'IN_PROGRESS' || status === 'ASSIGNED') color = '#d97706'; // Amber
  else if (status === 'AWAITING_APPROVAL') color = '#7c3aed'; // Purple
  else if (status === 'RESOLVED') color = '#10b981'; // Green

  return L.divIcon({
    className: 'custom-multi-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background: ${color};
        border: 2px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-family: 'Material Symbols Outlined';
          font-size: 16px;
          line-height: 1;
        ">report_problem</span>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

export const MultiMarkerMap: React.FC<MultiMarkerMapProps> = ({
  reports,
  center = [30.7333, 76.7794], // Default Chandigarh / Tricity core
  zoom = 13,
}) => {
  const pinCache = useMemo(() => new Map<string, L.DivIcon>(), []);

  const getPin = (status: string) => {
    if (!pinCache.has(status)) {
      pinCache.set(status, createStatusPin(status));
    }
    return pinCache.get(status)!;
  };

  return (
    <div className="w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-outline-variant/30 shadow-inner relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.location.latitude, report.location.longitude]}
            icon={getPin(report.status)}
          >
            <Popup>
              <div className="p-1 space-y-1 font-body-md text-body-sm">
                <div className="flex items-center gap-1.5 font-bold text-on-surface">
                  <span>#{report.trackingNumber}</span>
                  <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-surface-container">
                    {report.status}
                  </span>
                </div>
                <p className="text-[12px] text-secondary">{report.location.address}</p>
                <Link
                  to={`/authority/reports/${report.trackingNumber}`}
                  className="text-primary font-semibold hover:underline text-[12px] block pt-1"
                >
                  Inspect in Triage Desk &rarr;
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
