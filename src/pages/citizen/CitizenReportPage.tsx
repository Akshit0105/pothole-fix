import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportsService } from '../../services/reportsService';
import { detectPothole, STATIC_TEST_SAMPLE } from '../../services/aiDetectionService';
import type { AIDetectionResult, GeoLocation } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SeverityBadge } from '../../components/common/StatusBadge';
import { LocationPickerMap } from '../../components/map/LocationPickerMap';
import { PotholeDetectionOverlay } from '../../components/common/PotholeDetectionOverlay';

const INDIAN_PRESETS = [
  { name: 'Sector 17 Plaza, Chandigarh', lat: 30.7398, lng: 76.7827 },
  { name: 'Madhya Marg, Sector 26, CHD', lat: 30.7290, lng: 76.8040 },
  { name: 'Sector 22 Market, Chandigarh', lat: 30.7258, lng: 76.7720 },
  { name: 'Phase 7 Industrial, Mohali', lat: 30.7046, lng: 76.7179 },
  { name: 'AIIMS Ring Road, New Delhi', lat: 28.5672, lng: 77.2100 },
];

export const CitizenReportPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Multi-step progress (1: Image, 2: Location, 3: AI Analysis, 4: Review & Submit)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);

  // Location State (Phase 10: Precision GPS + Indian Localization)
  const [coordinates, setCoordinates] = useState<[number, number]>([30.7398, 76.7827]); // Default Chandigarh
  const [address, setAddress] = useState<string>('Sector 17 Plaza Corridor, Chandigarh');
  const [landmark, setLandmark] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiDetection, setAiDetection] = useState<AIDetectionResult | null>(null);
  const [aiAttempted, setAiAttempted] = useState<boolean>(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Step 1: File Upload Handler
  const handleFile = (file: File) => {
    setImageError(null);
    setAiDetection(null);
    setAiAttempted(false);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Invalid format. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate size (10 MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageError('File exceeds maximum 10 MB limit.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Helper for evaluation / demo sample image selection
  const handleSelectSample = async (sampleUrl: string) => {
    setImageError(null);
    setAiDetection(null);
    setAiAttempted(false);
    setImageFile(null);
    setImagePreview('');

    try {
      const response = await fetch(sampleUrl);
      if (!response.ok) throw new Error('Unable to load sample image');
      const blob = await response.blob();
      const filename = sampleUrl.split('/').pop() || 'sample.jpg';
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      setImageFile(file);
      setImagePreview(sampleUrl);
    } catch (error) {
      console.error('Sample image loading failed:', error);
      setImageError('Could not load sample image.');
    }
  };

  // Step 2: Request High-Accuracy GPS Location (Phase 10)
  const requestGps = () => {
    setIsGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please select or drag pin on map.');
      setIsGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoordinates([latitude, longitude]);
        setGpsAccuracy(Math.round(accuracy));
        setIsGpsLoading(false);

        // Attempt reverse geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || 'Corridor';
            const city = data.address?.city || data.address?.state_district || 'Chandigarh';
            setAddress(`${road}, ${city}`);
            return;
          }
        } catch {
          // fallback to coordinates label
        }
        setAddress(`GPS Location: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`);
      },
      (err) => {
        setIsGpsLoading(false);
        setGpsError(`Unable to retrieve GPS: ${err.message}. You can manually drag the pin or click any preset below.`);
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Step 3: Trigger AI Analysis
  const runAiAnalysis = async () => {
    if (!imageFile && !imagePreview) return;
    setIsAnalyzing(true);
    setAiAttempted(true);

    try {
      if (imageFile) {
        const result = await detectPothole(imageFile);
        setAiDetection(result);
      } else {
        throw new Error('No image file available for live inference');
      }
    } catch {
      setAiDetection({
        isModelConnected: false,
        detected: false,
        confidence: 0,
        severityScore: 'LOW',
        boundingBoxes: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 4: Submit Final Report
  const handleSubmit = async () => {
    if (!imagePreview) return;
    setIsSubmitting(true);
    setSubmissionError(null);

    const locationData: GeoLocation = {
      latitude: coordinates[0],
      longitude: coordinates[1],
      address: landmark ? `${address} (${landmark})` : address,
    };

    try {
      const created = await reportsService.createReport({
        reporterId: user?.id || 'user-citizen-01',
        reporterName: user?.name || 'Akshit Sharma',
        reporterEmail: user?.email || 'akshit.sharma@community.in',
        location: locationData,
        description: description || 'Road asphalt pothole hazard reported by citizen.',
        damageImageUrl: imagePreview,
        imageFile: imageFile || undefined,
        aiDetection: aiDetection || undefined,
      });

      setSubmissionSuccess(created.trackingNumber);
      setTimeout(() => {
        navigate(`/citizen/reports/${created.trackingNumber}`);
      }, 1200);
    } catch (err) {
      console.error('Submission failed', err);
      setSubmissionError(
        err instanceof Error
          ? err.message
          : 'Submission failed. Please check network connectivity or backend status.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl lg:max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Citizen Dashboard</span>
        </Link>
        <span className="font-code-sm text-label-sm text-secondary">
          Step {currentStep} of 4
        </span>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { step: 1, title: 'Upload Photo' },
          { step: 2, title: 'Pin Location' },
          { step: 3, title: 'AI Analysis' },
          { step: 4, title: 'Review & Submit' },
        ].map((s) => (
          <div
            key={s.step}
            className={`p-2 rounded-lg text-center transition-all ${
              currentStep === s.step
                ? 'bg-primary-container text-on-primary font-semibold shadow-xs'
                : currentStep > s.step
                ? 'bg-surface-container-low text-primary border border-primary/20'
                : 'bg-surface-container-low text-secondary/60'
            }`}
          >
            <span className="font-display-hero text-code-sm block">0{s.step}</span>
            <span className="font-title-md text-[11px] block truncate">{s.title}</span>
          </div>
        ))}
      </div>

      {/* Main Step Container */}
      <Card padding="lg">
        {/* STEP 1: UPLOAD IMAGE */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display-hero text-headline-sm font-bold text-on-surface">
                Upload Road Hazard Photograph
              </h2>
              <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                Clear street-level photographs enable rapid municipal triage and AI detection.
              </p>
            </div>

            {imageError && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{imageError}</span>
              </div>
            )}

            {!imagePreview ? (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('pothole-file-input')?.click()}
                  className="border-2 border-dashed border-outline-variant/60 hover:border-primary-container rounded-xl p-8 sm:p-12 text-center bg-surface-container-low/40 hover:bg-surface-container-low transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-full bg-surface-container-low group-hover:bg-primary-fixed/40 flex items-center justify-center mx-auto text-primary mb-3 transition-colors">
                    <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
                  </div>
                  <p className="font-display-hero text-title-md font-bold text-on-surface mb-1">
                    Click to select or drag and drop image
                  </p>
                  <p className="font-body-sm text-body-sm text-secondary">
                    JPEG, PNG, or WebP up to 10 MB. High-contrast daylight angle recommended.
                  </p>
                  <input
                    id="pothole-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>

                {/* Quick Sample Selector for Evaluators */}
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
                  <span className="text-xs font-semibold text-secondary block mb-2">
                    Or select a local sample photo for evaluation:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectSample('/photos/pothole-sector17.jpg')}
                      className="p-1.5 rounded bg-surface hover:bg-surface-container text-left border border-outline-variant/30 text-xs"
                    >
                      <img src="/photos/pothole-sector17.jpg" alt="Sector 17 Sample" className="h-12 w-full object-cover rounded mb-1" />
                      <span className="font-medium truncate block">Sector 17 Crater</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSample('/photos/pothole-madhyamarg.jpg')}
                      className="p-1.5 rounded bg-surface hover:bg-surface-container text-left border border-outline-variant/30 text-xs"
                    >
                      <img src="/photos/pothole-madhyamarg.jpg" alt="Madhya Marg Sample" className="h-12 w-full object-cover rounded mb-1" />
                      <span className="font-medium truncate block">Madhya Marg Defect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSample('/photos/pothole-kharar.jpg')}
                      className="p-1.5 rounded bg-surface hover:bg-surface-container text-left border border-outline-variant/30 text-xs"
                    >
                      <img src="/photos/pothole-kharar.jpg" alt="Kharar Highway Sample" className="h-12 w-full object-cover rounded mb-1" />
                      <span className="font-medium truncate block">Kharar Highway</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-surface-container aspect-video max-h-80 mx-auto border border-outline-variant/30">
                  <img
                    src={imagePreview}
                    alt="Uploaded road hazard preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                        setAiDetection(null);
                        setAiAttempted(false);
                      }}
                      className="px-2.5 py-1 rounded-md bg-on-surface/75 hover:bg-on-surface text-white text-xs font-semibold backdrop-blur-sm transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      <span>Change Image</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between text-body-sm">
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-[18px] text-primary">image</span>
                    <span className="font-title-md text-on-surface truncate">
                      {imageFile?.name || 'Road Hazard Photograph'}
                    </span>
                    <span className="text-secondary text-[12px]">
                      ({imageFile ? `${(imageFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Sample Asset'})
                    </span>
                  </div>
                  <span className="text-emerald-700 font-label-sm font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Ready
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-surface-container-high flex justify-end">
              <Button
                size="md"
                disabled={!imagePreview}
                onClick={() => setCurrentStep(2)}
                iconRight={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              >
                Proceed to Location
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT LOCATION (Phase 10 / UI Master Upgrade 2-Column Desktop Layout) */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container-high">
              <div>
                <h2 className="font-display-hero text-headline-sm font-bold text-on-surface">
                  Pin Road Hazard Location
                </h2>
                <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                  Position the pin at the exact street coordinates using high-accuracy GPS or interactive map dragging.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={isGpsLoading}
                  onClick={requestGps}
                  icon={<span className="material-symbols-outlined text-[18px]">my_location</span>}
                >
                  Detect My Current Location
                </Button>
              </div>
            </div>

            {gpsAccuracy && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
                <span className="material-symbols-outlined text-[16px]">gps_fixed</span>
                <span>High-precision GPS active (±{gpsAccuracy}m estimated accuracy). Pin auto-positioned.</span>
              </div>
            )}

            {gpsError && (
              <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-body-sm flex items-center gap-2 border border-amber-200">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>{gpsError}</span>
              </div>
            )}

            {/* 2-Column Layout on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Prominent Leaflet Map Preview */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex items-center justify-between text-xs text-secondary font-medium">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">pin_drop</span>
                    <span>Interactive OpenStreetMap Preview</span>
                  </span>
                  <span className="font-mono text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {coordinates[0].toFixed(5)}° N, {coordinates[1].toFixed(5)}° E
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden border border-outline-variant/30 shadow-xs">
                  <LocationPickerMap
                    position={coordinates}
                    onPositionChange={(lat, lng) => {
                      setCoordinates([lat, lng]);
                      setAddress(`Lat: ${lat.toFixed(5)}° N, Lng: ${lng.toFixed(5)}° E`);
                    }}
                  />
                </div>
                <p className="text-[11px] text-secondary">
                  Click anywhere on the map or drag the pin directly over the asphalt pothole location.
                </p>
              </div>

              {/* Right Column: GPS presets, address fields & action buttons */}
              <div className="lg:col-span-5 space-y-4 bg-surface-container-low/40 p-4 sm:p-5 rounded-2xl border border-outline-variant/30">
                {/* Indian Corridor Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider block">
                    Quick Corridor Presets:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {INDIAN_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setCoordinates([p.lat, p.lng]);
                          setAddress(p.name);
                        }}
                        className="px-2.5 py-1 rounded-md text-xs bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors font-medium"
                      >
                        {p.name.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Street Address Input */}
                <div>
                  <label className="block font-title-md text-label-md text-on-surface mb-1">
                    Street Address or Cross-Street
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Sector 17 Plaza Corridor, Chandigarh"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm"
                  />
                </div>

                {/* Optional Landmark */}
                <div>
                  <label className="block font-title-md text-label-md text-on-surface mb-1">
                    Optional Landmark / Reference
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Sector 17 fountain, westbound corridor"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm"
                  />
                </div>

                {/* Hazard Description */}
                <div>
                  <label className="block font-title-md text-label-md text-on-surface mb-1">
                    Road Hazard Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe road condition, depth severity, loose gravel, or vehicle swerving hazards..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-surface-container-high flex items-center justify-between gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    Back to Image
                  </Button>
                  <Button
                    size="md"
                    onClick={() => setCurrentStep(3)}
                    iconRight={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                  >
                    Proceed to AI Analysis
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AI ANALYSIS */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display-hero text-headline-sm font-bold text-on-surface">
                AI Pothole Detection &amp; Severity Classification
              </h2>
              <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                Send photograph to our YOLO model API endpoint for classification.
              </p>
            </div>

            {/* Image Preview with Detection Overlay */}
            <div className="max-w-xl mx-auto">
              <PotholeDetectionOverlay
                imageUrl={imagePreview}
                aiDetection={aiDetection || undefined}
                className="aspect-video max-h-72"
              />
            </div>

            {/* Analysis Action / Status Card */}
            {!aiAttempted ? (
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center space-y-3">
                <span className="material-symbols-outlined text-[32px] text-primary block">
                  model_training
                </span>
                <p className="font-title-md text-on-surface font-semibold">
                  Ready to query YOLO detection endpoint (`POST /ai/detect`)
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    size="md"
                    isLoading={isAnalyzing}
                    onClick={runAiAnalysis}
                    icon={<span className="material-symbols-outlined text-[18px]">smart_toy</span>}
                  >
                    Trigger AI Analysis
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setAiDetection(STATIC_TEST_SAMPLE);
                      setAiAttempted(true);
                    }}
                  >
                    Load Static Test Sample
                  </Button>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center space-y-2">
                <span className="material-symbols-outlined text-[28px] text-primary animate-spin">
                  progress_activity
                </span>
                <p className="font-title-md text-on-surface">
                  Analyzing road surface photograph...
                </p>
                <p className="font-body-sm text-secondary text-[12px]">
                  Dispatching multipart form data to FastAPI YOLO service
                </p>
              </div>
            ) : aiDetection?.isModelConnected && aiDetection.detected ? (
              /* Verified Detection Card */
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                      verified
                    </span>
                    <span className="font-title-md text-emerald-900 font-semibold">
                      Pothole Hazard Identified
                    </span>
                  </div>
                  <SeverityBadge severity={aiDetection.severityScore} size="sm" />
                </div>
                <p className="font-body-sm text-emerald-800 text-[13px]">
                  Model Confidence: {(aiDetection.confidence * 100).toFixed(0)}% · Categorical Risk:{' '}
                  {aiDetection.severityScore}
                </p>
              </div>
            ) : aiDetection?.isModelConnected && !aiDetection.detected ? (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-700">check_circle</span>
                  <span className="font-title-md text-blue-900 font-semibold">
                    AI Model Connected Successfully
                  </span>
                </div>
                <p className="font-body-sm text-blue-800 text-[13px]">
                  YOLO analyzed the image successfully. No potholes were detected in this photograph.
                </p>
              </div>
            ) : (
              /* Graceful Model Not Connected Card */
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined text-[20px] text-amber-600">
                    cloud_off
                  </span>
                  <span className="font-title-md text-on-surface font-semibold">
                    AI Model Not Connected
                  </span>
                </div>
                <p className="font-body-sm text-secondary text-[13px]">
                  The backend YOLO service is not currently responding. Your report can still be
                  submitted for manual triage by the Municipal Authority.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAiDetection(STATIC_TEST_SAMPLE);
                    }}
                    className="text-primary hover:underline font-label-sm text-[12px] flex items-center gap-1"
                  >
                    <span>Inspect with Static Test Sample</span>
                    <span className="material-symbols-outlined text-[14px]">east</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-surface-container-high flex items-center justify-between">
              <Button variant="ghost" size="md" onClick={() => setCurrentStep(2)}>
                Back to Location
              </Button>
              <Button
                size="md"
                onClick={() => setCurrentStep(4)}
                iconRight={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              >
                Proceed to Review
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW AND SUBMIT */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display-hero text-headline-sm font-bold text-on-surface">
                Review &amp; Submit Hazard Report
              </h2>
              <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                Verify details before registering this report in the municipal triage queue.
              </p>
            </div>

            {submissionSuccess && (
              <div className="p-4 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px]">check_circle</span>
                <div>
                  <p className="font-title-md font-semibold">
                    Report #{submissionSuccess} successfully submitted!
                  </p>
                  <p className="text-[12px]">Redirecting to tracking timeline...</p>
                </div>
              </div>
            )}

            {submissionError && (
              <div className="p-4 rounded-xl bg-error-container text-on-error-container flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px]">error</span>
                <div>
                  <p className="font-title-md font-semibold">Report Submission Failed</p>
                  <p className="text-[12px]">{submissionError}</p>
                </div>
              </div>
            )}

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
                  Reported Defect Photo
                </span>
                <PotholeDetectionOverlay
                  imageUrl={imagePreview}
                  aiDetection={aiDetection || undefined}
                  className="aspect-video max-h-48"
                />
              </div>

              <div className="space-y-3 p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 text-body-sm">
                <div>
                  <span className="font-headline-sm text-label-sm uppercase text-secondary font-semibold block">
                    Location &amp; Coordinates
                  </span>
                  <p className="font-title-md text-on-surface font-semibold">{address}</p>
                  <p className="font-code-sm text-[11px] text-primary">
                    GIS: {coordinates[0].toFixed(4)}° N, {coordinates[1].toFixed(4)}° E
                  </p>
                </div>

                <div>
                  <span className="font-headline-sm text-label-sm uppercase text-secondary font-semibold block">
                    Description
                  </span>
                  <p className="text-secondary text-[12px]">
                    {description || 'Road asphalt pothole hazard reported by citizen.'}
                  </p>
                </div>

                <div>
                  <span className="font-headline-sm text-label-sm uppercase text-secondary font-semibold block">
                    AI Detection Status
                  </span>
                  {aiDetection?.isModelConnected ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-emerald-700 font-label-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        {aiDetection.detected
                          ? 'Pothole Detected by YOLO'
                          : 'YOLO Connected - No Pothole Detected'}
                      </span>
                      {aiDetection.detected && (
                        <SeverityBadge severity={aiDetection.severityScore} size="sm" />
                      )}
                    </div>
                  ) : (
                    <span className="text-secondary font-label-sm text-[11px] block mt-1">
                      Pending Municipal Manual Triage
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-container-high flex items-center justify-between">
              <Button
                variant="ghost"
                size="md"
                disabled={isSubmitting}
                onClick={() => setCurrentStep(3)}
              >
                Back to AI Step
              </Button>
              <Button
                size="lg"
                isLoading={isSubmitting}
                onClick={handleSubmit}
                icon={<span className="material-symbols-outlined text-[18px]">send</span>}
              >
                Submit Report to Authority
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
