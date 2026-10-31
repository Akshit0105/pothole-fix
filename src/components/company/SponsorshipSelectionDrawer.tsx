import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CompanyPothole } from '../../types/company';

interface SponsorshipSelectionDrawerProps {
  selectedPotholes: CompanyPothole[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onSubmitRequest: () => void;
}

export const SponsorshipSelectionDrawer: React.FC<SponsorshipSelectionDrawerProps> = ({
  selectedPotholes,
  onRemoveItem,
  onClearAll,
  onSubmitRequest,
}) => {
  const totalCost = selectedPotholes.reduce((sum, p) => sum + p.estimatedRepairCostINR, 0);

  return (
    <AnimatePresence>
      {selectedPotholes.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-teal-500/30 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-4 sm:p-5"
        >
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Summary Count & Chips */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span>{selectedPotholes.length} Road Defect{selectedPotholes.length > 1 ? 's' : ''} Selected</span>
                </span>

                <span className="text-xs text-secondary">
                  Estimated CSR Allocation:{' '}
                  <strong className="text-on-surface font-mono font-bold text-sm">
                    ₹{totalCost.toLocaleString('en-IN')}
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[11px] text-secondary hover:text-error underline transition-colors cursor-pointer ml-1"
                >
                  Clear Selection
                </button>
              </div>

              {/* Scrollable list of selected items */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 pr-2 no-scrollbar">
                {selectedPotholes.map((pothole) => (
                  <div
                    key={pothole.id}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-xs shrink-0 shadow-2xs group"
                  >
                    <span className="font-mono font-bold text-[11px] text-on-surface">
                      #{pothole.trackingNumber}
                    </span>
                    <span className="text-secondary text-[11px] truncate max-w-[140px] sm:max-w-[180px]">
                      {pothole.roadName}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                        pothole.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pothole.severity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(pothole.id)}
                      className="p-0.5 rounded-md text-secondary hover:text-error hover:bg-surface-variant transition-colors cursor-pointer"
                      title="Remove from sponsorship selection"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Submit Button */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onSubmitRequest}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-sm shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <span>Submit Sponsorship Request</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
