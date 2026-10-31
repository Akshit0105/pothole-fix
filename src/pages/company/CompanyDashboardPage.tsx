import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { companyService } from '../../services/companyService';
import type {
  CompanyPothole,
  SponsorshipRequest,
} from '../../types/company';
import { CompanyMetricsBar } from '../../components/company/CompanyMetricsBar';
import { CompanyPotholeCard } from '../../components/company/CompanyPotholeCard';
import { CompanyPotholeTable } from '../../components/company/CompanyPotholeTable';
import { SponsorshipSubmissionModal } from '../../components/company/SponsorshipSubmissionModal';
import { SponsorshipTrackingCard } from '../../components/company/SponsorshipTrackingCard';

export const CompanyDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'POTHOLES' | 'TRACKING'>('POTHOLES');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Core Data
  const [potholes, setPotholes] = useState<CompanyPothole[]>(() => companyService.getAvailablePotholes());
  const [sponsorshipRequests, setSponsorshipRequests] = useState<SponsorshipRequest[]>(
    () => companyService.getSponsorshipRequests(user?.email)
  );
  const companyProfile = useMemo(() => companyService.getCompanyProfile(user?.email), [user?.email]);

  // Selection State
  const [selectedPotholeIds, setSelectedPotholeIds] = useState<string[]>([]);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [reviseProposal, setReviseProposal] = useState<SponsorshipRequest | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('ALL');

  // Tracking tab status filter
  const [trackingStatusFilter, setTrackingStatusFilter] = useState<string>('ALL');

  // Refresh data helper
  const reloadData = () => {
    setPotholes(companyService.getAvailablePotholes());
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

  // Metrics
  const metrics = useMemo(() => {
    return companyService.getDashboardMetrics(selectedPotholeIds, user?.email);
  }, [potholes, sponsorshipRequests, selectedPotholeIds, user?.email]);

  // Selected Pothole Objects
  const selectedPotholes = useMemo(() => {
    return potholes.filter((p) => selectedPotholeIds.includes(p.id));
  }, [potholes, selectedPotholeIds]);

  // Toggle selection for a single pothole
  const handleToggleSelect = (id: string) => {
    const target = potholes.find((p) => p.id === id);
    if (!target || target.eligibility !== 'ELIGIBLE_VERIFIED') return;

    setSelectedPotholeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all eligible currently visible
  const handleSelectAllEligible = () => {
    const eligibleIds = filteredPotholes
      .filter((p) => p.eligibility === 'ELIGIBLE_VERIFIED')
      .map((p) => p.id);
    setSelectedPotholeIds(Array.from(new Set([...selectedPotholeIds, ...eligibleIds])));
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedPotholeIds([]);
  };

  // Filtered Potholes
  const filteredPotholes = useMemo(() => {
    return potholes.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          p.id.toLowerCase().includes(query) ||
          p.trackingNumber.toLowerCase().includes(query) ||
          p.roadName.toLowerCase().includes(query) ||
          p.locationName.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Location
      if (locationFilter !== 'ALL') {
        if (locationFilter === 'CHANDIGARH' && !p.city.toLowerCase().includes('chandigarh')) return false;
        if (locationFilter === 'PUNJAB' && !p.state.toLowerCase().includes('punjab')) return false;
        if (locationFilter === 'HIGHWAYS' && p.roadCategory !== 'NATIONAL_HIGHWAY' && p.roadCategory !== 'STATE_HIGHWAY') return false;
      }

      // Severity
      if (severityFilter !== 'ALL' && p.severity !== severityFilter) return false;

      // Category
      if (categoryFilter !== 'ALL' && p.roadCategory !== categoryFilter) return false;

      // Eligibility
      if (eligibilityFilter !== 'ALL') {
        if (eligibilityFilter === 'ELIGIBLE_ONLY' && p.eligibility !== 'ELIGIBLE_VERIFIED') return false;
        if (eligibilityFilter === 'PENDING_ONLY' && p.eligibility !== 'PENDING_VERIFICATION') return false;
        if (eligibilityFilter === 'SPONSORED_ONLY' && p.eligibility !== 'ALREADY_SPONSORED') return false;
        if (eligibilityFilter === 'COMPLETED_ONLY' && p.eligibility !== 'REPAIR_COMPLETED') return false;
      }

      return true;
    });
  }, [potholes, searchQuery, locationFilter, severityFilter, categoryFilter, eligibilityFilter]);

  // Filtered Tracking Requests
  const filteredRequests = useMemo(() => {
    if (trackingStatusFilter === 'ALL') return sponsorshipRequests;
    if (trackingStatusFilter === 'ACTIVE') {
      return sponsorshipRequests.filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS');
    }
    return sponsorshipRequests.filter((r) => r.status === trackingStatusFilter);
  }, [sponsorshipRequests, trackingStatusFilter]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-24">
      {/* 1. TOP HEADER & INTRODUCTORY BANNER */}
      <div className="relative rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl overflow-hidden">
        {/* Subtle background network pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Corporate Social Responsibility (CSR) Road Infrastructure Portal</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-display-hero">
              Direct Road Safety Sponsorship &amp; Level-1 Audits
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Enable your organization to fund municipal saw-cut asphalt restoration on certified arterial corridors. Every sponsored defect receives full photographic evidence and commissioner audit sign-off.
            </p>

            <div className="flex items-center gap-4 pt-1 text-xs text-slate-400 flex-wrap">
              <span>Partner: <strong className="text-white">{companyProfile.companyName}</strong></span>
              <span>·</span>
              <span>Active Initiative: <strong className="text-teal-300">{companyProfile.initiativeName}</strong></span>
              <span>·</span>
              <span>Municipal Pilot: <strong className="text-white">Chandigarh &amp; Punjab PWD</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('POTHOLES')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'POTHOLES'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              <span>Explore Eligible Potholes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TRACKING')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'TRACKING'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">track_changes</span>
              <span>Track Sponsorships ({sponsorshipRequests.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD KPI METRICS BAR */}
      <section>
        <CompanyMetricsBar
          metrics={metrics}
          onFilterEligible={() => {
            setActiveTab('POTHOLES');
            setEligibilityFilter('ELIGIBLE_ONLY');
          }}
          onFilterHighSeverity={() => {
            setActiveTab('POTHOLES');
            setSeverityFilter('CRITICAL');
          }}
          onFilterSelected={() => {
            setActiveTab('POTHOLES');
            if (selectedPotholeIds.length > 0) {
              setIsSubmissionModalOpen(true);
            }
          }}
          onFilterActive={() => {
            setActiveTab('TRACKING');
            setTrackingStatusFilter('ACTIVE');
          }}
          onFilterCompleted={() => {
            setActiveTab('TRACKING');
            setTrackingStatusFilter('COMPLETED');
          }}
        />
      </section>

      {/* 3. PRIMARY WORKSPACE TABS */}
      <div className="flex items-center justify-between border-b border-outline-variant/30 gap-4 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('POTHOLES')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'POTHOLES'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">checklist</span>
            <span>Available Potholes &amp; Corridors</span>
            <span className="px-2 py-0.2 rounded-full bg-surface-container text-xs font-mono font-bold">
              {filteredPotholes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRACKING')}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'TRACKING'
                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">timeline</span>
            <span>Company Sponsorship Tracking</span>
            <span className="px-2 py-0.2 rounded-full bg-surface-container text-xs font-mono font-bold">
              {sponsorshipRequests.length}
            </span>
          </button>
        </div>

        {/* View Toggle (Only for Potholes Tab) */}
        {activeTab === 'POTHOLES' && (
          <div className="pb-3 flex items-center gap-2">
            <span className="text-xs text-secondary hidden sm:inline">View:</span>
            <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'GRID'
                    ? 'bg-surface-container-lowest text-teal-600 shadow-2xs font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
                title="Grid Card View"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-surface-container-lowest text-teal-600 shadow-2xs font-bold'
                    : 'text-secondary hover:text-on-surface'
                }`}
                title="Detailed Table View"
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* TAB 1: AVAILABLE POTHOLES & FILTERING                            */}
      {/* ================================================================ */}
      {activeTab === 'POTHOLES' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[20px] pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search road name, corridor, defect ID, landmark or city..."
                  className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Reset Filters Shortcut */}
              {(searchQuery || locationFilter !== 'ALL' || severityFilter !== 'ALL' || categoryFilter !== 'ALL' || eligibilityFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setLocationFilter('ALL');
                    setSeverityFilter('ALL');
                    setCategoryFilter('ALL');
                    setEligibilityFilter('ALL');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-secondary hover:text-error transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>

            {/* Dropdown / Chip Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-outline-variant/20 text-xs">
              {/* Location Corridor */}
              <div>
                <label className="block text-[11px] font-bold text-secondary uppercase mb-1">
                  Corridor Region
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                >
                  <option value="ALL">All Regions</option>
                  <option value="CHANDIGARH">Chandigarh Capital Region</option>
                  <option value="PUNJAB">Punjab Arterial Network</option>
                  <option value="HIGHWAYS">National &amp; State Highways</option>
                </select>
              </div>

              {/* Severity Level */}
              <div>
                <label className="block text-[11px] font-bold text-secondary uppercase mb-1">
                  AI Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical Craters</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MODERATE">Moderate / Medium</option>
                </select>
              </div>

              {/* Road Category */}
              <div>
                <label className="block text-[11px] font-bold text-secondary uppercase mb-1">
                  Road Classification
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                >
                  <option value="ALL">All Road Types</option>
                  <option value="NATIONAL_HIGHWAY">National Highway</option>
                  <option value="STATE_HIGHWAY">State Highway</option>
                  <option value="MAJOR_ARTERIAL">Major Arterial</option>
                  <option value="COMMERCIAL_CORRIDOR">Commercial Corridor</option>
                </select>
              </div>

              {/* Sponsorship Eligibility */}
              <div>
                <label className="block text-[11px] font-bold text-secondary uppercase mb-1">
                  Authority Status
                </label>
                <select
                  value={eligibilityFilter}
                  onChange={(e) => setEligibilityFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-on-surface text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ELIGIBLE_ONLY">Verified &amp; Eligible</option>
                  <option value="PENDING_ONLY">Pending Authority Review</option>
                  <option value="SPONSORED_ONLY">Already Sponsored</option>
                  <option value="COMPLETED_ONLY">Level-1 Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Informational Notice */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-secondary flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600 text-[18px]">info</span>
              <span>
                <strong>Sponsorship Rule:</strong> Only Municipal Authority verified defects are eligible for corporate adoption.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-on-surface">
                {filteredPotholes.filter((p) => p.eligibility === 'ELIGIBLE_VERIFIED').length} Available for Immediate Pledge
              </span>
              <button
                type="button"
                onClick={handleSelectAllEligible}
                className="text-teal-600 font-bold hover:underline cursor-pointer"
              >
                Select All Eligible
              </button>
            </div>
          </div>

          {/* Potholes Display: Grid or Table */}
          {filteredPotholes.length > 0 ? (
            viewMode === 'GRID' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {filteredPotholes.map((pothole) => (
                  <CompanyPotholeCard
                    key={pothole.id}
                    pothole={pothole}
                    isSelected={selectedPotholeIds.includes(pothole.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>
            ) : (
              <CompanyPotholeTable
                potholes={filteredPotholes}
                selectedIds={selectedPotholeIds}
                onToggleSelect={handleToggleSelect}
                onSelectAllEligible={handleSelectAllEligible}
                onClearSelection={handleClearSelection}
              />
            )
          ) : (
            /* Empty State */
            <div className="p-12 text-center rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <span className="material-symbols-outlined text-5xl text-secondary">
                search_off
              </span>
              <h3 className="text-lg font-bold text-on-surface">
                No matching potholes found
              </h3>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                Try loosening your filters or searching for another corridor.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setLocationFilter('ALL');
                  setSeverityFilter('ALL');
                  setCategoryFilter('ALL');
                  setEligibilityFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: COMPANY SPONSORSHIP TRACKING                             */}
      {/* ================================================================ */}
      {activeTab === 'TRACKING' && (
        <div className="space-y-6">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'ALL', label: 'All Sponsorships', count: sponsorshipRequests.length },
              {
                id: 'PENDING_APPROVAL',
                label: 'Pending Authority Review',
                count: sponsorshipRequests.filter((r) => r.status === 'PENDING_APPROVAL').length,
              },
              {
                id: 'CHANGES_REQUESTED',
                label: 'Changes Requested',
                count: sponsorshipRequests.filter((r) => r.status === 'CHANGES_REQUESTED').length,
              },
              {
                id: 'APPROVED',
                label: 'Approved',
                count: sponsorshipRequests.filter((r) => r.status === 'APPROVED').length,
              },
              {
                id: 'ACTIVE',
                label: 'Active in Field',
                count: sponsorshipRequests.filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS').length,
              },
              {
                id: 'COMPLETED',
                label: 'Completed & Certified',
                count: sponsorshipRequests.filter((r) => r.status === 'COMPLETED').length,
              },
              {
                id: 'REJECTED',
                label: 'Rejected',
                count: sponsorshipRequests.filter((r) => r.status === 'REJECTED').length,
              },
            ].map((tab) => {
              const active = trackingStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTrackingStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface border border-outline-variant/30'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      active ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sponsorship Requests Cards Stack */}
          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <SponsorshipTrackingCard
                  key={request.id}
                  request={request}
                  onRevise={(req) => setReviseProposal(req)}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <span className="material-symbols-outlined text-5xl text-secondary">
                hourglass_empty
              </span>
              <h3 className="text-lg font-bold text-on-surface">
                No sponsorship requests in this state
              </h3>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                Select eligible potholes to submit your next corporate road repair sponsorship proposal.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('POTHOLES')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Browse Eligible Potholes
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. CENTERED / FLOATING SELECTION ACTION BAR */}
      {selectedPotholes.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-xl w-full bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-teal-500/50 flex items-center justify-between gap-4 animate-scale-up">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-[20px]">checklist</span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white flex items-center gap-2 truncate">
                <span>{selectedPotholes.length} Road Defect{selectedPotholes.length > 1 ? 's' : ''} Selected</span>
                <span className="text-teal-400 font-mono text-xs font-semibold">
                  (₹{selectedPotholes.reduce((acc, p) => acc + p.estimatedRepairCostINR, 0).toLocaleString('en-IN')})
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate">
                Ready for CSR municipal pledge
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsSubmissionModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Submit Proposal</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. SPONSORSHIP SUBMISSION & CONFIRMATION MODAL */}
      <SponsorshipSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        potholes={selectedPotholes}
        onRemovePothole={handleToggleSelect}
        companyName={companyProfile.companyName}
        companyEmail={user?.email || companyProfile.email}
        onSubmit={async (data) => {
          companyService.submitSponsorshipRequest({
            potholeIds: selectedPotholeIds,
            proposedAmountINR: data.proposedAmountINR,
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            csrBudgetYear: data.csrBudgetYear,
            companyNotes: data.notes,
            companyName: companyProfile.companyName,
            csrInitiativeName: companyProfile.initiativeName,
            companyEmail: user?.email || companyProfile.email,
          });
          reloadData();
          setSelectedPotholeIds([]);
        }}
        onSuccessRedirect={() => {
          setActiveTab('TRACKING');
          setTrackingStatusFilter('ALL');
        }}
      />

      {/* 6. REVISE & RESUBMIT MODAL */}
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
