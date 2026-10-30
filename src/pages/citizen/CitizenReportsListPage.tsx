import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportsService } from '../../services/reportsService';
import type { PotholeReport } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { PotholeImage } from '../../components/common/PotholeImage';
import { LoadingState } from '../../components/common/LoadingState';

export const CitizenReportsListPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await reportsService.getMyReports(user?.email);
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [user]);

  const filteredReports = reports.filter((r) => {
    if (filter === 'ALL') return true;
    if (filter === 'RESOLVED') return r.status === 'RESOLVED';
    if (filter === 'ACTIVE') return r.status !== 'RESOLVED' && r.status !== 'REJECTED';
    return true;
  });

  if (isLoading) {
    return <LoadingState message="Loading your community reports..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          to="/citizen/dashboard"
          className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Citizen Dashboard</span>
        </Link>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <h1 className="font-display-hero text-headline-sm text-on-surface">
            My Submitted Hazard Reports
          </h1>
          <p className="font-body-sm text-body-sm text-secondary">
            Permanent civic ledger tracking your reported road conditions.
          </p>
        </div>

        <Link to="/citizen/report">
          <Button
            size="sm"
            icon={<span className="material-symbols-outlined text-[16px]">add_a_photo</span>}
          >
            New Hazard Report
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg w-fit border border-outline-variant/30">
        {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-md font-title-md text-label-md transition-all ${
              filter === tab
                ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            {tab === 'ALL' ? `All (${reports.length})` : tab === 'ACTIVE' ? 'Active Work Orders' : 'Resolved'}
          </button>
        ))}
      </div>

      {/* Reports Feed */}
      {filteredReports.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-container-low text-secondary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">search_off</span>
          </div>
          <h3 className="font-display-hero text-title-md text-on-surface">
            No Reports Found
          </h3>
          <p className="font-body-sm text-body-sm text-secondary max-w-sm mx-auto">
            No hazard reports match your current filter selection.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card key={report.id} padding="md" variant="interactive">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30">
                    <PotholeImage
                      src={report.damageImageUrl}
                      alt="Road defect thumbnail"
                      className="w-full h-full object-cover"
                      fallbackType="default"
                      allowZoom={false}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-code-sm font-semibold text-primary">
                        #{report.trackingNumber}
                      </span>
                      <StatusBadge status={report.status} size="sm" />
                      {report.aiDetection?.severityScore && (
                        <SeverityBadge severity={report.aiDetection.severityScore} size="sm" />
                      )}
                      <span className="font-body-sm text-[12px] text-secondary">
                        · {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-title-md text-title-md text-on-surface font-semibold truncate">
                      {report.location.address}
                    </h3>
                    <p className="font-body-sm text-body-sm text-secondary line-clamp-1">
                      {report.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link to={`/citizen/reports/${report.trackingNumber}`}>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
