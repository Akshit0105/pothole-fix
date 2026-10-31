import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { companyService } from '../../services/companyService';
import type { SponsorshipRequest } from '../../types/company';
import { SponsorshipTrackingCard } from '../../components/company/SponsorshipTrackingCard';
import { SponsorshipSubmissionModal } from '../../components/company/SponsorshipSubmissionModal';

export const CompanySponsorshipsPage: React.FC = () => {
  const { user } = useAuth();
  const [sponsorshipRequests, setSponsorshipRequests] = useState<SponsorshipRequest[]>(
    () => companyService.getSponsorshipRequests(user?.email)
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviseProposal, setReviseProposal] = useState<SponsorshipRequest | null>(null);

  const reloadData = () => {
    setSponsorshipRequests(companyService.getSponsorshipRequests(user?.email));
  };

  React.useEffect(() => {
    companyService.syncWithBackend(user?.email).then(() => {
      reloadData();
    }).catch(() => {});

    const handleUpdate = () => {
      reloadData();
    };
    window.addEventListener('potholefix_sponsorships_updated', handleUpdate);
    return () => {
      window.removeEventListener('potholefix_sponsorships_updated', handleUpdate);
    };
  }, [user?.email]);

  const filteredRequests = useMemo(() => {
    return sponsorshipRequests.filter((req) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ACTIVE') {
          if (req.status !== 'ASSIGNED' && req.status !== 'IN_PROGRESS') return false;
        } else if (req.status !== statusFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          req.id.toLowerCase().includes(q) ||
          req.companyName.toLowerCase().includes(q) ||
          req.contactPerson.toLowerCase().includes(q) ||
          req.potholes.some(
            (p) =>
              p.id.toLowerCase().includes(q) ||
              p.roadName.toLowerCase().includes(q) ||
              p.locationName.toLowerCase().includes(q)
          );
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [sponsorshipRequests, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    return {
      all: sponsorshipRequests.length,
      pending: sponsorshipRequests.filter((r) => r.status === 'PENDING_APPROVAL').length,
      changesRequested: sponsorshipRequests.filter((r) => r.status === 'CHANGES_REQUESTED').length,
      approved: sponsorshipRequests.filter((r) => r.status === 'APPROVED').length,
      active: sponsorshipRequests.filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS').length,
      assigned: sponsorshipRequests.filter((r) => r.status === 'ASSIGNED').length,
      inProgress: sponsorshipRequests.filter((r) => r.status === 'IN_PROGRESS').length,
      completed: sponsorshipRequests.filter((r) => r.status === 'COMPLETED').length,
      rejected: sponsorshipRequests.filter((r) => r.status === 'REJECTED').length,
    };
  }, [sponsorshipRequests]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/company" className="text-secondary hover:text-teal-600 text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>CSR Dashboard</span>
            </Link>
            <span className="text-secondary">/</span>
            <span className="text-xs font-bold text-on-surface">Track Sponsorships</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Corporate Sponsorship Tracking &amp; Field Audits
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Monitor real-time repair progress, squad assignments, and Level-1 photographic completion audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/company/potholes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Sponsor New Corridors</span>
          </Link>
        </div>
      </div>

      {/* Overview Stats Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
          <p className="text-xs font-bold text-secondary">Active Sponsorships</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-on-surface">
              {statusCounts.approved + statusCounts.assigned + statusCounts.inProgress}
            </span>
            <span className="text-xs font-semibold text-teal-600">On Track</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
          <p className="text-xs font-bold text-secondary">Pending Authority Review</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {statusCounts.pending}
            </span>
            <span className="text-xs font-semibold text-secondary">Under Review</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
          <p className="text-xs font-bold text-secondary">In Repair / Assigned</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {statusCounts.assigned + statusCounts.inProgress}
            </span>
            <span className="text-xs font-semibold text-secondary">In Field</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
          <p className="text-xs font-bold text-secondary">Completed &amp; Certified</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {statusCounts.completed}
            </span>
            <span className="text-xs font-semibold text-emerald-600">100% Passed</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
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
              placeholder="Search by Request ID (e.g. CSR-2026-001), road corridor, or company name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-teal-600"
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

          <button
            type="button"
            onClick={reloadData}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-outline-variant/60 hover:bg-surface text-secondary hover:text-on-surface text-xs font-bold transition-all cursor-pointer"
            title="Refresh requests"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Requests', count: statusCounts.all },
            { id: 'PENDING_APPROVAL', label: 'Pending Review', count: statusCounts.pending },
            { id: 'CHANGES_REQUESTED', label: 'Changes Requested', count: statusCounts.changesRequested },
            { id: 'APPROVED', label: 'Approved', count: statusCounts.approved },
            { id: 'ACTIVE', label: 'Active in Field', count: statusCounts.active },
            { id: 'COMPLETED', label: 'Completed & Certified', count: statusCounts.completed },
            { id: 'REJECTED', label: 'Rejected', count: statusCounts.rejected },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-surface hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-variant/40'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-6">
          {filteredRequests.map((req) => (
            <SponsorshipTrackingCard
              key={req.id}
              request={req}
              onRevise={(r) => setReviseProposal(r)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
          <span className="material-symbols-outlined text-5xl text-secondary">
            history_edu
          </span>
          <h3 className="text-lg font-bold text-on-surface">
            No sponsorship requests found
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No requests match your current search or status filters. Try clearing your filters.'
              : 'You have not submitted any road repair sponsorships yet. Browse available potholes to sponsor.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-container border border-outline-variant text-xs font-bold text-secondary cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <Link
              to="/company/potholes"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Sponsor a Road Corridor</span>
            </Link>
          </div>
        </div>
      )}

      {/* Revise & Resubmit Modal */}
      {reviseProposal && (
        <SponsorshipSubmissionModal
          isOpen={!!reviseProposal}
          onClose={() => setReviseProposal(null)}
          existingProposal={reviseProposal}
          potholes={reviseProposal.potholes}
          companyName={reviseProposal.companyName}
          companyEmail={reviseProposal.companyEmail || user?.email}
          onSubmit={async (data) => {
            companyService.reviseAndResubmitRequest(reviseProposal.id, {
              proposedAmountINR: data.proposedAmountINR,
              contactName: data.contactName,
              contactEmail: data.contactEmail,
              contactPhone: data.contactPhone,
              csrBudgetYear: data.csrBudgetYear,
              companyNotes: data.notes,
            });
            reloadData();
            setReviseProposal(null);
          }}
        />
      )}
    </div>
  );
};
export default CompanySponsorshipsPage;
