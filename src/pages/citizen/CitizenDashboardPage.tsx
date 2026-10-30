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

export const CitizenDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        setError(null);
        const userReports = await reportsService.getMyReports(user?.email);
        setReports(userReports);
      } catch (err) {
        console.error('Failed to load citizen reports', err);
        setError(err instanceof Error ? err.message : 'Unable to connect to municipal reporting API.');
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [user]);

  // Real statistics calculated directly from stored records
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(r.status)
  ).length;
  const inProgressReports = reports.filter((r) =>
    ['ASSIGNED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'REWORK_REQUIRED'].includes(r.status)
  ).length;
  const resolvedReports = reports.filter((r) => r.status === 'RESOLVED').length;

  if (isLoading) {
    return <LoadingState message="Loading your community reports..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-lg bg-error-container text-on-error-container flex items-center gap-2.5 font-body-sm border border-error/30">
          <span className="material-symbols-outlined text-[20px]">cloud_off</span>
          <div>
            <p className="font-title-md font-semibold">Backend Connection Unavailable</p>
            <p className="text-[12px]">{error}</p>
          </div>
        </div>
      )}

      {/* Personalized Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low text-primary text-label-sm font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
            Active Civic Session
          </div>
          <h1 className="font-display-hero text-headline-sm font-bold text-on-surface">
            Hello, {user?.name || 'Akshit Sharma'}
          </h1>
          <p className="font-body-sm text-body-sm text-secondary">
            Track submitted road hazards and view verified repair updates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              icon={<span className="material-symbols-outlined text-[16px]">home</span>}
            >
              Back to Home
            </Button>
          </Link>
          <Link to="/citizen/report">
            <Button
              size="md"
              icon={<span className="material-symbols-outlined text-[18px]">add_a_photo</span>}
            >
              Report a Pothole
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Statistics Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="md">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-secondary">
            Total Submitted
          </span>
          <p className="font-display-hero text-headline-lg text-on-surface mt-1">{totalReports}</p>
          <span className="font-body-sm text-[11px] text-secondary">Your registered submissions</span>
        </Card>

        <Card padding="md">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-secondary">
            Pending Triage
          </span>
          <p className="font-display-hero text-headline-lg text-on-surface mt-1">{pendingReports}</p>
          <span className="font-body-sm text-[11px] text-secondary">Awaiting initial review</span>
        </Card>

        <Card padding="md">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-amber-700">
            In Progress
          </span>
          <p className="font-display-hero text-headline-lg text-amber-700 mt-1">{inProgressReports}</p>
          <span className="font-body-sm text-[11px] text-secondary">Assigned to repair unit</span>
        </Card>

        <Card padding="md">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-emerald-700">
            Resolved
          </span>
          <p className="font-display-hero text-headline-lg text-emerald-700 mt-1">{resolvedReports}</p>
          <span className="font-body-sm text-[11px] text-secondary">Verified &amp; closed</span>
        </Card>
      </div>

      {/* Recent Reports Section */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-surface-container-high flex items-center justify-between">
          <div>
            <h2 className="font-display-hero text-title-md text-on-surface">Recent Submissions</h2>
            <p className="font-body-sm text-body-sm text-secondary">
              Chronological log of your reported road hazards.
            </p>
          </div>
          {reports.length > 0 && (
            <Link
              to="/citizen/reports"
              className="font-title-md text-label-md text-primary hover:underline flex items-center gap-1"
            >
              <span>View All ({reports.length})</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          )}
        </div>

        {reports.length === 0 ? (
          /* Empty State for New Users */
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-surface-container-low text-secondary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">alt_route</span>
            </div>
            <h3 className="font-display-hero text-title-md text-on-surface">No Reports Yet</h3>
            <p className="font-body-sm text-body-sm text-secondary max-w-sm mx-auto">
              You haven&apos;t submitted any road hazards. Help improve our streets by reporting dangerous potholes.
            </p>
            <div className="pt-2">
              <Link to="/citizen/report">
                <Button size="sm" icon={<span className="material-symbols-outlined text-[16px]">add_a_photo</span>}>
                  Report Your First Pothole
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-high">
            {reports.slice(0, 4).map((report) => (
              <div
                key={report.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30">
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
                      <span className="font-code-sm font-semibold text-primary">#{report.trackingNumber}</span>
                      <StatusBadge status={report.status} size="sm" />
                      {report.aiDetection?.severityScore && (
                        <SeverityBadge severity={report.aiDetection.severityScore} size="sm" />
                      )}
                      <span className="font-body-sm text-[11px] text-secondary">
                        · {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-title-md text-label-md text-on-surface font-semibold truncate">
                      {report.location.address}
                    </p>
                    <p className="font-body-sm text-body-sm text-secondary line-clamp-1">
                      {report.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0">
                  <Link to={`/citizen/reports/${report.id}`}>
                    <Button variant="secondary" size="sm">
                      View Progress
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
