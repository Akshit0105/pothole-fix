#!/usr/bin/env python3
"""
PotholeFix YOLO Training Pipeline
Trains Ultralytics YOLO (v8 / v11) for road pothole detection with configurable parameters.
"""

import argparse
import os
import shutil
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="PotholeFix YOLO Object Detection Training")
    parser.add_argument("--data", type=str, default="data.yaml", help="Path to data.yaml dataset config")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Base model (e.g. yolov8n.pt, yolov8s.pt, yolov11n.pt)")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs (default: 50)")
    parser.add_argument("--batch", type=int, default=16, help="Batch size (default: 16)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution size (default: 640)")
    parser.add_argument("--device", type=str, default="", help="Compute device: '0' for CUDA GPU, 'cpu', 'mps', or '' for auto-detect")
    parser.add_argument("--workers", type=int, default=2, help="DataLoader worker processes (use 0-2 on Windows)")
    parser.add_argument("--patience", type=int, default=15, help="Early stopping epochs patience (default: 15)")
    parser.add_argument("--project", type=str, default="runs/train", help="Training run output directory")
    parser.add_argument("--name", type=str, default="pothole_detector", help="Experiment name")
    parser.add_argument("--copy-to-backend", action="store_true", default=True, help="Copy best.pt to backend/weights/best.pt upon completion")
    args = parser.parse_args()

    print("==================================================")
    print("       POTHOLEFIX YOLO MODEL TRAINING PIPELINE    ")
    print("==================================================")
    print(f"Base Architecture:   {args.model}")
    print(f"Dataset Config:      {args.data}")
    print(f"Target Epochs:       {args.epochs}")
    print(f"Batch Size:          {args.batch}")
    print(f"Image Resolution:    {args.imgsz}x{args.imgsz}")
    print(f"Auto-export Backend: {args.copy_to_backend}")

    # Verify data.yaml
    data_path = Path(args.data).resolve()
    if not data_path.exists():
        print(f"\n[FATAL] Dataset configuration file not found: {data_path}")
        print("Please check the path or generate one with split_dataset.py.")
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("\n[FATAL] Ultralytics package is not installed.")
        print("Install required packages: pip install ultralytics")
        sys.exit(1)

    # Determine device
    import torch
    if not args.device:
        if torch.cuda.is_available():
            device = 0
            print(f"Device: Auto-detected CUDA GPU: {torch.cuda.get_device_name(0)}")
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            device = 'mps'
            print("Device: Auto-detected Apple Silicon MPS")
        else:
            device = 'cpu'
            print("Device: No GPU detected, using CPU (recommended: train on Google Colab GPU)")
    else:
        device = args.device
        print(f"Device: Configured as '{device}'")

    print("\n[1/3] Initializing base YOLO model architecture...")
    model = YOLO(args.model)

    print("\n[2/3] Commencing model training...")
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=device,
        workers=args.workers,
        patience=args.patience,
        project=args.project,
        name=args.name,
        save=True,
        plots=True,
        verbose=True,
    )

    # Locate best.pt
    run_dir = Path(args.project) / args.name
    best_weights = run_dir / "weights" / "best.pt"

    print("\n==================================================")
    print("             TRAINING RUN COMPLETE                ")
    print("==================================================")
    if best_weights.exists():
        print(f"[SUCCESS] Trained weights saved to:\n  {best_weights}")
        
        # Copy to backend if requested
        if args.copy_to_backend:
            # Look for backend/weights
            candidate_backend_dirs = [
                Path(__file__).resolve().parent.parent.parent / "backend" / "weights",
                Path("backend/weights").resolve(),
                Path("../backend/weights").resolve(),
            ]
            
            target_dir = None
            for cand in candidate_backend_dirs:
                if cand.parent.exists() and (cand.parent / "app").exists():
                    target_dir = cand
                    break

            if target_dir:
                target_dir.mkdir(parents=True, exist_ok=True)
                dest = target_dir / "best.pt"
                shutil.copy2(best_weights, dest)
                print(f"\n[INTEGRATION] Successfully copied best.pt to backend:")
                print(f"  -> {dest}")
                print(f"The FastAPI backend is now ready for live real-time pothole inference!")
            else:
                print(f"\n[NOTE] Backend directory not found automatically. Manually copy:")
                print(f"  copy {best_weights} backend/weights/best.pt")
    else:
        print("[WARNING] best.pt not found in expected output location.")

if __name__ == "__main__":
    main()
