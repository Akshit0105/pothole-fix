import React from 'react';
import { Link } from 'react-router-dom';
import { PotholeImage } from '../components/common/PotholeImage';

export const ResolutionPreviewPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="w-full bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/30 p-5 sm:p-6 transition-all duration-300">
        {/* Civic Email Header Strip */}
        <div className="flex items-center justify-between mb-4 pb-3 bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-display-hero text-code-sm uppercase tracking-wider text-on-surface font-semibold">
              Civic Notification Dispatch
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-emerald-100 text-emerald-800 font-bold">
            Certified Pass
          </span>
        </div>

        {/* Email Envelope Meta */}
        <div className="space-y-1 mb-4">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-headline-sm text-label-sm uppercase text-secondary font-semibold">
              Subject:
            </span>
            <h2 className="font-display-hero text-body-lg text-on-surface font-semibold">
              Your PotholeFix Report Has Been Resolved (#PF-101)
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-body-sm font-body-sm text-secondary pt-1">
            <div className="truncate">
              <span className="text-on-surface-variant font-medium">From:</span>{' '}
              notifications@potholefix.gov.in
            </div>
            <div className="truncate">
              <span className="text-on-surface-variant font-medium">To:</span>{' '}
              akshit@potholefix.in
            </div>
          </div>
        </div>

        {/* Email Body Card */}
        <div className="bg-surface-container-lowest rounded-lg mb-4 space-y-3">
          <p className="font-body-md text-body-md text-on-surface leading-relaxed">
            Hello <span className="font-semibold text-primary">Akshit</span>,
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            The road hazard you reported at{' '}
            <span className="font-medium text-on-surface">Sector 17 Plaza Corridor, Chandigarh</span> has been
            successfully repaired and verified by the Municipal Corporation Inspector. Thank you for
            flagging this road hazard to keep commuters safe.
          </p>

          {/* Report Summary Box */}
          <div className="bg-surface-container-low rounded-lg p-3 my-3 border border-outline-variant/20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                Inspection Summary
              </span>
              <span className="font-code-sm text-code-sm text-primary-container font-medium">
                GIS: 30.7398° N, 76.7827° E
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-body-sm font-body-sm">
              <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/10">
                <span className="text-[11px] text-secondary block">Report ID</span>
                <span className="font-semibold text-on-surface font-display-hero">PF-101</span>
              </div>
              <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/10">
                <span className="text-[11px] text-secondary block">Location</span>
                <span className="font-semibold text-on-surface truncate block">
                  Sector 17 Plaza Corridor
                </span>
              </div>
              <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/10">
                <span className="text-[11px] text-secondary block">Verified Timestamp</span>
                <span className="font-semibold text-on-surface">Today 14:20 IST</span>
              </div>
              <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/10">
                <span className="text-[11px] text-secondary block">Repair Unit</span>
                <span className="font-semibold text-primary font-medium">Punjab PWD Unit 04</span>
              </div>
            </div>
          </div>

          {/* Before & After Photographic Comparison */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                Photographic Triage Evidence
              </span>
              <span className="text-[11px] font-code-sm text-emerald-700 font-semibold">Level-1 Pass</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Damage State */}
              <div className="space-y-1">
                <PotholeImage
                  src="/photos/pothole-sector17.jpg"
                  alt="Pre-repair road defect"
                  className="w-full h-24 sm:h-28 object-cover rounded-lg"
                  fallbackType="critical"
                  showBadge
                />
                <p className="font-code-sm text-[10px] text-secondary truncate">Pre-Repair Hazard</p>
              </div>

              {/* Restored State */}
              <div className="space-y-1">
                <PotholeImage
                  src="/photos/pothole-restored1.jpg"
                  alt="Post-repair flush patch"
                  className="w-full h-24 sm:h-28 object-cover rounded-lg"
                  fallbackType="restored"
                  showBadge
                />
                <p className="font-code-sm text-[10px] text-emerald-700 font-semibold truncate">Flush Bitumen Patch</p>
              </div>
            </div>
          </div>

          {/* Portal Resolution CTA */}
          <div className="pt-2">
            <Link
              to="/citizen/reports/PF-101"
              className="w-full py-2.5 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-md text-body-md font-medium shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>View Full Resolution Audit in Portal</span>
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </Link>
          </div>

          {/* Email Footer */}
          <div className="mt-4 pt-3 text-center bg-surface-container-low rounded-lg p-2.5 border border-outline-variant/20">
            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              Thank you for helping keep Chandigarh roads safe.
            </p>
            <p className="font-body-sm text-[11px] text-secondary mt-0.5">
              MC Chandigarh Public Works Department · Work Order #WO-88421
            </p>
          </div>
        </div>

        {/* Action to return to Login & Home */}
        <div className="mt-2 flex items-center justify-center gap-4 text-center">
          <Link
            to="/"
            className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">home</span>
            <span>Back to Home</span>
          </Link>
          <span className="text-outline-variant">·</span>
          <Link
            to="/login"
            className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            <span>Back to Portal Sign-In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
