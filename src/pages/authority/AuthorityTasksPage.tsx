import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasksService } from '../../services/tasksService';
import type { RepairTask } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PotholeImage } from '../../components/common/PotholeImage';
import { LoadingState } from '../../components/common/LoadingState';

export const AuthorityTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<RepairTask[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await tasksService.getAllTasks();
        setTasks(data);
      } catch (err) {
        console.error('Failed to load tasks', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (teamFilter !== 'ALL' && t.assignedTeamId !== teamFilter) return false;
    return true;
  });

  if (isLoading) {
    return <LoadingState message="Loading municipal repair work orders..." />;
  }

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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <h1 className="font-display-hero text-headline-sm text-on-surface">
            Active Municipal Work Orders
          </h1>
          <p className="font-body-sm text-body-sm text-secondary">
            Tracking dispatches, crew allocations, and repair execution across all city units.
          </p>
        </div>

        <Link to="/authority/approvals">
          <Button
            variant="secondary"
            size="sm"
            icon={<span className="material-symbols-outlined text-[16px]">verified</span>}
          >
            Review Evidence Approvals
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-secondary text-[12px] whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-md text-label-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest"
            >
              <option value="ALL">All Statuses ({tasks.length})</option>
              <option value="PENDING">Pending Start</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="AWAITING_APPROVAL">Awaiting Approval</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REWORK_REQUIRED">Rework Required</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-label-sm text-secondary text-[12px] whitespace-nowrap">Repair Unit:</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-md text-label-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest"
            >
              <option value="ALL">All Repair Teams</option>
              <option value="team-04">Punjab PWD Unit 04</option>
              <option value="team-02">Chandigarh MC Road Squad 02</option>
              <option value="team-01">Delhi Emergency Arterial Unit 01</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-2">
          <span className="material-symbols-outlined text-[36px] text-secondary mx-auto block">
            assignment_late
          </span>
          <h3 className="font-display-hero text-title-md text-on-surface">No Work Orders Found</h3>
          <p className="font-body-sm text-secondary">
            No active work orders match your current filter settings.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} padding="md" variant="interactive">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30">
                    <PotholeImage
                      src={task.damageImageUrl}
                      alt="Hazard thumbnail"
                      className="w-full h-full object-cover"
                      fallbackType="critical"
                      allowZoom={false}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-code-sm font-semibold text-primary">
                        Work Order #{task.id}
                      </span>
                      <span className="font-body-sm text-secondary text-[12px]">
                        (Report #{task.trackingNumber})
                      </span>
                      <StatusBadge status={task.status as unknown as import('../../types').ReportStatus} size="sm" />
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold bg-primary-fixed/40 text-primary">
                        {task.priority} Priority
                      </span>
                    </div>

                    <h3 className="font-title-md text-title-md text-on-surface font-semibold truncate">
                      {task.location?.address || 'Municipal Street Location'}
                    </h3>

                    <div className="flex items-center gap-3 text-body-sm text-secondary text-[12px] flex-wrap">
                      <span>Assigned: {task.assignedTeamName}</span>
                      {task.deadline && <span>· Target: {task.deadline}</span>}
                    </div>

                    {task.instructions && (
                      <p className="font-body-sm text-body-sm text-secondary line-clamp-1 italic">
                        &quot;{task.instructions}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link to={`/authority/reports/${task.trackingNumber}`}>
                    <Button variant="secondary" size="sm">
                      Inspect Report
                    </Button>
                  </Link>

                  {task.status === 'AWAITING_APPROVAL' && (
                    <Link to="/authority/approvals">
                      <Button variant="primary" size="sm">
                        Review Evidence
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
