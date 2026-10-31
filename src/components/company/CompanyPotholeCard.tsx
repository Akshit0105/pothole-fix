import React from 'react';
import type { CompanyPothole } from '../../types/company';

interface CompanyPotholeCardProps {
  pothole: CompanyPothole;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails?: (pothole: CompanyPothole) => void;
}

export const CompanyPotholeCard: React.FC<CompanyPotholeCardProps> = ({
  pothole,
  isSelected,
  onToggleSelect,
  onViewDetails,
}) => {
  const isEligible = pothole.eligibility === 'ELIGIBLE_VERIFIED';
  const isPendingVerification = pothole.eligibility === 'PENDING_VERIFICATION';
  const isAlreadySponsored = pothole.eligibility === 'ALREADY_SPONSORED';
  const isCompleted = pothole.eligibility === 'REPAIR_COMPLETED';

  const formatRoadCategory = (cat: string) => {
    switch (cat) {
      case 'NATIONAL_HIGHWAY':
        return 'National Highway';
      case 'STATE_HIGHWAY':
        return 'State Highway';
      case 'MAJOR_ARTERIAL':
        return 'Major Arterial';
      case 'COMMERCIAL_CORRIDOR':
        return 'Commercial Corridor';
      case 'URBAN_TRANSIT':
        return 'Urban Transit';
      default:
        return cat;
    }
  };

  const formatTrafficVolume = (vol: string) => {
    switch (vol) {
      case 'EXTREME_HIGHWAY':
        return 'High-Speed Freight';
      case 'HEAVY_COMMERCIAL':
        return 'Heavy Commercial';
      case 'MODERATE_URBAN':
        return 'Moderate Urban';
      default:
        return 'Transit Route';
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden bg-surface-container-lowest ${
        isSelected
          ? 'border-teal-500 shadow-md ring-2 ring-teal-500/20'
          : 'border-outline-variant/30 hover:border-outline-variant hover:shadow-md'
      }`}
    >
      <div>
        {/* Top Header Strip: Photo + Badges */}
        <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
          <img
            src={pothole.photoUrl}
            alt={pothole.roadName}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              // Graceful fallback to default asset
              (e.target as HTMLImageElement).src = '/photos/pothole-sector17.jpg';
            }}
          />

          {/* Top Left: Tracking Number & Road Category */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white font-mono text-[10px] font-bold">
              #{pothole.trackingNumber}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-primary-container text-on-primary font-bold text-[9px] uppercase tracking-wider shadow-xs">
              {formatRoadCategory(pothole.roadCategory)}
            </span>
          </div>

          {/* Top Right: Severity Badge */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
                pothole.severity === 'CRITICAL'
                  ? 'bg-rose-600 text-white'
                  : pothole.severity === 'HIGH'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {pothole.severity}
            </span>
          </div>

          {/* Bottom Banner: Authority Verification Status */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px]">
            <div className="flex items-center gap-1">
              <span
                className={`material-symbols-outlined text-[14px] ${
                  pothole.authorityVerified ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {pothole.authorityVerified ? 'verified' : 'hourglass_top'}
              </span>
              <span className="truncate max-w-[160px]">
                {pothole.authorityVerified
                  ? `Verified: ${pothole.verifiedBy || 'Municipal Authority'}`
                  : 'Pending Field Verification'}
              </span>
            </div>
            <span className="font-mono text-emerald-300 font-bold shrink-0">
              ₹{pothole.estimatedRepairCostINR.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          <div>
            <h4 className="text-sm font-bold text-on-surface leading-tight hover:text-primary transition-colors">
              {pothole.roadName}
            </h4>
            <p className="text-[11px] text-secondary mt-0.5 line-clamp-1">
              {pothole.locationName}
            </p>
          </div>

          {/* Key Metric Tags */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
              <span className="text-secondary block">Traffic Density</span>
              <span className="font-semibold text-on-surface">
                {formatTrafficVolume(pothole.trafficVolume)}
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
              <span className="text-secondary block">Reported On</span>
              <span className="font-semibold text-on-surface">
                {pothole.reportedDate}
              </span>
            </div>
          </div>

          {/* Eligibility Indicator Pill */}
          <div className="pt-1">
            {isEligible && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Authority Verified &amp; Eligible for CSR</span>
              </div>
            )}
            {isPendingVerification && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold">
                <span className="material-symbols-outlined text-[13px] text-amber-600">lock</span>
                <span>Pending Authority Review (Locked)</span>
              </div>
            )}
            {isAlreadySponsored && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-300 text-[10px] font-bold">
                <span className="material-symbols-outlined text-[13px] text-blue-600">handshake</span>
                <span>Sponsored by Corporate Partner</span>
              </div>
            )}
            {isCompleted && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-400 text-[10px] font-bold">
                <span className="material-symbols-outlined text-[13px] text-emerald-700">task_alt</span>
                <span>Level-1 Certified Restoration</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-outline-variant/20 flex items-center gap-2">
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(pothole)}
              className="p-2 rounded-xl text-secondary hover:text-on-surface hover:bg-surface-container border border-outline-variant/30 text-xs transition-colors shrink-0 cursor-pointer"
              title="Inspect Location & Engineering Specs"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
            </button>
          )}

          {isEligible ? (
            <button
              type="button"
              onClick={() => onToggleSelect(pothole.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700'
                  : 'bg-primary-container hover:bg-primary text-on-primary shadow-2xs'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isSelected ? 'check_box' : 'add_circle'}
              </span>
              <span>{isSelected ? 'Selected for Sponsorship' : 'Select for Sponsorship'}</span>
            </button>
          ) : isPendingVerification ? (
            <button
              type="button"
              disabled
              className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
              title="Only Municipal Authority certified defects can be selected for CSR sponsorship."
            >
              <span className="material-symbols-outlined text-[15px]">lock</span>
              <span>Awaiting Authority Verification</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">done_all</span>
              <span>{isCompleted ? 'Repair Completed' : 'Pledge Active'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
