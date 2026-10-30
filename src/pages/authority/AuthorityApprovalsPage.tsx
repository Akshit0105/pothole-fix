import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasksService } from '../../services/tasksService';
import type { RepairTask } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PotholeImage } from '../../components/common/PotholeImage';
import { RejectReasonModal } from '../../components/modals/RejectReasonModal';
import { LoadingState } from '../../components/common/LoadingState';

export const AuthorityApprovalsPage: React.FC = () => {
  const [tasks, setTasks] = useState<RepairTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskForRework, setSelectedTaskForRework] = useState<RepairTask | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadApprovalQueue = async () => {
    try {
      const data = await tasksService.getApprovalQueue();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load approval queue', err);
      setActionError(err instanceof Error ? err.message : 'Failed to fetch approval queue from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovalQueue();
  }, []);

  const handleApprove = async (task: RepairTask) => {
    setActionError(null);
    try {
      await tasksService.reviewTask(task.id, true, undefined, 'Alice Sharma');
      setActionNotice(
        `Work Order #${task.id} (Report #${task.trackingNumber}) marked RESOLVED! Level-1 inspection pass certified. Backend notification event prepared for FastAPI.`
      );
      await loadApprovalQueue();
      setTimeout(() => setActionNotice(null), 6000);
    } catch (err) {
      console.error('Approval failed', err);
      setActionError(err instanceof Error ? err.message : 'Approval failed. Pothole was not marked resolved.');
    }
  };

  const handleRework = async (reason: string) => {
    if (!selectedTaskForRework) return;
    setActionError(null);
    try {
      await tasksService.reviewTask(selectedTaskForRework.id, false, reason, 'Alice Sharma');
      setActionNotice(
        `Rework requested on Work Order #${selectedTaskForRework.id}. Task returned to ${selectedTaskForRework.assignedTeamName}.`
      );
      setSelectedTaskForRework(null);
      await loadApprovalQueue();
      setTimeout(() => setActionNotice(null), 6000);
    } catch (err) {
      console.error('Rework submission failed', err);
      setActionError(err instanceof Error ? err.message : 'Rework request failed.');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading repair completion evidence queue..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          to="/authority/dashboard"
          className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Authority Dashboard</span>
        </Link>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <h1 className="font-display-hero text-headline-sm text-on-surface">
            Repair Evidence Approvals &amp; Sign-off
          </h1>
          <p className="font-body-sm text-body-sm text-secondary">
            Inspect before-and-after photographic evidence to certify Level-1 municipal completion.
          </p>
        </div>

        <Link to="/resolution-preview">
          <Button
            variant="outline"
            size="sm"
            icon={<span className="material-symbols-outlined text-[16px]">visibility</span>}
          >
            Preview Resolution Email Format
          </Button>
        </Link>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-start gap-2.5 font-body-sm shadow-sm">
          <span className="material-symbols-outlined text-emerald-700 text-[20px] mt-0.5">
            verified
          </span>
          <div>
            <p className="font-title-md font-semibold text-emerald-950">Action Completed</p>
            <p className="text-[12px]">{actionNotice}</p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-lg bg-error-container text-on-error-container border border-error/30 flex items-start gap-2.5 font-body-sm shadow-sm">
          <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
          <div>
            <p className="font-title-md font-semibold">Action Failed</p>
            <p className="text-[12px]">{actionError}</p>
          </div>
        </div>
      )}

      {/* Approval Queue */}
      {tasks.length === 0 ? (
        <Card padding="lg" className="text-center py-16 space-y-3">
          <div className="w-14 h-14 rounded-full bg-surface-container-low text-emerald-700 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">task_alt</span>
          </div>
          <h3 className="font-display-hero text-headline-sm text-on-surface">
            No Approvals Pending
          </h3>
          <p className="font-body-sm text-secondary max-w-md mx-auto">
            All submitted field repair evidence has been reviewed. Work orders currently in progress will appear here upon crew completion.
          </p>
          <div className="pt-2">
            <Link to="/authority/tasks">
              <Button variant="secondary" size="sm">
                View Active Work Orders
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {tasks.map((task) => (
            <Card key={task.id} padding="lg" className="space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-surface-container-high">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-code-sm font-semibold text-primary">
                      Work Order #{task.id}
                    </span>
                    <span className="text-secondary text-[12px]">
                      (Report #{task.trackingNumber})
                    </span>
                    <StatusBadge status="AWAITING_APPROVAL" size="md" />
                    <span className="px-2 py-0.5 rounded text-[11px] uppercase font-semibold bg-primary-fixed text-on-primary-fixed">
                      Evidence Ready
                    </span>
                  </div>
                  <h2 className="font-display-hero text-headline-sm text-on-surface">
                    {task.location?.address || 'Municipal Road Location'}
                  </h2>
                  <p className="font-body-sm text-body-sm text-secondary mt-0.5">
                    Completed by {task.assignedTeamName} · Submitted today for final verification
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/authority/reports/${task.trackingNumber}`}>
                    <Button variant="ghost" size="sm">
                      Inspect Original Report
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Side-by-Side Photographic Comparison */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                    Photographic Triage Evidence Comparison
                  </span>
                  <span className="font-code-sm text-label-sm text-primary font-medium">
                    Level-1 Pass Standard
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before / Damaged */}
                  <div className="space-y-1.5">
                    <div className="relative rounded-lg overflow-hidden aspect-video border border-error/20">
                      <PotholeImage
                        src={task.damageImageUrl}
                        alt="Original damaged pavement"
                        className="w-full h-full object-cover"
                        fallbackType="critical"
                        showBadge
                      />
                    </div>
                    <p className="font-body-sm text-[11px] text-secondary">
                      Class A arterial hazard · Deep pavement fracture
                    </p>
                  </div>

                  {/* After / Restored */}
                  <div className="space-y-1.5">
                    <div className="relative rounded-lg overflow-hidden aspect-video border border-emerald-200">
                      <PotholeImage
                        src={task.afterRepairPhotoUrl}
                        alt="Restored pavement evidence"
                        className="w-full h-full object-cover"
                        fallbackType="restored"
                        showBadge
                      />
                    </div>
                    <p className="font-body-sm text-[11px] text-emerald-800 font-medium">
                      Compacted dark asphalt patch · Flush with driving grade
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Completion Notes */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 text-body-sm space-y-1">
                <span className="font-headline-sm text-label-sm uppercase text-secondary font-semibold block">
                  Field Team Completion Notes
                </span>
                <p className="text-on-surface">
                  {task.repairNotes || 'Asphalt patch rolled and compacted flush with roadway.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="font-body-sm text-[12px] text-secondary">
                  Approving officially resolves Report #{task.trackingNumber} and makes restored evidence visible to the citizen reporter.
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setSelectedTaskForRework(task)}
                    icon={<span className="material-symbols-outlined text-[18px]">replay</span>}
                  >
                    Request Rework
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleApprove(task)}
                    icon={<span className="material-symbols-outlined text-[18px]">verified</span>}
                  >
                    Approve &amp; Mark Resolved
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Rework Reason Modal */}
      {selectedTaskForRework && (
        <RejectReasonModal
          isOpen={!!selectedTaskForRework}
          onClose={() => setSelectedTaskForRework(null)}
          title="Request Rework from Repair Crew"
          subtitle={`Work Order #${selectedTaskForRework.id} · ${selectedTaskForRework.assignedTeamName}`}
          promptLabel="Rework Explanation & Defect Instructions"
          placeholder="e.g. Surface edges are not fully sealed; compaction depth has slight dip; gravel debris remains on shoulder..."
          onSubmit={handleRework}
          confirmButtonText="Submit Rework Request"
        />
      )}
    </div>
  );
};
