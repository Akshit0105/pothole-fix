import React from 'react';
import type { CompanyPothole } from '../../types/company';

interface CompanyPotholeTableProps {
  potholes: CompanyPothole[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAllEligible: () => void;
  onClearSelection: () => void;
  onViewDetails?: (pothole: CompanyPothole) => void;
}

export const CompanyPotholeTable: React.FC<CompanyPotholeTableProps> = ({
  potholes,
  selectedIds,
  onToggleSelect,
  onSelectAllEligible,
  onClearSelection,
  onViewDetails,
}) => {
  const eligiblePotholes = potholes.filter((p) => p.eligibility === 'ELIGIBLE_VERIFIED');
  const allEligibleSelected =
    eligiblePotholes.length > 0 &&
    eligiblePotholes.every((p) => selectedIds.includes(p.id));

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
      default:
        return cat;
    }
  };

  return (
    <div className="rounded-2xl border border-outline-variant/30 overflow-hidden bg-surface-container-lowest shadow-xs">
      {/* Table Toolbar */}
      <div className="p-3.5 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between gap-3 flex-wrap text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-on-surface">
            Showing {potholes.length} Road Corridors
          </span>
          <span className="text-secondary">·</span>
          <span className="text-secondary font-medium">
            {eligiblePotholes.length} Verified for Sponsorship
          </span>
        </div>

        <div className="flex items-center gap-2">
          {eligiblePotholes.length > 0 && (
            <button
              type="button"
              onClick={allEligibleSelected ? onClearSelection : onSelectAllEligible}
              className="px-2.5 py-1 rounded-lg border border-outline-variant/40 bg-surface hover:bg-surface-variant text-on-surface text-[11px] font-semibold transition-colors cursor-pointer"
            >
              {allEligibleSelected ? 'Deselect All' : `Select All Eligible (${eligiblePotholes.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low/50 text-[11px] font-bold uppercase tracking-wider text-secondary">
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allEligibleSelected}
                  onChange={allEligibleSelected ? onClearSelection : onSelectAllEligible}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  title="Select / Deselect all eligible potholes"
                />
              </th>
              <th className="py-3 px-3">Pothole Defect</th>
              <th className="py-3 px-3">Location &amp; Road Category</th>
              <th className="py-3 px-3">AI Severity</th>
              <th className="py-3 px-3">Authority Verification</th>
              <th className="py-3 px-3 text-right">Est. CSR Cost</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {potholes.map((pothole) => {
              const isEligible = pothole.eligibility === 'ELIGIBLE_VERIFIED';
              const isSelected = selectedIds.includes(pothole.id);

              return (
                <tr
                  key={pothole.id}
                  className={`hover:bg-surface-container-low/60 transition-colors ${
                    isSelected ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3.5 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isEligible}
                      onChange={() => onToggleSelect(pothole.id)}
                      className={`rounded border-slate-300 text-teal-600 focus:ring-teal-500 ${
                        isEligible ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                      }`}
                    />
                  </td>

                  {/* Photo & ID */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 relative">
                        <img
                          src={pothole.photoUrl}
                          alt={pothole.roadName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/photos/pothole-sector17.jpg';
                          }}
                        />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-on-surface block">
                          #{pothole.trackingNumber}
                        </span>
                        <span className="text-[10px] text-secondary">
                          {pothole.dimensions || 'Standard Crater'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Road & Category */}
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-on-surface">{pothole.roadName}</div>
                    <div className="text-[11px] text-secondary truncate max-w-xs">
                      {pothole.locationName}
                    </div>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-surface-container text-secondary text-[10px] font-medium">
                      {formatRoadCategory(pothole.roadCategory)}
                    </span>
                  </td>

                  {/* AI Severity */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        pothole.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : pothole.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {pothole.severity}
                    </span>
                  </td>

                  {/* Authority Verification */}
                  <td className="py-3.5 px-3">
                    {pothole.authorityVerified ? (
                      <div className="flex items-center gap-1.5 text-emerald-700">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <div>
                          <span className="font-bold text-[11px] block">Verified &amp; Eligible</span>
                          <span className="text-[10px] text-secondary block">{pothole.verifiedBy || 'Municipal Works'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-700">
                        <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                        <div>
                          <span className="font-bold text-[11px] block">Pending Triage</span>
                          <span className="text-[10px] text-secondary block">Awaiting authority visit</span>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Est Cost */}
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-on-surface">
                    ₹{pothole.estimatedRepairCostINR.toLocaleString('en-IN')}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {onViewDetails && (
                        <button
                          type="button"
                          onClick={() => onViewDetails(pothole)}
                          className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                          title="Inspect Defect Telemetry"
                        >
                          <span className="material-symbols-outlined text-[17px]">visibility</span>
                        </button>
                      )}

                      {isEligible ? (
                        <button
                          type="button"
                          onClick={() => onToggleSelect(pothole.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-primary-container hover:bg-primary text-on-primary'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Locked
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
