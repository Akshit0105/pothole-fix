import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { companyService } from '../../services/companyService';
import type { CompanyPothole } from '../../types/company';
import { CompanyPotholeCard } from '../../components/company/CompanyPotholeCard';
import { CompanyPotholeTable } from '../../components/company/CompanyPotholeTable';
import { SponsorshipSubmissionModal } from '../../components/company/SponsorshipSubmissionModal';

export const CompanyPotholesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [potholes, setPotholes] = useState<CompanyPothole[]>(() => companyService.getAvailablePotholes());
  const companyProfile = useMemo(() => companyService.getCompanyProfile(user?.email), [user?.email]);

  const [selectedPotholeIds, setSelectedPotholeIds] = useState<string[]>([]);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [eligibilityFilter, setEligibilityFilter] = useState<string>('ALL');

  const reloadData = () => {
    setPotholes(companyService.getAvailablePotholes());
  };

  useEffect(() => {
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

  const selectedPotholes = useMemo(() => {
    return potholes.filter((p) => selectedPotholeIds.includes(p.id));
  }, [potholes, selectedPotholeIds]);

  const handleToggleSelect = (id: string) => {
    const target = potholes.find((p) => p.id === id);
    if (!target || target.eligibility !== 'ELIGIBLE_VERIFIED') return;

    setSelectedPotholeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEligible = () => {
    const eligibleIds = filteredPotholes
      .filter((p) => p.eligibility === 'ELIGIBLE_VERIFIED')
      .map((p) => p.id);
    setSelectedPotholeIds(Array.from(new Set([...selectedPotholeIds, ...eligibleIds])));
  };

  const handleClearSelection = () => {
    setSelectedPotholeIds([]);
  };

  const filteredPotholes = useMemo(() => {
    return potholes.filter((p) => {
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

      if (locationFilter !== 'ALL') {
        if (locationFilter === 'CHANDIGARH' && !p.city.toLowerCase().includes('chandigarh')) return false;
        if (locationFilter === 'PUNJAB' && !p.state.toLowerCase().includes('punjab')) return false;
        if (locationFilter === 'HIGHWAYS' && p.roadCategory !== 'NATIONAL_HIGHWAY' && p.roadCategory !== 'STATE_HIGHWAY') return false;
      }

      if (severityFilter !== 'ALL' && p.severity !== severityFilter) return false;
      if (categoryFilter !== 'ALL' && p.roadCategory !== categoryFilter) return false;

      if (eligibilityFilter !== 'ALL') {
        if (eligibilityFilter === 'ELIGIBLE_ONLY' && p.eligibility !== 'ELIGIBLE_VERIFIED') return false;
        if (eligibilityFilter === 'PENDING_ONLY' && p.eligibility !== 'PENDING_VERIFICATION') return false;
        if (eligibilityFilter === 'SPONSORED_ONLY' && p.eligibility !== 'ALREADY_SPONSORED') return false;
        if (eligibilityFilter === 'COMPLETED_ONLY' && p.eligibility !== 'REPAIR_COMPLETED') return false;
      }

      return true;
    });
  }, [potholes, searchQuery, locationFilter, severityFilter, categoryFilter, eligibilityFilter]);

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
            <span className="text-xs font-bold text-on-surface">Available Potholes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Certified Road Corridors Available for Sponsorship
          </h2>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Browse verified arterial and highway road craters ready for corporate CSR adoption.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
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
      </div>

      {/* Filters Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
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
          </div>

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
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-outline-variant/20 text-xs">
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
              <option value="HIGHWAYS">Highways Only</option>
            </select>
          </div>

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
              <option value="PENDING_ONLY">Pending Verification</option>
              <option value="SPONSORED_ONLY">Already Sponsored</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid or Table */}
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
        <div className="p-12 text-center rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-3">
          <span className="material-symbols-outlined text-5xl text-secondary">search_off</span>
          <h3 className="text-lg font-bold text-on-surface">No matching potholes found</h3>
        </div>
      )}

      {/* Centered / Floating Selection Banner */}
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

      {/* Submission Modal */}
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
          navigate('/company/sponsorships');
        }}
      />
    </div>
  );
};
