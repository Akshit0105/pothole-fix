import React, { useState } from 'react';
import type { PotholeReport, RepairTask } from '../../types';
import { tasksService } from '../../services/tasksService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PotholeReport;
  onSuccess: (task: RepairTask) => void;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  report,
  onSuccess,
}) => {
  const defaultPriority = (
    report.aiDetection?.severityScore === 'LOW'
      ? 'LOW'
      : report.aiDetection?.severityScore === 'MODERATE' || report.aiDetection?.severityScore === 'MEDIUM'
      ? 'MEDIUM'
      : 'HIGH'
  ) as 'HIGH' | 'MEDIUM' | 'LOW';

  const [selectedTeam, setSelectedTeam] = useState('team-04');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>(defaultPriority);
  const [deadline, setDeadline] = useState('Tomorrow 17:00 IST');
  const [instructions, setInstructions] = useState(
    'Saw-cut defect perimeter, clean gravel debris, apply tack coat, and compact hot-mix asphalt flush with grade.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const teamOptions = [
    { id: 'team-04', name: 'Punjab PWD Unit 04 (Lead: Gurpreet Singh)' },
    { id: 'team-02', name: 'Chandigarh MC Road Squad 02 (Lead: Amit Verma)' },
    { id: 'team-01', name: 'Delhi Arterial Emergency Squad 01 (Lead: Rajesh Sharma)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const team = teamOptions.find((t) => t.id === selectedTeam) || teamOptions[0];

    try {
      const task = await tasksService.createTask({
        reportId: report.id,
        trackingNumber: report.trackingNumber,
        assignedTeamId: team.id,
        assignedTeamName: team.name,
        priority,
        deadline,
        instructions,
        location: report.location,
        damageImageUrl: report.damageImageUrl,
      });

      setIsSubmitting(false);
      onSuccess(task);
      onClose();
    } catch (err) {
      console.error('Failed to create task assignment', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Dispatch assignment failed. Verify municipal server status.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Repair Task"
      subtitle={`Assign Work Order for Report #${report.trackingNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Report Overview Header */}
        <div className="p-3 rounded-lg bg-surface-container-low text-body-sm space-y-0.5 border border-outline-variant/20">
          <span className="font-semibold text-on-surface block truncate">
            {report.location.address}
          </span>
          <span className="text-secondary text-[12px] block">
            GIS: {report.location.latitude.toFixed(4)}° N, {report.location.longitude.toFixed(4)}° E
          </span>
        </div>

        {/* Team Selection */}
        <div>
          <label className="block font-title-md text-label-md text-on-surface mb-1">
            Designated Municipal Crew
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest"
          >
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority & Deadline Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-title-md text-label-md text-on-surface mb-1">
              Dispatch Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest"
            >
              <option value="HIGH">High (Urgent Arterial)</option>
              <option value="MEDIUM">Medium (Scheduled Triage)</option>
              <option value="LOW">Low (Minor Surface Spall)</option>
            </select>
          </div>

          <div>
            <label className="block font-title-md text-label-md text-on-surface mb-1">
              Target Deadline
            </label>
            <input
              type="text"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="e.g. Tomorrow 17:00 EST"
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest"
            />
          </div>
        </div>

        {/* Work Instructions */}
        <div>
          <label className="block font-title-md text-label-md text-on-surface mb-1">
            Field Work Instructions
          </label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-surface-container-high flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isSubmitting}
            icon={<span className="material-symbols-outlined text-[18px]">engineering</span>}
          >
            Confirm Dispatch
          </Button>
        </div>
      </form>
    </Modal>
  );
};
