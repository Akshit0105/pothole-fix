import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  promptLabel: string;
  onSubmit: (reason: string) => Promise<void>;
  confirmButtonText?: string;
  placeholder?: string;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  promptLabel,
  onSubmit,
  confirmButtonText = 'Confirm Rejection',
  placeholder = 'Explain technical defect or non-conformance...',
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('An explanation is required to complete this action.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(reason);
      setReason('');
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block font-title-md text-label-md text-on-surface mb-1">
            {promptLabel}
          </label>
          <textarea
            rows={4}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md border border-outline-variant/30 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-error/20"
          />
        </div>

        <div className="pt-3 border-t border-surface-container-high flex items-center justify-end gap-2">
          <Button variant="ghost" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" size="md" type="submit" isLoading={isSubmitting}>
            {confirmButtonText}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
