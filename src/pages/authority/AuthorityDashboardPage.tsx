import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportsService } from '../../services/reportsService';
import { tasksService } from '../../services/tasksService';
import { companyService } from '../../services/companyService';
import type { PotholeReport, RepairTask } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { MultiMarkerMap } from '../../components/map/MultiMarkerMap';
import { PotholeImage } from '../../components/common/PotholeImage';
import { LoadingState } from '../../components/common/LoadingState';
import { AssignTaskModal } from '../../components/modals/AssignTaskModal';
import { RejectReasonModal } from '../../components/modals/RejectReasonModal';
import { SmartRepairClusters } from '../../components/authority/SmartRepairClusters';
import { ResolvedReportsArchive } from '../../components/authority/ResolvedReportsArchive';

type SectionTab = 'SECTION_A' | 'SECTION_B' | 'SECTION_C' | 'RESOLVED_CLOSED' | 'CLUSTERS' | 'MAP';

export const AuthorityDashboardPage: React.FC = () => {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [tasks, setTasks] = useState<RepairTask[]>([]);
  const [activeTab, setActiveTab] = useState<SectionTab>('SECTION_A');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Modals
  const [assignModalReport, setAssignModalReport] = useState<PotholeReport | null>(null);
  const [reworkModalTask, setReworkModalTask] = useState<RepairTask | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [allReports, allTasks] = await Promise.all([
        reportsService.getAllReports(),
        tasksService.getAllTasks().catch(() => []),
      ]);
      setReports(allReports);
      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load authority dashboard data', err);
      setError(err instanceof Error ? err.message : 'Unable to connect to municipal reports API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Section Counts
  const sectionACount = useMemo(
    () => reports.filter((r) => ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(r.status)).length,
    [reports]
  );
  const sectionBCount = useMemo(
    () => reports.filter((r) => ['ASSIGNED', 'IN_PROGRESS', 'REWORK_REQUIRED'].includes(r.status)).length,
    [reports]
  );
  const sectionCCount = useMemo(
    () => reports.filter((r) => r.status === 'AWAITING_APPROVAL').length,
    [reports]
  );
  const resolvedCount = useMemo(
    () => reports.filter((r) => r.status === 'RESOLVED').length,
    [reports]
  );

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Tab section filtering - Resolved reports strictly excluded from active queues
      if (activeTab === 'SECTION_A') {
        if (!['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(r.status)) return false;
      } else if (activeTab === 'SECTION_B') {
        if (!['ASSIGNED', 'IN_PROGRESS', 'REWORK_REQUIRED'].includes(r.status)) return false;
      } else if (activeTab === 'SECTION_C') {
        if (r.status !== 'AWAITING_APPROVAL') return false;
      } else if (activeTab === 'RESOLVED_CLOSED') {
        if (r.status !== 'RESOLVED') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesAddress = r.location.address.toLowerCase().includes(query);
        const matchesId = r.trackingNumber.toLowerCase().includes(query);
        const matchesReporter = r.reporterName.toLowerCase().includes(query);
        if (!matchesAddress && !matchesId && !matchesReporter) return false;
      }

      // Severity filter
      if (severityFilter !== 'ALL') {
        const sev = r.aiDetection?.severityScore || 'LOW';
        if (sev !== severityFilter) return false;
      }

      // Location filter
      if (locationFilter !== 'ALL') {
        if (!r.location.address.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [reports, activeTab, searchQuery, severityFilter, locationFilter]);

  // Quick Inline Actions
  const handleQuickVerify = async (reportId: string) => {
    try {
      await reportsService.verifyReport(reportId, true, undefined, 'Alice Sharma');
      setActionSuccess(`Report #${reportId} verified! Defect confirmed for crew assignment.`);
      await loadData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    }
  };

  const handleApproveRepair = async (task: RepairTask) => {
    try {
      await tasksService.reviewTask(task.id, true, undefined, 'Alice Sharma');
      setActionSuccess(
        `Work Order #${task.id} (Report #${task.trackingNumber}) marked RESOLVED! Level-1 inspection pass certified.`
      );
      await loadData();
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed.');
    }
  };

  const handleReworkSubmit = async (reason: string) => {
    if (!reworkModalTask) return;
    try {
      await tasksService.reviewTask(reworkModalTask.id, false, reason, 'Alice Sharma');
      setActionSuccess(
        `Rework requested on Work Order #${reworkModalTask.id}. Returned to ${reworkModalTask.assignedTeamName}.`
      );
      setReworkModalTask(null);
      await loadData();
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rework request failed.');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading municipal operations dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-error-container text-on-error-container flex items-center justify-between gap-2.5 font-body-sm border border-error/30 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">cloud_off</span>
            <div>
              <p className="font-semibold text-xs sm:text-sm">Error connecting to reports</p>
              <p className="text-[11px]">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-semibold px-2 py-1 rounded hover:bg-error/20"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-low text-primary text-xs font-semibold mb-1 border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>MC Chandigarh Public Works Operations Hub</span>
          </div>
          <h1 className="font-display-hero text-2xl sm:text-3xl font-extrabold text-on-surface">
            Municipal Road Infrastructure Triage
          </h1>
          <p className="font-body-sm text-xs sm:text-sm text-secondary">
            Alice Sharma (Municipal Commissioner) · Verify defect severities, dispatch repair squads, and certify completed work.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              icon={<span className="material-symbols-outlined text-[16px]">home</span>}
            >
              Home
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            icon={<span className="material-symbols-outlined text-[16px]">refresh</span>}
          >
            Refresh
          </Button>

          <Link to="/authority/reports">
            <Button
              variant="outline"
              size="sm"
              icon={<span className="material-symbols-outlined text-[16px]">list</span>}
            >
              Full Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Corporate Sponsorship Proposals Notification Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-teal-500/30">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/30">
            <span className="material-symbols-outlined text-[22px]">domain</span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Company CSR Sponsorship Proposals</span>
              {companyService.getPendingRequestsCount() > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  {companyService.getPendingRequestsCount()} PENDING REVIEW
                </span>
              )}
            </div>
            <p className="text-xs text-teal-100/70">
              Corporate road adoption proposals with municipal funding commitments and Level-1 audit workflows.
            </p>
          </div>
        </div>

        <Link
          to="/authority/sponsorships"
          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
        >
          <span>Open CSR Triage Desk</span>
          <span className="material-symbols-outlined text-[16px]">east</span>
        </Link>
      </div>

      {/* 4 MAIN INTERACTIVE SECTION CARDS (Phase 1 & Phase 2 Master Upgrade) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Section A: Awaiting Verification & Assignment */}
        <button
          type="button"
          onClick={() => setActiveTab('SECTION_A')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
            activeTab === 'SECTION_A'
              ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-md'
              : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-primary/40 hover:bg-surface-container-low/50 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between w-full mb-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              activeTab === 'SECTION_A' ? 'bg-primary text-white shadow-xs' : 'bg-amber-100 text-amber-800'
            }`}>
              <span className="material-symbols-outlined text-[22px]">assignment_turned_in</span>
            </span>
            <span className={`text-3xl font-extrabold font-display-hero ${
              activeTab === 'SECTION_A' ? 'text-primary' : 'text-on-surface'
            }`}>
              {sectionACount}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
              Section A
            </span>
            <h3 className="font-display-hero font-bold text-sm sm:text-base text-on-surface leading-tight mt-0.5">
              Awaiting Verification &amp; Assignment
            </h3>
            <p className="text-[11px] text-secondary mt-1 line-clamp-1">
              Initial triage, defect confirmation &amp; squad dispatch
            </p>
          </div>
        </button>

        {/* Section B: Repair In Progress */}
        <button
          type="button"
          onClick={() => setActiveTab('SECTION_B')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
            activeTab === 'SECTION_B'
              ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-md'
              : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-primary/40 hover:bg-surface-container-low/50 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between w-full mb-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              activeTab === 'SECTION_B' ? 'bg-primary text-white shadow-xs' : 'bg-sky-100 text-sky-800'
            }`}>
              <span className="material-symbols-outlined text-[22px]">engineering</span>
            </span>
            <span className={`text-3xl font-extrabold font-display-hero ${
              activeTab === 'SECTION_B' ? 'text-primary' : 'text-on-surface'
            }`}>
              {sectionBCount}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
              Section B
            </span>
            <h3 className="font-display-hero font-bold text-sm sm:text-base text-on-surface leading-tight mt-0.5">
              Repair In Progress
            </h3>
            <p className="text-[11px] text-secondary mt-1 line-clamp-1">
              Dispatched to PWD field squads &amp; underway
            </p>
          </div>
        </button>

        {/* Section C: Awaiting Repair Approval */}
        <button
          type="button"
          onClick={() => setActiveTab('SECTION_C')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
            activeTab === 'SECTION_C'
              ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-md'
              : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-primary/40 hover:bg-surface-container-low/50 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between w-full mb-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              activeTab === 'SECTION_C' ? 'bg-primary text-white shadow-xs' : 'bg-purple-100 text-purple-800'
            }`}>
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </span>
            <span className={`text-3xl font-extrabold font-display-hero ${
              activeTab === 'SECTION_C' ? 'text-primary' : 'text-on-surface'
            }`}>
              {sectionCCount}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
              Section C
            </span>
            <h3 className="font-display-hero font-bold text-sm sm:text-base text-on-surface leading-tight mt-0.5">
              Awaiting Repair Approval
            </h3>
            <p className="text-[11px] text-secondary mt-1 line-clamp-1">
              Field evidence submitted for Level-1 inspection pass
            </p>
          </div>
        </button>

        {/* Section D: Resolved & Closed Archive */}
        <button
          type="button"
          onClick={() => setActiveTab('RESOLVED_CLOSED')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
            activeTab === 'RESOLVED_CLOSED'
              ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-md'
              : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-primary/40 hover:bg-surface-container-low/50 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between w-full mb-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              activeTab === 'RESOLVED_CLOSED' ? 'bg-primary text-white shadow-xs' : 'bg-emerald-100 text-emerald-800'
            }`}>
              <span className="material-symbols-outlined text-[22px]">task_alt</span>
            </span>
            <span className={`text-3xl font-extrabold font-display-hero ${
              activeTab === 'RESOLVED_CLOSED' ? 'text-primary' : 'text-on-surface'
            }`}>
              {resolvedCount}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
              Archive
            </span>
            <h3 className="font-display-hero font-bold text-sm sm:text-base text-on-surface leading-tight mt-0.5">
              Resolved &amp; Closed
            </h3>
            <p className="text-[11px] text-secondary mt-1 line-clamp-1">
              Certified repairs archive &amp; chronological audit history
            </p>
          </div>
        </button>
      </div>

      {/* Secondary Tools Navigation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high pb-2 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('CLUSTERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'CLUSTERS'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">hub</span>
            <span>Smart Repair Clusters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MAP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'MAP'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            <span>Municipal Ward GIS Map</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-secondary">
          <span>Total Database Records: <strong className="text-on-surface">{reports.length}</strong></span>
          <span>·</span>
          <span>Field Squad: <strong className="text-primary font-medium">Punjab PWD Unit 04</strong></span>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR (Visible on report sections) */}
      {activeTab !== 'CLUSTERS' && activeTab !== 'MAP' && activeTab !== 'RESOLVED_CLOSED' && (
        <Card padding="sm" className="bg-surface-container-lowest border border-outline-variant/30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Report ID, Road Corridor, or Citizen..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-secondary font-medium">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium / Moderate</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-secondary font-medium">Sector:</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none"
              >
                <option value="ALL">All Regions</option>
                <option value="Sector 17">Sector 17</option>
                <option value="Madhya Marg">Madhya Marg</option>
                <option value="Kharar">Kharar / NH-5</option>
                <option value="Chandigarh">Chandigarh</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* CLUSTERS VIEW */}
      {activeTab === 'CLUSTERS' && (
        <SmartRepairClusters reports={reports} onClusterAssigned={loadData} />
      )}

      {/* GIS MAP VIEW */}
      {activeTab === 'MAP' && (
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 border-b border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display-hero text-base font-bold text-on-surface">
                Municipal Ward GIS Map
              </h3>
              <p className="font-body-sm text-xs text-secondary">
                Pins indicate real-time location and triage state of road defects.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> New Defect
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Awaiting Review
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolved
              </span>
            </div>
          </div>
          <div className="p-3">
            <MultiMarkerMap reports={reports} />
          </div>
        </Card>
      )}

      {/* SECTION A: AWAITING VERIFICATION AND ASSIGNMENT */}
      {activeTab === 'SECTION_A' && (
        <Card padding="none" className="overflow-hidden shadow-xs border border-outline-variant/40">
          <div className="p-4 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <div>
                <h3 className="font-bold text-sm text-on-surface">
                  Section A: Awaiting Verification &amp; Assignment ({filteredReports.filter((r) => ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(r.status)).length})
                </h3>
                <p className="text-[11px] text-secondary">
                  Incoming citizen reports requiring defect verification or repair crew work order assignment.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-surface-container-high">
            {filteredReports
              .filter((r) => ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(r.status))
              .map((report) => {
                const isVerified = report.status === 'VERIFIED';
                return (
                  <div
                    key={report.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
                  >
                    {/* Defect details */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-outline-variant/30 shadow-xs">
                        <PotholeImage
                          src={report.damageImageUrl}
                          alt="Citizen Defect"
                          className="w-full h-full object-cover"
                          fallbackType="default"
                          allowZoom={true}
                        />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-primary">
                            #{report.trackingNumber}
                          </span>
                          <StatusBadge status={report.status} size="sm" />
                          {report.aiDetection?.severityScore && (
                            <SeverityBadge severity={report.aiDetection.severityScore} size="sm" />
                          )}
                          <span className="text-[11px] text-secondary">
                            · Submitted {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {report.reporterName}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-on-surface truncate">
                          {report.location.address}
                        </h4>

                        <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                          {report.description}
                        </p>

                        <div className="pt-1 flex items-center gap-2 text-[11px] text-secondary">
                          <span className="font-mono">
                            GIS: {report.location.latitude.toFixed(4)}° N, {report.location.longitude.toFixed(4)}° E
                          </span>
                          <span>·</span>
                          <span className={isVerified ? 'text-primary font-semibold' : 'text-amber-700 font-semibold'}>
                            {isVerified ? '✓ Verified by Inspector' : '⚠ Unverified Photo Defect'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Authority Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {!isVerified && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickVerify(report.id)}
                          icon={<span className="material-symbols-outlined text-[15px]">check_circle</span>}
                        >
                          Verify Defect
                        </Button>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setAssignModalReport(report)}
                        icon={<span className="material-symbols-outlined text-[15px]">send</span>}
                      >
                        Assign Crew
                      </Button>

                      <Link to={`/authority/reports/${report.trackingNumber}`}>
                        <Button variant="ghost" size="sm">
                          Inspect
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}

            {filteredReports.filter((r) => ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(r.status)).length === 0 && (
              <div className="p-8 text-center text-xs text-secondary">
                No reports awaiting verification or assignment matching the current filters.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* SECTION B: REPAIR IN PROGRESS */}
      {activeTab === 'SECTION_B' && (
        <Card padding="none" className="overflow-hidden shadow-xs border border-outline-variant/40">
          <div className="p-4 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500" />
              <div>
                <h3 className="font-bold text-sm text-on-surface">
                  Section B: Repair In Progress ({filteredReports.filter((r) => ['ASSIGNED', 'IN_PROGRESS', 'REWORK_REQUIRED'].includes(r.status)).length})
                </h3>
                <p className="text-[11px] text-secondary">
                  Work orders currently dispatched to field squads undergoing saw-cut excavation or compaction.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-surface-container-high">
            {filteredReports
              .filter((r) => ['ASSIGNED', 'IN_PROGRESS', 'REWORK_REQUIRED'].includes(r.status))
              .map((report) => {
                const linkedTask = tasks.find((t) => t.reportId === report.id || t.id === report.id);
                return (
                  <div
                    key={report.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-outline-variant/30 shadow-xs">
                        <PotholeImage
                          src={report.damageImageUrl}
                          alt="Citizen Defect"
                          className="w-full h-full object-cover"
                          fallbackType="default"
                          allowZoom={true}
                        />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-primary">
                            #{report.trackingNumber}
                          </span>
                          <StatusBadge status={report.status} size="sm" />
                          {report.aiDetection?.severityScore && (
                            <SeverityBadge severity={report.aiDetection.severityScore} size="sm" />
                          )}
                          <span className="text-[11px] text-secondary">
                            · Assigned to: <strong className="text-on-surface">{linkedTask?.assignedTeamName || 'Punjab PWD Unit 04'}</strong>
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-on-surface truncate">
                          {report.location.address}
                        </h4>

                        <p className="text-xs text-secondary line-clamp-1 leading-relaxed">
                          {report.description}
                        </p>

                        <div className="pt-1 flex items-center gap-3 text-[11px] text-secondary">
                          <span>
                            Work Order:{' '}
                            <strong className="font-mono text-on-surface">{linkedTask?.id || 'WO-PENDING'}</strong>
                          </span>
                          <span>·</span>
                          <span className="text-primary font-medium">
                            Priority: {linkedTask?.priority || 'HIGH'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Link to={`/authority/reports/${report.trackingNumber}`}>
                        <Button variant="secondary" size="sm">
                          View Work Order
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}

            {filteredReports.filter((r) => ['ASSIGNED', 'IN_PROGRESS', 'REWORK_REQUIRED'].includes(r.status)).length === 0 && (
              <div className="p-8 text-center text-xs text-secondary">
                No active repairs currently in progress matching the filters.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* SECTION C: AWAITING REPAIR APPROVAL */}
      {activeTab === 'SECTION_C' && (
        <Card padding="none" className="overflow-hidden shadow-xs border border-purple-200">
          <div className="p-4 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-purple-950">
                  Section C: Awaiting Repair Approval ({filteredReports.filter((r) => r.status === 'AWAITING_APPROVAL').length})
                </h3>
                <p className="text-[11px] text-purple-800">
                  Field squads submitted completion photographic proof. Inspect saw-cut bitumen patch for Level-1 municipal sign-off.
                </p>
              </div>
            </div>

            <Link to="/authority/approvals" className="text-xs font-bold text-purple-900 hover:underline">
              Open Full Approvals Desk →
            </Link>
          </div>

          <div className="divide-y divide-purple-100">
            {filteredReports
              .filter((r) => r.status === 'AWAITING_APPROVAL')
              .map((report) => {
                const linkedTask = tasks.find((t) => t.reportId === report.id || t.id === report.id) || {
                  id: `WO-${report.trackingNumber}`,
                  assignedTeamName: 'Punjab PWD Unit 04',
                  afterRepairPhotoUrl: report.restoredImageUrl || '/photos/pothole-restored1.jpg',
                  repairNotes: 'Saw-cut compaction completed with flush grade.',
                };

                return (
                  <div
                    key={report.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-purple-50/10 hover:bg-purple-50/30 transition-colors"
                  >
                    {/* Before & After Side-by-Side Images */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="space-y-1">
                        <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-xl overflow-hidden border border-outline-variant/30 shadow-xs relative">
                          <PotholeImage
                            src={report.damageImageUrl}
                            alt="Pre-repair"
                            className="w-full h-full object-cover"
                            fallbackType="critical"
                            allowZoom={true}
                          />
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded font-bold">
                            PRE-REPAIR
                          </span>
                        </div>
                      </div>

                      <span className="material-symbols-outlined text-secondary text-lg">east</span>

                      <div className="space-y-1">
                        <div className="w-24 h-20 sm:w-28 sm:h-24 rounded-xl overflow-hidden border border-emerald-400 shadow-xs relative">
                          <PotholeImage
                            src={report.restoredImageUrl || linkedTask.afterRepairPhotoUrl}
                            alt="Completed compaction"
                            className="w-full h-full object-cover"
                            fallbackType="restored"
                            allowZoom={true}
                          />
                          <span className="absolute bottom-1 left-1 bg-emerald-700 text-white text-[9px] px-1 rounded font-bold">
                            RESTORED
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Audit description & notes */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary">
                          #{report.trackingNumber}
                        </span>
                        <StatusBadge status="AWAITING_APPROVAL" size="sm" />
                        <span className="text-[11px] text-secondary">
                          · Squad: <strong className="text-on-surface">{linkedTask.assignedTeamName}</strong>
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-on-surface">
                        {report.location.address}
                      </h4>

                      <p className="text-xs text-secondary leading-relaxed">
                        Crew Notes: <span className="text-purple-900 font-medium">"{report.reworkNotes || linkedTask.repairNotes || 'Completed compaction patch'}"</span>
                      </p>

                      <div className="text-[11px] text-secondary pt-0.5">
                        GIS: {report.location.latitude.toFixed(4)}° N, {report.location.longitude.toFixed(4)}° E · Ready for Level-1 Municipal Sign-off
                      </div>
                    </div>

                    {/* Approval & Rework Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setReworkModalTask(
                            (linkedTask as RepairTask) || {
                              id: `WO-${report.trackingNumber}`,
                              reportId: report.id,
                              trackingNumber: report.trackingNumber,
                              assignedTeamId: 'team-04',
                              assignedTeamName: 'Punjab PWD Unit 04',
                              status: 'AWAITING_APPROVAL',
                              priority: 'HIGH',
                              createdAt: report.createdAt,
                              location: report.location,
                            }
                          )
                        }
                        icon={<span className="material-symbols-outlined text-[15px]">undo</span>}
                      >
                        Request Rework
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          handleApproveRepair(
                            (linkedTask as RepairTask) || {
                              id: `WO-${report.trackingNumber}`,
                              reportId: report.id,
                              trackingNumber: report.trackingNumber,
                              assignedTeamId: 'team-04',
                              assignedTeamName: 'Punjab PWD Unit 04',
                              status: 'AWAITING_APPROVAL',
                              priority: 'HIGH',
                              createdAt: report.createdAt,
                              location: report.location,
                            }
                          )
                        }
                        icon={<span className="material-symbols-outlined text-[15px]">verified</span>}
                      >
                        Approve Level-1 Pass
                      </Button>
                    </div>
                  </div>
                );
              })}

            {filteredReports.filter((r) => r.status === 'AWAITING_APPROVAL').length === 0 && (
              <div className="p-8 text-center text-xs text-secondary">
                No completed repair evidence currently awaiting approval.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* SECTION D: RESOLVED & CLOSED REPORT ARCHIVE (Phase 2 Master Upgrade) */}
      {activeTab === 'RESOLVED_CLOSED' && (
        <ResolvedReportsArchive reports={reports} tasks={tasks} />
      )}

      {/* ASSIGN TASK MODAL */}
      {assignModalReport && (
        <AssignTaskModal
          isOpen={true}
          onClose={() => setAssignModalReport(null)}
          report={assignModalReport}
          onSuccess={(newTask) => {
            setActionSuccess(
              `Work order #${newTask.id} successfully dispatched to ${newTask.assignedTeamName}!`
            );
            setAssignModalReport(null);
            loadData();
            setTimeout(() => setActionSuccess(null), 5000);
          }}
        />
      )}

      {/* REWORK MODAL */}
      {reworkModalTask && (
        <RejectReasonModal
          isOpen={true}
          onClose={() => setReworkModalTask(null)}
          title={`Request Rework on Work Order #${reworkModalTask.id}`}
          subtitle={`Report #${reworkModalTask.trackingNumber} · ${reworkModalTask.assignedTeamName}`}
          promptLabel="Explain asphalt compaction defect or quality non-conformance for the repair squad:"
          placeholder="e.g. Rough saw-cut border; hot-mix asphalt sits 1.5 cm below surrounding pavement. Compaction re-run required."
          confirmButtonText="Return to Crew for Rework"
          onSubmit={handleReworkSubmit}
        />
      )}
    </div>
  );
};
