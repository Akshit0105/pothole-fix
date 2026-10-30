import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsService } from '../../services/reportsService';
import type { PotholeReport } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { PotholeImage } from '../../components/common/PotholeImage';
import { LoadingState } from '../../components/common/LoadingState';

const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MODERATE: 2,
  MEDIUM: 2,
  LOW: 1,
};

export const AuthorityReportsPage: React.FC = () => {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await reportsService.getAllReports();
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, []);

  // Filter and prioritize: Critical & High first by default (Phase 7)
  const filteredAndSortedReports = reports
    .filter((r) => {
      if (statusFilter === 'ALL') {
        if (r.status === 'RESOLVED') return false; // Strictly exclude resolved from active triage queue
      } else if (r.status !== statusFilter) {
        return false;
      }
      if (severityFilter !== 'ALL') {
        const score = r.aiDetection?.severityScore;
        if (severityFilter === 'MODERATE' && (score === 'MODERATE' || score === 'MEDIUM')) {
          // match
        } else if (score !== severityFilter) {
          return false;
        }
      }
      if (
        searchQuery &&
        !r.location.address.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.reporterName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Priority 1: Severity weight descending (Critical -> High -> Medium -> Low)
      const weightA = SEVERITY_WEIGHT[a.aiDetection?.severityScore || 'LOW'] || 0;
      const weightB = SEVERITY_WEIGHT[b.aiDetection?.severityScore || 'LOW'] || 0;
      if (weightB !== weightA) return weightB - weightA;

      // Priority 2: Creation time descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (isLoading) {
    return <LoadingState message="Loading incoming triage queue..." />;
  }

  const criticalCount = reports.filter((r) => r.aiDetection?.severityScore === 'CRITICAL').length;
  const highCount = reports.filter((r) => r.aiDetection?.severityScore === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          to="/authority/dashboard"
          className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Authority Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <h1 className="font-display-hero text-headline-sm font-bold text-on-surface">
            Municipal Road Hazard Triage Queue
          </h1>
          <p className="font-body-sm text-body-sm text-secondary">
            Inspect citizen submissions, assess defect severity, and dispatch repair work orders. Prioritized by risk tier.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 text-xs font-bold">
            {criticalCount} Critical
          </span>
          <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-800 text-xs font-bold">
            {highCount} High Priority
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card padding="md" className="space-y-4">
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
              placeholder="Search by Report #, Indian street, or reporter name..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-md text-sm border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-secondary text-xs whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none"
            >
              <option value="ALL">All Active Hazards (Excl. Closed)</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VERIFIED">Verified</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="AWAITING_APPROVAL">Awaiting Approval</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-secondary text-xs whitespace-nowrap">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none"
            >
              <option value="ALL">All Tiers</option>
              <option value="CRITICAL">Critical (Tier 1)</option>
              <option value="HIGH">High (Tier 2)</option>
              <option value="MODERATE">Moderate / Medium (Tier 3)</option>
              <option value="LOW">Low / Monitor (Tier 4)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Severity Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20 flex-wrap">
          <span className="text-xs font-semibold text-secondary">Quick Filter:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                severityFilter === sev
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container hover:bg-surface-container-high text-secondary'
              }`}
            >
              {sev === 'ALL' ? 'All Severities' : sev}
            </button>
          ))}
        </div>
      </Card>

      {/* Reports List */}
      {filteredAndSortedReports.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-2">
          <span className="material-symbols-outlined text-[36px] text-secondary mx-auto block">
            search_off
          </span>
          <h3 className="font-display-hero text-title-md font-bold text-on-surface">No Reports Match Filter</h3>
          <p className="font-body-sm text-xs text-secondary">
            Adjust your search query or severity filter to display records.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedReports.map((report) => {
            const sev = report.aiDetection?.severityScore?.toLowerCase() || 'default';
            const fallbackType = (sev.includes('crit') ? 'critical' : sev.includes('high') ? 'high' : sev.includes('mod') ? 'moderate' : 'default') as 'critical' | 'high' | 'moderate' | 'default';

            return (
              <Card key={report.id} padding="md" variant="interactive" className="hover:border-primary/40 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30">
                      <PotholeImage
                        src={report.damageImageUrl}
                        alt={`Hazard at ${report.location.address}`}
                        className="w-full h-full object-cover"
                        fallbackType={fallbackType}
                        allowZoom={true}
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary">
                          #{report.trackingNumber}
                        </span>
                        <StatusBadge status={report.status} size="sm" />
                        {report.aiDetection?.severityScore && (
                          <SeverityBadge severity={report.aiDetection.severityScore} size="sm" />
                        )}
                        <span className="text-xs text-secondary">
                          · {new Date(report.createdAt).toLocaleDateString()} by{' '}
                          <strong>{report.reporterName}</strong>
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-on-surface truncate">
                        {report.location.address}
                      </h3>
                      <p className="text-xs text-secondary line-clamp-1">
                        {report.description}
                      </p>
                      <div className="text-[11px] font-mono text-secondary">
                        GPS: {report.location.latitude.toFixed(4)}° N, {report.location.longitude.toFixed(4)}° E
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link to={`/authority/reports/${report.trackingNumber}`}>
                      <Button variant="secondary" size="sm" icon={<span className="material-symbols-outlined text-[16px]">visibility</span>}>
                        Inspect &amp; Triage
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
