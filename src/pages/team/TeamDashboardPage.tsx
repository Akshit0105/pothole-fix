import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { tasksService } from '../../services/tasksService';
import type { RepairTask } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PotholeImage } from '../../components/common/PotholeImage';
import { LoadingState } from '../../components/common/LoadingState';
import { TeamTasksDispatchMap } from '../../components/team/TeamTasksDispatchMap';

export const TeamDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<RepairTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeamTasks() {
      try {
        setError(null);
        const teamTasks = await tasksService.getMyTasks();
        setTasks(teamTasks);
      } catch (err) {
        console.error('Failed to load team tasks', err);
        setError(err instanceof Error ? err.message : 'Unable to connect to municipal tasks API.');
      } finally {
        setIsLoading(false);
      }
    }
    loadTeamTasks();
  }, [user]);

  // Statistics calculated directly from stored tasks
  const assignedCount = tasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const awaitingApprovalCount = tasks.filter((t) => t.status === 'AWAITING_APPROVAL').length;
  const reworkCount = tasks.filter((t) => t.status === 'REWORK_REQUIRED').length;

  if (isLoading) {
    return <LoadingState message="Loading Field Repair workspace..." />;
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low text-tertiary text-label-sm font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
            Field Maintenance Dispatch
          </div>
          <h1 className="font-display-hero text-headline-sm font-bold text-on-surface">
            {user?.name || 'Field Repair Crew'} · {user?.title || 'Crew Lead'}
          </h1>
          <p className="font-body-sm text-body-sm text-secondary">
            {user?.unit || 'Field Repair Squad'} · Active road maintenance work orders and inspection dispatches.
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
          <Link to="/team/tasks">
            <Button
              variant="secondary"
              size="sm"
              icon={<span className="material-symbols-outlined text-[16px]">list</span>}
            >
              All Work Orders ({tasks.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="md">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-secondary">
            Assigned Queue
          </span>
          <p className="font-display-hero text-headline-lg text-on-surface mt-1">{assignedCount}</p>
          <span className="font-body-sm text-[11px] text-secondary">Ready to start</span>
        </Card>

        <Card padding="md">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-amber-700">
            In Progress
          </span>
          <p className="font-display-hero text-headline-lg text-amber-700 mt-1">{inProgressCount}</p>
          <span className="font-body-sm text-[11px] text-secondary">Active on road</span>
        </Card>

        <Card padding="md">
          <span className="font-display-hero text-label-sm uppercase tracking-wider text-purple-700">
            Awaiting Sign-off
          </span>
          <p className="font-display-hero text-headline-lg text-purple-700 mt-1">{awaitingApprovalCount}</p>
          <span className="font-body-sm text-[11px] text-secondary">Photo uploaded</span>
        </Card>

        <Card padding="md" className={reworkCount > 0 ? 'border-error/30 bg-red-50/20' : ''}>
          <span className={`font-display-hero text-label-sm uppercase tracking-wider ${reworkCount > 0 ? 'text-error' : 'text-secondary'}`}>
            Rework Required
          </span>
          <p className={`font-display-hero text-headline-lg mt-1 ${reworkCount > 0 ? 'text-error' : 'text-on-surface'}`}>
            {reworkCount}
          </p>
          <span className="font-body-sm text-[11px] text-secondary">
            {reworkCount > 0 ? 'Requires attention' : 'Zero rework flags'}
          </span>
        </Card>
      </div>

      {/* Dispatch Field Navigation Map (Phase 4) */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display-hero text-base font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-rose-600 text-[20px]">near_me</span>
              <span>Field Repair Dispatch &amp; Route Map</span>
            </h2>
            <p className="font-body-sm text-xs text-secondary">
              GPS markers show assigned work orders. Click any pin to open turn-by-turn navigation or view task workspace.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            {tasks.length} Assigned Sites
          </span>
        </div>

        <TeamTasksDispatchMap tasks={tasks} heightClass="h-72 sm:h-80" />
      </Card>

      {/* Assigned Tasks Feed */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-surface-container-high flex items-center justify-between">
          <div>
            <h2 className="font-display-hero text-title-md text-on-surface">
              Assigned Field Work Orders
            </h2>
            <p className="font-body-sm text-body-sm text-secondary">
              Work orders assigned to Asphalt Unit 04 by the Municipal Authority.
            </p>
          </div>
          <Link
            to="/team/tasks"
            className="font-title-md text-label-md text-primary hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <span className="material-symbols-outlined text-[36px] text-secondary mx-auto block">
              handyman
            </span>
            <h3 className="font-display-hero text-title-md text-on-surface">No Assigned Tasks</h3>
            <p className="font-body-sm text-secondary">
              There are currently no active work orders dispatched to your unit.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-high">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30">
                    <PotholeImage
                      src={task.damageImageUrl}
                      alt="Pothole hazard"
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

                    <h3 className="font-title-md text-headline-sm text-on-surface truncate">
                      {task.location?.address || 'Municipal Street Location'}
                    </h3>

                    {task.instructions && (
                      <p className="font-body-sm text-body-sm text-secondary line-clamp-1 italic">
                        &quot;{task.instructions}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link to={`/team/tasks/${task.id}`}>
                    <Button
                      variant={
                        task.status === 'IN_PROGRESS' || task.status === 'REWORK_REQUIRED'
                          ? 'primary'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {task.status === 'PENDING'
                        ? 'Open & Start Repair'
                        : task.status === 'IN_PROGRESS'
                        ? 'Upload Evidence'
                        : task.status === 'REWORK_REQUIRED'
                        ? 'Review Rework'
                        : 'View Details'}
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
