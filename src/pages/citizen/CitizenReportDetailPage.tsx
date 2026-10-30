import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsService } from '../../services/reportsService';
import { ApiError } from '../../services/apiClient';
import type { PotholeReport } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { ReportLocationMap } from '../../components/map/LocationPickerMap';
import { PotholeDetectionOverlay } from '../../components/common/PotholeDetectionOverlay';
import { ReportEventTimeline } from '../../components/common/ReportEventTimeline';
import { PotholeImage } from '../../components/common/PotholeImage';
import { LoadingState } from '../../components/common/LoadingState';

export const CitizenReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<PotholeReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadReport = async () => {
    if (!id) return;
    setLoadError(null);
    try {
      const data = await reportsService.getReportById(id);
      setReport(data || null);
    } catch (err) {
      console.error('Failed to load report detail', err);
      if (err instanceof ApiError && err.status === 404) {
        setReport(null);
      } else {
        setLoadError(err instanceof Error ? err.message : 'Unable to load report from server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  if (isLoading) {
    return <LoadingState message="Fetching report inspection record..." />;
  }

  if (loadError) {
    return (
      <Card padding="lg" className="text-center py-12 space-y-3 max-w-xl mx-auto border-error/30">
        <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto mb-2">
          <span className="material-symbols-outlined text-[24px]">cloud_off</span>
        </div>
        <h2 className="font-display-hero text-headline-sm text-on-surface">Unable to Load Report</h2>
        <p className="font-body-sm text-secondary">{loadError}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={() => { setIsLoading(true); loadReport(); }}>
            Retry
          </Button>
          <Link to="/citizen/reports">
            <Button variant="secondary" size="md">
              Return to Submissions
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card padding="lg" className="text-center py-12 space-y-3 max-w-xl mx-auto">
        <h2 className="font-display-hero text-headline-sm text-on-surface">Report Not Found</h2>
        <p className="font-body-sm text-secondary">
          No record found matching identifier #{id}.
        </p>
        <Link to="/citizen/reports">
          <Button variant="secondary" size="md">
            Return to Submissions
          </Button>
        </Link>
      </Card>
    );
  }

  const isResolved = report.status === 'RESOLVED';
  const hasRestoredPhoto = Boolean(report.restoredImageUrl);
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.location.latitude},${report.location.longitude}`;

  return (
    <div className="max-w-6xl lg:max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/citizen/reports"
          className="inline-flex items-center gap-1.5 font-label-sm text-secondary hover:text-primary transition-colors font-medium text-xs sm:text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to My Submissions</span>
        </Link>

        <div className="flex items-center gap-2">
          {isResolved && (
            <Link to="/resolution-preview">
              <Button
                variant="outline"
                size="sm"
                icon={<span className="material-symbols-outlined text-[16px]">mail</span>}
              >
                Preview Resolution Email
              </Button>
            </Link>
          )}

          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-primary border border-outline-variant/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">navigation</span>
            <span>Open in Maps</span>
          </a>
        </div>
      </div>

      {/* Main Header Card */}
      <Card padding="lg" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-surface-container-high">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono font-bold text-primary text-sm sm:text-base px-2.5 py-0.5 rounded-md bg-primary/10">
                Report #{report.trackingNumber}
              </span>
              <StatusBadge status={report.status} size="md" />
              {report.aiDetection?.severityScore && (
                <SeverityBadge severity={report.aiDetection.severityScore} size="md" />
              )}
              {isResolved && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Resolved &amp; Closed
                </span>
              )}
            </div>
            <h1 className="font-display-hero text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface">
              {report.location.address}
            </h1>
            <p className="font-body-sm text-xs sm:text-sm text-secondary mt-1">
              Reported on {new Date(report.createdAt).toLocaleString()} by {report.reporterName}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low text-right shrink-0 border border-outline-variant/30 space-y-1">
            <span className="font-label-sm text-[10px] uppercase text-secondary font-bold tracking-wider block">
              INDIAN GIS COORDINATES
            </span>
            <span className="font-mono text-xs sm:text-sm text-primary font-bold block">
              {report.location.latitude.toFixed(5)}° N, {report.location.longitude.toFixed(5)}° E
            </span>
          </div>
        </div>

        {/* PHOTOGRAPHIC EVIDENCE SECTION: Side-by-Side Original & Approved Post-Repair */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display-hero text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">compare</span>
              <span>Photographic Evidence &amp; Visual Audit</span>
            </h2>
            {isResolved && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Level-1 Municipal Inspection Certified
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Original Reported Defect with AI Overlay */}
            <div className="space-y-2 bg-surface-container-low/40 p-3 sm:p-4 rounded-xl border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-xs uppercase tracking-wider text-secondary font-bold">
                  Original Reported Defect
                </span>
                <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Citizen Submission
                </span>
              </div>
              <div className="rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container aspect-video max-h-64">
                <PotholeDetectionOverlay
                  imageUrl={report.damageImageUrl}
                  aiDetection={report.aiDetection}
                  className="w-full h-full object-cover"
                />
              </div>
              {report.aiDetection?.isModelConnected && (
                <div className="flex items-center justify-between text-[11px] font-mono text-secondary pt-1">
                  <span>YOLO Confidence: {(report.aiDetection.confidence * 100).toFixed(0)}%</span>
                  <span className="font-semibold text-primary">Triage Score: {report.aiDetection.severityScore}</span>
                </div>
              )}
            </div>

            {/* Right: Approved Post-Repair Photographic Evidence or Active Status */}
            <div className="space-y-2 bg-surface-container-low/40 p-3 sm:p-4 rounded-xl border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-xs uppercase tracking-wider text-primary font-bold">
                  {isResolved || hasRestoredPhoto ? 'Approved Post-Repair Evidence' : 'Post-Repair Field Evidence'}
                </span>
                {isResolved ? (
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Certified Pass
                  </span>
                ) : (
                  <span className="text-[11px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {report.status.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className="rounded-lg overflow-hidden border border-outline-variant/30 bg-surface-container aspect-video max-h-64 flex items-center justify-center">
                <PotholeImage
                  src={report.restoredImageUrl}
                  alt="Post-repair road patch"
                  className="w-full h-full object-cover"
                  fallbackType="restored"
                  allowZoom={true}
                  showMissingStateIfEmpty={!hasRestoredPhoto}
                  missingStateLabel={
                    isResolved
                      ? 'Archived repair certification record'
                      : 'Awaiting photographic evidence upload from repair crew'
                  }
                />
              </div>

              <div className="text-[11px] text-secondary pt-1 flex items-center justify-between">
                <span>Assigned Squad: <strong className="text-on-surface">{report.assignedTeamName || 'Punjab PWD Unit 04'}</strong></span>
                {isResolved && <span className="text-emerald-700 font-semibold">Flush grade compaction certified</span>}
              </div>
            </div>
          </div>
        </div>

        {/* SITE MAP & REPORT METADATA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Left: Dedicated Interactive Site Map */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display-hero text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">map</span>
                <span>Exact Road Defect Location Map</span>
              </span>
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Google Maps Route</span>
                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              </a>
            </div>
            <div className="rounded-xl overflow-hidden border border-outline-variant/30 shadow-xs h-56 sm:h-64">
              <ReportLocationMap
                position={[report.location.latitude, report.location.longitude]}
                address={report.location.address}
                zoom={16}
              />
            </div>
            <p className="text-[11px] text-secondary">
              GPS Marker centered at {report.location.latitude.toFixed(5)}° N, {report.location.longitude.toFixed(5)}° E
            </p>
          </div>

          {/* Right: Well-Organized Report Metadata */}
          <div className="lg:col-span-5 space-y-3 bg-surface-container-low/50 p-4 sm:p-5 rounded-2xl border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary block mb-3">
                Civic Operations Telemetry
              </span>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-surface-container-high">
                  <span className="text-secondary">Tracking ID:</span>
                  <span className="font-mono font-bold text-on-surface">{report.trackingNumber}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-surface-container-high">
                  <span className="text-secondary">Work Order Number:</span>
                  <span className="font-mono font-bold text-primary">{report.workOrderNumber || `WO-${report.id.slice(0, 6).toUpperCase()}`}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-surface-container-high">
                  <span className="text-secondary">Submission Date:</span>
                  <span className="font-medium text-on-surface">{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-surface-container-high">
                  <span className="text-secondary">Assigned Squad:</span>
                  <span className="font-medium text-on-surface">{report.assignedTeamName || 'Punjab PWD Asphalt Unit 04'}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-surface-container-high">
                  <span className="text-secondary">Triage Level:</span>
                  <span className="font-semibold text-on-surface">{report.aiDetection?.severityScore || 'CRITICAL'} Severity</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-secondary">Target Resolution:</span>
                  <span className="font-semibold text-emerald-700">Level-1 Municipal Pass</span>
                </div>
              </div>
            </div>

            {/* Description note */}
            <div className="mt-3 p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-xs">
              <span className="font-bold text-secondary text-[11px] block mb-0.5">Citizen Notes &amp; Landmark:</span>
              <p className="text-on-surface">{report.description || 'Pothole hazard on road surface.'}</p>
            </div>
          </div>
        </div>

        {/* 10-State Civic Resolution Lifecycle */}
        <div className="pt-6 border-t border-surface-container-high">
          <ReportEventTimeline
            currentStatus={report.status}
            history={report.statusHistory}
            workOrderNumber={report.workOrderNumber}
            assignedTeamName={report.assignedTeamName}
          />
        </div>
      </Card>
    </div>
  );
};
