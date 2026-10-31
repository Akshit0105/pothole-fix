import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Popup as LeafletPopup,
  Tooltip as LeafletTooltip,
  Polyline as LeafletPolyline,
  CircleMarker as LeafletCircleMarker,
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

// Haversine distance calculator in km
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Custom Leaflet Icons using clean SVG and inline styles with stable DOM elements
const createReportPinIcon = (status?: string) => {
  const isResolved = status === 'RESOLVED';
  const bgColor = isResolved ? '#10b981' : '#ef4444';
  const shadowColor = isResolved ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';

  return L.divIcon({
    className: 'custom-pothole-pin',
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div class="pin-pulse-ring" style="
          display: none;
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: ${isResolved ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'};
          border: 2px dashed ${bgColor};
          animation: pulse 1.8s infinite;
          pointer-events: none;
        "></div>
        <div class="pin-badge" style="
          width: 32px;
          height: 32px;
          background: ${bgColor};
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px ${shadowColor};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          <span style="
            transform: rotate(45deg);
            color: #ffffff;
            font-family: 'Material Symbols Outlined';
            font-size: 17px;
            line-height: 1;
            pointer-events: none;
          ">${isResolved ? 'task_alt' : 'location_on'}</span>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
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

const createUserPinIcon = () =>
  L.divIcon({
    className: 'custom-user-location-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px;">
        <div style="position: absolute; inset: -7px; border-radius: 50%; background: rgba(37, 99, 235, 0.35); border: 2px dashed #2563eb; animation: pulse 1.6s infinite;"></div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.6); display: flex; align-items: center; justify-content: center;">
          <span style="color: #ffffff; font-family: 'Material Symbols Outlined'; font-size: 16px; line-height: 1;">my_location</span>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });

// Map Controller: smooth flyTo and bounds adjusting without tearing down MapContainer DOM
interface MapViewControllerProps {
  center: [number, number];
  zoom: number;
}

const MapViewController: React.FC<MapViewControllerProps> = ({ center, zoom }) => {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);

  useEffect(() => {
    map.invalidateSize();
    const dist = Math.hypot(center[0] - prevCenterRef.current[0], center[1] - prevCenterRef.current[1]);
    if (dist > 0.00001) {
      prevCenterRef.current = center;
      map.flyTo(center, zoom, { duration: 0.6 });
    }
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

// Isolated interactive defect marker with hover synchronization & clean visual highlights
interface ReportDefectMarkerProps {
  report: GlobePinData;
  displayPos: [number, number];
  isSelected: boolean;
  isHovered: boolean;
  anyMarkerHovered: boolean;
  isRouteDestination: boolean;
  onHover: (report: GlobePinData) => void;
  onHoverEnd: () => void;
  onSelect: (report: GlobePinData) => void;
  onGetDirections: (report: GlobePinData) => void;
}

const ReportDefectMarker: React.FC<ReportDefectMarkerProps> = ({
  report,
  displayPos,
  isSelected,
  isHovered,
  anyMarkerHovered,
  isRouteDestination,
  onHover,
  onHoverEnd,
  onSelect,
}) => {
  const markerRef = useRef<L.Marker | null>(null);
  const isVisuallyHighlighted = isHovered || (isSelected && !anyMarkerHovered) || isRouteDestination;
  const showTooltip = isHovered || (isSelected && !anyMarkerHovered);
  const baseIcon = useMemo(() => createReportPinIcon(report.status), [report.status]);

  useEffect(() => {
    if (markerRef.current) {
      const el = markerRef.current.getElement();
      if (el) {
        el.setAttribute('data-report-id', report.trackingNumber || report.id);
        const ring = el.querySelector('.pin-pulse-ring') as HTMLElement | null;
        const badge = el.querySelector('.pin-badge') as HTMLElement | null;
        if (isVisuallyHighlighted) {
          el.style.zIndex = '1000';
          if (ring) ring.style.display = 'block';
          if (badge) badge.style.transform = 'scale(1.25) rotate(-45deg)';
        } else {
          el.style.zIndex = '';
          if (ring) ring.style.display = 'none';
          if (badge) badge.style.transform = 'scale(1) rotate(-45deg)';
        }
      }
    }
  }, [isVisuallyHighlighted, report.trackingNumber, report.id]);

  return (
    <LeafletMarker
      ref={markerRef}
      key={report.id}
      position={displayPos}
      icon={baseIcon}
      eventHandlers={{
        mouseover: () => {
          onHover(report);
        },
        mouseout: () => {
          onHoverEnd();
        },
        click: () => {
          onSelect(report);
        },
      }}
    >
      {/* Compact PF ID Tooltip shown ONLY when hovered or when selected without any other hover */}
      {showTooltip && (
        <LeafletTooltip
          direction="top"
          offset={[0, -24]}
          opacity={0.98}
          permanent={isSelected && !anyMarkerHovered}
          className="clean-pf-compact-tooltip"
        >
          <div className="font-mono font-bold text-xs text-slate-900 leading-none py-0.5 px-1 bg-white/95 rounded shadow-xs border border-slate-200">
            #{report.reportId || report.trackingNumber || report.id}
          </div>
        </LeafletTooltip>
      )}
    </LeafletMarker>
  );
};

export interface DetailedStreetMapProps {
  initialReport: GlobePinData | null;
  allReports: GlobePinData[];
  onBackToGlobe: () => void;
  onSelectReport: (report: GlobePinData) => void;
}

export interface ActiveRouteInfo {
  destinationId: string;
  destinationName: string;
  destinationCoords: [number, number];
  userCoords: [number, number];
  coordinates: [number, number][]; // [lat, lng] array
  distanceKm: number;
  durationMins: number;
}

export const DetailedStreetMap: React.FC<DetailedStreetMapProps> = ({
  initialReport,
  allReports,
  onBackToGlobe,
  onSelectReport,
}) => {
  const [selectedReport, setSelectedReport] = useState<GlobePinData | null>(initialReport);
  const [hoveredReport, setHoveredReport] = useState<GlobePinData | null>(null);

  // Active report displayed in the right panel and targeted by directions (Hover Synchronization)
  const activeDisplayReport = hoveredReport || selectedReport;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
    isCustomPin: boolean;
  } | null>(null);

  // Directions & Routing State
  const [activeRoute, setActiveRoute] = useState<ActiveRouteInfo | null>(null);
  const [isCalculatingDirections, setIsCalculatingDirections] = useState(false);
  const [directionsNotice, setDirectionsNotice] = useState<string | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  // Exact stored GPS coordinates of selected report
  const initialLat = initialReport?.lat ?? 30.7290;
  const initialLng = initialReport?.lng ?? 76.8040;

  const [mapCenter, setMapCenter] = useState<[number, number]>([initialLat, initialLng]);
  const [mapZoom, setMapZoom] = useState<number>(18);

  // Synchronize when initialReport prop changes
  useEffect(() => {
    if (initialReport && initialReport.lat && initialReport.lng) {
      setSelectedReport(initialReport);
      setHoveredReport(null);
      setSearchLocation(null);
      setMapCenter([initialReport.lat, initialReport.lng]);
      setMapZoom(18);
    }
  }, [initialReport]);

  // Disperse overlapping / coincident coordinates so all potholes are independently selectable (Spiderfy, Fix 3)
  const dispersedMarkers = useMemo(() => {
    const groups: GlobePinData[][] = [];
    const threshold = 0.0002; // ~22 meters

    allReports.forEach((rep) => {
      let matchedGroup = false;
      for (const group of groups) {
        const leader = group[0];
        const dist = Math.hypot(rep.lat - leader.lat, rep.lng - leader.lng);
        if (dist < threshold) {
          group.push(rep);
          matchedGroup = true;
          break;
        }
      }
      if (!matchedGroup) {
        groups.push([rep]);
      }
    });

    const list: {
      report: GlobePinData;
      displayPos: [number, number];
      originalPos: [number, number];
      isDispersed: boolean;
    }[] = [];

    groups.forEach((group) => {
      if (group.length === 1) {
        const r = group[0];
        list.push({
          report: r,
          displayPos: [r.lat, r.lng],
          originalPos: [r.lat, r.lng],
          isDispersed: false,
        });
      } else {
        const centerLat = group.reduce((sum, r) => sum + r.lat, 0) / group.length;
        const centerLng = group.reduce((sum, r) => sum + r.lng, 0) / group.length;
        const radius = 0.00028; // ~30m radius around cluster center

        group.forEach((r, idx) => {
          const angle = (2 * Math.PI * idx) / group.length;
          const dLat = radius * Math.sin(angle);
          const dLng = (radius * Math.cos(angle)) / Math.cos((centerLat * Math.PI) / 180);
          list.push({
            report: r,
            displayPos: [centerLat + dLat, centerLng + dLng],
            originalPos: [r.lat, r.lng],
            isDispersed: true,
          });
        });
      }
    });

    return list;
  }, [allReports]);

  // Handle Directions Request
  const handleGetDirections = useCallback(
    async (targetReport: GlobePinData, cachedUserCoords?: [number, number]) => {
      setIsCalculatingDirections(true);
      setDirectionsError(null);
      setDirectionsNotice(`Requesting GPS location for turn-by-turn route to #${targetReport.trackingNumber || targetReport.id}...`);

      if (!targetReport.lat || !targetReport.lng || isNaN(targetReport.lat) || isNaN(targetReport.lng)) {
        setDirectionsError('Invalid GPS coordinates stored for this defect.');
        setIsCalculatingDirections(false);
        return;
      }

      const proceedWithRoute = async (userLat: number, userLng: number) => {
        try {
          // Fetch route from public OSRM router
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${targetReport.lng},${targetReport.lat}?overview=full&geometries=geojson`
          );
          const data = await res.json();

          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const latLngs: [number, number][] = route.geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]]
            );

            setActiveRoute({
              destinationId: targetReport.trackingNumber || targetReport.id,
              destinationName: targetReport.roadName || targetReport.title,
              destinationCoords: [targetReport.lat, targetReport.lng],
              userCoords: [userLat, userLng],
              coordinates: latLngs,
              distanceKm: Number((route.distance / 1000).toFixed(1)),
              durationMins: Math.max(1, Math.round(route.duration / 60)),
            });
            setDirectionsNotice(null);
          } else {
            // Straight-line fallback if OSRM route unavailable
            const dist = calculateHaversineDistanceKm(userLat, userLng, targetReport.lat, targetReport.lng);
            setActiveRoute({
              destinationId: targetReport.trackingNumber || targetReport.id,
              destinationName: targetReport.roadName || targetReport.title,
              destinationCoords: [targetReport.lat, targetReport.lng],
              userCoords: [userLat, userLng],
              coordinates: [
                [userLat, userLng],
                [targetReport.lat, targetReport.lng],
              ],
              distanceKm: Number(dist.toFixed(1)),
              durationMins: Math.max(1, Math.round((dist / 35) * 60)),
            });
            setDirectionsNotice(null);
          }
        } catch (err) {
          console.warn('OSRM routing request failed:', err);
          // Fallback line
          const dist = calculateHaversineDistanceKm(userLat, userLng, targetReport.lat, targetReport.lng);
          setActiveRoute({
            destinationId: targetReport.trackingNumber || targetReport.id,
            destinationName: targetReport.roadName || targetReport.title,
            destinationCoords: [targetReport.lat, targetReport.lng],
            userCoords: [userLat, userLng],
            coordinates: [
              [userLat, userLng],
              [targetReport.lat, targetReport.lng],
            ],
            distanceKm: Number(dist.toFixed(1)),
            durationMins: Math.max(1, Math.round((dist / 35) * 60)),
          });
          setDirectionsNotice(null);
        } finally {
          setIsCalculatingDirections(false);
        }
      };

      if (cachedUserCoords) {
        await proceedWithRoute(cachedUserCoords[0], cachedUserCoords[1]);
        return;
      }

      if (!navigator.geolocation) {
        setDirectionsError('Geolocation is not supported by your browser. Use Google Maps directions link below.');
        setIsCalculatingDirections(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await proceedWithRoute(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err.message);
          setIsCalculatingDirections(false);
          setDirectionsNotice(null);
          setDirectionsError('Location permission was denied or unavailable. Open turn-by-turn directions directly in Google Maps.');
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    },
    []
  );

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
          if (activeRoute) {
            handleGetDirections(matchedReport, activeRoute.userCoords);
          }
        } else {
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
          (r.reportId && r.reportId.toLowerCase().includes(trimmed.toLowerCase())) ||
          (r.trackingNumber && r.trackingNumber.toLowerCase().includes(trimmed.toLowerCase()))
      );

      if (foundInReports) {
        setSelectedReport(foundInReports);
        setSearchLocation(null);
        setMapCenter([foundInReports.lat, foundInReports.lng]);
        setMapZoom(18);
        onSelectReport(foundInReports);
        if (activeRoute) {
          handleGetDirections(foundInReports, activeRoute.userCoords);
        }
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
    [allReports, onSelectReport, activeRoute, handleGetDirections]
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

  // Active Coordinates for Google Maps & Telemetry (tracks currently hovered/selected report)
  const activeLat = activeDisplayReport ? activeDisplayReport.lat : searchLocation?.lat || 30.7290;
  const activeLng = activeDisplayReport ? activeDisplayReport.lng : searchLocation?.lng || 76.8040;
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
                activeDisplayReport?.locationName.toLowerCase().includes(locationKey.toLowerCase()) ||
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
              placeholder="Search city, sector, road, landmark or defect ID (e.g. PF-101, PF-102)..."
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
        {/* Left Column: Leaflet Map Container (STABLE KEY - NO REMOUNTING) */}
        <div className="lg:col-span-7 h-[480px] sm:h-[560px] lg:h-[620px] rounded-2xl overflow-hidden border border-outline-variant/30 shadow-lg relative bg-surface-container-low">
          <MapContainer
            key="potholefix-stable-street-map"
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

            <MapViewController center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onLocationSelected={handleMapLocationSelect} enabled={true} />

            {/* Active Route Polyline */}
            {activeRoute && activeRoute.coordinates.length > 0 && (
              <>
                <LeafletPolyline
                  positions={activeRoute.coordinates}
                  pathOptions={{
                    color: '#2563eb',
                    weight: 6,
                    opacity: 0.85,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
                {/* User Origin Pin */}
                <LeafletMarker
                  position={activeRoute.userCoords}
                  icon={createUserPinIcon()}
                >
                  <LeafletPopup autoPan={false}>
                    <div className="p-1 font-sans text-xs">
                      <strong className="text-blue-600 block">Your Current Location</strong>
                      <span className="text-[11px] text-slate-600">Starting point for road repair directions</span>
                    </div>
                  </LeafletPopup>
                </LeafletMarker>
              </>
            )}

            {/* Real Registered Reports Markers (Clean by Default, Hover PF ID Tooltip, Dispersed if Overlapping) */}
            {dispersedMarkers.map((item) => (
              <React.Fragment key={item.report.id}>
                {/* Spiderfy connecting line & anchor dot if coordinates are dispersed */}
                {item.isDispersed && (
                  <>
                    <LeafletCircleMarker
                      center={item.originalPos}
                      radius={4}
                      pathOptions={{ color: '#475569', fillColor: '#94a3b8', fillOpacity: 0.8, weight: 1.5 }}
                    />
                    <LeafletPolyline
                      positions={[item.originalPos, item.displayPos]}
                      pathOptions={{ color: '#64748b', weight: 1.5, dashArray: '3, 4', opacity: 0.8 }}
                    />
                  </>
                )}
                <ReportDefectMarker
                  report={item.report}
                  displayPos={item.displayPos}
                  isSelected={selectedReport?.id === item.report.id}
                  isHovered={hoveredReport?.id === item.report.id}
                  anyMarkerHovered={!!hoveredReport}
                  isRouteDestination={activeRoute?.destinationId === (item.report.trackingNumber || item.report.id)}
                  onHover={(r) => setHoveredReport(r)}
                  onHoverEnd={() => setHoveredReport(null)}
                  onSelect={(r) => {
                    setSelectedReport(r);
                    setHoveredReport(null);
                    setSearchLocation(null);
                    setMapCenter([r.lat, r.lng]);
                    setMapZoom(18);
                    onSelectReport(r);
                    if (activeRoute) {
                      handleGetDirections(r, activeRoute.userCoords);
                    }
                  }}
                  onGetDirections={(r) => handleGetDirections(r)}
                />
              </React.Fragment>
            ))}

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

          {/* Floating Directions Route Status Bar */}
          {activeRoute && (
            <div className="absolute top-3 left-3 right-3 z-[1000] bg-surface/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-blue-500/40 shadow-xl flex items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">directions_car</span>
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-on-surface truncate">
                      Route to #{activeRoute.destinationId}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[9px] font-extrabold">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary font-medium">
                    {activeRoute.distanceKm} km · ~{activeRoute.durationMins} min drive · Turn-by-turn guidance
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeRoute.destinationCoords[0]},${activeRoute.destinationCoords[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary hover:text-primary-dark transition-colors"
                  title="Open turn-by-turn directions in Google Maps app"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveRoute(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  title="Clear route polyline"
                >
                  Clear Route
                </button>
              </div>
            </div>
          )}

          {/* Calculating Directions Indicator */}
          {isCalculatingDirections && directionsNotice && (
            <div className="absolute top-3 left-3 z-[1000] bg-surface/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-500/30 text-xs text-blue-700 shadow-md flex items-center gap-2 animate-fadeIn">
              <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>{directionsNotice}</span>
            </div>
          )}

          {/* Geolocation Denied / Fallback Alert Banner */}
          {directionsError && (
            <div className="absolute top-3 left-3 right-3 z-[1000] bg-surface/95 backdrop-blur-md p-3 rounded-2xl border border-amber-500/40 shadow-xl flex items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>{directionsError}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                >
                  Open in Google Maps
                </a>
                <button
                  type="button"
                  onClick={() => setDirectionsError(null)}
                  className="text-secondary hover:text-on-surface p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Floating Map Navigation Badge */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-outline-variant/30 text-[11px] text-secondary shadow-md flex items-center gap-2 pointer-events-none">
            <span className="material-symbols-outlined text-[16px] text-primary">map</span>
            <span>
              {searchLocation
                ? `Draggable Search Pin: ${searchLocation.name}`
                : activeDisplayReport
                ? `Inspecting: #${activeDisplayReport.reportId || activeDisplayReport.trackingNumber || activeDisplayReport.id} (${activeDisplayReport.title})${hoveredReport ? ' · Hover Preview' : ''}`
                : 'Click any marker to inspect exact coordinates & directions'}
            </span>
          </div>
        </div>

        {/* Right Column: Dynamic Report Information Panel or Search Result Panel */}
        <div className="lg:col-span-5 w-full">
          <AnimatePresence mode="wait">
            {activeDisplayReport ? (
              /* REAL REGISTERED REPORT INSPECTION CARD */
              <motion.div
                key={activeDisplayReport.id}
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
                          hoveredReport
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : activeDisplayReport.isRealDatabaseRecord
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>
                          {hoveredReport
                            ? 'Marker Hover Preview'
                            : activeDisplayReport.isRealDatabaseRecord
                            ? 'Live Registry Record'
                            : 'Demo Corridor'}
                        </span>
                      </span>

                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-surface-container-high border border-outline-variant/40 text-on-surface">
                        #{activeDisplayReport.reportId || activeDisplayReport.trackingNumber || activeDisplayReport.id}
                      </span>

                      {activeDisplayReport.status && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                            activeDisplayReport.status === 'RESOLVED'
                              ? 'bg-emerald-600 text-white'
                              : activeDisplayReport.status === 'IN_PROGRESS'
                              ? 'bg-amber-500 text-white'
                              : activeDisplayReport.status === 'ASSIGNED'
                              ? 'bg-blue-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {activeDisplayReport.status}
                        </span>
                      )}

                      {activeDisplayReport.severity && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-error/15 text-error">
                          {activeDisplayReport.severity} SEVERITY
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-extrabold text-on-surface truncate">
                      {activeDisplayReport.title}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5 leading-snug">
                      {activeDisplayReport.locationName}
                    </p>
                  </div>

                  {/* Stored GPS Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-secondary bg-surface-container-low px-2 py-1 rounded-md border border-outline-variant/30 block">
                      {activeDisplayReport.lat.toFixed(5)}° N
                      <br />
                      {activeDisplayReport.lng.toFixed(5)}° E
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
                    {activeDisplayReport.status === 'RESOLVED' ? (
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
                          src={activeDisplayReport.beforePhotoUrl}
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
                        {activeDisplayReport.afterPhotoUrl ? (
                          <>
                            <PotholeImage
                              src={activeDisplayReport.afterPhotoUrl}
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
                        {activeDisplayReport.afterPhotoUrl ? 'Compacted Restoration' : 'Status: In Progress'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit & Engineering Notes */}
                <div className="bg-surface-container-low/70 p-3 rounded-xl border border-outline-variant/30 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-secondary text-[11px]">
                    <span>Recorded Timestamp:</span>
                    <span className="font-semibold text-on-surface">{activeDisplayReport.completedDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-secondary text-[11px]">
                    <span>Assigned Squad / Authority:</span>
                    <span className="font-semibold text-primary">{activeDisplayReport.inspectorName}</span>
                  </div>
                  {activeDisplayReport.notes && (
                    <p className="text-[11px] text-on-surface/90 pt-1 border-t border-outline-variant/20 italic">
                      "{activeDisplayReport.notes}"
                    </p>
                  )}
                </div>

                {/* Driving Directions Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => handleGetDirections(activeDisplayReport)}
                    className="py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Calculate in-map driving route from your location"
                  >
                    <span className="material-symbols-outlined text-[17px]">directions</span>
                    <span>Get Directions</span>
                  </button>

                  <a
                    href={googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-outline-variant/30 shadow-xs cursor-pointer"
                    title="Open turn-by-turn driving directions in Google Maps app"
                  >
                    <span className="material-symbols-outlined text-[17px] text-primary">open_in_new</span>
                    <span>Google Maps</span>
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

export default DetailedStreetMap;
