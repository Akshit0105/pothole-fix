import React, { useState, useEffect, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Popup as LeafletPopup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { PotholeImage } from '../common/PotholeImage';
import type { GlobePinData } from './InteractiveImpactGlobe';

// High-precision coordinates for key Chandigarh demo corridors
export const PRESET_DEMO_LOCATIONS: Record<string, { lat: number; lng: number; name: string; description: string }> = {
  'Sector 43, Chandigarh': {
    lat: 30.7228,
    lng: 76.7570,
    name: 'Sector 43, Chandigarh',
    description: 'ISBT Sector 43 & District Courts Arterial Road. No existing defect registered.',
  },
  'Madhya Marg, Chandigarh': {
    lat: 30.7290,
    lng: 76.8040,
    name: 'Madhya Marg Arterial, Sector 26, Chandigarh',
    description: 'Critical commercial transport corridor connecting Chandigarh to Panchkula.',
  },
  'Sector 17, Chandigarh': {
    lat: 30.7398,
    lng: 76.7827,
    name: 'Sector 17 Plaza Corridor, Chandigarh',
    description: 'City center commercial pedestrian and vehicular transit plaza.',
  },
  'Sector 22, Chandigarh': {
    lat: 30.7315,
    lng: 76.7725,
    name: 'Sector 22 Market Arterial, Chandigarh',
    description: 'Aroma Chowk and inner market corridor with high density daily commuter traffic.',
  },
  'Mohali, Punjab': {
    lat: 30.7046,
    lng: 76.7179,
    name: 'Phase 7, SAS Nagar, Mohali, Punjab',
    description: 'Industrial and commercial arterial sector connecting Chandigarh to Mohali.',
  },
};

// Custom Leaflet Icons using clean SVG and inline styles
const createReportPinIcon = (isSelected: boolean, status?: string) => {
  const isResolved = status === 'RESOLVED';
  const bgColor = isResolved ? '#10b981' : '#ef4444';
  const shadowColor = isResolved ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';
  const size = isSelected ? 42 : 32;

  return L.divIcon({
    className: 'custom-pothole-pin',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        ${
          isSelected
            ? `<div style="
                position: absolute;
                inset: -7px;
                border-radius: 50%;
                background: ${isResolved ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'};
                border: 2px dashed ${bgColor};
                animation: pulse 1.8s infinite;
              "></div>`
            : ''
        }
        <div style="
          width: 100%;
          height: 100%;
          background: ${bgColor};
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px ${shadowColor};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        ">
          <span style="
            transform: rotate(45deg);
            color: #ffffff;
            font-family: 'Material Symbols Outlined';
            font-size: ${isSelected ? '22px' : '17px'};
            line-height: 1;
          ">${isResolved ? 'task_alt' : 'location_on'}</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
};

const createSearchMarkerIcon = () =>
  L.divIcon({
    className: 'custom-search-pin',
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
      ">
        <div style="
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.25);
          border: 2px dashed #2563eb;
          animation: pulse 1.8s infinite;
        "></div>
        <div style="
          width: 100%;
          height: 100%;
          background: #2563eb;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            color: #ffffff;
            font-family: 'Material Symbols Outlined';
            font-size: 24px;
            line-height: 1;
          ">travel_explore</span>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -42],
  });

// Map Controller Helper: forces invalidateSize and direct recenter on report change
interface MapInitializerProps {
  center: [number, number];
  zoom: number;
}

const MapInitializer: React.FC<MapInitializerProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView(center, zoom, { animate: false });

    const t1 = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, zoom, { animate: false });
    }, 60);

    const t2 = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, zoom, { animate: false });
    }, 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [center[0], center[1], zoom, map]);
  return null;
};

