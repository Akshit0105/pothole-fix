import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import type { SponsorshipRequest, CompanyPothole } from '../../types/company';
import { PotholeImage } from '../../components/common/PotholeImage';

export const AuthoritySponsorshipsPage: React.FC = () => {
  const [requests, setRequests] = useState<SponsorshipRequest[]>(() =>
    companyService.getSponsorshipRequests()
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SponsorshipRequest | null>(null);

  // Action Dialog States
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isChangesDialogOpen, setIsChangesDialogOpen] = useState(false);
  const [isPartialApproveDialogOpen, setIsPartialApproveDialogOpen] = useState(false);

  // Form states for modals
  const [rejectionReason, setRejectionReason] = useState('');
  const [changesNotes, setChangesNotes] = useState('');
  const [authorityReviewNotes, setAuthorityReviewNotes] = useState('');
  const [partiallySelectedPotholeIds, setPartiallySelectedPotholeIds] = useState<string[]>([]);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const reloadRequests = async () => {
    try {
      await companyService.syncWithBackend();
    } catch {}
    const updated = companyService.getSponsorshipRequests();
    setRequests(updated);
    if (selectedRequest) {
      const refreshedSelected = updated.find((r) => r.id === selectedRequest.id) || null;
      setSelectedRequest(refreshedSelected);
    }
  };

  useEffect(() => {
    reloadRequests();
    const handleUpdate = () => {
      const updated = companyService.getSponsorshipRequests();
      setRequests(updated);
      if (selectedRequest) {
        const refreshedSelected = updated.find((r) => r.id === selectedRequest.id) || null;
        setSelectedRequest(refreshedSelected);
      }
    };
    window.addEventListener('potholefix_sponsorships_updated', handleUpdate);
    return () => {
      window.removeEventListener('potholefix_sponsorships_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isApproveDialogOpen) setIsApproveDialogOpen(false);
        else if (isRejectDialogOpen) setIsRejectDialogOpen(false);
        else if (isChangesDialogOpen) setIsChangesDialogOpen(false);
        else if (isPartialApproveDialogOpen) setIsPartialApproveDialogOpen(false);
        else if (selectedRequest) setSelectedRequest(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isApproveDialogOpen, isRejectDialogOpen, isChangesDialogOpen, isPartialApproveDialogOpen, selectedRequest]);

  const metrics = useMemo(() => {
    return companyService.getAuthoritySponsorshipMetrics();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          r.id.toLowerCase().includes(q) ||
          r.companyName.toLowerCase().includes(q) ||
          r.contactPerson.toLowerCase().includes(q) ||
          r.potholes.some(
            (p) =>
              p.id.toLowerCase().includes(q) ||
              p.roadName.toLowerCase().includes(q) ||
              p.locationName.toLowerCase().includes(q)
          );
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  // Validation helper for selected request
  const currentValidation = useMemo(() => {
    if (!selectedRequest) return null;
    return companyService.validateRequestForApproval(selectedRequest);
  }, [selectedRequest]);

  // Handle Approve Action
  const handleApproveConfirm = () => {
    if (!selectedRequest) return;
    const res = companyService.approveSponsorshipRequest(
      selectedRequest.id,
      'Alice Sharma (Municipal Commissioner)',
      authorityReviewNotes || 'Sanctioned for PWD work order dispatch.'
    );

    if (res.success) {
      setFeedbackNotice({
        type: 'success',
        message: `Proposal #${selectedRequest.id} APPROVED! Work orders validated for dispatch. Note: Corporate funding verification pending.`,
      });
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setAuthorityReviewNotes('');
      reloadRequests();
      setTimeout(() => setFeedbackNotice(null), 6000);
    } else {
      setFeedbackNotice({
        type: 'error',
        message: res.error || 'Validation failed. This proposal cannot be approved.',
      });
    }
  };

  // Handle Reject Action
  const handleRejectConfirm = () => {
    if (!selectedRequest) return;
    const reason = rejectionReason.trim() || 'Cancelled / Rejected by Municipal Authority';
    const res = companyService.rejectSponsorshipRequest(
      selectedRequest.id,
      reason,
      'Alice Sharma (Municipal Commissioner)'
    );

    if (res.success) {
      setFeedbackNotice({
        type: 'success',
        message: `Proposal #${selectedRequest.id} cancelled/rejected. Record preserved under Rejected history.`,
      });
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
      reloadRequests();
      setTimeout(() => setFeedbackNotice(null), 6000);
    } else {
      setFeedbackNotice({
        type: 'error',
        message: res.error || 'Rejection failed.',
      });
    }
  };

  // Handle Request Changes Action
  const handleChangesConfirm = () => {
    if (!selectedRequest || !changesNotes.trim()) return;
    const res = companyService.requestChangesForSponsorship(
      selectedRequest.id,
      changesNotes.trim(),
      'Alice Sharma (Municipal Commissioner)'
    );

    if (res.success) {
      setFeedbackNotice({
        type: 'success',
        message: `Changes requested for proposal #${selectedRequest.id}. Feedback recorded and status updated.`,
      });
      setIsChangesDialogOpen(false);
      setSelectedRequest(null);
      setChangesNotes('');
      reloadRequests();
      setTimeout(() => setFeedbackNotice(null), 6000);
    } else {
      setFeedbackNotice({
        type: 'error',
        message: res.error || 'Operation failed.',
      });
    }
  };

  // Handle Partial Approve Confirm
  const handlePartialApproveConfirm = () => {
    if (!selectedRequest || partiallySelectedPotholeIds.length === 0) return;
    const res = companyService.partiallyApproveSponsorship(
      selectedRequest.id,
      partiallySelectedPotholeIds,
      'Alice Sharma (Municipal Commissioner)',
      authorityReviewNotes || `Partially sanctioned (${partiallySelectedPotholeIds.length} defects).`
    );

    if (res.success) {
      setFeedbackNotice({
        type: 'success',
        message: `Proposal #${selectedRequest.id} partially approved (${partiallySelectedPotholeIds.length} defects sanctioned). Excluded defects freed for adoption.`,
      });
      setIsPartialApproveDialogOpen(false);
      setSelectedRequest(null);
      setPartiallySelectedPotholeIds([]);
      setAuthorityReviewNotes('');
      reloadRequests();
      setTimeout(() => setFeedbackNotice(null), 6000);
    } else {
      setFeedbackNotice({
        type: 'error',
        message: res.error || 'Partial approval failed.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return {
          label: 'Pending Authority Review',
          color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
          icon: 'hourglass_top',
        };
      case 'APPROVED':
        return {
          label: 'Approved by Authority',
          color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300',
          icon: 'check_circle',
        };
      case 'CHANGES_REQUESTED':
        return {
          label: 'Changes Requested',
          color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300',
          icon: 'edit_note',
        };
      case 'ASSIGNED':
        return {
          label: 'Assigned for Repair',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300',
          icon: 'assignment_ind',
        };
      case 'IN_PROGRESS':
        return {
          label: 'Repair In Progress',
          color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300',
          icon: 'engineering',
        };
      case 'COMPLETED':
        return {
          label: 'Completed & Certified',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
          icon: 'verified',
        };
      case 'REJECTED':
        return {
          label: 'Rejected by Authority',
          color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300',
          icon: 'cancel',
        };
      default:
        return {
          label: status,
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: 'help',
        };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Feedback Banner */}
      {feedbackNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md animate-fadeIn ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              {feedbackNotice.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="font-semibold">{feedbackNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-xs font-bold px-2 py-1 hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Shared Environment Disclaimer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-wider">
              Municipal CSR Triage Desk
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-mono border border-outline-variant/30">
              Demo Environment · Shared Frontend Contract
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Corporate Sponsorship Proposals
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-1 max-w-2xl">
            Review corporate CSR road adoption proposals, validate defect eligibility, grant municipal sanction, and dispatch repair squad work orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/company"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs border border-outline-variant/40 flex items-center gap-1.5 transition-all shadow-xs"
            title="Open Public Company Portal in new tab"
          >
            <span className="material-symbols-outlined text-[17px] text-teal-600">domain</span>
            <span>View Company Portal</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </Link>

          <button
            type="button"
            onClick={reloadRequests}
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary hover:text-on-surface border border-outline-variant/30 transition-all cursor-pointer"
            title="Refresh proposal queue"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* 1.2 SPONSORSHIP OVERVIEW: 6 RESPONSIVE KPI CARDS */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Requests */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-primary/5 border-primary shadow-xs'
              : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
          }`}
        >
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="text-[11px] font-bold">Total Proposals</span>
            <span className="material-symbols-outlined text-[18px] text-primary">folder</span>
          </div>
          <div className="text-2xl font-black text-on-surface">{metrics.totalRequests}</div>
          <span className="text-[10px] text-secondary font-medium">All logged pledges</span>
        </div>

        {/* Card 2: Pending Review (Highlight) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('PENDING_APPROVAL')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            statusFilter === 'PENDING_APPROVAL'
              ? 'bg-amber-500/10 border-amber-500 shadow-xs'
              : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-bold">Pending Review</span>
            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {metrics.pendingCount}
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
            Requires Triage
          </span>
        </div>

        {/* Card 3: Approved Requests */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            statusFilter === 'APPROVED'
              ? 'bg-blue-500/10 border-blue-500 shadow-xs'
              : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
          }`}
        >
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1">
            <span className="text-[11px] font-bold">Approved</span>
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {metrics.approvedCount}
          </div>
          <span className="text-[10px] text-secondary font-medium">Sanctioned</span>
        </div>

        {/* Card 4: Rejected Requests */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-500/10 border-rose-500 shadow-xs'
              : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
            <span className="text-[11px] font-bold">Rejected</span>
            <span className="material-symbols-outlined text-[18px]">cancel</span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {metrics.rejectedCount}
          </div>
          <span className="text-[10px] text-secondary font-medium">Freed for adoption</span>
        </div>

        {/* Card 5: Active Sponsored Repairs */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            statusFilter === 'IN_PROGRESS' || statusFilter === 'ASSIGNED'
              ? 'bg-indigo-500/10 border-indigo-500 shadow-xs'
              : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 mb-1">
            <span className="text-[11px] font-bold">Active in Field</span>
            <span className="material-symbols-outlined text-[18px]">construction</span>
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {metrics.activeRepairsCount}
          </div>
          <span className="text-[10px] text-secondary font-medium">Assigned to squads</span>
        </div>

        {/* Card 6: Completed Sponsored Repairs */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            statusFilter === 'COMPLETED'
              ? 'bg-emerald-500/10 border-emerald-500 shadow-xs'
              : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-bold">Completed</span>
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.completedRepairsCount}
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
            Level-1 Certified
          </span>
        </div>
      </section>

      {/* 1.3 SPONSORSHIP REQUEST LIST: SEARCH & STATUS FILTERS */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Request ID (CSR-2026-...), company, corridor name, or contact person..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-xs text-secondary font-medium shrink-0 self-center">
              Showing <strong className="text-on-surface">{filteredRequests.length}</strong> of {requests.length} requests
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'ALL', label: 'All Requests' },
              { id: 'PENDING_APPROVAL', label: 'Pending Review', highlight: true },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'CHANGES_REQUESTED', label: 'Changes Requested' },
              { id: 'ASSIGNED', label: 'Assigned' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              const count =
                tab.id === 'ALL'
                  ? requests.length
                  : requests.filter((r) => r.status === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-variant/30'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Requests Table / Card List */}
        {filteredRequests.length > 0 ? (
          <div className="space-y-3">
            {filteredRequests.map((request) => {
              const badge = getStatusBadge(request.status);
              const isSelected = selectedRequest?.id === request.id;

              return (
                <div
                  key={request.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all bg-surface-container-lowest ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 shadow-md'
                      : 'border-outline-variant/30 hover:border-outline-variant/80 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: ID & Company Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-extrabold text-on-surface">
                          #{request.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {badge.icon}
                          </span>
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-[11px] text-secondary">
                          Submitted: {request.submittedAt}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-on-surface">
                          {request.companyName}
                        </h4>
                        <p className="text-xs text-secondary">
                          Initiative: <strong className="text-on-surface font-semibold">{request.csrInitiativeName}</strong> · Contact: {request.contactPerson} ({request.contactEmail} · {request.contactPhone})
                        </p>
                      </div>

                      {/* Selected Potholes Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] font-semibold text-secondary">
                          {request.potholes.length} Road Defect(s):
                        </span>
                        {request.potholes.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container text-[10px] font-mono font-bold text-on-surface border border-outline-variant/30"
                          >
                            <span>#{p.trackingNumber}</span>
                            <span className="text-secondary font-normal font-sans truncate max-w-[120px]">
                              {p.roadName}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Budget & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-outline-variant/20">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-secondary block lg:text-right">
                          Proposed Sponsorship Budget
                        </span>
                        <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 block lg:text-right">
                          ₹{request.totalEstimatedCostINR.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAuthorityReviewNotes('');
                          }}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          title="View and inspect proposal details"
                          aria-label="View / Inspect Proposal"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          <span>View / Inspect Proposal</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
            <span className="material-symbols-outlined text-5xl text-secondary">inbox</span>
            <h3 className="text-lg font-bold text-on-surface">No sponsorship requests found</h3>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              No corporate sponsorship proposals match your current filter criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-container border border-outline-variant text-xs font-bold text-secondary cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 1.4 & 1.5 REQUEST DETAILS DRAWER / MODAL */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRequest(null);
          }}
        >
          <div
            className="bg-surface rounded-3xl border border-outline-variant/40 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-outline-variant/30 flex items-center justify-between gap-4 bg-surface-container-lowest shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-base font-extrabold text-on-surface">
                    #{selectedRequest.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      getStatusBadge(selectedRequest.status).color
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {getStatusBadge(selectedRequest.status).icon}
                    </span>
                    <span>{getStatusBadge(selectedRequest.status).label}</span>
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-on-surface">
                  {selectedRequest.companyName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-xl hover:bg-surface-variant text-secondary hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Proposal Overview Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs">
                <div>
                  <span className="text-secondary block">Initiative:</span>
                  <span className="font-bold text-on-surface">{selectedRequest.csrInitiativeName}</span>
                </div>
                <div>
                  <span className="text-secondary block">Contact Person:</span>
                  <span className="font-bold text-on-surface">{selectedRequest.contactPerson}</span>
                  <span className="text-[11px] text-secondary block">{selectedRequest.contactEmail} · {selectedRequest.contactPhone}</span>
                </div>
                <div>
                  <span className="text-secondary block">Financial Commitment:</span>
                  <div className="font-mono font-black text-emerald-600 text-sm">
                    ₹{(selectedRequest.proposedAmountINR || selectedRequest.totalEstimatedCostINR).toLocaleString('en-IN')}
                    <span className="text-[10px] text-secondary font-normal ml-1.5">
                      (Est: ₹{selectedRequest.totalEstimatedCostINR.toLocaleString('en-IN')})
                    </span>
                  </div>
                </div>
              </div>

              {/* Changes Requested Callout */}
              {selectedRequest.changesRequestedNotes && (
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-purple-800 dark:text-purple-300">
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    <span>Changes Required by Municipal Authority</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-purple-950 dark:text-purple-100 font-medium">
                    {selectedRequest.changesRequestedNotes}
                  </p>
                </div>
              )}

              {/* Cancellation / Rejection Reason Callout */}
              {selectedRequest.rejectionReason && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    <span>Proposal Cancellation / Rejection Reason</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-rose-950 dark:text-rose-100 font-medium">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              {/* Validation Warning / Error Callout */}
              {currentValidation && !currentValidation.isValid && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                    <span className="material-symbols-outlined text-[18px]">gpp_bad</span>
                    <span>Prerequisite Validation Issues Identified</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {currentValidation.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentValidation && currentValidation.warnings.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    <span>Inter-Jurisdictional Advisory Notes</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {currentValidation.warnings.map((warn, idx) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Selected Road Corridors Inspection */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">add_road</span>
                  <span>Selected Road Defects &amp; Engineering Records ({selectedRequest.potholes.length})</span>
                </h4>

                <div className="space-y-3">
                  {selectedRequest.potholes.map((pothole: CompanyPothole) => (
                    <div
                      key={pothole.id}
                      className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col md:flex-row items-start gap-4"
                    >
                      {/* Photo Thumbnail */}
                      <div className="w-28 h-20 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/30 relative">
                        <PotholeImage
                          src={pothole.photoUrl}
                          alt={pothole.roadName}
                          className="w-full h-full object-cover"
                          fallbackType="critical"
                          showBadge={false}
                        />
                      </div>

                      {/* Specs */}
                      <div className="flex-1 min-w-0 space-y-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-on-surface">
                            #{pothole.trackingNumber}
                          </span>
                          <span className="px-2 py-0.2 rounded bg-surface-container-high text-[10px] font-bold text-primary">
                            {pothole.roadCategory.replace('_', ' ')}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                              pothole.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pothole.severity} SEVERITY
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              pothole.authorityVerified
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {pothole.authorityVerified ? 'Verified' : 'Pending Field Triage'}
                          </span>
                        </div>

                        <h5 className="font-bold text-sm text-on-surface">{pothole.roadName}</h5>
                        <p className="text-secondary">{pothole.locationName}</p>

                        <div className="flex items-center gap-4 text-[11px] text-secondary font-mono pt-1">
                          <span>GPS: {pothole.lat.toFixed(5)}° N, {pothole.lng.toFixed(5)}° E</span>
                          <span>Jurisdiction: {pothole.city}, {pothole.state}</span>
                        </div>
                      </div>

                      {/* Cost & Map Action */}
                      <div className="text-right shrink-0 space-y-2">
                        <span className="font-mono text-sm font-bold text-emerald-600 block">
                          ₹{pothole.estimatedRepairCostINR.toLocaleString('en-IN')}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${pothole.lat},${pothole.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-[14px]">map</span>
                          <span>Inspect GIS Map</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer / Decision History Strip */}
              {(selectedRequest.authorityReviewDate || selectedRequest.rejectionReason || selectedRequest.changesRequestedNotes) && (
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs space-y-1">
                  <span className="font-bold text-on-surface block">Decision History:</span>
                  {selectedRequest.authorityReviewerName && (
                    <p className="text-secondary">
                      Reviewed by <strong className="text-on-surface">{selectedRequest.authorityReviewerName}</strong>
                      {selectedRequest.authorityReviewDate ? ` on ${selectedRequest.authorityReviewDate}` : ''}.
                    </p>
                  )}
                  {selectedRequest.authorityNotes && (
                    <p className="italic text-on-surface">"{selectedRequest.authorityNotes}"</p>
                  )}
                  {selectedRequest.rejectionReason && (
                    <p className="text-rose-600 font-semibold">Rejection Reason: {selectedRequest.rejectionReason}</p>
                  )}
                  {selectedRequest.changesRequestedNotes && (
                    <p className="text-purple-600 font-semibold">Changes Required: {selectedRequest.changesRequestedNotes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-outline-variant/30 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-secondary hover:text-on-surface cursor-pointer"
              >
                Close Drawer
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedRequest.status === 'PENDING_APPROVAL' || selectedRequest.status === 'CHANGES_REQUESTED' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectionReason('');
                        setIsRejectDialogOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Cancel Request or Reject Proposal"
                    >
                      <span className="material-symbols-outlined text-[15px]">cancel</span>
                      <span>Cancel Request / Reject Proposal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setChangesNotes('');
                        setIsChangesDialogOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Request Changes"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit_note</span>
                      <span>Request Changes</span>
                    </button>

                    {selectedRequest.potholes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPartiallySelectedPotholeIds(selectedRequest.potholeIds);
                          setIsPartialApproveDialogOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        Partially Approve
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!currentValidation?.isValid}
                      onClick={() => setIsApproveDialogOpen(true)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Approve Sponsorship Request</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-secondary italic">
                    Decision already recorded ({getStatusBadge(selectedRequest.status).label})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: APPROVE SPONSORSHIP */}
      {isApproveDialogOpen && selectedRequest && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsApproveDialogOpen(false);
          }}
        >
          <div
            className="relative z-[80] bg-surface rounded-3xl border border-outline-variant/40 shadow-2xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-on-surface">Confirm Municipal Approval</h4>
                <p className="text-xs text-secondary">Work Order Sanction under Commissioner Review</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
              <span className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Important Funding Notice:</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                Approval validates the road defect engineering scope and authorizes repair squad dispatch. Approval does <strong>NOT</strong> automatically mean that CSR funds have been received.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-secondary">Proposal ID:</span>
                <span className="font-mono font-bold text-on-surface">{selectedRequest.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-secondary">Corporate Sponsor:</span>
                <span className="font-bold text-on-surface">{selectedRequest.companyName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-secondary">Sanctioned Corridors:</span>
                <span className="font-bold text-on-surface">{selectedRequest.potholes.length} Road Defect(s)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-secondary">Estimated Repair Cost:</span>
                <span className="font-mono font-semibold text-on-surface">₹{selectedRequest.totalEstimatedCostINR.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-secondary font-semibold">Proposed Sponsorship Amount:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ₹{(selectedRequest.proposedAmountINR || selectedRequest.totalEstimatedCostINR).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-secondary">Reviewing Authority:</span>
                <span className="font-semibold text-primary">Alice Sharma (Municipal Commissioner)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Sanction Notes / Work Order Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={authorityReviewNotes}
                onChange={(e) => setAuthorityReviewNotes(e.target.value)}
                placeholder="e.g. Cleared for saw-cut restoration. Dispatch Punjab PWD Unit 04..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsApproveDialogOpen(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-secondary hover:text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: CANCEL / REJECT SPONSORSHIP */}
      {isRejectDialogOpen && selectedRequest && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRejectDialogOpen(false);
          }}
        >
          <div
            className="relative z-[80] bg-surface rounded-3xl border border-outline-variant/40 shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-extrabold text-on-surface truncate">
                  Reject Sponsorship Proposal
                </h4>
                <p className="text-xs text-secondary truncate">
                  {selectedRequest.companyName} · <span className="font-mono font-bold">#{selectedRequest.id}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs sm:text-sm text-on-surface">
              <p className="font-semibold text-on-surface">
                Are you sure you want to cancel/reject this sponsorship request?
              </p>
              <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                This proposal will be removed from active/pending review and preserved under Rejected history. Sponsored defects will be returned to the open sponsorship pool.
              </p>
            </div>

            <div>
              <label htmlFor="rejection-reason-input" className="block text-xs font-semibold text-on-surface mb-1">
                Reason / Notes <span className="text-secondary font-normal">(Optional)</span>
              </label>
              <textarea
                id="rejection-reason-input"
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason for cancellation or rejection (optional)..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectDialogOpen(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-secondary hover:text-on-surface transition-all cursor-pointer"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT MODAL: REQUEST CHANGES */}
      {isChangesDialogOpen && selectedRequest && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsChangesDialogOpen(false);
          }}
        >
          <div
            className="relative z-[80] bg-surface rounded-3xl border border-outline-variant/40 shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
                <span className="material-symbols-outlined text-2xl">edit_note</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-extrabold text-on-surface truncate">
                  Request Changes
                </h4>
                <p className="text-xs text-secondary truncate">
                  Company: <strong className="text-on-surface font-semibold">{selectedRequest.companyName}</strong>
                </p>
                <p className="text-xs text-secondary font-mono">
                  Proposal Reference: <strong className="text-on-surface font-bold">#{selectedRequest.id}</strong>
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="changes-required-input" className="block text-xs font-semibold text-on-surface mb-1">
                Changes Required <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="changes-required-input"
                rows={3}
                required
                value={changesNotes}
                onChange={(e) => setChangesNotes(e.target.value)}
                placeholder="Explain what the company needs to correct or provide before approval..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsChangesDialogOpen(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-secondary hover:text-on-surface transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!changesNotes.trim()}
                onClick={handleChangesConfirm}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                Send Change Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: PARTIALLY APPROVE */}
      {isPartialApproveDialogOpen && selectedRequest && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPartialApproveDialogOpen(false);
          }}
        >
          <div
            className="relative z-[80] bg-surface rounded-3xl border border-outline-variant/40 shadow-2xl w-full max-w-lg p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">rule</span>
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-on-surface">Partially Approve Corridors</h4>
                <p className="text-xs text-secondary">Select which road defects to sanction from this proposal</p>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {selectedRequest.potholes.map((p) => {
                const isChecked = partiallySelectedPotholeIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 cursor-pointer hover:bg-surface-container text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setPartiallySelectedPotholeIds((prev) =>
                            prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          );
                        }}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <span className="font-bold text-on-surface">#{p.trackingNumber}</span> · {p.roadName}
                        <span className="block text-[11px] text-secondary">{p.locationName}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-600">
                      ₹{p.estimatedRepairCostINR.toLocaleString('en-IN')}
                    </span>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Partial Sanction Notes
              </label>
              <textarea
                rows={2}
                value={authorityReviewNotes}
                onChange={(e) => setAuthorityReviewNotes(e.target.value)}
                placeholder="e.g. Sanctioned urban corridor; highway stretch excluded pending NHAI clearance..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPartialApproveDialogOpen(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-secondary hover:text-on-surface cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={partiallySelectedPotholeIds.length === 0}
                onClick={handlePartialApproveConfirm}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Sanction {partiallySelectedPotholeIds.length} Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AuthoritySponsorshipsPage;
