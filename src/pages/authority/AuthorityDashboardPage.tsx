import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsService } from '../../services/reportsService';
import type { PotholeReport } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { MultiMarkerMap } from '../../components/map/MultiMarkerMap';
import { PotholeImage } from '../../components/common/PotholeImage';
import { LoadingState } from '../../components/common/LoadingState';

export const AuthorityDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        const allReports = await reportsService.getAllReports();
        setReports(allReports);
      } catch (err) {
        console.error('Failed to load authority dashboard data', err);
        setError(err instanceof Error ? err.message : 'Unable to connect to municipal reports API.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Real statistics calculated directly from shared stored records
  const totalReports = reports.length;
  const awaitingVerification = reports.filter((r) =>
    ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)
  ).length;
  const verifiedAwaitingAssignment = reports.filter((r) => r.status === 'VERIFIED').length;
  const activeRepairTasks = reports.filter((r) =>
    ['ASSIGNED', 'IN_PROGRESS'].includes(r.status)
  ).length;
  const repairsAwaitingApproval = reports.filter((r) => r.status === 'AWAITING_APPROVAL').length;
  const resolvedReports = reports.filter((r) => r.status === 'RESOLVED').length;

  if (isLoading) {
    return <LoadingState message="Loading municipal operations dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-lg bg-error-container text-on-error-container flex items-center gap-2.5 font-body-sm border border-error/30">
          <span className="material-symbols-outlined text-[20px]">cloud_off</span>
          <div>
            <p className="font-title-md font-semibold">Backend Connection Unavailable</p>
            <p className="text-[12px]">{error}</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-label-sm font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
            Dept of Public Works Dispatch Hub
          </div>
          <h1 className="font-display-hero text-headline-sm text-on-surface">
            Municipal Road Infrastructure Triage
          </h1>
          <p className="font-body-sm text-body-sm text-secondary">
            Alice Sharma (Municipal Commissioner) · Municipal road hazard verification, team dispatch &amp; sign-off desk.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              icon={<span className="material-symbols-outlined text-[16px]">home</span>}
            >
              Back to Home
            </Button>
          </Link>
          <Link to="/authority/reports">
            <Button
              variant="primary"
              size="sm"
              icon={<span className="material-symbols-outlined text-[16px]">checklist</span>}
            >
              Open Triage Queue ({awaitingVerification + verifiedAwaitingAssignment})
            </Button>
          </Link>
          <Link to="/authority/approvals">
            <Button
              variant={repairsAwaitingApproval > 0 ? 'primary' : 'secondary'}
              size="sm"
              icon={<span className="material-symbols-outlined text-[16px]">verified</span>}
            >
              Pending Approvals ({repairsAwaitingApproval})
            </Button>
          </Link>
        </div>
      </div>

      {/* Demo Data Label Banner */}
      <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-body-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">database</span>
          <span className="text-secondary text-[12px]">
            <strong>Development Environment:</strong> Live metrics calculated from shared database records. Baseline records (`PF-101`, `PF-102`, `PF-103`) are seeded as pristine demonstration reports.
          </span>
        </div>
        <span className="font-code-sm text-[11px] px-2 py-0.5 rounded bg-surface-container text-secondary shrink-0">
          Sync Active
        </span>
      </div>

      {/* Real Statistics Metric Row (Calculated from shared reports service) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card padding="sm" className="space-y-1">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-secondary">
            Total Hazards
          </span>
          <p className="font-display-hero text-headline-lg text-on-surface">{totalReports}</p>
          <span className="font-body-sm text-[10px] text-secondary">Reported by citizens</span>
        </Card>

        <Card padding="sm" className="space-y-1 border-error/20 bg-red-50/20">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-error">
            Verify Needed
          </span>
          <p className="font-display-hero text-headline-lg text-error">{awaitingVerification}</p>
          <span className="font-body-sm text-[10px] text-error/80">Pending visual check</span>
        </Card>

        <Card padding="sm" className="space-y-1">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-primary">
            Awaiting Crew
          </span>
          <p className="font-display-hero text-headline-lg text-primary">{verifiedAwaitingAssignment}</p>
          <span className="font-body-sm text-[10px] text-secondary">Verified by inspector</span>
        </Card>

        <Card padding="sm" className="space-y-1 border-amber-200 bg-amber-50/20">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-amber-700">
            Active Tasks
          </span>
          <p className="font-display-hero text-headline-lg text-amber-700">{activeRepairTasks}</p>
          <span className="font-body-sm text-[10px] text-secondary">Dispatched to crews</span>
        </Card>

        <Card padding="sm" className="space-y-1 border-purple-200 bg-purple-50/20">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-purple-700">
            Awaiting Sign-off
          </span>
          <p className="font-display-hero text-headline-lg text-purple-700">{repairsAwaitingApproval}</p>
          <span className="font-body-sm text-[10px] text-secondary">Photo evidence uploaded</span>
        </Card>

        <Card padding="sm" className="space-y-1 border-emerald-200 bg-emerald-50/20">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-emerald-700">
            Certified Closed
          </span>
          <p className="font-display-hero text-headline-lg text-emerald-700">{resolvedReports}</p>
          <span className="font-body-sm text-[10px] text-secondary">Passed Level-1 audit</span>
        </Card>
      </div>

      {/* Geospatial Map Container (Multi-marker Leaflet map) */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display-hero text-title-md text-on-surface">
              Municipal Ward GIS Map
            </h2>
            <p className="font-body-sm text-body-sm text-secondary">
              OpenStreetMap pins indicating real-time location and triage status of road defects.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-label-sm">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> New Defect
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Awaiting Review
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolved
            </span>
          </div>
        </div>

        <div className="p-3">
          <MultiMarkerMap reports={reports} />
        </div>
      </Card>

      {/* Recent Incoming Reports */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-surface-container-high flex items-center justify-between">
          <div>
            <h2 className="font-display-hero text-title-md text-on-surface">
              Recent Incoming Road Hazard Reports
            </h2>
            <p className="font-body-sm text-body-sm text-secondary">
              Incoming citizen submissions requiring review or crew assignment.
            </p>
          </div>
          <Link
            to="/authority/reports"
            className="font-title-md text-label-md text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Reports ({reports.length})</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        <div className="divide-y divide-surface-container-high">
          {reports.slice(0, 5).map((report) => (
            <div
              key={report.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30">
                  <PotholeImage
                    src={report.damageImageUrl}
                    alt="Hazard thumbnail"
                    className="w-full h-full object-cover"
                    fallbackType="default"
                    allowZoom={false}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-code-sm font-semibold text-primary">#{report.trackingNumber}</span>
                    <StatusBadge status={report.status} size="sm" />
                    {report.aiDetection?.severityScore && (
                      <SeverityBadge severity={report.aiDetection.severityScore} size="sm" />
                    )}
                    <span className="font-body-sm text-[11px] text-secondary">
                      · Reported by {report.reporterName}
                    </span>
                  </div>
                  <h3 className="font-title-md text-label-md text-on-surface font-semibold truncate">
                    {report.location.address}
                  </h3>
                  <p className="font-body-sm text-body-sm text-secondary line-clamp-1">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link to={`/authority/reports/${report.trackingNumber}`}>
                  <Button variant="secondary" size="sm">
                    Inspect &amp; Triage
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
