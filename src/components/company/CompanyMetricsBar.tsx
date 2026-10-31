import React from 'react';
import type { CompanyDashboardMetrics } from '../../types/company';

interface CompanyMetricsBarProps {
  metrics: CompanyDashboardMetrics;
  onFilterEligible?: () => void;
  onFilterHighSeverity?: () => void;
  onFilterSelected?: () => void;
  onFilterActive?: () => void;
  onFilterCompleted?: () => void;
}

export const CompanyMetricsBar: React.FC<CompanyMetricsBarProps> = ({
  metrics,
  onFilterEligible,
  onFilterHighSeverity,
  onFilterSelected,
  onFilterActive,
  onFilterCompleted,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* 1. Total Eligible Potholes */}
      <button
        type="button"
        onClick={onFilterEligible}
        className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[19px]">verified_user</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Authority Verified
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-on-surface font-display-hero">
          {metrics.totalEligibleCount}
        </div>
        <div className="text-xs font-semibold text-secondary mt-0.5">
          Total Eligible Potholes
        </div>
        <div className="text-[11px] text-slate-400 mt-1 leading-tight">
          Certified by Municipal Works
        </div>
      </button>

      {/* 2. High-Severity Potholes */}
      <button
        type="button"
        onClick={onFilterHighSeverity}
        className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-error/50 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="w-8 h-8 rounded-xl bg-error/10 text-error flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[19px]">warning</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-error bg-error/10 px-2 py-0.5 rounded-full">
            Priority Triage
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-error font-display-hero">
          {metrics.highSeverityCount}
        </div>
        <div className="text-xs font-semibold text-secondary mt-0.5">
          High-Severity Craters
        </div>
        <div className="text-[11px] text-slate-400 mt-1 leading-tight">
          Arterial transit risks
        </div>
      </button>

      {/* 3. Potholes Selected for Sponsorship */}
      <button
        type="button"
        onClick={onFilterSelected}
        className={`p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
          metrics.selectedCount > 0
            ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-500/50 shadow-sm ring-1 ring-teal-500/20'
            : 'bg-surface-container-lowest border-outline-variant/30 hover:border-teal-500/40 shadow-xs hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[19px]">checklist</span>
          </span>
          {metrics.selectedCount > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full animate-pulse">
              Active Pledge
            </span>
          )}
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 font-display-hero">
          {metrics.selectedCount}
        </div>
        <div className="text-xs font-semibold text-secondary mt-0.5">
          Selected for Sponsorship
        </div>
        <div className="text-[11px] text-slate-400 mt-1 leading-tight">
          Ready for CSR submission
        </div>
      </button>

      {/* 4. Active Sponsorship Requests */}
      <button
        type="button"
        onClick={onFilterActive}
        className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[19px]">pending_actions</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            In Workflow
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-display-hero">
          {metrics.activeSponsorshipsCount}
        </div>
        <div className="text-xs font-semibold text-secondary mt-0.5">
          Active Sponsorships
        </div>
        <div className="text-[11px] text-slate-400 mt-1 leading-tight">
          Pending / In Progress
        </div>
      </button>

      {/* 5. Completed Sponsored Repairs */}
      <button
        type="button"
        onClick={onFilterCompleted}
        className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer col-span-2 sm:col-span-1"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[19px]">task_alt</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Level-1 Certified
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-display-hero">
          {metrics.completedRepairsCount}
        </div>
        <div className="text-xs font-semibold text-secondary mt-0.5">
          Completed Sponsored Repairs
        </div>
        <div className="text-[11px] text-slate-400 mt-1 leading-tight">
          Certified by Commissioner
        </div>
      </button>
    </div>
  );
};