// Map click listener to allow clicking to reposition search marker
interface MapClickHandlerProps {
  onLocationSelected: (lat: number, lng: number) => void;
  enabled: boolean;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onLocationSelected, enabled }) => {
  useMapEvents({
    click(e) {
      if (enabled) {
        onLocationSelected(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export interface DetailedStreetMapProps {
  initialReport: GlobePinData | null;
  allReports: GlobePinData[];
  onBackToGlobe: () => void;
  onSelectReport: (report: GlobePinData) => void;
}

export const DetailedStreetMap: React.FC<DetailedStreetMapProps> = ({
  initialReport,
  allReports,
  onBackToGlobe,
  onSelectReport,
}) => {
  const [selectedReport, setSelectedReport] = useState<GlobePinData | null>(initialReport);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
    isCustomPin: boolean;
  } | null>(null);

  // Exact stored GPS coordinates of selected report (Defaulting to Madhya Marg 30.7290, 76.8040 if initialReport missing)
  const initialLat = initialReport?.lat ?? 30.7290;
  const initialLng = initialReport?.lng ?? 76.8040;

  const [mapCenter, setMapCenter] = useState<[number, number]>([initialLat, initialLng]);
  const [mapZoom, setMapZoom] = useState<number>(18);

  // Synchronize when initialReport prop changes
  useEffect(() => {
    if (initialReport && initialReport.lat && initialReport.lng) {
      setSelectedReport(initialReport);
      setSearchLocation(null);
      setMapCenter([initialReport.lat, initialReport.lng]);
      setMapZoom(18);
    }
  }, [initialReport]);

  // Handle Search Execution
  const handlePerformSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setIsSearching(true);

      // 1. Check if matches any preset corridor
      const matchedPresetKey = Object.keys(PRESET_DEMO_LOCATIONS).find((k) =>
        k.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(k.toLowerCase())
      );

      if (matchedPresetKey) {
        const preset = PRESET_DEMO_LOCATIONS[matchedPresetKey];
        // Check if an existing report matches this preset location (e.g. Madhya Marg or Sector 17)
        const matchedReport = allReports.find(
          (r) =>
            Math.abs(r.lat - preset.lat) < 0.005 &&
            Math.abs(r.lng - preset.lng) < 0.005
        );

        if (matchedReport && !trimmed.toLowerCase().includes('sector 43')) {
          setSelectedReport(matchedReport);
          setSearchLocation(null);
          setMapCenter([matchedReport.lat, matchedReport.lng]);
          setMapZoom(18);
          onSelectReport(matchedReport);
        } else {
          // Preset location without an existing report (e.g. Sector 43, Chandigarh)
          setSelectedReport(null);
          setSearchLocation({
            lat: preset.lat,
            lng: preset.lng,
            name: preset.name,
            isCustomPin: true,
          });
          setMapCenter([preset.lat, preset.lng]);
          setMapZoom(18);
        }
        setIsSearching(false);
        return;
      }

      // 2. Check if query matches a Report ID or Address in existing reports
      const foundInReports = allReports.find(
        (r) =>
          r.title.toLowerCase().includes(trimmed.toLowerCase()) ||
          r.locationName.toLowerCase().includes(trimmed.toLowerCase()) ||
          (r.id && r.id.toLowerCase().includes(trimmed.toLowerCase())) ||
          (r.reportId && r.reportId.toLowerCase().includes(trimmed.toLowerCase()))
      );

      if (foundInReports) {
        setSelectedReport(foundInReports);
        setSearchLocation(null);
        setMapCenter([foundInReports.lat, foundInReports.lng]);
        setMapZoom(18);
        onSelectReport(foundInReports);
        setIsSearching(false);
        return;
      }

      // 3. Fallback to OpenStreetMap Nominatim Live Geocoding API
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            trimmed + ', Chandigarh'
          )}&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const displayName = data[0].display_name.split(',').slice(0, 3).join(',');

          setSelectedReport(null);
          setSearchLocation({
            lat,
            lng,
            name: displayName,
            isCustomPin: true,
          });
          setMapCenter([lat, lng]);
          setMapZoom(18);
        } else {
          alert(`Location "${trimmed}" not found. Try searching "Sector 43, Chandigarh" or "Madhya Marg".`);
        }
      } catch (err) {
        console.warn('OSM Geocoding failed, using fallback', err);
      } finally {
        setIsSearching(false);
      }
    },
    [allReports, onSelectReport]
  );

  // Handle Dragging Search Marker
  const handleMarkerDragEnd = (e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setSearchLocation((prev) =>
      prev
        ? {
            ...prev,
            lat: position.lat,
            lng: position.lng,
          }
        : {
            lat: position.lat,
            lng: position.lng,
            name: 'Pinpointed Street Coordinate',
            isCustomPin: true,
          }
    );
  };

  // Handle clicking on map to place/move the search pin
  const handleMapLocationSelect = (lat: number, lng: number) => {
    if (searchLocation) {
      setSearchLocation((prev) => ({
        lat,
        lng,
        name: prev ? prev.name : 'Selected Road Surface Coordinate',
        isCustomPin: true,
      }));
    }
  };

  // Active Coordinates for Google Maps & Telemetry
  const activeLat = selectedReport ? selectedReport.lat : searchLocation?.lat || 30.7290;
  const activeLng = selectedReport ? selectedReport.lng : searchLocation?.lng || 76.8040;
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${activeLat},${activeLng}`;

  return (
    <div className="w-full space-y-4">
      {/* Top Header & Search Bar Navigation */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Back Button & View Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToGlobe}
              className="px-3.5 py-2 rounded-xl bg-surface-container-high text-primary hover:bg-primary hover:text-white font-bold text-xs shadow-xs border border-outline-variant/30 flex items-center gap-2 transition-all cursor-pointer group"
              title="Return to 3D Earth Globe"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
                arrow_back
              </span>
              <span>← Back to 3D Globe</span>
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-extrabold text-on-surface text-base sm:text-lg">
                  Street-Level GPS Pothole Exploration
                </h3>
              </div>
              <p className="text-[11px] text-secondary">
                Exact Stored GPS Telemetry · OpenStreetMap Indian Road Surface Layer
              </p>
            </div>
          </div>

          {/* Quick Location Suggestion Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider hidden lg:inline">
              Quick Corridors:
            </span>
            {Object.keys(PRESET_DEMO_LOCATIONS).map((locationKey) => {
              const isCurrent =
                selectedReport?.locationName.toLowerCase().includes(locationKey.toLowerCase()) ||
                searchLocation?.name.toLowerCase().includes(locationKey.toLowerCase());

              return (
                <button
                  key={locationKey}
                  type="button"
                  onClick={() => {
                    setSearchQuery(locationKey);
                    handlePerformSearch(locationKey);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                    isCurrent
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container border-outline-variant/30'
                  }`}
                >
                  {locationKey.split(',')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePerformSearch(searchQuery);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, sector, road, landmark or address..."
              className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-secondary/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                <span>Locate Street</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Leaflet Map Container (Keyed to guarantee fresh, centered instance) */}
        <div className="lg:col-span-7 h-[480px] sm:h-[560px] lg:h-[620px] rounded-2xl overflow-hidden border border-outline-variant/30 shadow-lg relative bg-surface-container-low">
          <MapContainer
            key={`leaflet-map-${selectedReport?.id || searchLocation?.name || 'base'}-${mapCenter[0]}-${mapCenter[1]}`}
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapInitializer center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onLocationSelected={handleMapLocationSelect} enabled={true} />

            {/* Real Registered Reports Markers */}
            {allReports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              return (
                <LeafletMarker
                  key={report.id}
                  position={[report.lat, report.lng]}
                  icon={createReportPinIcon(isSelected, report.status)}
                  eventHandlers={{
                    click: () => {
                      setSelectedReport(report);
                      setSearchLocation(null);
                      setMapCenter([report.lat, report.lng]);
                      setMapZoom(18);
                      onSelectReport(report);
                    },
                  }}
                >
                  <LeafletPopup autoPan={false}>
                    <div className="p-1 space-y-1 font-sans min-w-[180px]">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs text-rose-600">
                          {report.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 font-bold uppercase text-slate-700">
                          {report.status || 'REPORTED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-tight">
                        {report.locationName}
                      </p>
                      <p className="font-mono text-[10px] text-slate-500">
                        {report.lat.toFixed(5)}° N, {report.lng.toFixed(5)}° E
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReport(report);
                          setSearchLocation(null);
                          onSelectReport(report);
                        }}
                        className="mt-1 w-full py-1 rounded bg-rose-50 text-rose-700 font-bold text-[10px] text-center hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Inspect Report Details
                      </button>
                    </div>
                  </LeafletPopup>
                </LeafletMarker>
              );
            })}

            {/* Draggable Search Marker for Searched Locations (e.g. Sector 43, Chandigarh) */}
            {searchLocation && (
              <LeafletMarker
                position={[searchLocation.lat, searchLocation.lng]}
                icon={createSearchMarkerIcon()}
                draggable={true}
                eventHandlers={{
                  dragend: handleMarkerDragEnd,
                }}
              >
                <LeafletPopup autoPan={false}>
                  <div className="p-1.5 space-y-1 font-sans min-w-[200px]">
                    <span className="font-extrabold text-xs text-blue-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                      <span>Target Road Location</span>
                    </span>
                    <p className="text-[11px] font-semibold text-slate-800">{searchLocation.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {searchLocation.lat.toFixed(5)}° N, {searchLocation.lng.toFixed(5)}° E
                    </p>
                    <p className="text-[10px] text-blue-600 italic">
                      Drag marker or click street to reposition exact pothole coordinate.
                    </p>
                  </div>
                </LeafletPopup>
              </LeafletMarker>
            )}
          </MapContainer>

          {/* Floating Map Navigation Badge */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-outline-variant/30 text-[11px] text-secondary shadow-md flex items-center gap-2 pointer-events-none">
            <span className="material-symbols-outlined text-[16px] text-primary">map</span>
            <span>
              {searchLocation
                ? `Draggable Search Pin: ${searchLocation.name}`
                : selectedReport
                ? `Inspecting: ${selectedReport.title}`
                : 'Click any marker or street to inspect exact coordinates'}
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic Report Information Panel or Search Result Panel */}
        <div className="lg:col-span-5 w-full">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              /* REAL REGISTERED REPORT INSPECTION CARD */
              <motion.div
                key={selectedReport.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 sm:p-6 shadow-xl space-y-4"
              >
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          selectedReport.isRealDatabaseRecord
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>
                          {selectedReport.isRealDatabaseRecord ? 'Live SQLite Record' : 'Demo Corridor'}
                        </span>
                      </span>

                      {selectedReport.status && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                            selectedReport.status === 'RESOLVED'
                              ? 'bg-emerald-600 text-white'
                              : selectedReport.status === 'IN_PROGRESS'
                              ? 'bg-amber-500 text-white'
                              : selectedReport.status === 'ASSIGNED'
                              ? 'bg-blue-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {selectedReport.status}
                        </span>
                      )}

                      {selectedReport.severity && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-error/15 text-error">
                          {selectedReport.severity} SEVERITY
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-on-surface truncate">
                      {selectedReport.title}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5 leading-snug">
                      {selectedReport.locationName}
                    </p>
                  </div>

                  {/* Stored GPS Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-secondary bg-surface-container-low px-2 py-1 rounded-md border border-outline-variant/30 block">
                      {selectedReport.lat.toFixed(5)}° N
                      <br />
                      {selectedReport.lng.toFixed(5)}° E
                    </span>
                  </div>
                </div>

                {/* Photographic Evidence Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        photo_camera
                      </span>
                      <span>Photographic Verification Proof</span>
                    </span>
                    {selectedReport.status === 'RESOLVED' ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Level-1 Certified Pass
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Active Restoration Workflow
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Pre-Repair Photo */}
                    <div className="space-y-1">
                      <div className="relative aspect-[16/11] rounded-xl overflow-hidden border border-error/30 bg-surface-container shadow-xs">
                        <PotholeImage
                          src={selectedReport.beforePhotoUrl}
                          alt="Pre-repair road defect"
                          className="w-full h-full object-cover"
                          fallbackType="critical"
                          showBadge
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-error/95 text-white text-[9px] font-bold shadow-xs">
                          PRE-REPAIR DEFECT
                        </div>
                      </div>
                      <span className="text-[10px] text-secondary font-medium block text-center">
                        Reported Crater
                      </span>
                    </div>

                    {/* Post-Repair Photo */}
                    <div className="space-y-1">
                      <div className="relative aspect-[16/11] rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container shadow-xs flex items-center justify-center">
                        {selectedReport.afterPhotoUrl ? (
                          <>
                            <PotholeImage
                              src={selectedReport.afterPhotoUrl}
                              alt="Restored road surface"
                              className="w-full h-full object-cover"
                              fallbackType="restored"
                              showBadge
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[11px]">task_alt</span>
                              <span>RESTORED PASS</span>
                            </div>
                          </>
                        ) : (
                          <div className="p-3 text-center space-y-1">
                            <span className="material-symbols-outlined text-2xl text-amber-500">
                              engineering
                            </span>
                            <span className="text-[10px] font-bold text-secondary block">
                              Repair In Progress
                            </span>
                            <span className="text-[9px] text-secondary/70 block">
                              Field compaction crew dispatched
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-secondary font-medium block text-center">
                        {selectedReport.afterPhotoUrl ? 'Compacted Restoration' : 'Status: In Progress'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit & Engineering Notes */}
                <div className="bg-surface-container-low/70 p-3 rounded-xl border border-outline-variant/30 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-secondary text-[11px]">
                    <span>Recorded Timestamp:</span>
                    <span className="font-semibold text-on-surface">{selectedReport.completedDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-secondary text-[11px]">
                    <span>Assigned Squad / Authority:</span>
                    <span className="font-semibold text-primary">{selectedReport.inspectorName}</span>
                  </div>
                  {selectedReport.notes && (
                    <p className="text-[11px] text-on-surface/90 pt-1 border-t border-outline-variant/20 italic">
                      "{selectedReport.notes}"
                    </p>
                  )}
                </div>

                {/* Google Maps Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30">
                  <a
                    href={googleMapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-outline-variant/30 shadow-xs cursor-pointer"
                    title="Open exact coordinate in Google Maps"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary">open_in_new</span>
                    <span>Open Google Maps</span>
                  </a>

                  <a
                    href={googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Get turn-by-turn driving directions to repair site"
                  >
                    <span className="material-symbols-outlined text-[17px]">directions</span>
                    <span>Get Directions</span>
                  </a>
                </div>
              </motion.div>
            ) : searchLocation ? (
              /* SEARCHED LOCATION CARD (e.g. Sector 43, Chandigarh) */
              <motion.div
                key={searchLocation.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-surface-container-lowest rounded-2xl border border-blue-200 p-5 sm:p-6 shadow-xl space-y-4"
              >
                {/* Search Badge & Heading */}
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300 mb-1.5">
                    <span className="material-symbols-outlined text-[13px]">travel_explore</span>
                    <span>Geocoded Street Search Result</span>
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-on-surface">
                    {searchLocation.name}
                  </h3>
                  <p className="text-xs text-secondary mt-0.5">
                    Municipal Boundary: Chandigarh Urban Division
                  </p>
                </div>

                {/* No Registered Report Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span>No Existing Hazard Reports Registered at this Location</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    This location currently has no registered municipal repair orders. You can drag the blue pin on the map or click directly on the road to pinpoint an exact pothole coordinate for submission.
                  </p>
                </div>

                {/* Exact Coordinates Box */}
                <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-secondary">Target GPS Coordinates:</span>
                    <span className="font-mono font-bold text-primary text-xs">
                      {searchLocation.lat.toFixed(6)}° N, {searchLocation.lng.toFixed(6)}° E
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-secondary">
                    <span>Geocoding Precision:</span>
                    <span className="text-emerald-700 font-bold">Sub-Meter Pinpoint</span>
                  </div>
                </div>

                {/* Call to Action: Report Pothole at this Location */}
                <div className="pt-2 border-t border-outline-variant/30 space-y-2">
                  <a
                    href={`/report?lat=${searchLocation.lat}&lng=${searchLocation.lng}&address=${encodeURIComponent(
                      searchLocation.name
                    )}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-error hover:bg-error-dark text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
                    <span>Report Pothole at this Location</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={googleMapsSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-outline-variant/30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">open_in_new</span>
                      <span>Google Maps</span>
                    </a>

                    <a
                      href={googleMapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-outline-variant/30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">directions</span>
                      <span>Get Directions</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* IDLE STATE */
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">pin_drop</span>
                </div>
                <h4 className="font-bold text-on-surface text-base">Select a Defect Marker</h4>
                <p className="text-xs text-secondary leading-relaxed max-w-xs mx-auto">
                  Click on any red or green pothole marker on the street map to inspect verified compaction audits, or search any road in Chandigarh.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
