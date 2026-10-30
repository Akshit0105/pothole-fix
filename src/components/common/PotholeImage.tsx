import React, { useState } from 'react';

interface PotholeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackType?: 'critical' | 'high' | 'moderate' | 'restored' | 'default';
  allowZoom?: boolean;
  showBadge?: boolean;
}

const FALLBACK_MAP: Record<string, string> = {
  critical: '/photos/pothole-sector17.jpg',
  high: '/photos/pothole-madhyamarg.jpg',
  moderate: '/photos/pothole-kharar.jpg',
  restored: '/photos/pothole-restored1.jpg',
  default: '/photos/pothole-sector17.jpg',
};

export const PotholeImage: React.FC<PotholeImageProps> = ({
  src,
  alt,
  className = 'w-full h-48 object-cover rounded-lg',
  fallbackType = 'default',
  allowZoom = true,
  showBadge = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Determine correct image URL
  const fallbackSrc = FALLBACK_MAP[fallbackType] || FALLBACK_MAP.default;

  let resolvedSrc = src;
  if (!resolvedSrc || resolvedSrc.trim() === '') {
    resolvedSrc = fallbackSrc;
  } else if (resolvedSrc.startsWith('/uploads/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    resolvedSrc = `${apiBase}${resolvedSrc}`;
  } else if (resolvedSrc.includes('sample-potholes') || resolvedSrc.endsWith('.svg')) {
    // Seamlessly map any legacy SVG paths to authentic realistic photographs
    if (resolvedSrc.includes('madhyamarg')) {
      resolvedSrc = '/photos/pothole-madhyamarg.jpg';
    } else if (resolvedSrc.includes('sector22') || resolvedSrc.includes('kharar')) {
      resolvedSrc = '/photos/pothole-kharar.jpg';
    } else if (resolvedSrc.includes('restored2')) {
      resolvedSrc = '/photos/pothole-restored2.jpg';
    } else if (resolvedSrc.includes('restored1')) {
      resolvedSrc = '/photos/pothole-restored1.jpg';
    } else {
      resolvedSrc = '/photos/pothole-sector17.jpg';
    }
  }

  const finalSrc = hasError ? fallbackSrc : resolvedSrc;
  const isDemo = hasError || !src || src.includes('photos') || src.includes('sample-potholes') || src.includes('googleusercontent');

  return (
    <>
      <div className="relative group overflow-hidden rounded-lg bg-surface-container-high">
        <img
          src={finalSrc}
          alt={alt}
          className={`${className} transition-transform duration-300 ${allowZoom ? 'cursor-pointer group-hover:scale-105' : ''}`}
          onError={() => setHasError(true)}
          onClick={() => allowZoom && setIsZoomed(true)}
          loading="lazy"
        />

        {showBadge && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded shadow-sm ${
                isDemo ? 'bg-secondary/90 text-white' : 'bg-primary/90 text-white'
              }`}
            >
              {isDemo ? 'Demo Photography' : 'Live Citizen Upload'}
            </span>
          </div>
        )}

        {allowZoom && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(true);
            }}
            className="absolute bottom-2 right-2 p-1.5 bg-on-surface/70 hover:bg-on-surface text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow"
            title="Inspect full image"
          >
            <span className="material-symbols-outlined text-sm leading-none">zoom_in</span>
          </button>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-surface rounded-xl overflow-hidden shadow-2xl border border-outline-variant flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-surface-container flex items-center justify-between border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">image</span>
                <span className="font-semibold text-sm text-on-surface">{alt}</span>
                {isDemo && (
                  <span className="text-[11px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-medium">
                    Demo Photography
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-2 overflow-auto max-h-[calc(90vh-100px)] flex items-center justify-center bg-black/40">
              <img src={finalSrc} alt={alt} className="max-w-full max-h-[75vh] object-contain rounded" />
            </div>

            <div className="p-2.5 bg-surface-container-low text-xs text-secondary text-center border-t border-outline-variant">
              Click outside or press close to exit inspection mode.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
