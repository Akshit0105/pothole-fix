import React from 'react';
import type { ReportStatus, SeverityLevel } from '../../types';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<
    ReportStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    SUBMITTED: {
      label: 'Submitted',
      bg: 'bg-surface-container-low',
      text: 'text-secondary',
      border: 'border-outline-variant/30',
      dot: 'bg-secondary',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      bg: 'bg-primary-fixed/30',
      text: 'text-primary',
      border: 'border-primary-fixed-dim/40',
      dot: 'bg-primary',
    },
    VERIFIED: {
      label: 'Verified by Authority',
      bg: 'bg-primary-fixed/50',
      text: 'text-primary-container',
      border: 'border-primary-container/20',
      dot: 'bg-primary-container',
    },
    ASSIGNED: {
      label: 'Assigned to Crew',
      bg: 'bg-tertiary-fixed/40',
      text: 'text-tertiary',
      border: 'border-tertiary/20',
      dot: 'bg-tertiary',
    },
    IN_PROGRESS: {
      label: 'Repair In Progress',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    AWAITING_APPROVAL: {
      label: 'Awaiting Sign-off',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
    },
    REWORK_REQUIRED: {
      label: 'Rework Required',
      bg: 'bg-error-container/40',
      text: 'text-error',
      border: 'border-error/20',
      dot: 'bg-error',
    },
    RESOLVED: {
      label: 'Resolved & Closed',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-surface-container',
      text: 'text-secondary',
      border: 'border-outline-variant/40',
      dot: 'bg-secondary',
    },
  };

  const config = configs[status] || configs.SUBMITTED;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-label-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-label-sm font-semibold border ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel; size?: 'sm' | 'md' }> = ({
  severity,
  size = 'md',
}) => {
  const configs: Record<
    SeverityLevel,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    CRITICAL: {
      label: 'Critical Hazard',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
    HIGH: {
      label: 'High Severity',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
    },
    MODERATE: {
      label: 'Moderate Risk',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    MEDIUM: {
      label: 'Medium Risk',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    LOW: {
      label: 'Low / Monitor',
      bg: 'bg-surface-container',
      text: 'text-secondary',
      border: 'border-outline-variant/30',
      dot: 'bg-secondary',
    },
  };

  const config = configs[severity] || configs.LOW;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-label-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-label-sm font-semibold border ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
