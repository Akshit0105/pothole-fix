#!/usr/bin/env python3
"""
PotholeFix Standalone Inference Tester
Tests YOLO detection on sample road images and outputs normalized percentages matching the frontend API contract.
"""

import argparse
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Test YOLO pothole inference on sample images")
    parser.add_argument("--weights", type=str, required=True, help="Path to weights file (e.g. backend/weights/best.pt)")
    parser.add_argument("--source", type=str, required=True, help="Path to image file or directory of test images")
    parser.add_argument("--conf", type=float, default=0.35, help="Confidence threshold (default: 0.35)")
    parser.add_argument("--save", action="store_true", default=True, help="Save visual bounding box annotations")
    parser.add_argument("--project", type=str, default="runs/predict", help="Output directory for annotated images")
    args = parser.parse_args()

    weights_path = Path(args.weights).resolve()
    if not weights_path.exists():
        print(f"[ERROR] Weights file not found: {weights_path}")
        sys.exit(1)

    source_path = Path(args.source).resolve()
    if not source_path.exists():
        print(f"[ERROR] Source image/directory not found: {source_path}")
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[FATAL] Ultralytics package is not installed. Install with: pip install ultralytics")
        sys.exit(1)

    print("==================================================")
    print("      POTHOLEFIX INFERENCE VERIFICATION           ")
    print("==================================================")
    print(f"Weights: {weights_path}")
    print(f"Source:  {source_path}")
    print(f"Conf:    {args.conf}")

    model = YOLO(str(weights_path))

    results = model.predict(
        source=str(source_path),
        conf=args.conf,
        save=args.save,
        project=args.project,
        name="test_detections",
        verbose=False,
    )

    print(f"\nProcessed {len(results)} image(s):")
    for r in results:
        img_p = Path(r.path)
        img_h, img_w = r.orig_shape
        boxes = r.boxes

        print(f"\nImage: {img_p.name} ({img_w}x{img_h}px) -> {len(boxes)} pothole(s) detected")
        for idx, b in enumerate(boxes, start=1):
            xyxy = b.xyxy[0].tolist()
            conf = float(b.conf[0])
            x1, y1, x2, y2 = xyxy
            w_px = x2 - x1
            h_px = y2 - y1

            # Format matching frontend API contract
            x_pct = round((x1 / img_w) * 100, 2)
            y_pct = round((y1 / img_h) * 100, 2)
            w_pct = round((w_px / img_w) * 100, 2)
            h_pct = round((h_px / img_h) * 100, 2)

            print(f"  [{idx}] Conf: {conf:.1%} | Bounding Box (%): x={x_pct}%, y={y_pct}%, w={w_pct}%, h={h_pct}%")

    if args.save:
        save_dir = Path(args.project) / "test_detections"
        print(f"\n[INFO] Annotated images with visual bounding boxes saved to: {save_dir}")

if __name__ == "__main__":
    main()
