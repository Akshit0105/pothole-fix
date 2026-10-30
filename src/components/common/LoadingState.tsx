import React from 'react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading road infrastructure data...',
  subtext = 'Synchronizing with municipal ledger',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-4 animate-pulse">
        <span className="material-symbols-outlined text-[28px] animate-spin">progress_activity</span>
      </div>
      <h4 className="font-display-hero text-title-md text-on-surface mb-1">{message}</h4>
      <p className="font-body-sm text-body-sm text-secondary">{subtext}</p>
    </div>
  );
};
