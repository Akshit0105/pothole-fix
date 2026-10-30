import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsService } from '../../services/reportsService';
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

  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      try {
        const data = await reportsService.getReportById(id);
        setReport(data || null);
      } catch (err) {
        console.error('Failed to load report detail', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [id]);

  if (isLoading) {
    return <LoadingState message="Fetching report inspection record..." />;
  }

  if (!report) {
    return (
      <Card padding="lg" className="text-center py-12 space-y-3">
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/citizen/reports"
          className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to My Submissions</span>
        </Link>

        {report.status === 'RESOLVED' && (
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
      </div>

      {/* Main Report Card */}
      <Card padding="lg" className="space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-surface-container-high">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-code-sm font-semibold text-primary text-body-md">
                Report #{report.trackingNumber}
              </span>
              <StatusBadge status={report.status} size="md" />
              {report.aiDetection?.severityScore && (
                <SeverityBadge severity={report.aiDetection.severityScore} size="md" />
              )}
            </div>
            <h1 className="font-display-hero text-headline-sm text-on-surface">
              {report.location.address}
            </h1>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Reported on {new Date(report.createdAt).toLocaleString()} by {report.reporterName}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low text-right shrink-0 border border-outline-variant/20">
            <span className="font-headline-sm text-label-sm uppercase text-secondary font-semibold block">
              INDIAN GIS COORDINATES
            </span>
            <span className="font-code-sm text-code-sm text-primary-container font-medium block">
              {report.location.latitude.toFixed(4)}° N, {report.location.longitude.toFixed(4)}° E
            </span>
          </div>
        </div>

        {/* Photos & Maps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Original Photograph with AI Detection Overlay */}
          <div className="space-y-2">
            <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
              Original Road Defect Evidence
            </span>
            <PotholeDetectionOverlay
              imageUrl={report.damageImageUrl}
              aiDetection={report.aiDetection}
              className="aspect-video max-h-56"
            />
            {report.aiDetection?.isModelConnected && (
              <p className="font-code-sm text-[11px] text-primary">
                YOLO Confidence: {(report.aiDetection.confidence * 100).toFixed(0)}% · Categorical Risk: {report.aiDetection.severityScore}
              </p>
            )}
          </div>

          {/* Right: Location Map or Restored Photo if Resolved */}
          <div className="space-y-2">
            {report.status === 'RESOLVED' && report.restoredImageUrl ? (
              <div className="space-y-2">
                <span className="font-headline-sm text-label-sm uppercase tracking-wider text-primary font-semibold block">
                  Approved Post-Repair Photograph
                </span>
                <div className="relative rounded-xl overflow-hidden bg-surface-container aspect-video max-h-56 border border-primary/20">
                  <PotholeImage
                    src={report.restoredImageUrl}
                    alt="Restored road patch"
                    className="w-full h-full object-cover"
                    fallbackType="restored"
                    allowZoom={true}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-[10px] uppercase font-semibold pointer-events-none">
                    Level-1 Pass Certified
                  </div>
                </div>
                <p className="font-body-sm text-[11px] text-primary font-medium">
                  Repaired by {report.assignedTeamName || 'Municipal Crew'} · Verified flush patch
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
                  Incident Geospatial Location
                </span>
                <ReportLocationMap
                  position={[report.location.latitude, report.location.longitude]}
                  address={report.location.address}
                />
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 text-body-sm space-y-1">
          <span className="font-headline-sm text-label-sm uppercase text-secondary font-semibold block">
            Hazard Description &amp; Landmark Notes
          </span>
          <p className="text-on-surface">{report.description}</p>
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
