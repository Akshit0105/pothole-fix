import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import type { RepairTask } from '../../types';

interface TeamTasksDispatchMapProps {
  tasks: RepairTask[];
  center?: [number, number];
  zoom?: number;
  heightClass?: string;
}

const createCrewPinIcon = (status: string) => {
  let color = '#ef4444'; // Red default
  if (status === 'IN_PROGRESS') color = '#d97706'; // Amber
  else if (status === 'AWAITING_APPROVAL') color = '#7c3aed'; // Purple
  else if (status === 'RESOLVED') color = '#10b981'; // Emerald
  else if (status === 'REWORK_REQUIRED') color = '#b91c1c'; // Crimson

  return L.divIcon({
    className: 'custom-crew-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: ${color};
        border: 2px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-family: 'Material Symbols Outlined';
          font-size: 18px;
          line-height: 1;
        ">engineering</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

export const TeamTasksDispatchMap: React.FC<TeamTasksDispatchMapProps> = ({
  tasks,
  center = [30.7398, 76.7827], // Chandigarh default
  zoom = 13,
  heightClass = 'h-72 sm:h-80',
}) => {
  // Extract tasks with valid coordinates
  const validTasks = useMemo(() => {
    return tasks.map((task, idx) => {
      // Default to slight offset around Chandigarh corridor if task location is empty
      const lat = task.location?.latitude || (30.7398 + (idx % 3) * 0.015);
      const lng = task.location?.longitude || (76.7827 + (idx % 2) * 0.02);
      const address = task.location?.address || 'Municipal PWD Road Sector';
      return {
        ...task,
        computedPos: [lat, lng] as [number, number],
        computedAddress: address,
      };
    });
  }, [tasks]);

  return (
    <div className={`w-full ${heightClass} rounded-2xl overflow-hidden border border-outline-variant/30 shadow-xs relative z-0`}>
      <MapContainer
        center={validTasks.length > 0 ? validTasks[0].computedPos : center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validTasks.map((t) => {
          const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${t.computedPos[0]},${t.computedPos[1]}`;
          return (
            <Marker
              key={t.id}
              position={t.computedPos}
              icon={createCrewPinIcon(t.status)}
            >
              <Popup>
                <div className="p-1 space-y-1.5 min-w-[190px] font-sans">
                  <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1">
                    <span className="font-bold text-xs text-rose-700 font-mono">
                      Task #{t.id}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="font-medium text-xs text-slate-800 leading-tight">
                    {t.computedAddress}
                  </p>

                  <p className="font-mono text-[10px] text-slate-500">
                    {t.computedPos[0].toFixed(5)}° N, {t.computedPos[1].toFixed(5)}° E
                  </p>

                  <div className="pt-1 flex items-center justify-between gap-1">
                    <a
                      href={navUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">turn_sharp_right</span>
                      <span>Navigate</span>
                    </a>

                    <Link
                      to={`/team/tasks/${t.id}`}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors"
                    >
                      Open Task
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
