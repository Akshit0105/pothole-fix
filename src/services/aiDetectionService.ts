import { apiClient } from './apiClient';
import type { AIDetectionResult } from '../types';

export interface RawYoloDetectionResponse {
  detected: boolean;
  confidence: number;
  severity: 'CRITICAL' | 'MODERATE' | 'LOW';
  boxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence?: number;
  }>;
  status?: string;
  message?: string;
  isModelConnected?: boolean;
}

/**
 * Attempts real API detection against the FastAPI backend (POST /ai/detect).
 * If the server is offline or fails, returns an unFabricated disconnected state.
 */
export async function detectPothole(imageFile: File): Promise<AIDetectionResult> {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const data = await apiClient.upload<RawYoloDetectionResponse>(
      '/ai/detect',
      formData,
      { timeoutMs: 6000, skipAuth: true }
    );

    const isModelConnected = data.status !== 'AI_UNAVAILABLE' && data.isModelConnected !== false;

    return {
      isModelConnected,
      detected: data.detected,
      confidence: data.confidence,
      severityScore: data.severity,
      boundingBoxes: (data.boxes || []).map((b) => ({
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        label: b.label || 'pothole',
        confidence: b.confidence,
      })),
      detectedAt: new Date().toISOString(),
      rawResponse: data,
    };
  } catch {
    // Explicitly return Model Not Connected state without fabricating fake predictions
    return {
      isModelConnected: false,
      detected: false,
      confidence: 0,
      severityScore: 'LOW',
      boundingBoxes: [],
    };
  }
}

/**
 * Static baseline test sample matching the Report #PF-101 photograph.
 * Exclusively used for interface verification and labeled as such.
 */
export const STATIC_TEST_SAMPLE: AIDetectionResult = {
  isModelConnected: true,
  detected: true,
  confidence: 0.94,
  severityScore: 'CRITICAL',
  boundingBoxes: [
    {
      x: 22,
      y: 35,
      width: 54,
      height: 48,
      label: 'severe-pothole',
      confidence: 0.94,
    },
  ],
  detectedAt: '2026-10-29T14:20:00Z',
};
