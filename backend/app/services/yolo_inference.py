import io
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..config import settings
from ..schemas import BoundingBoxSchema

# Cached model instance for efficiency across requests
_cached_model = None
_cached_weights_path = None

def get_yolo_model():
    """
    Lazily loads and caches the Ultralytics YOLO model if weights exist.
    Returns None if weights do not exist or Ultralytics is unavailable.
    """
    global _cached_model, _cached_weights_path
    
    weights_path = Path(settings.YOLO_WEIGHTS_PATH)
    if not weights_path.is_absolute():
        # Relative to backend root
        weights_path = Path(__file__).resolve().parent.parent.parent / settings.YOLO_WEIGHTS_PATH

    if not weights_path.exists():
        return None

    # Return cached instance if path matches
    if _cached_model is not None and _cached_weights_path == str(weights_path):
        return _cached_model

    try:
        from ultralytics import YOLO
        print(f"[YOLO] Loading trained weights from {weights_path}...")
        _cached_model = YOLO(str(weights_path))
        _cached_weights_path = str(weights_path)
        return _cached_model
    except ImportError:
        print("[YOLO] Ultralytics package is not installed in current environment.")
        return None
    except Exception as e:
        print(f"[YOLO] Error loading model weights from {weights_path}: {e}")
        return None

def compute_severity(max_confidence: float, max_area_pct: float) -> str:
    """
    Computes an estimated risk classification based on detection confidence and bounding box area.
    Does NOT fabricate depth measurements from a single photograph.
    """
    if max_area_pct >= 15.0 or max_confidence >= 0.88:
        return "CRITICAL"
    elif max_area_pct >= 6.0 or max_confidence >= 0.70:
        return "HIGH"
    elif max_area_pct >= 2.0 or max_confidence >= 0.45:
        return "MODERATE"
    return "LOW"

def run_pothole_detection(image_bytes: bytes) -> Dict[str, Any]:
    """
    Runs YOLO inference on image bytes if weights exist.
    If weights do not exist, returns honest AI_UNAVAILABLE status without fabricating synthetic data.
    """
    model = get_yolo_model()
    if model is None:
        return {
            "is_model_connected": False,
            "detected": False,
            "confidence": 0.0,
            "severity": "LOW",
            "boxes": [],
            "status": "AI_UNAVAILABLE",
            "message": "YOLO model service offline. Hazard registered for manual municipal review.",
        }

    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        img_w, img_h = img.size

        # Run Ultralytics inference
        results = model.predict(source=img, conf=settings.YOLO_CONFIDENCE_THRESHOLD, verbose=False)
        
        boxes: List[BoundingBoxSchema] = []
        max_confidence = 0.0
        max_area_pct = 0.0

        for r in results:
            for b in r.boxes:
                # b.xyxy format: [x1, y1, x2, y2]
                xyxy = b.xyxy[0].tolist()
                conf = float(b.conf[0])
                cls_idx = int(b.cls[0])
                label = model.names.get(cls_idx, "pothole") if hasattr(model, "names") else "pothole"

                x1, y1, x2, y2 = xyxy
                width_px = max(0.0, x2 - x1)
                height_px = max(0.0, y2 - y1)

                # Convert to percentages (0-100)
                x_pct = round((x1 / img_w) * 100, 2)
                y_pct = round((y1 / img_h) * 100, 2)
                w_pct = round((width_px / img_w) * 100, 2)
                h_pct = round((height_px / img_h) * 100, 2)
                area_pct = round((w_pct * h_pct) / 100, 2)

                if conf > max_confidence:
                    max_confidence = conf
                if area_pct > max_area_pct:
                    max_area_pct = area_pct

                boxes.append(BoundingBoxSchema(
                    x=x_pct,
                    y=y_pct,
                    width=w_pct,
                    height=h_pct,
                    label=label,
                    confidence=round(conf, 3),
                ))

        detected = len(boxes) > 0
        severity = compute_severity(max_confidence, max_area_pct) if detected else "LOW"

        return {
            "is_model_connected": True,
            "detected": detected,
            "confidence": round(max_confidence, 3),
            "severity": severity,
            "boxes": boxes,
            "status": "CONNECTED",
            "message": f"YOLO model verified {len(boxes)} pothole hazard(s) in pavement imagery.",
        }

    except Exception as e:
        print(f"[YOLO] Inference error: {e}")
        return {
            "is_model_connected": False,
            "detected": False,
            "confidence": 0.0,
            "severity": "LOW",
            "boxes": [],
            "status": "AI_UNAVAILABLE",
            "message": f"Inference processing error: {str(e)}",
        }
