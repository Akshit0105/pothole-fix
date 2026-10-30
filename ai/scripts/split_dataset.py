#!/usr/bin/env python3
"""
PotholeFix Dataset Splitter
Splits raw paired images and labels into train/val/test splits and generates data.yaml.
"""

import argparse
import os
import random
import shutil
import sys
from pathlib import Path
import yaml

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}

def main():
    parser = argparse.ArgumentParser(description="Split raw dataset into train/val/test for YOLO")
    parser.add_argument("--source", type=str, required=True, help="Path to raw dataset folder containing images and labels")
    parser.add_argument("--output", type=str, default="dataset", help="Output directory for organized dataset")
    parser.add_argument("--train-ratio", type=float, default=0.75, help="Proportion for training set (default: 0.75)")
    parser.add_argument("--val-ratio", type=float, default=0.15, help="Proportion for validation set (default: 0.15)")
    parser.add_argument("--test-ratio", type=float, default=0.10, help="Proportion for test set (default: 0.10)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--class-name", type=str, default="pothole", help="Class name for annotations (default: pothole)")
    args = parser.parse_args()

    total_ratio = args.train_ratio + args.val_ratio + args.test_ratio
    if abs(total_ratio - 1.0) > 1e-4:
        print(f"[ERROR] Ratios must sum to 1.0 (currently {total_ratio:.2f})")
        sys.exit(1)

    src_dir = Path(args.source).resolve()
    if not src_dir.exists():
        print(f"[ERROR] Source directory does not exist: {src_dir}")
        sys.exit(1)

    out_dir = Path(args.output).resolve()
    print(f"Reading images from: {src_dir}")
    print(f"Target dataset directory: {out_dir}")

    # Find images
    all_images = [f for f in src_dir.rglob("*") if f.is_file() and f.suffix.lower() in IMAGE_EXTS]
    print(f"Found {len(all_images)} total image files.")

    if len(all_images) == 0:
        print("[ERROR] No images found.")
        sys.exit(1)

    # Pair with labels
    paired_samples = []
    missing_labels = 0
    for img_path in all_images:
        # Search for corresponding .txt in the same dir or in sister labels dir
        lbl_path = img_path.with_suffix('.txt')
        if not lbl_path.exists():
            # Check sister labels dir
            candidate = img_path.parent.parent / 'labels' / f"{img_path.stem}.txt"
            if candidate.exists():
                lbl_path = candidate
            else:
                lbl_path = None
                missing_labels += 1
        paired_samples.append((img_path, lbl_path))

    print(f"Total samples: {len(paired_samples)} ({len(paired_samples) - missing_labels} labeled, {missing_labels} background)")

    random.seed(args.seed)
    random.shuffle(paired_samples)

    n_total = len(paired_samples)
    n_train = int(n_total * args.train_ratio)
    n_val = int(n_total * args.val_ratio)

    splits = {
        'train': paired_samples[:n_train],
        'val': paired_samples[n_train:n_train + n_val],
        'test': paired_samples[n_train + n_val:],
    }

    print(f"\nPartitioning:")
    print(f"  Train: {len(splits['train'])} samples ({len(splits['train'])/n_total*100:.1f}%)")
    print(f"  Val:   {len(splits['val'])} samples ({len(splits['val'])/n_total*100:.1f}%)")
    print(f"  Test:  {len(splits['test'])} samples ({len(splits['test'])/n_total*100:.1f}%)")

    # Create directories
    for split in ['train', 'val', 'test']:
        if len(splits[split]) == 0:
            continue
        (out_dir / 'images' / split).mkdir(parents=True, exist_ok=True)
        (out_dir / 'labels' / split).mkdir(parents=True, exist_ok=True)

    # Copy files
    for split_name, items in splits.items():
        if len(items) == 0:
            continue
        img_out = out_dir / 'images' / split_name
        lbl_out = out_dir / 'labels' / split_name

        for img_p, lbl_p in items:
            shutil.copy2(img_p, img_out / img_p.name)
            if lbl_p and lbl_p.exists():
                shutil.copy2(lbl_p, lbl_out / f"{img_p.stem}.txt")
            else:
                # Create empty label file for background images
                open(lbl_out / f"{img_p.stem}.txt", 'w', encoding='utf-8').close()

    # Generate data.yaml
    data_yaml = {
        'path': str(out_dir),
        'train': 'images/train',
        'val': 'images/val',
        'test': 'images/test' if len(splits['test']) > 0 else None,
        'names': {0: args.class_name}
    }
    # Remove None values
    data_yaml = {k: v for k, v in data_yaml.items() if v is not None}

    yaml_file = out_dir / 'data.yaml'
    with open(yaml_file, 'w', encoding='utf-8') as f:
        yaml.dump(data_yaml, f, sort_keys=False)

    print(f"\n[SUCCESS] Dataset prepared successfully!")
    print(f"  Generated data config: {yaml_file}")
    print(f"  Train command: python ai/scripts/train.py --data {yaml_file}")

if __name__ == "__main__":
    main()
