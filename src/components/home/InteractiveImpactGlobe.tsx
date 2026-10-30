import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { reportsService } from '../../services/reportsService';
import type { PotholeReport } from '../../types';
import { DetailedStreetMap } from './DetailedStreetMap';

export interface GlobePinData {
  id: string;
  reportId?: string;
  trackingNumber?: string;
  lat: number;
  lng: number;
  title: string;
  locationName: string;
  completedCount: number;
  completedDate: string;
  inspectorName: string;
  isRealDatabaseRecord: boolean;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  notes: string;
  status?: string;
  severity?: string;
  description?: string;
}

export interface GlobeClusterData {
  id: string;
  lat: number;
  lng: number;
  count: number;
  pins: GlobePinData[];
}

interface ProjectedScreenPoint {
  id: string;
  x: number;
  y: number;
  isVisible: boolean;
  isCluster: boolean;
  clusterData?: GlobeClusterData;
  pinData?: GlobePinData;
}

const REGIONAL_SHOWCASE_PINS: GlobePinData[] = [
  {
    id: 'DEMO-CHD-17',
    reportId: 'PF-101',
    trackingNumber: 'PF-101',
    lat: 30.7398,
    lng: 76.7827,
    title: 'Sector 17 Commercial Corridor',
    locationName: 'Sector 17 Plaza, Chandigarh',
    completedCount: 8,
    completedDate: 'Active Defect',
    inspectorName: 'Alice Sharma (Commissioner)',
    isRealDatabaseRecord: false,
    beforePhotoUrl: '/photos/pothole-sector17.jpg',
    afterPhotoUrl: '/photos/pothole-restored1.jpg',
    notes: 'Saw-cut square excavation and hot-mix compaction completed with Level-1 municipal pass.',
    status: 'ASSIGNED',
    severity: 'CRITICAL',
  },
  {
    id: 'DEMO-CHD-26',
    reportId: 'PF-102',
    trackingNumber: 'PF-102',
    lat: 30.7290,
    lng: 76.8040,
    title: 'Madhya Marg Arterial',
    locationName: 'Sector 26 Grain Market Corridor, Chandigarh',
    completedCount: 14,
    completedDate: 'Active Defect',
    inspectorName: 'Alice Sharma (Commissioner)',
    isRealDatabaseRecord: false,
    beforePhotoUrl: '/photos/pothole-madhyamarg.jpg',
    afterPhotoUrl: '/photos/pothole-restored2.jpg',
    notes: 'Significant asphalt depression across main carriageway patched flush to curb level.',
    status: 'IN_PROGRESS',
    severity: 'HIGH',
  },
  {
    id: 'DEMO-PB-KHARAR',
    reportId: 'PF-103',
    trackingNumber: 'PF-103',
    lat: 30.7499,
    lng: 76.6433,
    title: 'National Highway 5 Corridor',
    locationName: 'NH-5 Kharar Flyover, Punjab',
    completedCount: 6,
    completedDate: 'Active Defect',
    inspectorName: 'Punjab PWD Inspection Squad',
    isRealDatabaseRecord: false,
    beforePhotoUrl: '/photos/pothole-kharar.jpg',
    afterPhotoUrl: '/photos/pothole-restored3.jpg',
    notes: 'High-speed highway defect repaired with bitumen sealant and roller compaction.',
    status: 'AWAITING_APPROVAL',
    severity: 'MEDIUM',
  },
  {
    id: 'DEMO-DELHI-CP',
    reportId: 'PF-DELHI',
    trackingNumber: 'PF-DELHI',
    lat: 28.6315,
    lng: 77.2167,
    title: 'Connaught Place Ring Road',
    locationName: 'Outer Ring, New Delhi',
    completedCount: 19,
    completedDate: 'Certified Pass',
    inspectorName: 'Delhi PWD Engineering Unit',
    isRealDatabaseRecord: false,
    beforePhotoUrl: '/photos/pothole-sector17.jpg',
    afterPhotoUrl: '/photos/pothole-restored1.jpg',
    notes: 'Transit lane surface fatigue restoration completed overnight.',
    status: 'RESOLVED',
    severity: 'HIGH',
  },
];

// Helper: converts lat/lng to 3D Cartesian coordinates on sphere with radius R
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Great-circle angular distance on unit sphere in radians
function angularDistanceRadians(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const phi1 = lat1 * (Math.PI / 180);
  const phi2 = lat2 * (Math.PI / 180);
  const deltaLambda = (lng2 - lng1) * (Math.PI / 180);
  return Math.acos(
    Math.min(1, Math.max(-1, Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)))
  );
}

// Helper: determine geospatial corridor name for cluster
function getClusterRegionName(cluster: GlobeClusterData): string {
  if (cluster.lat >= 30.5 && cluster.lat <= 31.1 && cluster.lng >= 76.4 && cluster.lng <= 77.1) {
    return 'Chandigarh Capital Region';
  }
  if (cluster.lat >= 28.3 && cluster.lat <= 28.9 && cluster.lng >= 76.9 && cluster.lng <= 77.5) {
    return 'Delhi NCR Arterial Network';
  }
  return 'Regional Highway Corridor';
}

// Fallback high-contrast procedural Earth texture
function createFallbackProceduralTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a192f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 30) {
    const x = ((lng + 180) / 360) * canvas.width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  ctx.fillStyle = '#2d4a22';
  ctx.fillRect(canvas.width * 0.65, canvas.height * 0.25, canvas.width * 0.18, canvas.height * 0.35);
  ctx.fillRect(canvas.width * 0.45, canvas.height * 0.35, canvas.width * 0.15, canvas.height * 0.4);
  ctx.fillRect(canvas.width * 0.15, canvas.height * 0.2, canvas.width * 0.2, canvas.height * 0.35);

  return new THREE.CanvasTexture(canvas);
}

