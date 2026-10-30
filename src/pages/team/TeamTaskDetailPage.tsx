import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tasksService } from '../../services/tasksService';
import { reportsService } from '../../services/reportsService';
import type { RepairTask, PotholeReport } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PotholeImage } from '../../components/common/PotholeImage';
import { ReportLocationMap } from '../../components/map/LocationPickerMap';
import { LoadingState } from '../../components/common/LoadingState';

export const TeamTaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<RepairTask | null>(null);
  const [report, setReport] = useState<PotholeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Evidence Form State
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string>('');
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [repairNotes, setRepairNotes] = useState<string>(
    'Sub-base compacted. Hot-mix asphalt rolled flush with grade. Excess aggregate removed.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      const taskData = await tasksService.getTaskById(id);
      setTask(taskData || null);
      if (taskData) {
        const reportData = await reportsService.getReportById(taskData.reportId);
        setReport(reportData || null);
      }
    } catch (err) {
      console.error('Failed to load task details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Action: Start Repair
  const handleStartRepair = async () => {
    if (!task) return;
    try {
      const updated = await tasksService.startTask(task.id, 'Gurpreet Singh (Crew Lead)');
      setTask(updated);
      setActionNotice('Repair status updated to IN_PROGRESS. Work started on site.');
      await loadData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.error('Failed to start repair', err);
    }
  };

  // Action: File upload for evidence
  const handleEvidenceFile = (file: File) => {
    setEvidenceError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setEvidenceError('Invalid format. Please upload JPEG, PNG, or WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEvidenceError('File exceeds 10 MB limit.');
      return;
    }

    setEvidenceFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setEvidencePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Action: Submit evidence for Authority approval
  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !evidencePreview) {
      setEvidenceError('An after-repair photograph is required to submit for approval.');
      return;
    }

    setIsSubmitting(true);
    setEvidenceError(null);

    try {
      const updated = await tasksService.submitCompletion(
        task.id,
        evidencePreview,
        repairNotes,
        'Gurpreet Singh (Crew Lead)',
        evidenceFile || undefined
      );
      setTask(updated);
      setActionNotice(
        'Post-repair evidence submitted! Task is now AWAITING_APPROVAL in the Municipal Authority queue.'
      );
      await loadData();
      setTimeout(() => setActionNotice(null), 6000);
    } catch (err) {
      console.error('Submission failed', err);
      setEvidenceError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading work order details..." />;
  }

  if (!task) {
    return (
      <Card padding="lg" className="text-center py-12 space-y-3">
        <h2 className="font-display-hero text-headline-sm text-on-surface">Work Order Not Found</h2>
        <p className="font-body-sm text-secondary">No task record found matching #{id}.</p>
        <Link to="/team/tasks">
          <Button variant="secondary" size="md">
            Return to Work Orders
          </Button>
        </Link>
      </Card>
    );
  }

  const coordinates = task.location || report?.location || { latitude: 30.7398, longitude: 76.7827, address: 'Sector 17 Plaza Corridor, Chandigarh' };
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/team/tasks"
          className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Assigned Tasks</span>
        </Link>
        <span className="font-code-sm text-label-sm text-secondary">
          Punjab PWD Unit 04 · Field Workspace
        </span>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center gap-2 font-body-sm shadow-sm">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Task Card */}
      <Card padding="lg" className="space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-surface-container-high">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-code-sm font-semibold text-primary text-body-md">
                Work Order #{task.id}
              </span>
              <span className="text-secondary text-[12px]">
                (Linked Citizen Report #{task.trackingNumber})
              </span>
              <StatusBadge status={task.status as unknown as import('../../types').ReportStatus} size="md" />
              <span className="px-2 py-0.5 rounded text-[11px] uppercase font-semibold bg-primary-fixed/40 text-primary">
                {task.priority} Priority
              </span>
            </div>

            <h1 className="font-display-hero text-headline-sm text-on-surface">
              {coordinates.address}
            </h1>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Target Deadline: {task.deadline || 'Standard'} · Assigned to {task.assignedTeamName}
            </p>
          </div>

          {/* Google Maps External Directions Link */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center gap-1.5 font-label-sm text-primary transition-colors shrink-0 border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[18px]">navigation</span>
            <span>Open in Google Maps</span>
          </a>
        </div>

        {/* Rework Alert Banner (If Authority Rejected Evidence) */}
        {task.status === 'REWORK_REQUIRED' && (
          <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-body-sm space-y-1.5">
            <div className="flex items-center gap-2 text-error font-semibold font-title-md">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>Authority Rework Required</span>
            </div>
            <p className="text-on-surface font-medium">
              Inspector Notice: {task.reworkReason || 'Compaction or surface finish non-conformance.'}
            </p>
            <p className="text-secondary text-[12px]">
              Please re-inspect the road site, rectify the defect, and upload new post-repair evidence below.
            </p>
          </div>
        )}

        {/* Media & Map Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Original Defect Photograph */}
          <div className="space-y-2">
            <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
              Original Road Defect Photo
            </span>
            <div className="relative rounded-xl overflow-hidden aspect-video max-h-56 border border-outline-variant/30">
              <PotholeImage
                src={task.damageImageUrl || report?.damageImageUrl}
                alt="Original defect"
                className="w-full h-full object-cover"
                fallbackType="critical"
                showBadge
              />
            </div>
          </div>

          {/* Location Map with Leaflet */}
          <div className="space-y-2">
            <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
              Work Order Site Map
            </span>
            <ReportLocationMap
              position={[coordinates.latitude, coordinates.longitude]}
              address={coordinates.address}
            />
          </div>
        </div>

        {/* Authority Instructions */}
        <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 text-body-sm space-y-1">
          <span className="font-headline-sm text-label-sm uppercase text-secondary font-semibold block">
            Authority Dispatch Instructions
          </span>
          <p className="text-on-surface">
            {task.instructions || 'Saw-cut defect perimeter, clean gravel debris, apply tack coat, and compact hot-mix asphalt flush with grade.'}
          </p>
        </div>

        {/* STEP 1: START REPAIR BUTTON (If PENDING) */}
        {task.status === 'PENDING' && (
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-title-md font-semibold text-on-surface">Ready to start road work?</p>
              <p className="font-body-sm text-secondary text-[12px]">
                Clicking Start Repair logs arrival time on site and updates the citizen tracking status to In Progress.
              </p>
            </div>
            <Button
              size="lg"
              variant="primary"
              onClick={handleStartRepair}
              icon={<span className="material-symbols-outlined text-[20px]">play_arrow</span>}
            >
              Start Repair
            </Button>
          </div>
        )}

        {/* STEP 2: UPLOAD EVIDENCE FORM (If IN_PROGRESS or REWORK_REQUIRED) */}
        {(task.status === 'IN_PROGRESS' || task.status === 'REWORK_REQUIRED') && (
          <form onSubmit={handleSubmitEvidence} className="space-y-4 pt-4 border-t border-surface-container-high">
            <div>
              <h3 className="font-display-hero text-title-md text-on-surface">
                Upload Post-Repair Evidence Photograph
              </h3>
              <p className="font-body-sm text-secondary text-[12px] mt-0.5">
                Capture the compacted smooth patch flush with driving grade for Authority sign-off.
              </p>
            </div>

            {evidenceError && (
              <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{evidenceError}</span>
              </div>
            )}

            {!evidencePreview ? (
              <div className="space-y-3">
                <div
                  onClick={() => document.getElementById('evidence-file-input')?.click()}
                  className="border-2 border-dashed border-outline-variant/60 hover:border-primary-container rounded-xl p-8 text-center bg-surface-container-low/40 hover:bg-surface-container-low transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-container-low group-hover:bg-primary-fixed/40 flex items-center justify-center mx-auto text-primary mb-2 transition-colors">
                    <span className="material-symbols-outlined text-[28px]">add_a_photo</span>
                  </div>
                  <p className="font-display-hero text-label-md text-on-surface">
                    Click to select post-repair photo
                  </p>
                  <p className="font-body-sm text-secondary text-[11px]">
                    JPEG, PNG, or WebP up to 10 MB.
                  </p>
                  <input
                    id="evidence-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleEvidenceFile(e.target.files[0])}
                  />
                </div>

                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20 flex items-center justify-between">
                  <span className="text-xs font-semibold text-secondary">
                    Demo Mode Evaluation:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEvidencePreview('/photos/pothole-restored1.jpg')}
                      className="px-2.5 py-1 rounded bg-surface hover:bg-surface-container text-xs font-semibold text-primary border border-outline-variant/30"
                    >
                      Use Sector 17 Flush Patch Sample
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvidencePreview('/photos/pothole-restored2.jpg')}
                      className="px-2.5 py-1 rounded bg-surface hover:bg-surface-container text-xs font-semibold text-primary border border-outline-variant/30"
                    >
                      Use Madhya Marg Sample
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-surface-container aspect-video max-h-64 mx-auto border border-outline-variant/30">
                  <img
                    src={evidencePreview}
                    alt="Post-repair evidence preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEvidencePreview('');
                        setEvidenceFile(null);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white font-title-md text-label-sm backdrop-blur-sm transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Replace Photo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Repair Completion Notes */}
            <div>
              <label className="block font-title-md text-label-md text-on-surface mb-1">
                Completion Notes &amp; Compaction Description
              </label>
              <textarea
                rows={3}
                value={repairNotes}
                onChange={(e) => setRepairNotes(e.target.value)}
                placeholder="Describe asphalt mix used, compaction depth, and surface flushness..."
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-secondary text-[12px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
                <span>
                  Submitted evidence moves to Awaiting Approval. Only Authority can certify final resolution.
                </span>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={!evidencePreview || isSubmitting}
                isLoading={isSubmitting}
                icon={<span className="material-symbols-outlined text-[20px]">send</span>}
              >
                Submit for Authority Approval
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: AWAITING APPROVAL DISPLAY */}
        {task.status === 'AWAITING_APPROVAL' && (
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-body-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-700 text-[20px]">
                  pending_actions
                </span>
                <span className="font-title-md text-purple-900 font-semibold">
                  Submitted for Municipal Sign-off
                </span>
              </div>
              <span className="font-code-sm text-[11px] text-purple-700">
                Submitted at {task.completedAt || 'Today'}
              </span>
            </div>

            {task.afterRepairPhotoUrl && (
              <div className="relative rounded-lg overflow-hidden aspect-video max-h-48 max-w-sm border border-purple-200">
                <PotholeImage
                  src={task.afterRepairPhotoUrl}
                  alt="Post-repair evidence"
                  className="w-full h-full object-cover"
                  fallbackType="restored"
                  showBadge
                />
              </div>
            )}

            <p className="text-purple-800 text-[12px]">
              Notes: {task.repairNotes || 'Evidence submitted. Awaiting Commissioner Alice Sharma review.'}
            </p>
          </div>
        )}

        {/* STEP 4: RESOLVED DISPLAY */}
        {task.status === 'RESOLVED' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-body-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                  verified
                </span>
                <span className="font-title-md text-emerald-900 font-semibold">
                  Certified Level-1 Pass &amp; Resolved
                </span>
              </div>
              <span className="font-code-sm text-[11px] text-emerald-700">
                Closed at {task.completedAt || 'Today'}
              </span>
            </div>

            {task.afterRepairPhotoUrl && (
              <div className="relative rounded-lg overflow-hidden aspect-video max-h-48 max-w-sm border border-emerald-200">
                <PotholeImage
                  src={task.afterRepairPhotoUrl}
                  alt="Approved post-repair evidence"
                  className="w-full h-full object-cover"
                  fallbackType="restored"
                  showBadge
                />
              </div>
            )}

            <p className="text-emerald-800 text-[12px]">
              Commissioner Alice Sharma confirmed flush asphalt patch. Work order completed and citizen resolution dispatch logged.
            </p>
          </div>
        )}

        {/* Audit Log */}
        {report?.statusHistory && report.statusHistory.length > 0 && (
          <div className="pt-4 border-t border-surface-container-high space-y-2">
            <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
              Work Order Audit Trail
            </span>
            <div className="space-y-1.5 text-body-sm">
              {report.statusHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-surface-container-low text-body-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      history
                    </span>
                    <span className="font-semibold text-on-surface">{entry.actorName}:</span>
                    <span className="text-secondary">{entry.note || entry.status}</span>
                  </div>
                  <span className="font-code-sm text-[11px] text-secondary shrink-0">
                    {entry.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
