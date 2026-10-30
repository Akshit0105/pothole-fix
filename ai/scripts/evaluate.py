#!/usr/bin/env python3
"""
PotholeFix Model Evaluation Script
Computes mAP@50, mAP@50-95, precision, recall, and generates confusion matrices for pothole detection.
"""

import argparse
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Evaluate trained YOLO model on validation or test dataset")
    parser.add_argument("--weights", type=str, required=True, help="Path to weights file (e.g. backend/weights/best.pt or runs/train/.../best.pt)")
    parser.add_argument("--data", type=str, default="data.yaml", help="Path to data.yaml dataset config")
    parser.add_argument("--split", type=str, default="val", choices=["val", "test"], help="Dataset split to evaluate")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--device", type=str, default="", help="Device: '0' for CUDA GPU, 'cpu', or '' for auto")
    args = parser.parse_args()

    weights_path = Path(args.weights).resolve()
    if not weights_path.exists():
        print(f"[FATAL] Weights file not found: {weights_path}")
        sys.exit(1)

    data_path = Path(args.data).resolve()
    if not data_path.exists():
        print(f"[FATAL] Dataset configuration not found: {data_path}")
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("[FATAL] Ultralytics package is not installed. Install with: pip install ultralytics")
        sys.exit(1)

    print("==================================================")
    print("      POTHOLEFIX YOLO EVALUATION & BENCHMARK      ")
    print("==================================================")
    print(f"Model Weights:  {weights_path}")
    print(f"Dataset Config: {data_path}")
    print(f"Target Split:   {args.split}")

    model = YOLO(str(weights_path))

    metrics = model.val(
        data=str(data_path),
        split=args.split,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device if args.device else None,
        plots=True,
    )

    print("\n==================================================")
    print("                EVALUATION METRICS                ")
    print("==================================================")
    print(f"mAP@50:        {metrics.box.map50:.4f} ({metrics.box.map50 * 100:.2f}%)")
    print(f"mAP@50-95:     {metrics.box.map:.4f} ({metrics.box.map * 100:.2f}%)")
    print(f"Precision:     {metrics.box.mp:.4f} ({metrics.box.mp * 100:.2f}%)")
    print(f"Recall:        {metrics.box.mr:.4f} ({metrics.box.mr * 100:.2f}%)")
    print("==================================================")

if __name__ == "__main__":
    main()
