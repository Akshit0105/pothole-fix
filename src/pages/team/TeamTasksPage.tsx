
import React, { useState, useEffect, useCallback } from 'react';
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

export const TeamTasksPage: React.FC = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<RepairTask[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Tasks from FastAPI Backend
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await tasksService.getMyTasks(user?.teamId);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load assigned work orders.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.teamId]);

  // Fetch Tasks on Component Load
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ALL') return true;
    if (filter === 'ASSIGNED') return t.status === 'PENDING';
    if (filter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (filter === 'AWAITING_APPROVAL') return t.status === 'AWAITING_APPROVAL';
    if (filter === 'REWORK_REQUIRED') return t.status === 'REWORK_REQUIRED';
    if (filter === 'RESOLVED') return t.status === 'RESOLVED';

    return true;
  });

  // Loading State
  if (isLoading) {
    return <LoadingState message="Loading field work orders..." />;
  }

  // Filter Tabs
  const filterTabs = [
    { id: 'ALL', label: `All (${tasks.length})` },
    { id: 'ASSIGNED', label: 'Assigned' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'AWAITING_APPROVAL', label: 'Awaiting Sign-off' },
    { id: 'REWORK_REQUIRED', label: 'Rework' },
    { id: 'RESOLVED', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">

      {/* Top Navigation */}
      <div>
        <Link
          to="/team/dashboard"
          className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          <span>Back to Crew Dashboard</span>
        </Link>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <h1 className="font-display-hero text-headline-sm font-bold text-on-surface">
            {user?.unit || 'Field Repair Squad'} Work Orders
          </h1>

          <p className="font-body-sm text-body-sm text-secondary">
            Field repair orders assigned to {user?.name || 'repair squad'}.
          </p>
        </div>
      </div>

      {/* API Error and Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container text-on-error-container flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-error/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-error shrink-0">
              error
            </span>

            <div>
              <p className="font-semibold text-sm">
                Failed to load work orders
              </p>

              <p className="text-xs opacity-90">
                {error}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadTasks}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-md font-title-md text-label-md transition-all ${
              filter === tab.id
                ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task Location Map */}
      <Card padding="md" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display-hero text-sm sm:text-base font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-rose-600 text-[18px]">
              map
            </span>

            <span>Assigned Tasks Geographic Distribution</span>
          </h2>

          <span className="text-xs text-secondary">
            Showing {filteredTasks.length} active sites
          </span>
        </div>

        <TeamTasksDispatchMap
          tasks={filteredTasks}
          heightClass="h-64 sm:h-72"
        />
      </Card>

      {/* Work Orders List */}
      {filteredTasks.length === 0 ? (
        !error && (
          <Card
            padding="lg"
            className="text-center py-12 space-y-2"
          >
            <span className="material-symbols-outlined text-[36px] text-secondary mx-auto block">
              search_off
            </span>

            <h3 className="font-display-hero text-title-md text-on-surface">
              No Work Orders Found
            </h3>

            <p className="font-body-sm text-secondary">
              No active work orders match your current filter selection.
            </p>
          </Card>
        )
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              padding="md"
              variant="interactive"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                {/* Task Information */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-outline-variant/30">
                    <PotholeImage
                      src={task.damageImageUrl}
                      alt="Pothole capture"
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

                      <StatusBadge
                        status={task.status as unknown as import('../../types').ReportStatus}
                        size="sm"
                      />

                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-primary-fixed/40 text-primary">
                        {task.priority} Priority
                      </span>
                    </div>

                    <h3 className="font-title-md text-headline-sm text-on-surface truncate">
                      {task.location?.address || 'Municipal Road Location'}
                    </h3>

                    <div className="flex items-center gap-3 text-body-sm text-secondary text-[12px] flex-wrap">
                      <span>
                        Assigned: {task.assignedTeamName}
                      </span>

                      {task.deadline && (
                        <span>· Target: {task.deadline}</span>
                      )}
                    </div>

                    {task.instructions && (
                      <p className="font-body-sm text-body-sm text-secondary line-clamp-1 italic">
                        &quot;{task.instructions}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Task Action */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Link to={`/team/tasks/${task.id}`}>
                    <Button
                      variant={
                        task.status === 'IN_PROGRESS' ||
                        task.status === 'REWORK_REQUIRED'
                          ? 'primary'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {task.status === 'PENDING'
                        ? 'Start Repair'
                        : task.status === 'IN_PROGRESS'
                        ? 'Upload Evidence'
                        : task.status === 'REWORK_REQUIRED'
                        ? 'Review Rework'
                        : 'View Details'}
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
