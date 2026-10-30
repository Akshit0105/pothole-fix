import React from 'react';
import type { ReportStatus, StatusHistoryEntry } from '../../types';

interface ReportEventTimelineProps {
  currentStatus: ReportStatus;
  history?: StatusHistoryEntry[];
  workOrderNumber?: string;
  assignedTeamName?: string;
}

interface StepDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  statusMatch: ReportStatus[];
}

const TIMELINE_STEPS: StepDefinition[] = [
  {
    id: 'step-1',
    label: 'Report Submitted',
    description: 'Citizen logged hazard photo with GPS coordinates',
    icon: 'camera_alt',
    statusMatch: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'RESOLVED'],
  },
  {
    id: 'step-2',
    label: 'Under Authority Review',
    description: 'Municipal triage desk reviewed defect imagery',
    icon: 'search_check',
    statusMatch: ['UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'RESOLVED'],
  },
  {
    id: 'step-3',
    label: 'Severity Assessed',
    description: 'Categorical risk tier evaluated for roadway safety',
    icon: 'priority_high',
    statusMatch: ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'RESOLVED'],
  },
  {
    id: 'step-4',
    label: 'Report Verified',
    description: 'Public Works confirmed physical defect',
    icon: 'verified',
    statusMatch: ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'RESOLVED'],
  },
  {
    id: 'step-5',
    label: 'Crew Assigned',
    description: 'Work order dispatched to field repair squad',
    icon: 'assignment_ind',
    statusMatch: ['ASSIGNED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'RESOLVED'],
  },
  {
    id: 'step-6',
    label: 'Repair Started',
    description: 'Crew on site, saw-cutting perimeter & preparing hot mix',
    icon: 'construction',
    statusMatch: ['IN_PROGRESS', 'AWAITING_APPROVAL', 'RESOLVED'],
  },
  {
    id: 'step-7',
    label: 'Repair Completed',
    description: 'Compacted asphalt patch placed flush with roadway',
    icon: 'task_alt',
    statusMatch: ['AWAITING_APPROVAL', 'RESOLVED'],
  },
  {
    id: 'step-8',
    label: 'Awaiting Approval',
    description: 'Post-repair photographic proof submitted for audit',
    icon: 'fact_check',
    statusMatch: ['AWAITING_APPROVAL', 'RESOLVED'],
  },
  {
    id: 'step-9',
    label: 'Repair Approved',
    description: 'Municipal engineering Level-1 flush inspection pass',
    icon: 'verified_user',
    statusMatch: ['RESOLVED'],
  },
  {
    id: 'step-10',
    label: 'Case Closed',
    description: 'Work order closed & citizen resolution notice dispatched',
    icon: 'mark_email_read',
    statusMatch: ['RESOLVED'],
  },
];

export const ReportEventTimeline: React.FC<ReportEventTimelineProps> = ({
  currentStatus,
  history = [],
}) => {
  const isRejected = currentStatus === 'REJECTED';
  const isRework = currentStatus === 'REWORK_REQUIRED';

  // Determine which step is currently active
  const getStepState = (stepIndex: number) => {
    if (isRejected) {
      if (stepIndex <= 1) return 'completed';
      if (stepIndex === 2) return 'rejected';
      return 'pending';
    }

    if (currentStatus === 'RESOLVED') return 'completed';
    if (currentStatus === 'AWAITING_APPROVAL') {
      if (stepIndex <= 7) return 'completed';
      if (stepIndex === 8) return 'current';
      return 'pending';
    }
    if (currentStatus === 'IN_PROGRESS') {
      if (stepIndex <= 5) return 'completed';
      if (stepIndex === 6) return 'current';
      return 'pending';
    }
    if (currentStatus === 'ASSIGNED') {
      if (stepIndex <= 4) return 'completed';
      if (stepIndex === 5) return 'current';
      return 'pending';
    }
    if (currentStatus === 'VERIFIED') {
      if (stepIndex <= 3) return 'completed';
      if (stepIndex === 4) return 'current';
      return 'pending';
    }
    if (currentStatus === 'UNDER_REVIEW') {
      if (stepIndex <= 1) return 'completed';
      if (stepIndex === 2) return 'current';
      return 'pending';
    }
    // SUBMITTED
    if (stepIndex === 0) return 'completed';
    if (stepIndex === 1) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
        <div>
          <h4 className="text-sm font-bold text-on-surface">10-State Civic Resolution Lifecycle</h4>
          <p className="text-xs text-secondary">
            End-to-end transparent municipal audit tracking from street capture to case sign-off.
          </p>
        </div>
        {isRejected && (
          <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container text-xs font-bold">
            Report Rejected
          </span>
        )}
        {isRework && (
          <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold">
            Rework Dispatched
          </span>
        )}
      </div>

      {/* Stepper Grid / Flow */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/30">
        {TIMELINE_STEPS.map((step, idx) => {
          const state = getStepState(idx);

          // Find if there's a matching entry in statusHistory
          const historyEntry = history.find(
            (h) =>
              (idx === 0 && h.status === 'SUBMITTED') ||
              (idx === 3 && h.status === 'VERIFIED') ||
              (idx === 4 && h.status === 'ASSIGNED') ||
              (idx === 5 && h.status === 'IN_PROGRESS') ||
              (idx === 7 && h.status === 'AWAITING_APPROVAL') ||
              (idx === 9 && h.status === 'RESOLVED')
          );

          return (
            <div key={step.id} className="relative flex items-start gap-3 group">
              {/* Step Marker Dot / Icon */}
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors ${
                  state === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : state === 'current'
                    ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse'
                    : state === 'rejected'
                    ? 'bg-error text-white'
                    : 'bg-surface-container-highest text-secondary border border-outline-variant/50'
                }`}
              >
                {state === 'completed' ? (
                  <span className="material-symbols-outlined text-[13px]">check</span>
                ) : state === 'rejected' ? (
                  <span className="material-symbols-outlined text-[13px]">close</span>
                ) : (
                  idx + 1
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold block ${
                      state === 'completed'
                        ? 'text-on-surface'
                        : state === 'current'
                        ? 'text-primary'
                        : state === 'rejected'
                        ? 'text-error'
                        : 'text-secondary'
                    }`}
                  >
                    Step {idx + 1}: {step.label}
                  </span>
                  {historyEntry?.timestamp && (
                    <span className="text-[11px] font-mono text-secondary shrink-0">
                      {historyEntry.timestamp}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-secondary mt-0.5 leading-snug">
                  {step.description}
                </p>

                {historyEntry && (
                  <div className="mt-1.5 p-2 rounded bg-surface-container-low text-[11px] text-on-surface border border-outline-variant/20 space-y-0.5">
                    <span className="font-semibold text-primary block">
                      Actor: {historyEntry.actorName}
                    </span>
                    {historyEntry.note && <p className="text-secondary">{historyEntry.note}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
