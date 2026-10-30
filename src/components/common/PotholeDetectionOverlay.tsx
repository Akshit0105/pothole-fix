import React from 'react';
import type { AIDetectionResult } from '../../types';

interface PotholeDetectionOverlayProps {
  imageUrl: string;
  aiDetection?: AIDetectionResult;
  className?: string;
  alt?: string;
}

export const PotholeDetectionOverlay: React.FC<PotholeDetectionOverlayProps> = ({
  imageUrl,
  aiDetection,
  className = '',
  alt = 'Pothole condition photograph',
}) => {
  const hasBoxes =
    aiDetection &&
    aiDetection.isModelConnected &&
    aiDetection.detected &&
    aiDetection.boundingBoxes &&
    aiDetection.boundingBoxes.length > 0;

  return (
    <div className={`relative rounded-xl overflow-hidden bg-surface-container select-none ${className}`}>
      {/* Base Photograph */}
      <img src={imageUrl} alt={alt} className="w-full h-full object-cover block" />

      {/* Bounding Boxes Layer */}
      {hasBoxes && (
        <div className="absolute inset-0 pointer-events-none">
          {aiDetection.boundingBoxes.map((box, idx) => (
            <div
              key={idx}
              className="absolute border-2 border-error rounded-md transition-all shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }}
            >
              {/* Badge label atop bounding box */}
              <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-error text-on-error font-code-sm text-[11px] font-semibold flex items-center gap-1 shadow-sm uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>
                  {box.label} {box.confidence ? `· ${(box.confidence * 100).toFixed(0)}%` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Model Disconnected Badge */}
      {aiDetection && !aiDetection.isModelConnected && (
        <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-surface-container-highest/90 backdrop-blur-sm text-secondary font-label-sm text-[11px] border border-outline-variant/40 flex items-center gap-1.5 shadow-sm">
          <span className="material-symbols-outlined text-[15px] text-amber-600">cloud_off</span>
          <span>AI Model Not Connected (Manual Triage)</span>
        </div>
      )}
    </div>
  );
};
