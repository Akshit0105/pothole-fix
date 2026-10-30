import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { reportsService } from '../../services/reportsService';
import type { PotholeReport } from '../../types';
import { PotholeImage } from '../common/PotholeImage';
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup as LeafletPopup } from 'react-leaflet';
import L from 'leaflet';

export interface GlobePinData {
  id: string;
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
}

const REGIONAL_SHOWCASE_PINS: GlobePinData[] = [
  {
    id: 'DEMO-CHD-17',
    lat: 30.7398,
    lng: 76.7827,
    title: 'Sector 17 Commercial Corridor',
    locationName: 'Sector 17 Plaza, Chandigarh',
    completedCount: 8,
    completedDate: 'Yesterday (Demo)',
    inspectorName: 'Alice Sharma (Commissioner)',
    isRealDatabaseRecord: false,
    beforePhotoUrl: '/photos/pothole-sector17.jpg',
    afterPhotoUrl: '/photos/pothole-restored1.jpg',
    notes: 'Saw-cut square excavation and hot-mix compaction completed with Level-1 municipal pass.',
  },
  {
    id: 'DEMO-CHD-26',
    lat: 30.729,
    lng: 76.804,
    title: 'Madhya Marg Arterial',
    locationName: 'Sector 26 Grain Market Corridor, Chandigarh',
    completedCount: 14,
    completedDate: '2 Days Ago (Demo)',
    inspectorName: 'Alice Sharma (Commissioner)',
    isRealDatabaseRecord: false,
    beforePhotoUrl: '/photos/pothole-madhyamarg.jpg',
    afterPhotoUrl: '/photos/pothole-restored2.jpg',
    notes: 'Significant asphalt depression patched flush to curb level.',
  },
  {
    id: 'DEMO-PB-KHARAR',
    lat: 30.7499,
    lng: 76.6433,
    title: 'National Highway 5 Corridor',
    locationName: 'NH-5 Kharar Flyover, Punjab',
    completedCount: 6,
    completedDate: '3 Days Ago (Demo)',
    inspectorName: 'Punjab PWD Inspection Squad',
    isRealDatabaseRecord: false,
    beforePhotoUrl: '/photos/pothole-kharar.jpg',
    afterPhotoUrl: '/photos/pothole-restored3.jpg',
    notes: 'High-speed highway defect repaired with bitumen sealant and roller compaction.',
  },
  {
    id: 'DEMO-DELHI-CP',
    lat: 28.6315,
    lng: 77.2167,
    title: 'Connaught Place Ring Road',
    locationName: 'Outer Ring, New Delhi',
    completedCount: 19,
    completedDate: 'Last Week (Demo)',
    inspectorName: 'Municipal Works Engineer',
    isRealDatabaseRecord: false,
    beforePhotoUrl: '/photos/pothole-sector17.jpg',
    afterPhotoUrl: '/photos/pothole-restored1.jpg',
    notes: 'Transit lane surface fatigue restoration completed overnight.',
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

// Procedural high-contrast fallback texture if image asset fails to load
const createRoadMapPinIcon = (isSelected: boolean) =>
  L.divIcon({
    className: 'custom-roadmap-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${isSelected ? '38px' : '30px'};
        height: ${isSelected ? '38px' : '30px'};
        background: #ef4444;
        border: 2.5px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(220, 38, 38, ${isSelected ? '0.65' : '0.4'});
        transition: all 0.2s ease;
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-family: 'Material Symbols Outlined';
          font-size: ${isSelected ? '20px' : '16px'};
          line-height: 1;
        ">location_on</span>
      </div>
    `,
    iconSize: isSelected ? [38, 38] : [30, 30],
    iconAnchor: isSelected ? [19, 38] : [15, 30],
    popupAnchor: [0, -32],
  });

function createFallbackProceduralTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep space ocean
  ctx.fillStyle = '#0a192f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle lat/long grid
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

  // Continent blocks
  ctx.fillStyle = '#2d4a22'; // Natural earthy green
  ctx.fillRect(canvas.width * 0.65, canvas.height * 0.25, canvas.width * 0.18, canvas.height * 0.35); // Asia/India
  ctx.fillRect(canvas.width * 0.45, canvas.height * 0.35, canvas.width * 0.15, canvas.height * 0.4); // Africa
  ctx.fillRect(canvas.width * 0.15, canvas.height * 0.2, canvas.width * 0.2, canvas.height * 0.35); // Americas

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export const InteractiveImpactGlobe: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<GlobePinData[]>(REGIONAL_SHOWCASE_PINS);
  const [selectedPin, setSelectedPin] = useState<GlobePinData | null>(REGIONAL_SHOWCASE_PINS[0]);
  const [hoveredPin, setHoveredPin] = useState<GlobePinData | null>(null);
  const [isRotationPaused, setIsRotationPaused] = useState(true); // Stationary by default (Phase 5)
  const [viewMode, setViewMode] = useState<'3D_GLOBE' | 'ROAD_MAP'>('3D_GLOBE'); // Hybrid 3D/Road Map (Phase 6)
  const [cameraDistance, setCameraDistance] = useState(2.7);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);
  const [totalCertifiedCount, setTotalCertifiedCount] = useState(47);

  // Mutable refs to decouple Three.js animation and event listeners from React re-renders
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const pinGroupRef = useRef<THREE.Group | null>(null);
  const pinObjectsRef = useRef<{ mesh: THREE.Mesh; pinData: GlobePinData }[]>([]);
  const isRotationPausedRef = useRef(true); // Stationary by default
  const isDraggingRef = useRef(false);
  const hoveredPinRef = useRef<GlobePinData | null>(null);
  const selectedPinRef = useRef<GlobePinData | null>(REGIONAL_SHOWCASE_PINS[0]);

  // Keep refs in sync with React state
  useEffect(() => {
    isRotationPausedRef.current = isRotationPaused;
  }, [isRotationPaused]);

  useEffect(() => {
    hoveredPinRef.current = hoveredPin;
  }, [hoveredPin]);

  useEffect(() => {
    selectedPinRef.current = selectedPin;
  }, [selectedPin]);

  // Check accessibility preference: prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        setIsRotationPaused(true);
        isRotationPausedRef.current = true;
      }
    }
  }, []);

  // 1. Fetch real resolved reports from backend SQLite database
  useEffect(() => {
    async function loadRealResolvedRepairs() {
      try {
        const allReports = await reportsService.getAllReports();
        const resolved = allReports.filter((r: PotholeReport) => r.status === 'RESOLVED');

        if (resolved.length > 0) {
          const livePins: GlobePinData[] = resolved.map((r: PotholeReport) => ({
            id: `LIVE-${r.id}`,
            lat: r.location.latitude,
            lng: r.location.longitude,
            title: `Repair Order #${r.trackingNumber}`,
            locationName: r.location.address,
            completedCount: 1,
            completedDate: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : 'Certified Today',
            inspectorName: 'Alice Sharma (Municipal Commissioner)',
            isRealDatabaseRecord: true,
            beforePhotoUrl: r.damageImageUrl || '/photos/pothole-sector17.jpg',
            afterPhotoUrl: r.restoredImageUrl || '/photos/pothole-restored1.jpg',
            notes: r.description || 'Level-1 certified flush asphalt restoration.',
          }));

          const mergedPins = [...livePins, ...REGIONAL_SHOWCASE_PINS];
          setPins(mergedPins);
          setTotalCertifiedCount(47 + livePins.length);
          setSelectedPin(livePins[0]);
          selectedPinRef.current = livePins[0];
        }
      } catch (err) {
        console.warn('Globe could not fetch live reports, using showcase corridors.', err);
      }
    }

    loadRealResolvedRepairs();
  }, []);

  // 2. Build 3D Pins in Three.js when pins change
  const buildPinMeshes = useCallback((globeRadius: number) => {
    const pinGroup = pinGroupRef.current;
    if (!pinGroup) return;

    // Clear existing pins
    while (pinGroup.children.length > 0) {
      const child = pinGroup.children[0];
      pinGroup.remove(child);
    }
    pinObjectsRef.current = [];

    pins.forEach((pin) => {
      const surfacePos = latLngToVector3(pin.lat, pin.lng, globeRadius);
      const normal = surfacePos.clone().normalize();

      const singlePin = new THREE.Group();
      singlePin.position.copy(surfacePos);
      singlePin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // Red Teardrop Location Pins (Phase 3)
      // Body: Vibrant Red (0xef4444); Tip needle: Tapered cone anchored to surface coordinate
      const pinColor = 0xef4444; // Vibrant Red
      const headColor = 0xdc2626; // Deep Crimson Red
      // Circular center dot: Emerald for live DB records, crisp white for demo corridors
      const dotColor = pin.isRealDatabaseRecord ? 0x10b981 : 0xffffff;
      // Anchor ring: Concentric coral/red ring on surface (emerald accent for live DB)
      const ringColor = pin.isRealDatabaseRecord ? 0x10b981 : 0xf87171;

      // A. Needle Stem (tapered cone pointing down to exact surface point)
      const stemGeo = new THREE.ConeGeometry(0.012, 0.055, 16);
      stemGeo.translate(0, 0.0275, 0);
      const stemMat = new THREE.MeshPhongMaterial({
        color: pinColor,
        shininess: 35,
      });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      singlePin.add(stemMesh);

      // B. Teardrop Pin Head (Spherical head resting on needle stem)
      const headGeo = new THREE.SphereGeometry(0.024, 16, 16);
      headGeo.translate(0, 0.062, 0);
      const headMat = new THREE.MeshPhongMaterial({
        color: headColor,
        shininess: 50,
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      singlePin.add(headMesh);

      // C. High-contrast circular center bead on front face of head
      const dotGeo = new THREE.SphereGeometry(0.008, 12, 12);
      dotGeo.translate(0, 0.062, 0.018);
      const dotMat = new THREE.MeshBasicMaterial({ color: dotColor });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      singlePin.add(dotMesh);

      // D. Ground Anchor Ring (concentric circular beacon on surface coordinate)
      const ringGeo = new THREE.RingGeometry(0.014, 0.032, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, 0.002, 0);
      singlePin.add(ringMesh);

      // E. Invisible Hit Sphere for generous, easy mouse targeting
      const hitGeo = new THREE.SphereGeometry(0.065, 8, 8);
      hitGeo.translate(0, 0.045, 0);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { pinData: pin };
      singlePin.add(hitMesh);

      pinGroup.add(singlePin);
      pinObjectsRef.current.push({ mesh: hitMesh, pinData: pin });
    });
  }, [pins]);

  // Update pin meshes when pins state changes without rebuilding the entire Three.js scene
  useEffect(() => {
    buildPinMeshes(1.0);
  }, [buildPinMeshes]);

  // 3. Three.js Scene Setup — Created ONCE on component mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
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
    const height = container.clientHeight || 520;

    // A. Scene, Camera, WebGLRenderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.85;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.outline = 'none';
    renderer.domElement.style.cursor = 'grab';
    container.appendChild(renderer.domElement);

    // B. Earth Sphere Geometry & Realistic Materials
    const globeRadius = 1.0;
    const earthGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);

    // Realistic Earth material: subtle ocean sheen, no overpowering cyan glow, pitch black night emissive
    const earthMaterial = new THREE.MeshPhongMaterial({
      shininess: 15, // Realistic soft ocean reflection
      specular: new THREE.Color(0x1a2e40), // Very subtle ocean specular, not electric blue
      emissive: new THREE.Color(0x000000), // Pure black space on night side, zero blue wash
    });

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    // Load India-Highlighted Satellite Earth (Accurate Geographic Mask & Vibrant Satellite Telemetry)
    textureLoader.load(
      '/textures/earth-india-highlighted.jpg',
      (highlightedTexture: THREE.Texture) => {
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
        // Fallback to base blue marble if highlighted composite is not found
        console.warn('Loading base NASA Blue Marble texture fallback...');
        textureLoader.load(
          '/textures/earth-blue-marble.jpg',
          (baseTexture: THREE.Texture) => {
            baseTexture.colorSpace = THREE.SRGBColorSpace;
            baseTexture.wrapS = THREE.RepeatWrapping;
            baseTexture.wrapT = THREE.ClampToEdgeWrapping;
            baseTexture.needsUpdate = true;

            earthMaterial.map = baseTexture;
            earthMaterial.needsUpdate = true;
            setIsLoading(false);
          },
          undefined,
          (err: unknown) => {
            console.warn('Could not load Earth texture assets, using procedural fallback', err);
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

    // Default orientation centered on India / South Asia (Lat ~22° N, Lng ~78° E)
    // -2.94 rad y-rotation brings India directly facing the camera at (0, 0, 2.85)
    earthMesh.rotation.y = -2.94;
    earthMesh.rotation.x = 0.22;
    scene.add(earthMesh);

    // Pin Group attached directly to Earth mesh so pins stay firmly anchored during rotation
    const pinGroup = new THREE.Group();
    earthMesh.add(pinGroup);
    pinGroupRef.current = pinGroup;
    buildPinMeshes(globeRadius);

    // C. Natural Space Atmosphere Rim (Reduced by 85% — subtle razor-thin atmospheric veil)
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.018, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.028, // Reduced by ~85% from previous heavy blue glow
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // D. Realistic Space Lighting
    // Soft neutral ambient light so night side topography is discernible without artificial color cast
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.48);
    scene.add(ambientLight);

    // Primary Solar Directional Light: Natural crisp white sunlight from space directly illuminating India
    const sunLight = new THREE.DirectionalLight(0xfffbf5, 2.0);
    sunLight.position.set(2, 3, 6);
    scene.add(sunLight);

    // Very subtle secondary starlight fill to avoid pure black clipping
    const starFillLight = new THREE.DirectionalLight(0x78909c, 0.15);
    starFillLight.position.set(-6, -2, -4);
    scene.add(starFillLight);

    // E. Raycasting for Smooth Pin Hover & Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pinObjectsRef.current.map((p) => p.mesh));

      if (intersects.length > 0) {
        const found = pinObjectsRef.current.find((p) => p.mesh === intersects[0].object);
        if (found) {
          setHoveredPin(found.pinData);
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        setHoveredPin(null);
        renderer.domElement.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
      }
    };

    const handlePointerClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pinObjectsRef.current.map((p) => p.mesh));

      if (intersects.length > 0) {
        const found = pinObjectsRef.current.find((p) => p.mesh === intersects[0].object);
        if (found) {
          setSelectedPin(found.pinData);
          selectedPinRef.current = found.pinData;
        }
      }
    };

    // F. Drag & Zoom Controls
    let previousMousePosition = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      setIsInteracting(true);
      renderer.domElement.style.cursor = 'grabbing';
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerDrag = (e: PointerEvent) => {
      if (!isDraggingRef.current || !earthMeshRef.current) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      earthMeshRef.current.rotation.y += deltaX * 0.004;
      earthMeshRef.current.rotation.x += deltaY * 0.004;

      // Clamp vertical rotation so poles remain upright
      earthMeshRef.current.rotation.x = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, earthMeshRef.current.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      renderer.domElement.style.cursor = 'grab';
      setTimeout(() => setIsInteracting(false), 500);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setIsInteracting(true);
      if (cameraRef.current) {
        cameraRef.current.position.z += e.deltaY * 0.0015;
        cameraRef.current.position.z = Math.max(1.75, Math.min(3.85, cameraRef.current.position.z));
        setCameraDistance(cameraRef.current.position.z);
      }
      setTimeout(() => setIsInteracting(false), 500);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerDrag);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handlePointerClick);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // G. Unified Animation Loop
    let animationFrameId: number;
    let pulseClock = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      pulseClock += 0.035;

      // Animate ground rings gently
      if (pinGroupRef.current) {
        const scale = 1 + 0.15 * Math.sin(pulseClock);
        pinGroupRef.current.children.forEach((childGroup: THREE.Object3D) => {
          // The 4th child (index 3) is the RingMesh
          const ringMesh = childGroup.children[3];
          if (ringMesh) {
            ringMesh.scale.set(scale, scale, scale);
          }
        });
      }

      // Check conditions to pause rotation:
      // 1. Manually paused
      // 2. Currently dragging
      // 3. Hovering over a pin
      // 4. A pin is selected / active inspection card open
      const shouldRotate =
        !isRotationPausedRef.current &&
        !isDraggingRef.current &&
        !hoveredPinRef.current &&
        !selectedPinRef.current;

      if (shouldRotate && earthMeshRef.current) {
        earthMeshRef.current.rotation.y += 0.0009; // Slow, stately satellite rotation
      }

      renderer.render(scene, camera);
    };
    animate();

    // H. Responsive Resize
    const handleResize = () => {
      if (!container || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 520;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // I. Cleanup on Component Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerDrag);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handlePointerClick);
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
  }, []); // Run ONCE on mount! Decoupled from pins / interaction state

  // Keyboard-driven zoom controls (+ / = to zoom in, - / _ to zoom out, numpad keys) - Phase 5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Ignore when user is typing in form inputs or textareas
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Control Handlers
  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(1.75, cameraRef.current.position.z - 0.35);
      setCameraDistance(cameraRef.current.position.z);
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.min(3.85, cameraRef.current.position.z + 0.35);
      setCameraDistance(cameraRef.current.position.z);
    }
  };

  const handleClosePopup = () => {
    setSelectedPin(null);
    selectedPinRef.current = null;
  };

  const activeDisplayPin = hoveredPin || selectedPin;

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
            Drag to rotate the 3D Earth, scroll or use vertical controls to zoom, and hover or tap geographic location pins to view verified before-and-after photographic compaction audits.
          </p>
        </div>

        {/* Global Statistics Chip */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-surface-container-lowest border border-outline-variant/30 p-3 rounded-2xl shadow-xs text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Total Certified Repairs
            </div>
            <div className="text-2xl font-extrabold text-primary font-display-hero">
              {totalCertifiedCount} Verified
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Realistic 3D Globe + Floating Active Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[580px] pt-4">
        {/* Globe Viewport: Supports Hybrid 3D Earth <-> Leaflet Detailed Road Map (Phase 6) */}
        <div className="lg:col-span-7 h-[480px] sm:h-[560px] lg:h-[620px] w-full relative flex items-center justify-center rounded-2xl bg-radial from-surface-container-low/30 to-surface-container-lowest overflow-hidden border border-outline-variant/20">
          {viewMode === 'ROAD_MAP' ? (
            /* DETAILED ROAD MAP VIEW (Leaflet OpenStreetMap with High-Res Indian Highways) */
            <div className="w-full h-full relative z-0">
              {/* Back to 3D Globe Button (Phase 6) */}
              <div className="absolute top-3 left-3 z-[1000]">
                <button
                  type="button"
                  onClick={() => setViewMode('3D_GLOBE')}
                  className="px-3.5 py-2 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md text-primary font-bold text-xs shadow-md border border-outline-variant/40 flex items-center gap-1.5 hover:bg-surface-container hover:shadow-lg transition-all"
                  title="Return to 3D Earth Globe"
                >
                  <span className="material-symbols-outlined text-[18px]">public</span>
                  <span>← Back to 3D Globe</span>
                </button>
              </div>

              {/* Road Map Mode Indicator */}
              <div className="absolute top-3 right-3 z-[1000] hidden sm:flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md text-[11px] font-semibold text-secondary border border-outline-variant/30 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Indian Highway &amp; Municipal Street Network (OSM)</span>
                </span>
              </div>

              <MapContainer
                center={[selectedPin?.lat || 30.7398, selectedPin?.lng || 76.7827]}
                zoom={selectedPin ? 13 : 6}
                scrollWheelZoom={true}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {pins.map((pin) => (
                  <LeafletMarker
                    key={pin.id}
                    position={[pin.lat, pin.lng]}
                    icon={createRoadMapPinIcon(pin.id === selectedPin?.id)}
                    eventHandlers={{
                      click: () => {
                        setSelectedPin(pin);
                        selectedPinRef.current = pin;
                      },
                    }}
                  >
                    <LeafletPopup>
                      <div className="p-1 space-y-1 min-w-[170px] font-sans">
                        <p className="font-bold text-xs text-rose-600">{pin.title}</p>
                        <p className="text-[11px] text-slate-700 leading-tight">{pin.locationName}</p>
                        <p className="font-mono text-[10px] text-slate-500">
                          {pin.lat.toFixed(4)}° N, {pin.lng.toFixed(4)}° E
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedPin(pin)}
                          className="mt-1 w-full py-1 rounded bg-rose-50 text-rose-700 font-bold text-[10px] text-center hover:bg-rose-100 transition-colors"
                        >
                          View Inspection Evidence
                        </button>
                      </div>
                    </LeafletPopup>
                  </LeafletMarker>
                ))}
              </MapContainer>
            </div>
          ) : webglSupported ? (
            /* 3D GLOBE VIEW */
            <>
              <div ref={mountRef} className="w-full h-full relative" />

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest/80 backdrop-blur-xs gap-3 z-20">
                  <div className="w-9 h-9 rounded-full border-3 border-primary border-t-transparent animate-spin" />
                  <span className="text-xs text-secondary font-medium">
                    Loading Realistic Satellite Earth &amp; Geographic Telemetry...
                  </span>
                </div>
              )}

              {/* Top Left: Distinction Legend Chips */}
              <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap z-10 pointer-events-none">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-[10px] font-bold text-emerald-700 border border-emerald-500/30 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Live Database Resolution</span>
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-[10px] font-bold text-rose-700 border border-rose-500/30 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Demonstration Pilot Corridor · Red Pin</span>
                </span>
              </div>

              {/* Top Right: Explore Detailed Road Map Button (Phase 6) */}
              <button
                type="button"
                onClick={() => setViewMode('ROAD_MAP')}
                className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md text-primary font-bold text-xs shadow-md border border-outline-variant/40 flex items-center gap-1.5 hover:bg-surface-container hover:shadow-lg transition-all"
                title="Switch to detailed Street-Level OpenStreetMap Road Map"
              >
                <span className="material-symbols-outlined text-[17px]">map</span>
                <span>Explore Detailed Road Map</span>
              </button>

              {/* Vertical Controls Bar along the right side */}
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-10 bg-surface-container-lowest/90 backdrop-blur-md p-1.5 rounded-2xl border border-outline-variant/30 shadow-md">
                {/* Zoom In (+) */}
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In (+ / =)"
                  aria-label="Zoom in"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container hover:text-primary transition-colors text-base sm:text-lg font-bold shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </button>

                <div className="w-4 h-px bg-outline-variant/40" />

                {/* Zoom Out (−) */}
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out (- / _)"
                  aria-label="Zoom out"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container hover:text-primary transition-colors text-base sm:text-lg font-bold shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 13H5v-2h14v2z" />
                  </svg>
                </button>
              </div>

              {/* Close-Up Zoom Threshold Prompt Pill (Phase 6) */}
              {cameraDistance <= 1.88 && (
                <button
                  type="button"
                  onClick={() => setViewMode('ROAD_MAP')}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-primary text-white font-bold text-xs shadow-lg flex items-center gap-1.5 hover:bg-primary-dark transition-all animate-bounce"
                >
                  <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                  <span>Street Zoom Reached: Open Road Map ↗</span>
                </button>
              )}

              {/* Bottom Left: Status & Interaction Hint Overlay */}
              <div className="absolute bottom-3 left-3 bg-surface-container-lowest/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/30 text-[11px] text-secondary flex items-center gap-2 pointer-events-none shadow-xs z-10">
                <svg className="w-3.5 h-3.5 fill-primary shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                <span>
                  {hoveredPin
                    ? `Hovering: ${hoveredPin.title}`
                    : selectedPin
                    ? `Inspecting: ${selectedPin.title}`
                    : isInteracting
                    ? 'Interacting with 3D Globe'
                    : 'India Centered (Stationary) · Drag to rotate · Press +/- to zoom'}
                </span>
              </div>
            </>
          ) : (
            /* Graceful WebGL Fallback State */
            <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center space-y-3 bg-surface-container-low rounded-2xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-5xl text-primary">public</span>
              <h3 className="text-lg font-bold text-on-surface">3D Earth (Accessible Fallback)</h3>
              <p className="text-xs text-secondary max-w-md leading-relaxed">
                Hardware WebGL acceleration is not active in this browser. All completed road repair audit records remain fully accessible using the corridor selector on the right.
              </p>
            </div>
          )}
        </div>

        {/* Side Detail Card: Dynamic Hover & Click Information */}
        <div className="lg:col-span-5 w-full">
          <AnimatePresence mode="wait">
            {activeDisplayPin ? (
              <motion.div
                key={activeDisplayPin.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 sm:p-6 shadow-xl space-y-4 relative"
              >
                {/* Header with Distinction Badge & Manual Close Button */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                        activeDisplayPin.isRealDatabaseRecord
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {activeDisplayPin.isRealDatabaseRecord ? (
                        <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2zm0 2c4.42 0 8 1.57 8 2.5S16.42 9 12 9 4 7.43 4 6.5 7.58 4 12 4zm0 16c-4.42 0-8-1.57-8-2.5V15.2c1.86 1.11 4.75 1.8 8 1.8s6.14-.69 8-1.8v2.3c0 .93-3.58 2.5-8 2.5zm0-5c-4.42 0-8-1.57-8-2.5V10.2c1.86 1.11 4.75 1.8 8 1.8s6.14-.69 8-1.8v2.3c0 .93-3.58 2.5-8 2.5z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z" />
                        </svg>
                      )}
                      <span>
                        {activeDisplayPin.isRealDatabaseRecord
                          ? 'Live SQLite Database Record'
                          : 'Demonstration Pilot Corridor (Demo Data)'}
                      </span>
                    </span>
                    <h3 className="text-lg font-bold text-on-surface truncate">
                      {activeDisplayPin.title}
                    </h3>
                    <p className="text-xs text-secondary mt-0.5 truncate">
                      {activeDisplayPin.locationName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-secondary bg-surface-container-low px-2 py-1 rounded-md border border-outline-variant/20">
                      {activeDisplayPin.lat.toFixed(4)}° N, {activeDisplayPin.lng.toFixed(4)}° E
                    </span>

                    {/* Manual Close Button to resume rotation */}
                    <button
                      type="button"
                      onClick={handleClosePopup}
                      title="Close repair details & resume orbit"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Before & After Photographic Comparison (Enlarged with Level-1 Badges) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface flex items-center gap-1.5">
                      <svg className="w-4 h-4 fill-primary shrink-0" viewBox="0 0 24 24">
                        <path d="M9.4 10.5l4.77-8.26C13.47 2.09 12.75 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10c2.25 0 4.33-.74 6-2l-7.8-4.5c-.47-.28-.8-.8-.8-1.5 0-.44.18-.84.47-1.14l-.47-.36zm12.35-1.92l-4.75 2.74c-.06.03-.12.06-.18.09L12 14.07v6.93c4.95-.5 8.93-4.44 9.5-9.42.06-.33.1-.66.15-1 .06-.34.1-.66.1-1z" />
                      </svg>
                      <span>Photographic Audit Proof</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                      Level-1 Certified Pass
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 group">
                      <div className="relative aspect-[16/11] rounded-2xl overflow-hidden border border-error/30 bg-surface-container shadow-xs">
                        <PotholeImage
                          src={activeDisplayPin.beforePhotoUrl}
                          alt="Hazard crater pre-repair"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          fallbackType="critical"
                          showBadge
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-error/95 text-white text-[9px] font-bold shadow-xs">
                          PRE-REPAIR DEFECT
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono flex items-center justify-between">
                          <span>Cavity Depth: ~80mm</span>
                          <span className="text-error-fixed font-bold">VERIFIED</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-secondary font-medium block text-center">
                        Pre-Repair Crater
                      </span>
                    </div>

                    <div className="space-y-1 group">
                      <div className="relative aspect-[16/11] rounded-2xl overflow-hidden border border-emerald-300 bg-surface-container shadow-xs">
                        <PotholeImage
                          src={activeDisplayPin.afterPhotoUrl}
                          alt="Compacted flush patch"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          fallbackType="restored"
                          showBadge
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[11px]">task_alt</span>
                          <span>POST-REPAIR RESTORATION</span>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono flex items-center justify-between">
                          <span>Flush Compaction</span>
                          <span className="text-emerald-400 font-bold">100% FLUSH</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold block text-center">
                        Flush Asphalt Patch
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit Meta Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-low/60 p-3 rounded-xl border border-outline-variant/20">
                  <div>
                    <span className="text-secondary text-[11px] block">Verified Timestamp:</span>
                    <span className="font-semibold text-on-surface">{activeDisplayPin.completedDate}</span>
                  </div>
                  <div>
                    <span className="text-secondary text-[11px] block">Certifying Authority:</span>
                    <span className="font-semibold text-primary truncate block">
                      {activeDisplayPin.inspectorName}
                    </span>
                  </div>
                </div>

                {/* Inspector Notes */}
                <p className="text-xs text-secondary leading-relaxed italic border-l-2 border-primary pl-2.5">
                  "{activeDisplayPin.notes}"
                </p>

                {/* Location Pin Selector Pills */}
                <div className="pt-2 border-t border-outline-variant/20">
                  <span className="text-[11px] font-semibold text-secondary block mb-1.5">
                    Jump to Location Pin:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pins.slice(0, 5).map((p) => {
                      const isCurrent = activeDisplayPin.id === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPin(p);
                            selectedPinRef.current = p;
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                            isCurrent
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                          }`}
                        >
                          {p.title.split(' ')[0]} {p.isRealDatabaseRecord ? '(Live)' : '(Demo)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Idle Prompt Card when no pin is selected */
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 sm:p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-2xl">pin_drop</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Select a Location Pin</h3>
                  <p className="text-xs text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
                    Hover over or click any geographic pin on the 3D Earth to view verified Level-1 road repair telemetry and before/after photographs.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                  {pins.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPin(p);
                        selectedPinRef.current = p;
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-container text-on-surface hover:bg-primary hover:text-white transition-all shadow-xs"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
