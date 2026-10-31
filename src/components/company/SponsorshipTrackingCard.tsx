import React, { useState } from 'react';
import type { SponsorshipRequest, SponsorshipStatus } from '../../types/company';

interface SponsorshipTrackingCardProps {
  request: SponsorshipRequest;
  onRevise?: (request: SponsorshipRequest) => void;
}

export const SponsorshipTrackingCard: React.FC<SponsorshipTrackingCardProps> = ({ request, onRevise }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (status: SponsorshipStatus) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return {
          label: 'Pending Authority Review',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: 'hourglass_top',
        };
      case 'APPROVED':
        return {
          label: 'Approved by Authority',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: 'check_circle',
        };
      case 'ASSIGNED':
        return {
          label: 'Assigned for Repair',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          icon: 'assignment_ind',
        };
      case 'IN_PROGRESS':
        return {
          label: 'Repair In Progress',
          color: 'bg-teal-100 text-teal-800 border-teal-300',
          icon: 'construction',
        };
      case 'COMPLETED':
        return {
          label: 'Completed & Certified',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: 'verified',
        };
      case 'REJECTED':
        return {
          label: 'Rejected by Authority',
          color: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: 'cancel',
        };
      case 'CHANGES_REQUESTED':
        return {
          label: 'Changes Requested',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: 'edit_note',
        };
      default:
        return {
          label: status,
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: 'help',
        };
    }
  };

  const badge = getStatusBadge(request.status);

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs hover:shadow-md transition-all">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-outline-variant/20 bg-surface-container-low/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-extrabold text-sm text-on-surface bg-surface-container px-2.5 py-0.5 rounded-lg border border-outline-variant/30">
              #{request.id}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}
            >
              <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
          </div>

          <h4 className="text-base font-bold text-on-surface pt-0.5">
            {request.csrInitiativeName}
          </h4>
          <p className="text-xs text-secondary">
            Sponsored by <strong className="text-on-surface">{request.companyName}</strong> · Submitted {request.submittedAt}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
          <span className="text-[10px] text-secondary font-medium">Proposed Sponsorship</span>
          <span className="font-mono font-extrabold text-lg text-teal-600 dark:text-teal-400">
            ₹{(request.proposedAmountINR || request.totalEstimatedCostINR).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-secondary">
            Est. Repair: ₹{request.totalEstimatedCostINR.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Progress Timeline Section */}
      <div className="p-4 sm:p-5 border-b border-outline-variant/20 bg-surface-container-lowest">
        <div className="text-[11px] font-bold uppercase tracking-wider text-secondary mb-3">
          Road Repair Execution Workflow
        </div>

        {/* Responsive Horizontal / Vertical Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-1 relative">
          {request.timeline.map((step, idx) => {
            const isCompleted = step.completed;
            const isCurrent = step.isCurrent;

            return (
              <div
                key={step.stage}
                className={`relative p-2.5 rounded-xl border flex flex-col justify-between text-left transition-all ${
                  isCurrent
                    ? 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-500/60 shadow-xs ring-1 ring-teal-500/20'
                    : isCompleted
                    ? 'bg-surface-container-low/40 border-emerald-300 dark:border-emerald-800'
                    : 'bg-surface-container-low/20 border-outline-variant/20 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400">
                      0{idx + 1}
                    </span>
                    <span
                      className={`material-symbols-outlined text-[16px] ${
                        isCompleted
                          ? 'text-emerald-600'
                          : isCurrent
                          ? 'text-teal-600 animate-spin'
                          : 'text-slate-300'
                      }`}
                    >
                      {isCompleted ? 'check_circle' : isCurrent ? 'progress_activity' : 'radio_button_unchecked'}
                    </span>
                  </div>
                  <div
                    className={`font-bold text-[11px] leading-tight ${
                      isCurrent
                        ? 'text-teal-700 dark:text-teal-300'
                        : isCompleted
                        ? 'text-on-surface'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-secondary leading-snug">
                  {step.timestamp ? (
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 block font-semibold">
                      {step.timestamp}
                    </span>
                  ) : null}
                  <span className="line-clamp-2">{step.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Evidence Placeholder / Audit Details */}
      {request.status === 'COMPLETED' && request.completionEvidence && (
        <div className="p-4 sm:p-5 bg-emerald-500/5 border-b border-emerald-500/20">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Level-1 Municipal Completion &amp; Compaction Audit Passed
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {request.completionEvidence.certificateId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before Photo */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">
                Pre-Repair Hazard Record
              </span>
              <div className="aspect-16/10 rounded-xl overflow-hidden border border-rose-300 bg-slate-100">
                <img
                  src={request.completionEvidence.beforePhotoUrl}
                  alt="Pre-repair"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* After Photo */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                Post-Repair Saw-Cut Compaction
              </span>
              <div className="aspect-16/10 rounded-xl overflow-hidden border border-emerald-400 bg-slate-100 relative">
                <img
                  src={request.completionEvidence.afterPhotoUrl}
                  alt="Post-repair"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[9px] font-bold shadow-xs">
                  CERTIFIED PASS
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-secondary gap-2">
            <div>
              <span>Inspected by: </span>
              <strong className="text-on-surface">{request.completionEvidence.inspectedBy}</strong>
            </div>
            <div>
              <span>Certified on: </span>
              <strong className="text-on-surface">{request.completionEvidence.completionDate}</strong>
            </div>
          </div>
        </div>
      )}

      {/* In-Progress Crew Callout */}
      {request.status === 'IN_PROGRESS' && request.assignedCrewName && (
        <div className="p-3.5 sm:px-5 bg-teal-500/5 border-b border-teal-500/20 flex items-center justify-between text-xs text-secondary">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-[18px]">engineering</span>
            <span>
              Dispatched Field Squad:{' '}
              <strong className="text-on-surface">{request.assignedCrewName}</strong>
            </span>
          </div>
          <span className="font-semibold text-teal-700">Site saw-cut hot-mix underway</span>
        </div>
      )}

      {/* Changes Requested Callout */}
      {request.status === 'CHANGES_REQUESTED' && (
        <div className="p-3.5 sm:px-5 bg-purple-500/10 border-b border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-secondary gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-600 text-[18px]">edit_note</span>
            <span>
              Changes Required by Authority:{' '}
              <strong className="text-on-surface">{request.changesRequestedNotes || 'Please review and adjust your proposal.'}</strong>
            </span>
          </div>
          {onRevise && (
            <button
              type="button"
              onClick={() => onRevise(request)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              <span>Revise &amp; Resubmit</span>
            </button>
          )}
        </div>
      )}

      {/* Rejected Callout */}
      {request.status === 'REJECTED' && request.rejectionReason && (
        <div className="p-3.5 sm:px-5 bg-rose-500/10 border-b border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-secondary gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-[18px]">cancel</span>
            <span>
              Cancellation / Rejection Reason:{' '}
              <strong className="text-on-surface">{request.rejectionReason}</strong>
            </span>
          </div>
          <span className="font-semibold text-rose-700">Request Cancelled / Rejected</span>
        </div>
      )}

      {/* Potholes Covered Expandable Strip */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-on-surface">Sponsored Corridors ({request.potholes.length}):</span>
          {request.potholes.map((p) => (
            <span
              key={p.id}
              className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface"
            >
              #{p.trackingNumber} ({p.roadName.split(' ')[0]})
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 self-start sm:self-center transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Corridors' : 'Inspect Corridors'}</span>
          <span className="material-symbols-outlined text-[16px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {/* Expanded Pothole Details */}
      {isExpanded && (
        <div className="p-4 sm:p-5 pt-0 border-t border-outline-variant/10 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            {request.potholes.map((pothole) => (
              <div
                key={pothole.id}
                className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center gap-3 text-xs"
              >
                <div className="w-14 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                  <img
                    src={pothole.photoUrl}
                    alt={pothole.roadName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-on-surface">#{pothole.trackingNumber}</span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-surface-container-highest text-secondary uppercase">
                      {pothole.roadCategory.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="font-bold text-on-surface truncate mt-0.5">{pothole.roadName}</div>
                  <div className="text-[11px] text-secondary truncate">{pothole.locationName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
