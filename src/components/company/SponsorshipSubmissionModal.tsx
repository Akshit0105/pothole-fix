import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Building2,
  CheckCircle,
  Send,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import type { CompanyPothole, SponsorshipRequest } from '../../types/company';

interface SponsorshipSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  potholes?: CompanyPothole[];
  selectedPotholes?: CompanyPothole[];
  companyName?: string;
  companyEmail?: string;
  companyProfile?: any;
  existingProposal?: SponsorshipRequest | null;
  onRemovePothole?: (id: string) => void;
  onSubmit: (data: {
    proposedAmountINR: number;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    csrBudgetYear: string;
    notes?: string;
  }) => Promise<void> | void;
  onSuccessRedirect?: () => void;
}

export const SponsorshipSubmissionModal: React.FC<SponsorshipSubmissionModalProps> = ({
  isOpen,
  onClose,
  potholes,
  selectedPotholes,
  companyName,
  companyEmail,
  companyProfile,
  existingProposal = null,
  onRemovePothole,
  onSubmit,
  onSuccessRedirect,
}) => {
  const isRevision = !!existingProposal;
  const activePotholes = potholes || selectedPotholes || (existingProposal ? existingProposal.potholes : []);
  const effectiveCompanyName = companyName || companyProfile?.companyName || 'Corporate Partner';
  const effectiveCompanyEmail = companyEmail || companyProfile?.email || 'csr.roads@partner.org';

  // Calculate default estimated cost
  const defaultEstimatedCost = activePotholes.reduce((acc, p) => acc + (p.estimatedRepairCostINR || 0), 0);

  const [proposedAmount, setProposedAmount] = useState<number | string>(
    existingProposal ? existingProposal.proposedAmountINR : defaultEstimatedCost
  );
  const [contactName, setContactName] = useState(
    existingProposal?.contactPerson || 'CSR Program Director'
  );
  const [contactEmail, setContactEmail] = useState(
    existingProposal?.contactEmail || effectiveCompanyEmail
  );
  const [contactPhone, setContactPhone] = useState(
    existingProposal?.contactPhone || '+91 98765 43210'
  );
  const [csrBudgetYear, setCsrBudgetYear] = useState('FY 2026-27');
  const [notes, setNotes] = useState(
    existingProposal?.notes || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedSnapshot, setSubmittedSnapshot] = useState<{
    id?: string;
    count: number;
    proposedAmountINR: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if modal reopens or proposal changes
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setSubmittedSnapshot(null);
      setErrorMsg(null);
      if (existingProposal) {
        setProposedAmount(existingProposal.proposedAmountINR);
        setContactName(existingProposal.contactPerson || 'CSR Program Director');
        setContactEmail(existingProposal.contactEmail || effectiveCompanyEmail);
        setContactPhone(existingProposal.contactPhone || '+91 98765 43210');
        setNotes(existingProposal.notes || '');
      } else {
        const est = activePotholes.reduce((acc, p) => acc + (p.estimatedRepairCostINR || 0), 0);
        setProposedAmount(est > 0 ? est : 25000);
        setContactEmail(effectiveCompanyEmail);
      }
    }
  }, [isOpen, existingProposal, activePotholes, effectiveCompanyEmail]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const numericAmount = typeof proposedAmount === 'string' ? parseFloat(proposedAmount) || 0 : proposedAmount;
  const isAmountValid = numericAmount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAmountValid) {
      setErrorMsg('Please enter a valid proposed sponsorship amount greater than ₹0.');
      return;
    }
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setErrorMsg('Please fill in all required contact details.');
      return;
    }

    const capturedCount = activePotholes.length;
    const capturedAmount = numericAmount;

    setIsSubmitting(true);
    try {
      await onSubmit({
        proposedAmountINR: numericAmount,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        csrBudgetYear,
        notes: notes.trim()
      });
      setSubmittedSnapshot({
        id: existingProposal?.id,
        count: capturedCount,
        proposedAmountINR: capturedAmount,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              {isRevision ? <Edit3 className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {isRevision ? 'Revise & Resubmit Sponsorship Proposal' : 'Submit CSR Sponsorship Proposal'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRevision
                  ? `Updating Proposal Ref: #${existingProposal.id}`
                  : `Initiating formal sponsorship on behalf of ${effectiveCompanyName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isRevision ? 'Proposal Successfully Revised!' : 'Proposal Submitted Successfully!'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
              {isRevision
                ? `Your updated sponsorship proposal (#${existingProposal?.id}) has been resubmitted to the Municipal Road Maintenance Authority for approval.`
                : 'Your formal CSR sponsorship request has been forwarded to the Municipal Authority. You can track review progress in your Sponsorships dashboard.'}
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-md text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Proposed Amount:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  ₹{(submittedSnapshot?.proposedAmountINR ?? numericAmount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Potholes Selected:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {submittedSnapshot?.count ?? activePotholes.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  PENDING APPROVAL
                </span>
              </div>
            </div>
            <div className="pt-4 flex gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onSuccessRedirect) onSuccessRedirect();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all text-sm cursor-pointer"
              >
                Done & View Sponsorships
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {errorMsg && (
                <div className="p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Selected Potholes Summary */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Target Potholes to Sponsor ({activePotholes.length})
                </label>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30 max-h-44 overflow-y-auto">
                  {activePotholes.map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{p.roadName || p.locationName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                            {p.id}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] truncate max-w-sm">
                          {p.locationName ? `${p.locationName}, ${p.city}` : `${p.city}, ${p.state}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-slate-500 text-[10px]">Est. Cost</div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            ₹{p.estimatedRepairCostINR.toLocaleString('en-IN')}
                          </div>
                        </div>
                        {onRemovePothole && activePotholes.length > 1 && !isRevision && (
                          <button
                            type="button"
                            onClick={() => onRemovePothole(p.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Remove from selection"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown: Estimated Cost vs Custom Proposed Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                    Total Estimated Repair Cost
                  </span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    ₹{defaultEstimatedCost.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Municipal engineering estimate based on repair methodology.
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/60">
                  <label
                    htmlFor="proposed-amount-input"
                    className="text-xs text-blue-900 dark:text-blue-300 block font-semibold"
                  >
                    Proposed Sponsorship Amount (₹) *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-sm font-semibold">
                      ₹
                    </span>
                    <input
                      id="proposed-amount-input"
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={proposedAmount}
                      onChange={(e) => setProposedAmount(e.target.value)}
                      placeholder="e.g. 98000"
                      className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1">
                    Your CSR commitment amount for this repair package.
                  </p>
                </div>
              </div>

              {/* Contact Information & CSR Year */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  CSR Contact & Verification
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      CSR Contact Officer *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contact officer name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Official CSR Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="csr.lead@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      CSR Budget Year
                    </label>
                    <select
                      value={csrBudgetYear}
                      onChange={(e) => setCsrBudgetYear(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FY 2026-27">FY 2026-27 (Current)</option>
                      <option value="FY 2025-26">FY 2025-26</option>
                      <option value="FY 2027-28">FY 2027-28</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Special Instructions / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Additional Notes / CSR Special Requests
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Requesting joint inspection with our CSR representative before asphalt laying..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Proposals are securely transmitted to the Municipal Authority. Repair crew assignment begins upon municipal sign-off.
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isAmountValid}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{isRevision ? 'Resubmit Proposal' : 'Submit Proposal for Approval'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
