import React, { useState, useMemo } from 'react';
import type { PotholeReport, RepairTask } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SeverityBadge, StatusBadge } from '../common/StatusBadge';
import { PotholeImage } from '../common/PotholeImage';
import { tasksService } from '../../services/tasksService';

interface SmartRepairClustersProps {
  reports: PotholeReport[];
  onClusterAssigned?: (newTasks: RepairTask[]) => void;
}

export interface ReportCluster {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  reports: PotholeReport[];
  highestSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedTeamId: string;
  suggestedTeamName: string;
}

// Haversine distance in kilometers
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MODERATE: 2,
  MEDIUM: 2,
  LOW: 1,
};

export const SmartRepairClusters: React.FC<SmartRepairClustersProps> = ({
  reports,
  onClusterAssigned,
}) => {
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(8); // Configurable 5-10 km radius
  const [minReportThreshold, setMinReportThreshold] = useState<number>(2); // 2 for evaluation demo, scalable to 50
  const [selectedCluster, setSelectedCluster] = useState<ReportCluster | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Filter eligible unresolved reports
  const eligibleReports = useMemo(() => {
    return reports.filter((r) =>
      ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(r.status)
    );
  }, [reports]);

  // Compute geographical clusters
  const clusters: ReportCluster[] = useMemo(() => {
    if (eligibleReports.length === 0) return [];

    const visited = new Set<string>();
    const result: ReportCluster[] = [];
    let clusterIndex = 1;

    for (let i = 0; i < eligibleReports.length; i++) {
      const current = eligibleReports[i];
      if (visited.has(current.id)) continue;

      const clusterGroup: PotholeReport[] = [current];
      visited.add(current.id);

      for (let j = 0; j < eligibleReports.length; j++) {
        if (i === j) continue;
        const candidate = eligibleReports[j];
        if (visited.has(candidate.id)) continue;

        const dist = calculateHaversineKm(
          current.location.latitude,
          current.location.longitude,
          candidate.location.latitude,
          candidate.location.longitude
        );

        if (dist <= maxRadiusKm) {
          clusterGroup.push(candidate);
          visited.add(candidate.id);
        }
      }

      if (clusterGroup.length >= minReportThreshold) {
        // Compute approximate center
        const avgLat =
          clusterGroup.reduce((acc, r) => acc + r.location.latitude, 0) / clusterGroup.length;
        const avgLng =
          clusterGroup.reduce((acc, r) => acc + r.location.longitude, 0) / clusterGroup.length;

        // Compute coverage radius
        let maxDist = 0.5;
        clusterGroup.forEach((r) => {
          const d = calculateHaversineKm(avgLat, avgLng, r.location.latitude, r.location.longitude);
          if (d > maxDist) maxDist = d;
        });

        // Determine highest severity
        let highestSev: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        let maxRank = 0;
        clusterGroup.forEach((r) => {
          const rank = SEVERITY_RANK[r.aiDetection?.severityScore || 'LOW'] || 1;
          if (rank > maxRank) {
            maxRank = rank;
            highestSev = (r.aiDetection?.severityScore as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') || 'LOW';
          }
        });

        // Cluster Name based on predominant street/sector
        const sampleAddress = clusterGroup[0].location.address || 'Corridor';
        const areaName = sampleAddress.split(',')[0].trim();

        result.push({
          id: `CLUSTER-CHD-${String(clusterIndex).padStart(2, '0')}`,
          name: `${areaName} Regional Cluster`,
          centerLat: avgLat,
          centerLng: avgLng,
          radiusKm: parseFloat(maxDist.toFixed(1)),
          reports: clusterGroup,
          highestSeverity: highestSev,
          suggestedTeamId: 'team-04',
          suggestedTeamName: 'Punjab PWD Unit 04 (Lead: Gurpreet Singh)',
        });

        clusterIndex++;
      }
    }

    return result;
  }, [eligibleReports, maxRadiusKm, minReportThreshold]);

  // Handle Coordinated Cluster Dispatch
  const handleDispatchCluster = async (cluster: ReportCluster) => {
    setIsDispatching(true);
    setDispatchSuccess(null);
    setDispatchError(null);

    try {
      const createdTasks: RepairTask[] = [];

      for (const report of cluster.reports) {
        // Only dispatch reports that haven't been assigned yet
        if (['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED'].includes(report.status)) {
          const newTask = await tasksService.createTask({
            reportId: report.id,
            trackingNumber: report.trackingNumber,
            assignedTeamId: cluster.suggestedTeamId,
            assignedTeamName: cluster.suggestedTeamName,
            priority:
              cluster.highestSeverity === 'CRITICAL'
                ? 'HIGH'
                : cluster.highestSeverity === 'HIGH'
                ? 'HIGH'
                : 'MEDIUM',
            deadline: 'Coordinated Dispatch: Within 48h',
            instructions: `Coordinated Cluster #${cluster.id}: Saw-cut, clean cavity, and compact hot-mix asphalt flush with grade. Individual report #${report.trackingNumber} retains independent auditability.`,
            location: report.location,
            damageImageUrl: report.damageImageUrl,
          });
          createdTasks.push(newTask);
        }
      }

      setDispatchSuccess(
        `Cluster #${cluster.id} coordinated successfully! ${createdTasks.length} independent work orders assigned to ${cluster.suggestedTeamName}. Original report IDs and audit trails preserved.`
      );
      if (onClusterAssigned) {
        onClusterAssigned(createdTasks);
      }
      setTimeout(() => setDispatchSuccess(null), 7000);
    } catch (err) {
      console.error('Cluster dispatch failed', err);
      setDispatchError(err instanceof Error ? err.message : 'Coordinated dispatch failed.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <Card padding="md" className="space-y-5 border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-high">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1">
            <span className="material-symbols-outlined text-[15px]">hub</span>
            <span>Spatial Intelligence</span>
          </div>
          <h2 className="font-display-hero text-lg font-bold text-on-surface">
            Smart Geographical Repair Clusters
          </h2>
          <p className="font-body-sm text-xs text-secondary">
            Groups localized road defects within a spatial radius to coordinate bulk repair squad dispatches without merging independent tickets.
          </p>
        </div>

        {/* Configuration Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="radiusSelect" className="text-secondary font-medium">Radius:</label>
            <select
              id="radiusSelect"
              value={maxRadiusKm}
              onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none"
            >
              <option value={5}>5 km</option>
              <option value={8}>8 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="thresholdSelect" className="text-secondary font-medium">Sensitivity:</label>
            <select
              id="thresholdSelect"
              value={minReportThreshold}
              onChange={(e) => setMinReportThreshold(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-surface-container-low text-on-surface text-xs border border-outline-variant/30 focus:outline-none"
            >
              <option value={2}>2+ Reports (Demo)</option>
              <option value={3}>3+ Reports</option>
              <option value={5}>5+ Reports</option>
              <option value={50}>50+ Reports (Bulk)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {dispatchSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span className="font-medium">{dispatchSuccess}</span>
        </div>
      )}

      {dispatchError && (
        <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{dispatchError}</span>
        </div>
      )}

      {/* Cluster List or Empty State */}
      {clusters.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-surface-container-low/40 border border-outline-variant/20 space-y-2">
          <span className="material-symbols-outlined text-3xl text-secondary">explore_off</span>
          <p className="text-xs text-secondary font-medium">
            No geographical clusters detected within {maxRadiusKm} km radius meeting the {minReportThreshold}+ reports threshold.
          </p>
          <p className="text-[11px] text-secondary">
            Try adjusting the spatial radius or report sensitivity selector above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusters.map((cluster) => {
            const isSelected = selectedCluster?.id === cluster.id;
            return (
              <div
                key={cluster.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 bg-surface-container-lowest shadow-md'
                    : 'border-outline-variant/30 bg-surface-container-low/30 hover:border-outline-variant hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-surface-container-high">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        #{cluster.id}
                      </span>
                      <SeverityBadge severity={cluster.highestSeverity} size="sm" />
                    </div>
                    <h4 className="font-bold text-sm text-on-surface mt-1">
                      {cluster.name}
                    </h4>
                  </div>

                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-container text-on-primary">
                    {cluster.reports.length} Reports
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-secondary py-1">
                  <div className="flex items-center justify-between">
                    <span>Geographic Radius:</span>
                    <span className="font-medium text-on-surface">~{cluster.radiusKm} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Center Coordinates:</span>
                    <span className="font-mono text-[11px] text-on-surface">
                      {cluster.centerLat.toFixed(4)}° N, {cluster.centerLng.toFixed(4)}° E
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Suggested Crew:</span>
                    <span className="font-medium text-primary truncate max-w-[180px]">
                      {cluster.suggestedTeamName.split('(')[0]}
                    </span>
                  </div>
                </div>

                {/* Individual Reports Included in Cluster */}
                <div className="pt-2 mt-2 border-t border-outline-variant/20">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary block mb-1">
                    Independently Tracked Sub-Defects:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {cluster.reports.map((r) => (
                      <span
                        key={r.id}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container text-on-surface border border-outline-variant/20"
                        title={r.location.address}
                      >
                        #{r.trackingNumber}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 mt-2 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCluster(isSelected ? null : cluster)}
                  >
                    {isSelected ? 'Hide Details' : 'View Defects'}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isDispatching}
                    onClick={() => handleDispatchCluster(cluster)}
                    icon={<span className="material-symbols-outlined text-[15px]">send</span>}
                  >
                    Dispatch Cluster
                  </Button>
                </div>

                {/* Expanded Inspection Drawer for Cluster */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-2">
                    <span className="text-xs font-bold text-on-surface block">
                      Cluster Defect Inspection List:
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {cluster.reports.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex items-center gap-2.5 text-xs"
                        >
                          <div className="w-9 h-9 rounded overflow-hidden shrink-0 border border-outline-variant/30">
                            <PotholeImage
                              src={rep.damageImageUrl}
                              alt="Defect"
                              className="w-full h-full object-cover"
                              fallbackType="default"
                              allowZoom={false}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-primary">
                                #{rep.trackingNumber}
                              </span>
                              <StatusBadge status={rep.status} size="sm" />
                            </div>
                            <p className="truncate text-secondary text-[11px]">
                              {rep.location.address}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Regulatory Note */}
      <div className="p-2.5 rounded-lg bg-surface-container-low text-[11px] text-secondary flex items-center gap-2 border border-outline-variant/20">
        <span className="material-symbols-outlined text-primary text-[16px]">info</span>
        <span>
          <strong>Cluster Rule:</strong> Grouping does not merge or delete reports. Every original hazard maintains its own unique ID, citizen photograph, status history, and post-repair audit trail.
        </span>
      </div>
    </Card>
  );
};
