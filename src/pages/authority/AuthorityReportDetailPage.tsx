import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reportsService } from '../../services/reportsService';
import { ApiError } from '../../services/apiClient';
import type { PotholeReport, SeverityLevel } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { ReportLocationMap } from '../../components/map/LocationPickerMap';
import { PotholeDetectionOverlay } from '../../components/common/PotholeDetectionOverlay';
import { PotholeImage } from '../../components/common/PotholeImage';
import { ReportEventTimeline } from '../../components/common/ReportEventTimeline';
import { AssignTaskModal } from '../../components/modals/AssignTaskModal';
import { RejectReasonModal } from '../../components/modals/RejectReasonModal';
import { LoadingState } from '../../components/common/LoadingState';

export const AuthorityReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [report, setReport] = useState<PotholeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Severity override state
  const [overrideSeverity, setOverrideSeverity] = useState<SeverityLevel>('CRITICAL');
  const [severityReason, setSeverityReason] = useState('');
  const [isUpdatingSeverity, setIsUpdatingSeverity] = useState(false);
  const [showSeverityOverride, setShowSeverityOverride] = useState(false);

  const loadReport = async () => {
    if (!id) return;
    setActionErrorMsg(null);
    try {
      const data = await reportsService.getReportById(id);
      if (data) {
        setReport(data);
        if (data.aiDetection?.severityScore) {
          setOverrideSeverity(data.aiDetection.severityScore);
        }
      } else {
        setReport(null);
      }
    } catch (err) {
      console.error('Failed to load report detail', err);
      if (err instanceof ApiError && err.status === 404) {
        setReport(null);
      } else {
        setActionErrorMsg(err instanceof Error ? err.message : 'Failed to fetch report from server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleVerify = async () => {
    if (!report) return;
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const updated = await reportsService.verifyReport(report.id, true, undefined, user?.name);
      setReport(updated);
      setActionSuccessMsg('Report verified successfully! Ready for crew dispatch.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Verification failed', err);
      setActionErrorMsg(err instanceof Error ? err.message : 'Report verification failed.');
    }
  };

  const handleReject = async (reason: string) => {
    if (!report) return;
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const updated = await reportsService.verifyReport(report.id, false, reason, user?.name);
      setReport(updated);
      setActionSuccessMsg(`Report marked as REJECTED: "${reason}"`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Rejection failed', err);
      setActionErrorMsg(err instanceof Error ? err.message : 'Report rejection failed.');
    }
  };

  const handleSaveSeverityOverride = async () => {
    if (!report) return;
    setIsUpdatingSeverity(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const note = severityReason.trim()
        ? `Authority manual override: ${severityReason}`
        : `Authority adjusted severity to ${overrideSeverity}.`;
      const updated = await reportsService.updateReportSeverity(
        report.id,
        overrideSeverity,
        note,
        user?.name || 'Alice Sharma'
      );
      setReport(updated);
      setShowSeverityOverride(false);
      setSeverityReason('');
      setActionSuccessMsg(`Severity updated to ${overrideSeverity} and logged in audit history.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to update severity', err);
      setActionErrorMsg(err instanceof Error ? err.message : 'Failed to update severity.');
    } finally {
      setIsUpdatingSeverity(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading report triage record..." />;
  }

  if (actionErrorMsg && !report) {
    return (
      <Card padding="lg" className="text-center py-12 space-y-3 max-w-xl mx-auto border-error/30">
        <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto mb-2">
          <span className="material-symbols-outlined text-[24px]">cloud_off</span>
        </div>
        <h2 className="font-display-hero text-headline-sm text-on-surface">Unable to Load Report</h2>
        <p className="font-body-sm text-secondary">{actionErrorMsg}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={() => { setIsLoading(true); loadReport(); }}>
            Retry
          </Button>
          <Link to="/authority/reports">
            <Button variant="secondary" size="md">
              Return to Triage Queue
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (actionErrorMsg && !report) {
    return (
      <Card padding="lg" className="text-center py-12 space-y-3 max-w-xl mx-auto border-error/30">
        <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto mb-2">
          <span className="material-symbols-outlined text-[24px]">cloud_off</span>
        </div>
        <h2 className="font-display-hero text-headline-sm text-on-surface">Unable to Load Report</h2>
        <p className="font-body-sm text-secondary">{actionErrorMsg}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={() => { setIsLoading(true); loadReport(); }}>
            Retry
          </Button>
          <Link to="/authority/reports">
            <Button variant="secondary" size="md">
              Return to Triage Queue
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card padding="lg" className="text-center py-12 space-y-3">
        <h2 className="font-display-hero text-headline-sm text-on-surface">Report Not Found</h2>
        <p className="font-body-sm text-secondary">No record found matching #{id}.</p>
        <Link to="/authority/reports">
          <Button variant="secondary" size="md">
            Return to Triage Queue
          </Button>
        </Link>
      </Card>
    );
  }

  const canVerifyOrReject = report.status === 'SUBMITTED' || report.status === 'UNDER_REVIEW';
  const canAssign = report.status === 'VERIFIED';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/authority/reports"
          className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Triage Queue</span>
        </Link>
        <span className="font-code-sm text-label-sm text-secondary">
          MC Chandigarh Triage Desk
        </span>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-body-sm">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container flex items-center gap-2 font-body-sm">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Main Inspection Card */}
      <Card padding="lg" className="space-y-6">
        {/* Inspection Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-surface-container-high">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-code-sm font-semibold text-primary text-body-md">
                Triage Record #{report.trackingNumber}
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
              Reported on {new Date(report.createdAt).toLocaleString()} by {report.reporterName} ({report.reporterEmail})
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

        {/* Severity Assessment & Override Panel (Phase 7) */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">tune</span>
              <h3 className="text-sm font-bold text-on-surface">Severity Risk Classification</h3>
              {report.aiDetection?.severityScore && (
                <SeverityBadge severity={report.aiDetection.severityScore} size="sm" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSeverityOverride(!showSeverityOverride)}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              <span>{showSeverityOverride ? 'Cancel Override' : 'Override Severity'}</span>
            </button>
          </div>

          {showSeverityOverride && (
            <div className="pt-3 border-t border-outline-variant/20 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as SeverityLevel[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setOverrideSeverity(sev)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      overrideSeverity === sev
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  value={severityReason}
                  onChange={(e) => setSeverityReason(e.target.value)}
                  placeholder="Reason for manual severity override (e.g. Near school crosswalk, high transit volume)..."
                  className="w-full text-xs p-2.5 rounded-lg bg-surface text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveSeverityOverride}
                  disabled={isUpdatingSeverity}
                >
                  {isUpdatingSeverity ? 'Updating...' : 'Save Severity & Log in Audit'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Media & Geospatial Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Photographic Evidence with AI Detection Overlay */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
                Citizen Photo &amp; AI Detection
              </span>
              {report.aiDetection?.isModelConnected && (
                <span className="font-code-sm text-[11px] text-primary">
                  YOLO Confidence: {(report.aiDetection.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <PotholeDetectionOverlay
              imageUrl={report.damageImageUrl}
              aiDetection={report.aiDetection}
              className="aspect-video max-h-60"
            />
          </div>

          {/* Location Map */}
          <div className="space-y-2">
            <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
              Reported Geospatial Coordinates
            </span>
            <ReportLocationMap
              position={[report.location.latitude, report.location.longitude]}
              address={report.location.address}
            />
          </div>
        </div>

        {/* Post-Repair Restored Image (If completed or awaiting approval) */}
        {report.restoredImageUrl && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-label-sm uppercase tracking-wider text-emerald-800 font-semibold block">
                Post-Repair Photographic Evidence (Level-1 Inspection Pass)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Field Evidence Submitted
              </span>
            </div>
            <div className="max-w-md">
              <PotholeImage
                src={report.restoredImageUrl}
                alt="Post-repair smooth asphalt patch"
                fallbackType="restored"
                showBadge
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Citizen Description */}
        <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 text-body-sm space-y-1">
          <span className="font-headline-sm text-label-sm uppercase text-secondary font-semibold block">
            Citizen Notes
          </span>
          <p className="text-on-surface">{report.description}</p>
        </div>

        {/* Existing Assignment / Work Order Information */}
        {report.workOrderNumber && (
          <div className="p-3.5 bg-primary-fixed/30 rounded-xl border border-primary-container/20 text-body-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-title-md font-semibold text-primary block">
                Dispatched under Work Order #{report.workOrderNumber}
              </span>
              <span className="text-secondary text-[12px]">
                Assigned Team: {report.assignedTeamName} · Priority: {report.priority} · Deadline:{' '}
                {report.deadline || 'Standard'}
              </span>
            </div>
            <Link to="/authority/tasks">
              <Button variant="outline" size="sm">
                View in Task Manager
              </Button>
            </Link>
          </div>
        )}

        {/* Rejection Notes if Rejected */}
        {report.status === 'REJECTED' && report.reworkNotes && (
          <div className="p-3.5 bg-error-container/40 rounded-xl border border-error/20 text-body-sm space-y-1">
            <span className="font-title-md font-semibold text-error block">Rejection Reason:</span>
            <p className="text-on-surface">{report.reworkNotes}</p>
          </div>
        )}

        {/* Verification Controls */}
        <div className="pt-4 border-t border-surface-container-high flex flex-wrap items-center justify-between gap-3">
          <div className="text-body-sm text-secondary">
            {canVerifyOrReject && (
              <span>Review defect photo above to confirm physical road hazard before dispatching.</span>
            )}
            {canAssign && (
              <span className="text-primary font-medium">
                Report verified. Ready to dispatch repair crew work order.
              </span>
            )}
            {!canVerifyOrReject && !canAssign && (
              <span>Current Status: <strong>{report.status}</strong>.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canVerifyOrReject && (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsRejectModalOpen(true)}
                  icon={<span className="material-symbols-outlined text-[18px]">close</span>}
                >
                  Reject Report
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleVerify}
                  icon={<span className="material-symbols-outlined text-[18px]">verified</span>}
                >
                  Verify Report
                </Button>
              </>
            )}

            {canAssign && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsAssignModalOpen(true)}
                icon={<span className="material-symbols-outlined text-[18px]">engineering</span>}
              >
                Assign Repair Crew
              </Button>
            )}
          </div>
        </div>

        {/* 10-Step Connected Event Timeline (Phase 8) */}
        <div className="pt-6 border-t border-surface-container-high">
          <ReportEventTimeline
            currentStatus={report.status}
            history={report.statusHistory}
            workOrderNumber={report.workOrderNumber}
            assignedTeamName={report.assignedTeamName}
          />
        </div>
      </Card>

      {/* Task Assignment Modal */}
      {isAssignModalOpen && (
        <AssignTaskModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          report={report}
          onSuccess={() => {
            loadReport();
            setActionSuccessMsg('Work Order generated and dispatched to Punjab PWD repair unit!');
            setTimeout(() => setActionSuccessMsg(null), 4000);
          }}
        />
      )}

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <RejectReasonModal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Road Hazard Report"
          subtitle={`Report #${report.trackingNumber}`}
          promptLabel="Municipal Rejection Reason (Required)"
          placeholder="e.g. Defect is on private commercial property; Surface degradation below municipal repair threshold..."
          onSubmit={handleReject}
          confirmButtonText="Confirm Rejection"
        />
      )}
    </div>
  );
};
