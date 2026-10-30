import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasksService } from '../../services/tasksService';
import type { RepairTask } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PotholeImage } from '../../components/common/PotholeImage';
import { LoadingState } from '../../components/common/LoadingState';

export const TeamTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<RepairTask[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await tasksService.getMyTasks('team-04');
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
    if (filter === 'ALL') return true;
    if (filter === 'ASSIGNED') return t.status === 'PENDING';
    if (filter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (filter === 'AWAITING_APPROVAL') return t.status === 'AWAITING_APPROVAL';
    if (filter === 'REWORK_REQUIRED') return t.status === 'REWORK_REQUIRED';
    if (filter === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  if (isLoading) {
    return <LoadingState message="Loading field work orders..." />;
  }

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
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Crew Dashboard</span>
        </Link>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <h1 className="font-display-hero text-headline-sm font-bold text-on-surface">
            Punjab PWD Unit 04 Work Orders
          </h1>
          <p className="font-body-sm text-body-sm text-secondary">
            Field repair orders assigned to Gurpreet Singh and repair crew.
          </p>
        </div>
      </div>

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

      {/* Work Orders List */}
      {filteredTasks.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-2">
          <span className="material-symbols-outlined text-[36px] text-secondary mx-auto block">
            search_off
          </span>
          <h3 className="font-display-hero text-title-md text-on-surface">No Work Orders Found</h3>
          <p className="font-body-sm text-secondary">
            No active work orders match your current filter selection.
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
                      <StatusBadge status={task.status as unknown as import('../../types').ReportStatus} size="sm" />
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold bg-primary-fixed/40 text-primary">
                        {task.priority} Priority
                      </span>
                    </div>

                    <h3 className="font-title-md text-headline-sm text-on-surface truncate">
                      {task.location?.address || 'Municipal Road Location'}
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