export const InteractiveImpactGlobe: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<GlobePinData[]>(REGIONAL_SHOWCASE_PINS);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RESOLVED'>('ALL');
  const [selectedPin, setSelectedPin] = useState<GlobePinData | null>(REGIONAL_SHOWCASE_PINS[1]); // Madhya Marg default
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);
  const [hoveredDetailReport, setHoveredDetailReport] = useState<GlobePinData | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [isRotationPaused, setIsRotationPaused] = useState(true);
  const [viewMode, setViewMode] = useState<'3D_GLOBE' | 'ROAD_MAP'>('3D_GLOBE');
  const [cameraDistance, setCameraDistance] = useState(2.45);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 1200, height: 700 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);
  const [totalCertifiedCount, setTotalCertifiedCount] = useState(47);
  const [isZoomAnimating, setIsZoomAnimating] = useState(false);
  const [zoomingReportTitle, setZoomingReportTitle] = useState<string>('');

  // Screen-space projected markers for crisp HTML overlay rendering
  const [projectedPoints, setProjectedPoints] = useState<ProjectedScreenPoint[]>([]);

  // Hover leave debounce timer to eliminate flickering
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mutable refs for Three.js
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const pinGroupRef = useRef<THREE.Group | null>(null);
  const isRotationPausedRef = useRef(true);
  const isDraggingRef = useRef(false);
  const isZoomAnimatingRef = useRef(false);
  const selectedPinRef = useRef<GlobePinData | null>(REGIONAL_SHOWCASE_PINS[1]);

  useEffect(() => {
    isRotationPausedRef.current = isRotationPaused;
  }, [isRotationPaused]);

  useEffect(() => {
    selectedPinRef.current = selectedPin;
  }, [selectedPin]);

  useEffect(() => {
    isZoomAnimatingRef.current = isZoomAnimating;
  }, [isZoomAnimating]);

  // Accessibility check: prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setIsRotationPaused(true);
        isRotationPausedRef.current = true;
      }
    }
  }, []);

  // 1. Fetch Real Reports from SQLite Database / Public API
  useEffect(() => {
    async function loadReports() {
      try {
        const allReports = await reportsService.getPublicReports();
        if (allReports && allReports.length > 0) {
          const livePins: GlobePinData[] = allReports.map((r: PotholeReport) => {
            let title = `Report #${r.trackingNumber}`;
            if (r.id === 'PF-102' || r.trackingNumber === 'PF-102') {
              title = 'Madhya Marg Arterial';
            } else if (r.id === 'PF-101' || r.trackingNumber === 'PF-101') {
              title = 'Sector 17 Plaza Corridor';
            } else if (r.id === 'PF-103' || r.trackingNumber === 'PF-103') {
              title = 'National Highway 5, Kharar';
            } else if (r.id === 'PF-999' || r.trackingNumber === 'PF-999') {
              title = 'Sector 17 Commercial Corridor';
            }

            return {
              id: r.id,
              reportId: r.id,
              trackingNumber: r.trackingNumber,
              lat: r.location.latitude,
              lng: r.location.longitude,
              title,
              locationName: r.location.address,
              completedCount: r.status === 'RESOLVED' ? 1 : 0,
              completedDate: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : 'Active Defect',
              inspectorName:
                r.status === 'RESOLVED'
                  ? 'Alice Sharma (Municipal Commissioner)'
                  : r.reporterName || 'Municipal Authority Inspection Squad',
              isRealDatabaseRecord: true,
              beforePhotoUrl: r.damageImageUrl || '/photos/pothole-sector17.jpg',
              afterPhotoUrl: r.restoredImageUrl || (r.status === 'RESOLVED' ? '/photos/pothole-restored1.jpg' : ''),
              notes: r.description || 'Level-1 certified asphalt restoration and compaction audit.',
              status: r.status,
              severity: r.aiDetection?.severityScore || (r as unknown as { severity?: string }).severity || 'HIGH',
              description: r.description,
            };
          });

          // Deduplicate with regional demo pins if necessary
          const liveIds = new Set(livePins.map((p) => p.trackingNumber || p.id));
          const nonOverlappingDemos = REGIONAL_SHOWCASE_PINS.filter((p) => !liveIds.has(p.trackingNumber || p.id));
          const merged = [...livePins, ...nonOverlappingDemos];

          setPins(merged);
          setTotalCertifiedCount(47 + livePins.filter((p) => p.status === 'RESOLVED').length);

          const madhyaReport = merged.find(
            (p) => p.trackingNumber === 'PF-102' || p.locationName.toLowerCase().includes('madhya marg')
          );
          if (madhyaReport) {
            setSelectedPin(madhyaReport);
            selectedPinRef.current = madhyaReport;
          } else {
            setSelectedPin(merged[0]);
            selectedPinRef.current = merged[0];
          }
        }
      } catch (err) {
        console.warn('Could not fetch public reports, using regional showcase corridors.', err);
      }
    }

    loadReports();
  }, []);

  // Filtered Pins based on activeFilter toggle
  const displayedPins = useMemo(() => {
    if (activeFilter === 'RESOLVED') {
      return pins.filter((p) => p.status === 'RESOLVED' || p.completedCount > 0);
    }
    return pins;
  }, [pins, activeFilter]);

  // 2. Compute Zoom-Aware Smart Clusters
  const clustersAndPins = useMemo(() => {
    const clusterThreshold = cameraDistance > 2.2 ? 0.035 : 0.012; // Angular distance in radians
    const visited = new Set<string>();
    const clusters: GlobeClusterData[] = [];
    const standalonePins: GlobePinData[] = [];

    for (let i = 0; i < displayedPins.length; i++) {
      const pinA = displayedPins[i];
      if (visited.has(pinA.id)) continue;

      const group: GlobePinData[] = [pinA];
      visited.add(pinA.id);

      for (let j = i + 1; j < displayedPins.length; j++) {
        const pinB = displayedPins[j];
        if (visited.has(pinB.id)) continue;

        const dist = angularDistanceRadians(pinA.lat, pinA.lng, pinB.lat, pinB.lng);
        if (dist < clusterThreshold) {
          group.push(pinB);
          visited.add(pinB.id);
        }
      }

      if (group.length > 1) {
        const avgLat = group.reduce((sum, p) => sum + p.lat, 0) / group.length;
        const avgLng = group.reduce((sum, p) => sum + p.lng, 0) / group.length;
        clusters.push({
          id: `CLUSTER-${group.map((p) => p.id).join('-')}`,
          lat: avgLat,
          lng: avgLng,
          count: group.length,
          pins: group,
        });
      } else {
        standalonePins.push(pinA);
      }
    }

    return { clusters, standalonePins };
  }, [displayedPins, cameraDistance]);

  // 3. Update 3D Surface Beacon Anchors on Globe
  const buildPinAndClusterMeshes = useCallback(
    (globeRadius: number) => {
      const pinGroup = pinGroupRef.current;
      if (!pinGroup) return;

      while (pinGroup.children.length > 0) {
        const child = pinGroup.children[0];
        pinGroup.remove(child);
      }

      // Add subtle ground beacon anchor rings on globe surface
      clustersAndPins.clusters.forEach((cluster) => {
        const surfacePos = latLngToVector3(cluster.lat, cluster.lng, globeRadius);
        const normal = surfacePos.clone().normalize();

        const anchor = new THREE.Group();
        anchor.position.copy(surfacePos);
        anchor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

        // Ground Concentric Anchor Ring
        const ringGeo = new THREE.RingGeometry(0.016, 0.038, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xf43f5e,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(0, 0.002, 0);
        anchor.add(ringMesh);

        pinGroup.add(anchor);
      });

      clustersAndPins.standalonePins.forEach((pin) => {
        const surfacePos = latLngToVector3(pin.lat, pin.lng, globeRadius);
        const normal = surfacePos.clone().normalize();

        const anchor = new THREE.Group();
        anchor.position.copy(surfacePos);
        anchor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

        const isResolved = pin.status === 'RESOLVED';
        const ringGeo = new THREE.RingGeometry(0.012, 0.028, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isResolved ? 0x10b981 : 0xf43f5e,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(0, 0.002, 0);
        anchor.add(ringMesh);

        pinGroup.add(anchor);
      });
    },
    [clustersAndPins]
  );

  useEffect(() => {
    buildPinAndClusterMeshes(1.0);
  }, [buildPinAndClusterMeshes]);

  // 4. Update Screen-Space Projected HTML Overlay Positions
  const updateProjectedPositions = useCallback(() => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const earthMesh = earthMeshRef.current;
    if (!container || !camera || !earthMesh) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 520;
    const points: ProjectedScreenPoint[] = [];

    // Project Clusters
    clustersAndPins.clusters.forEach((cluster) => {
      const surfacePos = latLngToVector3(cluster.lat, cluster.lng, 1.0);
      const worldPos = surfacePos.clone().applyMatrix4(earthMesh.matrixWorld);

      // Normal check: is point on hemisphere facing camera?
      const normal = surfacePos.clone().applyQuaternion(earthMesh.quaternion).normalize();
      const camDir = camera.position.clone().sub(worldPos).normalize();
      const dot = normal.dot(camDir);
      const isVisible = dot > 0.08 && worldPos.z > -1.0;

      const projected = worldPos.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;

      points.push({
        id: cluster.id,
        x,
        y,
        isVisible,
        isCluster: true,
        clusterData: cluster,
      });
    });

    // Project Standalone Pins
    clustersAndPins.standalonePins.forEach((pin) => {
      const surfacePos = latLngToVector3(pin.lat, pin.lng, 1.0);
      const worldPos = surfacePos.clone().applyMatrix4(earthMesh.matrixWorld);

      const normal = surfacePos.clone().applyQuaternion(earthMesh.quaternion).normalize();
      const camDir = camera.position.clone().sub(worldPos).normalize();
      const dot = normal.dot(camDir);
      const isVisible = dot > 0.08 && worldPos.z > -1.0;

      const projected = worldPos.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;

      points.push({
        id: pin.id,
        x,
        y,
        isVisible,
        isCluster: false,
        pinData: pin,
      });
    });

    setProjectedPoints(points);
  }, [clustersAndPins]);

  // 5. Three.js Scene Setup (Initialized ONCE on Mount)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        setIsLoading(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      setIsLoading(false);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight || 700;
    setContainerSize({ width, height });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.45;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.outline = 'none';
    renderer.domElement.style.cursor = 'grab';
    container.appendChild(renderer.domElement);

    const globeRadius = 1.0;
    const earthGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);

    const earthMaterial = new THREE.MeshPhongMaterial({
      shininess: 15,
      specular: new THREE.Color(0x1a2e40),
      emissive: new THREE.Color(0x000000),
    });

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    textureLoader.load(
      '/textures/earth-india-highlighted.jpg',
      (highlightedTexture) => {
        highlightedTexture.colorSpace = THREE.SRGBColorSpace;
        highlightedTexture.wrapS = THREE.RepeatWrapping;
        highlightedTexture.wrapT = THREE.ClampToEdgeWrapping;
        highlightedTexture.needsUpdate = true;

        earthMaterial.map = highlightedTexture;
        earthMaterial.needsUpdate = true;
        setIsLoading(false);
      },
      undefined,
      () => {
        console.warn('Loading fallback NASA Blue Marble texture...');
        textureLoader.load(
          '/textures/earth-blue-marble.jpg',
          (baseTexture) => {
            baseTexture.colorSpace = THREE.SRGBColorSpace;
            baseTexture.wrapS = THREE.RepeatWrapping;
            baseTexture.wrapT = THREE.ClampToEdgeWrapping;
            baseTexture.needsUpdate = true;

            earthMaterial.map = baseTexture;
            earthMaterial.needsUpdate = true;
            setIsLoading(false);
          },
          undefined,
          (err) => {
            console.warn('Could not load Blue Marble texture, using procedural fallback', err);
            const fallbackTex = createFallbackProceduralTexture();
            earthMaterial.map = fallbackTex;
            earthMaterial.needsUpdate = true;
            setIsLoading(false);
          }
        );
      }
    );

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMeshRef.current = earthMesh;

    // Centered on India / South Asia (Lat ~22° N, Lng ~78° E)
    earthMesh.rotation.y = -2.94;
    earthMesh.rotation.x = 0.22;
    scene.add(earthMesh);

    const pinGroup = new THREE.Group();
    earthMesh.add(pinGroup);
    pinGroupRef.current = pinGroup;
    buildPinAndClusterMeshes(globeRadius);

    // Atmospheric rim
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.018, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.028,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // Space Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.48);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbf5, 2.0);
    sunLight.position.set(2, 3, 6);
    scene.add(sunLight);

    const starFillLight = new THREE.DirectionalLight(0x78909c, 0.15);
    starFillLight.position.set(-6, -2, -4);
    scene.add(starFillLight);

    // Drag & Zoom Controls
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      if (isZoomAnimatingRef.current) return;
      isDraggingRef.current = true;
      setIsInteracting(true);
      renderer.domElement.style.cursor = 'grabbing';
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerDrag = (e: PointerEvent) => {
      if (!isDraggingRef.current || !earthMeshRef.current || isZoomAnimatingRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      earthMeshRef.current.rotation.y += deltaX * 0.004;
      earthMeshRef.current.rotation.x += deltaY * 0.004;
      earthMeshRef.current.rotation.x = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, earthMeshRef.current.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
      updateProjectedPositions();
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      renderer.domElement.style.cursor = 'grab';
      setTimeout(() => setIsInteracting(false), 500);
      updateProjectedPositions();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isZoomAnimatingRef.current) return;
      setIsInteracting(true);
      if (cameraRef.current) {
        cameraRef.current.position.z += e.deltaY * 0.0015;
        cameraRef.current.position.z = Math.max(1.75, Math.min(3.85, cameraRef.current.position.z));
        setCameraDistance(cameraRef.current.position.z);
      }
      updateProjectedPositions();
      setTimeout(() => setIsInteracting(false), 500);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerDrag);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animationFrameId: number;
    let pulseClock = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      pulseClock += 0.035;

      if (pinGroupRef.current) {
        const scale = 1 + 0.15 * Math.sin(pulseClock);
        pinGroupRef.current.children.forEach((childGroup) => {
          const ringMesh = childGroup.children[0];
          if (ringMesh) {
            ringMesh.scale.set(scale, scale, scale);
          }
        });
      }

      const shouldRotate =
        !isRotationPausedRef.current &&
        !isDraggingRef.current &&
        !isZoomAnimatingRef.current;

      if (shouldRotate && earthMeshRef.current) {
        earthMeshRef.current.rotation.y += 0.0009;
        updateProjectedPositions();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Initial projection
    setTimeout(() => updateProjectedPositions(), 100);

    const handleResize = () => {
      if (!container || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 700;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      setContainerSize({ width: newWidth, height: newHeight });
      updateProjectedPositions();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerDrag);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      earthGeometry.dispose();
      earthMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      renderer.dispose();
    };
  }, []); // Run ONCE on mount

  // Sync projected points whenever clustersAndPins change
  useEffect(() => {
    updateProjectedPositions();
  }, [clustersAndPins, updateProjectedPositions]);

  // 6. Direct Click-to-Zoom Navigation (Phase 5 Mandatory Interaction)
  const handleDirectNavigateToReport = useCallback((targetPin: GlobePinData) => {
    // Clear hover states immediately
    setHoveredClusterId(null);
    setHoveredPinId(null);
    setHoveredDetailReport(null);

    if (!earthMeshRef.current || !cameraRef.current) {
      setSelectedPin(targetPin);
      selectedPinRef.current = targetPin;
      setViewMode('ROAD_MAP');
      return;
    }

    const startRy = earthMeshRef.current.rotation.y;
    const startRx = earthMeshRef.current.rotation.x;
    const startZ = cameraRef.current.position.z;

    // Direct formula to bring target lat/lng directly to camera center (0, 0, Z)
    const targetRy = -(targetPin.lng * Math.PI) / 180 - Math.PI / 2;
    const targetRx = (targetPin.lat * Math.PI) / 180 * 0.45;
    const targetZ = 1.45; // Close-up orbital altitude

    let deltaRy = (targetRy - startRy) % (Math.PI * 2);
    if (deltaRy > Math.PI) deltaRy -= Math.PI * 2;
    if (deltaRy < -Math.PI) deltaRy += Math.PI * 2;
    const finalRy = startRy + deltaRy;

    setIsZoomAnimating(true);
    isZoomAnimatingRef.current = true;
    setZoomingReportTitle(targetPin.title);

    const startTime = performance.now();
    const duration = 1600; // 1.6s smooth transition

    const animateStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      // easeInOutCubic
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      if (earthMeshRef.current && cameraRef.current) {
        earthMeshRef.current.rotation.y = startRy + (finalRy - startRy) * ease;
        earthMeshRef.current.rotation.x = startRx + (targetRx - startRx) * ease;
        cameraRef.current.position.z = startZ + (targetZ - startZ) * ease;
        setCameraDistance(cameraRef.current.position.z);
        updateProjectedPositions();
      }

      if (progress < 1.0) {
        requestAnimationFrame(animateStep);
      } else {
        setIsZoomAnimating(false);
        isZoomAnimatingRef.current = false;
        setSelectedPin(targetPin);
        selectedPinRef.current = targetPin;
        setViewMode('ROAD_MAP');
      }
    };

    requestAnimationFrame(animateStep);
  }, [updateProjectedPositions]);

  // 7. Return from Road Map to 3D Globe with smooth camera zoom-out (Phase 10)
  const handleBackToGlobe = useCallback(() => {
    setViewMode('3D_GLOBE');
    if (cameraRef.current && earthMeshRef.current) {
      const startZ = cameraRef.current.position.z;
      const targetZ = 2.45;
      const startTime = performance.now();
      const duration = 1200;

      const animateOut = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        if (cameraRef.current) {
          cameraRef.current.position.z = startZ + (targetZ - startZ) * ease;
          setCameraDistance(cameraRef.current.position.z);
          updateProjectedPositions();
        }
        if (progress < 1.0) {
          requestAnimationFrame(animateOut);
        }
      };
      requestAnimationFrame(animateOut);
    }
  }, [updateProjectedPositions]);

  // Anti-flicker hover helpers for two-level progressive disclosure
  const handleMouseEnterCluster = (id: string, defaultPin?: GlobePinData) => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    setHoveredClusterId(id);
    setHoveredPinId(null);
    if (defaultPin) {
      setHoveredDetailReport(defaultPin);
    }
  };

  const handleMouseLeaveCluster = () => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
    }
    hoverLeaveTimerRef.current = setTimeout(() => {
      setHoveredClusterId(null);
      setHoveredDetailReport(null);
    }, 350);
  };

  const handleMouseEnterPin = (id: string) => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    setHoveredPinId(id);
    setHoveredClusterId(null);
    setHoveredDetailReport(null);
  };

  const handleMouseLeavePin = () => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
    }
    hoverLeaveTimerRef.current = setTimeout(() => {
      setHoveredPinId(null);
      setHoveredDetailReport(null);
    }, 350);
  };

  return (
    <div className="relative w-full rounded-3xl bg-gradient-to-b from-surface-container-lowest via-surface-container-low/50 to-surface-container-lowest border border-outline-variant/30 overflow-hidden shadow-xl p-4 sm:p-6 lg:p-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Realistic Satellite Earth · Municipal Infrastructure Telemetry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            Global Impact &amp; Completed Repairs
          </h2>
          <p className="text-secondary text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Hover any cluster to preview active pothole reports, then click any report to automatically zoom to its exact stored GPS location.
          </p>
        </div>

        {/* Filter Toggle & Verified Count Badge */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              All Active &amp; Resolved
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('RESOLVED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'RESOLVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              Certified Repairs
            </button>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/30 p-2.5 sm:p-3 rounded-2xl shadow-xs text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Total Audited Repairs
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-primary font-display-hero">
              {totalCertifiedCount} Verified
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Hybrid 3D Globe <-> Detailed Street-Level Map */}
      <div className="pt-4 relative">
        {/* DETAILED STREET MAP VIEW (Phase 6 - 10) */}
        {viewMode === 'ROAD_MAP' && (
          <DetailedStreetMap
            key={`detailed-map-${selectedPin?.id || 'default'}-${selectedPin?.lat}-${selectedPin?.lng}`}
            initialReport={selectedPin}
            allReports={displayedPins}
            onBackToGlobe={handleBackToGlobe}
            onSelectReport={(report) => {
              setSelectedPin(report);
              selectedPinRef.current = report;
            }}
          />
        )}

        {/* 3D GLOBE VIEW WITH SCREEN-SPACE CLUSTER OVERLAY (Phase 1 - 5) */}
        <div className={viewMode === 'ROAD_MAP' ? 'hidden' : 'block'}>
          {/* Dominant Full-Width 3D Earth Globe Viewport (Spacious & Centered) */}
          <div className="w-full h-[580px] sm:h-[640px] lg:h-[700px] xl:h-[720px] relative flex items-center justify-center rounded-3xl bg-radial from-surface-container-low/30 via-surface-container-lowest to-surface-container-lowest overflow-hidden border border-outline-variant/30 shadow-inner">
            {webglSupported ? (
              <>
                {/* Three.js Canvas Container */}
                <div ref={mountRef} className="w-full h-full relative z-0" />

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest/80 backdrop-blur-xs gap-3 z-30">
                    <div className="w-9 h-9 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                    <span className="text-xs text-secondary font-medium">
                      Loading NASA Satellite Earth &amp; Telemetry...
                    </span>
                  </div>
                )}

                {/* Zoom Animation In Progress Overlay */}
                {isZoomAnimating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest/40 backdrop-blur-xs gap-2 z-40 pointer-events-none">
                    <div className="px-5 py-2.5 rounded-full bg-slate-900/95 text-white font-bold text-xs shadow-2xl flex items-center gap-2.5 border border-white/20 animate-pulse">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Direct Zoom: Navigating to {zoomingReportTitle}...</span>
                    </div>
                  </div>
                )}

                {/* Top Left: Legend Chips */}
                <div className="absolute top-3.5 left-3.5 flex items-center gap-2 flex-wrap z-10 pointer-events-none">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-[10px] font-bold text-emerald-700 border border-emerald-500/30 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Certified Restoration</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-[10px] font-bold text-rose-700 border border-rose-500/30 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Active Hazard</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-outline-variant/30 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-800" />
                    <span>Cluster Marker</span>
                  </span>
                </div>

                {/* Bottom Left: Orientation & Instruction Hint */}
                <div className="absolute bottom-3.5 left-3.5 bg-surface-container-lowest/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-outline-variant/30 text-[11px] text-secondary flex items-center gap-2 pointer-events-none shadow-xs z-10">
                  <svg className="w-3.5 h-3.5 fill-teal-600 shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                  <span>
                    {isInteracting
                      ? 'Interacting with 3D Earth'
                      : 'India Centered (Stationary) · Hover cluster for reports · Click Locate Precise Location to navigate'}
                  </span>
                </div>

                {/* ======================================================== */}
                {/* SCREEN-SPACE PROJECTED HTML OVERLAY: TWO-LEVEL POPOVERS */}
                {/* ======================================================== */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                  {/* Circular Map Pins & Cluster Badges */}
                  {projectedPoints.map((point) => {
                    if (!point.isVisible) return null;

                    /* ---------------------------------------------------- */
                    /* CASE A: CLUSTER MARKER PIN                           */
                    /* ---------------------------------------------------- */
                    if (point.isCluster && point.clusterData) {
                      const cluster = point.clusterData;
                      const isHovered = hoveredClusterId === cluster.id;
                      const hasActive = cluster.pins.some((p) => p.status !== 'RESOLVED');
                      const badgeSize = cluster.count >= 7 ? 46 : cluster.count >= 4 ? 40 : 36;
                      const regionName = getClusterRegionName(cluster);

                      return (
                        <div
                          key={cluster.id}
                          className="absolute pointer-events-auto"
                          style={{
                            left: `${point.x}px`,
                            top: `${point.y}px`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: isHovered ? 60 : 30,
                          }}
                          onMouseEnter={() => handleMouseEnterCluster(cluster.id)}
                          onMouseLeave={handleMouseLeaveCluster}
                        >
                          {/* Subtle needle stem */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-3 bg-gradient-to-b from-rose-500/80 to-transparent pointer-events-none" />

                          {/* Premium Cluster Circular Badge */}
                          <button
                            type="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMouseEnterCluster(cluster.id);
                              if (!hoveredDetailReport && cluster.pins.length > 0) {
                                setHoveredDetailReport(cluster.pins[0]);
                              }
                            }}
                            onMouseEnter={() => {
                              handleMouseEnterCluster(cluster.id);
                              if (!hoveredDetailReport && cluster.pins.length > 0) {
                                setHoveredDetailReport(cluster.pins[0]);
                              }
                            }}
                            onFocus={() => {
                              handleMouseEnterCluster(cluster.id);
                              if (!hoveredDetailReport && cluster.pins.length > 0) {
                                setHoveredDetailReport(cluster.pins[0]);
                              }
                            }}
                            className={`relative rounded-full flex items-center justify-center font-extrabold text-white shadow-xl transition-all duration-200 cursor-pointer select-none group ${
                              hasActive
                                ? 'bg-slate-900/90 border-2 border-rose-500/90 shadow-[0_4px_16px_rgba(244,63,94,0.4)] hover:shadow-[0_4px_22px_rgba(244,63,94,0.65)]'
                                : 'bg-slate-900/90 border-2 border-emerald-500/90 shadow-[0_4px_16px_rgba(16,185,129,0.4)] hover:shadow-[0_4px_22px_rgba(16,185,129,0.65)]'
                            }`}
                            style={{
                              width: `${badgeSize}px`,
                              height: `${badgeSize}px`,
                              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                              backdropFilter: 'blur(8px)',
                            }}
                            title={`Cluster of ${cluster.count} reports in ${regionName}. Hover to inspect.`}
                            aria-label={`Cluster of ${cluster.count} reports in ${regionName}.`}
                          >
                            <div className="absolute inset-0.5 rounded-full border border-white/20 pointer-events-none" />
                            <span className="font-mono text-xs sm:text-sm font-extrabold tracking-tight drop-shadow-xs">
                              {cluster.count}
                            </span>
                          </button>
                        </div>
                      );
                    }

                    /* ---------------------------------------------------- */
                    /* CASE B: SINGLE POTHOLE PIN                           */
                    /* ---------------------------------------------------- */
                    if (!point.isCluster && point.pinData) {
                      const pin = point.pinData;
                      const isHovered = hoveredPinId === pin.id;
                      const isResolved = pin.status === 'RESOLVED';

                      return (
                        <div
                          key={pin.id}
                          className="absolute pointer-events-auto"
                          style={{
                            left: `${point.x}px`,
                            top: `${point.y}px`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: isHovered ? 60 : 25,
                          }}
                          onMouseEnter={() => handleMouseEnterPin(pin.id)}
                          onMouseLeave={handleMouseLeavePin}
                        >
                          <button
                            type="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMouseEnterPin(pin.id);
                            }}
                            onMouseEnter={() => handleMouseEnterPin(pin.id)}
                            onFocus={() => handleMouseEnterPin(pin.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-white shadow-xl transition-all duration-200 cursor-pointer select-none group border-2 ${
                              isResolved
                                ? 'bg-slate-900/90 border-emerald-500 shadow-[0_4px_14px_rgba(16,185,129,0.4)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.6)]'
                                : 'bg-slate-900/90 border-rose-500 shadow-[0_4px_14px_rgba(244,63,94,0.4)] hover:shadow-[0_4px_20px_rgba(244,63,94,0.6)]'
                            }`}
                            style={{
                              transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                              backdropFilter: 'blur(8px)',
                            }}
                            title={`${pin.title}. Hover to inspect.`}
                          >
                            <span className="material-symbols-outlined text-[15px] text-white">
                              {isResolved ? 'task_alt' : 'location_on'}
                            </span>
                          </button>
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* ======================================================== */}
                  {/* TWO-LEVEL CLUSTER POPOVER: CLAMPED & NON-CLIPPING        */}
                  {/* ======================================================== */}
                  <AnimatePresence>
                    {(() => {
                      const activeClusterPoint = projectedPoints.find(
                        (p) => p.isCluster && p.clusterData?.id === hoveredClusterId
                      );
                      if (!activeClusterPoint || !activeClusterPoint.clusterData) return null;

                      const cluster = activeClusterPoint.clusterData;
                      const isMobile = containerSize.width < 680;
                      const totalPopupWidth = isMobile ? Math.min(320, containerSize.width - 32) : 660;
                      const maxPopupHeight = Math.min(500, containerSize.height - 32);

                      // Smart viewport-clamped positioning relative to container
                      let idealLeft = activeClusterPoint.x + 28;
                      if (idealLeft + totalPopupWidth > containerSize.width - 16) {
                        idealLeft = activeClusterPoint.x - totalPopupWidth - 28;
                      }
                      const clampLeft = Math.max(16, Math.min(idealLeft, containerSize.width - totalPopupWidth - 16));
                      const idealTop = activeClusterPoint.y - maxPopupHeight * 0.35;
                      const clampTop = Math.max(16, Math.min(idealTop, containerSize.height - maxPopupHeight - 16));

                      const regionName = getClusterRegionName(cluster);
                      const activeReport =
                        hoveredDetailReport && cluster.pins.some((p) => p.id === hoveredDetailReport.id)
                          ? hoveredDetailReport
                          : cluster.pins[0];

                      return (
                        <div
                          className="absolute pointer-events-auto z-50 flex flex-col sm:flex-row items-start gap-3"
                          style={{
                            left: `${clampLeft}px`,
                            top: `${clampTop}px`,
                            maxHeight: `${maxPopupHeight}px`,
                          }}
                          onMouseEnter={() => {
                            if (hoverLeaveTimerRef.current) {
                              clearTimeout(hoverLeaveTimerRef.current);
                              hoverLeaveTimerRef.current = null;
                            }
                          }}
                          onMouseLeave={handleMouseLeaveCluster}
                        >
                          {/* LEVEL 1: COMPACT CLUSTER REPORT LIST */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="w-72 sm:w-76 max-h-[480px] sm:max-h-[500px] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 text-left shrink-0 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={() => {
                              if (hoverLeaveTimerRef.current) {
                                clearTimeout(hoverLeaveTimerRef.current);
                                hoverLeaveTimerRef.current = null;
                              }
                            }}
                          >
                            {/* Header */}
                            <div className="shrink-0 p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                  <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    {regionName}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                  {cluster.count} Defects
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                                Select a report to preview telemetry:
                              </p>
                            </div>

                            {/* Scrollable list */}
                            <div
                              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2.5 space-y-1.5 custom-scrollbar"
                              onWheel={(e) => e.stopPropagation()}
                            >
                              {cluster.pins.map((pin) => {
                                const isSelected = activeReport?.id === pin.id;
                                return (
                                  <div
                                    key={pin.id}
                                    tabIndex={0}
                                    data-testid={`report-row-${pin.id}`}
                                    data-report-id={pin.id}
                                    onMouseEnter={() => {
                                      if (hoverLeaveTimerRef.current) {
                                        clearTimeout(hoverLeaveTimerRef.current);
                                        hoverLeaveTimerRef.current = null;
                                      }
                                      setHoveredDetailReport(pin);
                                    }}
                                    onMouseOver={() => {
                                      if (hoverLeaveTimerRef.current) {
                                        clearTimeout(hoverLeaveTimerRef.current);
                                        hoverLeaveTimerRef.current = null;
                                      }
                                      setHoveredDetailReport(pin);
                                    }}
                                    onFocus={() => setHoveredDetailReport(pin)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHoveredDetailReport(pin);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setHoveredDetailReport(pin);
                                      }
                                    }}
                                    className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 group ${
                                      isSelected
                                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500/60 shadow-xs ring-1 ring-teal-500/30'
                                        : 'bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 border-slate-100 dark:border-slate-700/60'
                                    }`}
                                  >
                                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-200 relative">
                                      <img
                                        src={pin.beforePhotoUrl}
                                        alt="Pothole"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-[11px] text-slate-900 dark:text-white">
                                          {pin.reportId || pin.trackingNumber || pin.id}
                                        </span>
                                        <span
                                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                            pin.status === 'RESOLVED'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : pin.status === 'IN_PROGRESS'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-rose-100 text-rose-800'
                                          }`}
                                        >
                                          {pin.status || 'REPORTED'}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-medium mt-0.5">
                                        {pin.title}
                                      </p>
                                    </div>
                                    <div
                                      className={`shrink-0 transition-all ${
                                        isSelected ? 'text-teal-600 translate-x-0.5 font-bold' : 'text-slate-400 group-hover:text-slate-600'
                                      }`}
                                    >
                                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>

                          {/* LEVEL 2: DETAILED FLYOUT CARD BESIDE THE LIST */}
                          {activeReport && (
                            <motion.div
                              key={activeReport.id}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              transition={{ duration: 0.16, ease: 'easeOut' }}
                              className="w-80 sm:w-88 max-h-[480px] sm:max-h-[500px] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 text-left shrink-0 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                              onMouseEnter={() => {
                                if (hoverLeaveTimerRef.current) {
                                  clearTimeout(hoverLeaveTimerRef.current);
                                  hoverLeaveTimerRef.current = null;
                                }
                              }}
                            >
                              {/* SECTION A: FIXED COMPACT HEADER */}
                              <div className="shrink-0 p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white">
                                      {activeReport.reportId || activeReport.trackingNumber || activeReport.id}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                      LIVE RECORD
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase ${
                                        activeReport.status === 'RESOLVED'
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                          : activeReport.status === 'IN_PROGRESS'
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                                      }`}
                                    >
                                      {activeReport.status || 'REPORTED'}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase">
                                      {activeReport.severity}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
                                    {activeReport.locationName || activeReport.title}
                                  </span>
                                  <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold shrink-0">
                                    {activeReport.lat.toFixed(4)}°, {activeReport.lng.toFixed(4)}°
                                  </span>
                                </div>
                              </div>

                              {/* SECTION B: SCROLLABLE CONTENT BODY */}
                              <div
                                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-3.5 space-y-3 custom-scrollbar"
                                onWheel={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                              >
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                    {activeReport.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                    {activeReport.locationName || 'Chandigarh Urban Division'}
                                  </p>
                                </div>

                                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-16/10 bg-slate-100">
                                  <img
                                    src={activeReport.beforePhotoUrl}
                                    alt={activeReport.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 text-white font-mono text-[9px] font-semibold backdrop-blur-xs">
                                    Reported Crater Proof
                                  </span>
                                  {activeReport.status === 'RESOLVED' && activeReport.afterPhotoUrl && (
                                    <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white font-mono text-[9px] font-semibold backdrop-blur-xs flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[11px]">verified</span>
                                      <span>Certified Pass</span>
                                    </span>
                                  )}
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
                                  <div>
                                    <span className="text-slate-400 block">Recorded Date:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {activeReport.completedDate || 'Oct 30, 2026'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block">Assigned Squad:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                                      {activeReport.inspectorName || 'Harjot Singh'}
                                    </span>
                                  </div>
                                </div>

                                {activeReport.notes && (
                                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-[10px]">
                                    <span className="text-slate-400 block font-semibold mb-0.5">Engineering Notes:</span>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                      "{activeReport.notes}"
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* SECTION C: STICKY FOOTER WITH LOCATE PRECISE LOCATION BUTTON */}
                              <div className="shrink-0 p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90">
                                <button
                                  type="button"
                                  data-testid="locate-precise-location-button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDirectNavigateToReport(activeReport);
                                  }}
                                  onMouseEnter={() => {
                                    if (hoverLeaveTimerRef.current) {
                                      clearTimeout(hoverLeaveTimerRef.current);
                                      hoverLeaveTimerRef.current = null;
                                    }
                                  }}
                                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 transition-all cursor-pointer group"
                                >
                                  <span className="material-symbols-outlined text-[17px] group-hover:scale-110 transition-transform">
                                    my_location
                                  </span>
                                  <span>Locate Precise Location</span>
                                  <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">
                                    arrow_forward
                                  </span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      );
                    })()}
                  </AnimatePresence>

                  {/* ======================================================== */}
                  {/* SINGLE PIN POPOVER: CLAMPED & NON-CLIPPING               */}
                  {/* ======================================================== */}
                  <AnimatePresence>
                    {(() => {
                      const activePinPoint = projectedPoints.find((p) => !p.isCluster && p.pinData?.id === hoveredPinId);
                      if (!activePinPoint || !activePinPoint.pinData) return null;

                      const pin = activePinPoint.pinData;
                      const singleCardWidth = Math.min(340, containerSize.width - 32);
                      const maxPopupHeight = Math.min(500, containerSize.height - 32);

                      let idealLeft = activePinPoint.x + 24;
                      if (idealLeft + singleCardWidth > containerSize.width - 16) {
                        idealLeft = activePinPoint.x - singleCardWidth - 24;
                      }
                      const clampLeft = Math.max(16, Math.min(idealLeft, containerSize.width - singleCardWidth - 16));
                      const idealTop = activePinPoint.y - maxPopupHeight * 0.35;
                      const clampTop = Math.max(16, Math.min(idealTop, containerSize.height - maxPopupHeight - 16));

                      const isResolved = pin.status === 'RESOLVED';

                      return (
                        <div
                          className="absolute pointer-events-auto z-50"
                          style={{
                            left: `${clampLeft}px`,
                            top: `${clampTop}px`,
                            maxHeight: `${maxPopupHeight}px`,
                          }}
                          onMouseEnter={() => {
                            if (hoverLeaveTimerRef.current) {
                              clearTimeout(hoverLeaveTimerRef.current);
                              hoverLeaveTimerRef.current = null;
                            }
                          }}
                          onMouseLeave={handleMouseLeavePin}
                        >
                          <motion.div
                            key={pin.id}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.16, ease: 'easeOut' }}
                            className="w-80 sm:w-88 max-h-[480px] sm:max-h-[500px] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 text-left shrink-0 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={() => {
                              if (hoverLeaveTimerRef.current) {
                                clearTimeout(hoverLeaveTimerRef.current);
                                hoverLeaveTimerRef.current = null;
                              }
                            }}
                          >
                            {/* SECTION A: FIXED COMPACT HEADER */}
                            <div className="shrink-0 p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white">
                                    {pin.reportId || pin.trackingNumber || pin.id}
                                  </span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    SINGLE PIN
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase ${
                                      isResolved
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                        : pin.status === 'IN_PROGRESS'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                                    }`}
                                  >
                                    {pin.status || 'REPORTED'}
                                  </span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase">
                                    {pin.severity}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-1.5 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
                                  {pin.locationName || pin.title}
                                </span>
                                <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold shrink-0">
                                  {pin.lat.toFixed(4)}°, {pin.lng.toFixed(4)}°
                                </span>
                              </div>
                            </div>

                            {/* SECTION B: SCROLLABLE BODY */}
                            <div
                              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-3.5 space-y-3 custom-scrollbar"
                              onWheel={(e) => e.stopPropagation()}
                              onTouchMove={(e) => e.stopPropagation()}
                            >
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                  {pin.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                  {pin.locationName || 'Indian Arterial Network'}
                                </p>
                              </div>

                              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-16/10 bg-slate-100">
                                <img
                                  src={pin.beforePhotoUrl}
                                  alt={pin.title}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 text-white font-mono text-[9px] font-semibold backdrop-blur-xs">
                                  Reported Crater Proof
                                </span>
                                {isResolved && pin.afterPhotoUrl && (
                                  <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white font-mono text-[9px] font-semibold backdrop-blur-xs flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[11px]">verified</span>
                                    <span>Certified Pass</span>
                                  </span>
                                )}
                              </div>

                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <span className="text-slate-400 block">Recorded Date:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {pin.completedDate || 'Oct 30, 2026'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Assigned Squad:</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                                    {pin.inspectorName || 'Municipal Authority'}
                                  </span>
                                </div>
                              </div>

                              {pin.notes && (
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-[10px]">
                                  <span className="text-slate-400 block font-semibold mb-0.5">Engineering Notes:</span>
                                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    "{pin.notes}"
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* SECTION C: STICKY FOOTER */}
                            <div className="shrink-0 p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90">
                              <button
                                type="button"
                                data-testid="locate-precise-location-button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDirectNavigateToReport(pin);
                                }}
                                onMouseEnter={() => {
                                  if (hoverLeaveTimerRef.current) {
                                    clearTimeout(hoverLeaveTimerRef.current);
                                    hoverLeaveTimerRef.current = null;
                                  }
                                }}
                                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 transition-all cursor-pointer group"
                              >
                                <span className="material-symbols-outlined text-[17px] group-hover:scale-110 transition-transform">
                                  my_location
                                </span>
                                <span>Locate Precise Location</span>
                                <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">
                                  arrow_forward
                                </span>
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Accessible WebGL Fallback */
              <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center space-y-3 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-5xl text-teal-600">public</span>
                <h3 className="text-lg font-bold text-on-surface">3D Earth (WebGL Fallback)</h3>
                <p className="text-xs text-secondary max-w-md leading-relaxed">
                  WebGL acceleration is currently disabled. Explore the detailed road map directly below.
                </p>
              </div>
            )}
          </div>

          {/* Below-Globe Progressive Disclosure Action Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-1 sm:px-2">
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-secondary flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 text-slate-700 dark:text-slate-300 font-medium shadow-2xs">
                <span className="material-symbols-outlined text-[16px] text-teal-600">travel_explore</span>
                <span>Hover cluster marker &rarr; select report &rarr; click <strong>Locate Precise Location</strong></span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {displayedPins.length} Active Spatial Telemetry Points
              </span>
            </div>

            {/* Repositioned Open Detailed Street Map Button */}
            <button
              type="button"
              onClick={() => {
                const target = selectedPin || displayedPins[0];
                if (target) {
                  handleDirectNavigateToReport(target);
                } else {
                  setViewMode('ROAD_MAP');
                }
              }}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-teal-600/25 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              <span>Open Detailed Street Map View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
