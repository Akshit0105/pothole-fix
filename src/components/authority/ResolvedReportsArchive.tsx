import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { PotholeReport, RepairTask } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SeverityBadge } from '../common/StatusBadge';
import { PotholeImage } from '../common/PotholeImage';

interface ResolvedReportsArchiveProps {
  reports: PotholeReport[];
  tasks?: RepairTask[];
}

export const ResolvedReportsArchive: React.FC<ResolvedReportsArchiveProps> = ({
  reports,
  tasks = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter only resolved reports
  const resolvedOnly = useMemo(() => {
    return reports.filter((r) => r.status === 'RESOLVED');
  }, [reports]);

  // Apply search and filter criteria
  const filteredResolved = useMemo(() => {
    return resolvedOnly.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.trackingNumber?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q);
        const matchesAddr = r.location?.address?.toLowerCase().includes(q);
        const matchesTeam = r.assignedTeamName?.toLowerCase().includes(q);
        const matchesReporter = r.reporterName?.toLowerCase().includes(q);
        if (!matchesId && !matchesAddr && !matchesTeam && !matchesReporter) return false;
      }

      const dateObj = new Date(r.updatedAt || r.createdAt);

      // Year filter
      if (yearFilter !== 'ALL') {
        const year = dateObj.getFullYear().toString();
        if (year !== yearFilter) return false;
      }

      // Month filter
      if (monthFilter !== 'ALL') {
        const month = dateObj.toLocaleString('default', { month: 'long' });
        if (month !== monthFilter) return false;
      }

      // Severity filter
      if (severityFilter !== 'ALL') {
        const sev = r.aiDetection?.severityScore || 'LOW';
        if (sev !== severityFilter) return false;
      }

      return true;
    });
  }, [resolvedOnly, searchQuery, yearFilter, monthFilter, severityFilter]);

  // Sort reports chronologically
  const sortedReports = useMemo(() => {
    return [...filteredResolved].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [filteredResolved, sortOrder]);

  // Group chronologically: Month-Year -> Day -> Reports
  const groupedData = useMemo(() => {
    interface MonthGroup {
      monthYear: string;
      dateGroups: {
        dateString: string;
        reports: PotholeReport[];
      }[];
    }

    const monthMap = new Map<string, Map<string, PotholeReport[]>>();

    sortedReports.forEach((r) => {
      const d = new Date(r.updatedAt || r.createdAt);
      const monthYear = d.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g., "October 2026"
      const dateString = d.toLocaleDateString('default', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }); // e.g., "October 30, 2026"

      if (!monthMap.has(monthYear)) {
        monthMap.set(monthYear, new Map());
      }
      const dayMap = monthMap.get(monthYear)!;
      if (!dayMap.has(dateString)) {
        dayMap.set(dateString, []);
      }
      dayMap.get(dateString)!.push(r);
    });

    const groups: MonthGroup[] = [];
    monthMap.forEach((dayMap, monthYear) => {
      const dateGroups: { dateString: string; reports: PotholeReport[] }[] = [];
      dayMap.forEach((repList, dateString) => {
        dateGroups.push({ dateString, reports: repList });
      });
      groups.push({ monthYear, dateGroups });
    });

    return groups;
  }, [sortedReports]);

  // Helper to find associated task
  const getTaskForReport = (reportId: string, trackingNumber: string) => {
    return tasks.find((t) => t.reportId === reportId || t.trackingNumber === trackingNumber);
  };

  return (
    <div className="space-y-6">
      {/* Archive Header & Filters Toolbar */}
      <Card padding="md" className="space-y-4 bg-surface-container-lowest border border-outline-variant/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-high">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1 border border-emerald-300">
              <span className="material-symbols-outlined text-[15px]">inventory_2</span>
              <span>Official Municipal Certification Archive</span>
            </div>
            <h2 className="font-display-hero text-lg sm:text-xl font-bold text-on-surface">
              Resolved &amp; Closed Road Repair Audit Trail
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Historical repository of completed road repairs with Level-1 municipal inspection certificates and photographic evidence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-secondary hover:text-on-surface flex items-center gap-1.5 border border-outline-variant/30 transition-colors"
              title="Toggle Chronological Sorting"
            >
              <span className="material-symbols-outlined text-[16px]">
                {sortOrder === 'desc' ? 'arrow_downward' : 'arrow_upward'}
              </span>
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Road, or Crew..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
            />
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-secondary font-medium shrink-0">Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:outline-none text-xs"
            >
              <option value="ALL">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-secondary font-medium shrink-0">Month:</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:outline-none text-xs"
            >
              <option value="ALL">All Months</option>
              <option value="October">October</option>
              <option value="September">September</option>
              <option value="August">August</option>
              <option value="July">July</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-secondary font-medium shrink-0">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/30 focus:outline-none text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium / Moderate</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Empty State */}
      {sortedReports.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-container-high mx-auto flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[28px]">search_off</span>
          </div>
          <h3 className="font-display-hero text-base font-bold text-on-surface">No Archived Reports Match Filter</h3>
          <p className="text-xs text-secondary max-w-md mx-auto">
            Try adjusting your search query, year, month, or severity filter to view completed repair records.
          </p>
        </Card>
      ) : (
        /* Chronological Grouped Display */
        <div className="space-y-8">
          {groupedData.map((monthGroup) => (
            <div key={monthGroup.monthYear} className="space-y-5">
              {/* Month & Year Banner */}
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                <h3 className="font-display-hero text-base sm:text-lg font-extrabold text-on-surface tracking-wide uppercase">
                  {monthGroup.monthYear}
                </h3>
                <div className="h-px bg-surface-container-high flex-1" />
              </div>

              {/* Day Subheadings & Reports */}
              {monthGroup.dateGroups.map((dateGroup) => (
                <div key={dateGroup.dateString} className="space-y-4 pl-2 sm:pl-4 border-l-2 border-primary/30">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary -ml-[19px] sm:-ml-[27px] ring-4 ring-background" />
                    <h4 className="font-title-md text-xs sm:text-sm font-bold text-primary">
                      {dateGroup.dateString}
                    </h4>
                    <span className="text-[11px] font-semibold text-secondary">
                      ({dateGroup.reports.length} {dateGroup.reports.length === 1 ? 'repair certified' : 'repairs certified'})
                    </span>
                  </div>

                  {/* Cards for each report */}
                  <div className="space-y-4">
                    {dateGroup.reports.map((report) => {
                      const task = getTaskForReport(report.id, report.trackingNumber);
                      const submissionDate = new Date(report.createdAt).toLocaleString();
                      const resolvedDate = new Date(report.updatedAt || report.createdAt).toLocaleString();
                      const certifyingAuthority = 'Alice Sharma · Municipal Commissioner';
                      const assignedCrew = report.assignedTeamName || task?.assignedTeamName || 'Punjab PWD Asphalt Unit 04';

                      return (
                        <Card
                          key={report.id}
                          padding="md"
                          className="bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 transition-all shadow-xs space-y-4"
                        >
                          {/* Card Top Strip */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-surface-container-high">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <span className="font-mono font-bold text-xs sm:text-sm text-primary px-2 py-0.5 rounded bg-primary/10">
                                  #{report.trackingNumber}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">task_alt</span>
                                  Resolved &amp; Closed
                                </span>
                                {report.aiDetection?.severityScore && (
                                  <SeverityBadge severity={report.aiDetection.severityScore} size="sm" />
                                )}
                              </div>
                              <h4 className="font-display-hero text-sm sm:text-base font-bold text-on-surface">
                                {report.location.address}
                              </h4>
                              {report.location.landmark && (
                                <p className="text-xs text-secondary mt-0.5">
                                  Landmark: {report.location.landmark}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Link to={`/authority/reports/${report.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<span className="material-symbols-outlined text-[15px]">visibility</span>}
                                >
                                  View Audit Record
                                </Button>
                              </Link>
                            </div>
                          </div>

                          {/* Side-by-Side Photographs */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Original Defect Photo */}
                            <div className="space-y-1.5 bg-surface-container-low/40 p-3 rounded-xl border border-outline-variant/20">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-secondary uppercase tracking-wider text-[10px]">
                                  Original Reported Defect
                                </span>
                                <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
                                  Pre-Repair
                                </span>
                              </div>
                              <div className="rounded-lg overflow-hidden border border-outline-variant/30 aspect-video max-h-48 bg-surface-container">
                                <PotholeImage
                                  src={report.damageImageUrl}
                                  alt="Original road pothole defect"
                                  className="w-full h-full object-cover"
                                  fallbackType="critical"
                                />
                              </div>
                              <p className="text-[11px] text-secondary truncate">
                                Reported: {submissionDate}
                              </p>
                            </div>

                            {/* Approved Post-Repair Evidence */}
                            <div className="space-y-1.5 bg-surface-container-low/40 p-3 rounded-xl border border-outline-variant/20">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-primary uppercase tracking-wider text-[10px]">
                                  Approved Post-Repair Evidence
                                </span>
                                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                                  Certified Pass
                                </span>
                              </div>
                              <div className="rounded-lg overflow-hidden border border-outline-variant/30 aspect-video max-h-48 bg-surface-container">
                                <PotholeImage
                                  src={report.restoredImageUrl}
                                  alt="Approved repaired road asphalt"
                                  className="w-full h-full object-cover"
                                  fallbackType="restored"
                                  allowZoom={true}
                                />
                              </div>
                              <p className="text-[11px] text-secondary truncate">
                                Certified Approved: {resolvedDate}
                              </p>
                            </div>
                          </div>

                          {/* Metadata Summary Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-surface-container-low/60 text-xs border border-outline-variant/20">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-secondary block">Assigned Crew</span>
                              <span className="font-semibold text-on-surface truncate block">{assignedCrew}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-secondary block">Certifying Authority</span>
                              <span className="font-semibold text-emerald-800 truncate block">{certifyingAuthority}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-secondary block">Submission Date</span>
                              <span className="font-mono text-on-surface truncate block">{new Date(report.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-secondary block">Approval Date</span>
                              <span className="font-mono text-emerald-700 truncate block">{new Date(report.updatedAt || report.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Complete Lifecycle Timeline */}
                          <div className="pt-2 border-t border-surface-container-high">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block mb-2">
                              Full Civic Resolution Lifecycle:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                              <div className="p-2 rounded bg-surface-container-low border border-outline-variant/20">
                                <span className="text-secondary block text-[10px]">1. Citizen Report</span>
                                <span className="font-bold text-on-surface">Registered &amp; Logged</span>
                              </div>
                              <div className="p-2 rounded bg-surface-container-low border border-outline-variant/20">
                                <span className="text-secondary block text-[10px]">2. Verification</span>
                                <span className="font-bold text-on-surface">Defect Confirmed</span>
                              </div>
                              <div className="p-2 rounded bg-surface-container-low border border-outline-variant/20">
                                <span className="text-secondary block text-[10px]">3. Field Repair</span>
                                <span className="font-bold text-on-surface">Hot-mix Compaction</span>
                              </div>
                              <div className="p-2 rounded bg-emerald-50 border border-emerald-300 text-emerald-900">
                                <span className="text-emerald-700 block text-[10px]">4. Inspection Pass</span>
                                <span className="font-bold">Level-1 Approved</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
