#!/usr/bin/env python3
"""
PotholeFix Dataset Validator
Validates YOLO format dataset structure, image-label matching, normalized coordinates, and class distributions.
"""

import argparse
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any
import yaml

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}

def validate_label_file(label_path: Path, max_classes: int) -> Tuple[bool, List[str], int]:
    """Validates YOLO annotation format: <class_id> <x_center> <y_center> <width> <height>"""
    errors = []
    box_count = 0
    try:
        with open(label_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        for idx, line in enumerate(lines, start=1):
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) != 5:
                errors.append(f"Line {idx}: Expected 5 values (cls x y w h), found {len(parts)}: '{line}'")
                continue
            
            try:
                cls_id = int(parts[0])
                coords = [float(p) for p in parts[1:]]
            except ValueError:
                errors.append(f"Line {idx}: Non-numeric value in: '{line}'")
                continue

            if cls_id < 0 or cls_id >= max_classes:
                errors.append(f"Line {idx}: Class ID {cls_id} out of range [0, {max_classes - 1}]")

            for c_idx, val in enumerate(coords):
                coord_name = ['x_center', 'y_center', 'width', 'height'][c_idx]
                if not (0.0 <= val <= 1.0):
                    errors.append(f"Line {idx}: {coord_name} {val:.4f} is outside normalized range [0.0, 1.0]")

            box_count += 1
            
        return len(errors) == 0, errors, box_count
    except Exception as e:
        return False, [f"Error reading {label_path.name}: {str(e)}"], 0

def validate_split(split_name: str, images_dir: Path, labels_dir: Path, num_classes: int) -> Dict[str, Any]:
    print(f"\n--- Validating '{split_name}' split ---")
    print(f"  Images: {images_dir}")
    print(f"  Labels: {labels_dir}")

    if not images_dir.exists():
        print(f"  [ERROR] Images directory not found: {images_dir}")
        return {"valid": False, "images": 0, "labels": 0, "boxes": 0}

    images = [f for f in images_dir.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS]
    print(f"  Found {len(images)} images in '{split_name}'")

    if len(images) == 0:
        print(f"  [WARNING] No valid images found in {images_dir}")
        return {"valid": False, "images": 0, "labels": 0, "boxes": 0}

    missing_labels = 0
    total_boxes = 0
    corrupt_labels = 0
    all_errors = []

    for img in images:
        label_file = labels_dir / f"{img.stem}.txt"
        if not label_file.exists():
            # In YOLO, empty label files or missing label files mean negative background sample (no potholes)
            missing_labels += 1
            continue
        
        is_valid, errors, box_cnt = validate_label_file(label_file, num_classes)
        if not is_valid:
            corrupt_labels += 1
            all_errors.extend([f"{label_file.name}: {err}" for err in errors[:3]])
        total_boxes += box_cnt

    print(f"  Images with annotations: {len(images) - missing_labels}")
    print(f"  Images without annotations (background): {missing_labels}")
    print(f"  Total annotated pothole instances: {total_boxes}")
    
    if corrupt_labels > 0:
        print(f"  [ERROR] Found {corrupt_labels} label files with format violations:")
        for err in all_errors[:10]:
            print(f"    - {err}")
        if len(all_errors) > 10:
            print(f"    ... and {len(all_errors) - 10} more errors.")
        return {"valid": False, "images": len(images), "boxes": total_boxes}
    else:
        print(f"  [OK] All label files conform to YOLO format.")
        return {"valid": True, "images": len(images), "boxes": total_boxes}

def main():
    parser = argparse.ArgumentParser(description="PotholeFix Dataset Validator for YOLOv8/v11")
    parser.add_argument("--data", type=str, default="data.yaml", help="Path to data.yaml file")
    args = parser.parse_args()

    yaml_path = Path(args.data).resolve()
    if not yaml_path.exists():
        print(f"[FATAL] data.yaml not found at: {yaml_path}")
        print("Please provide a valid YAML file: python dataset_validator.py --data path/to/data.yaml")
        sys.exit(1)

    print(f"Loading dataset configuration from: {yaml_path}")
    with open(yaml_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    root_path = Path(config.get('path', yaml_path.parent))
    if not root_path.is_absolute():
        root_path = (yaml_path.parent / root_path).resolve()

    names = config.get('names', {0: 'pothole'})
    if isinstance(names, list):
        num_classes = len(names)
        class_names = names
    elif isinstance(names, dict):
        num_classes = len(names)
        class_names = [names[k] for k in sorted(names.keys())]
    else:
        num_classes = 1
        class_names = ['pothole']

    print(f"Dataset root: {root_path}")
    print(f"Detected {num_classes} class(es): {class_names}")

    splits = [('train', config.get('train')), ('val', config.get('val'))]
    if config.get('test'):
        splits.append(('test', config.get('test')))

    all_passed = True
    total_imgs = 0
    total_bxs = 0

    for split_name, rel_path in splits:
        if not rel_path:
            continue
        img_dir = Path(rel_path)
        if not img_dir.is_absolute():
            img_dir = (root_path / img_dir).resolve()

        # By YOLO convention, labels are in sister directory ../labels or labels/
        lbl_dir = img_dir.parent.parent / 'labels' / img_dir.name
        if not lbl_dir.exists():
            # Alternative: same parent directory
            lbl_dir = img_dir.parent / 'labels'

        stats = validate_split(split_name, img_dir, lbl_dir, num_classes)
        if not stats["valid"]:
            all_passed = False
        total_imgs += stats["images"]
        total_bxs += stats["boxes"]

    print("\n==========================================")
    print("        VALIDATION SUMMARY REPORT         ")
    print("==========================================")
    print(f"Total dataset images verified: {total_imgs}")
    print(f"Total pothole bounding boxes:  {total_bxs}")
    if total_imgs > 0:
        print(f"Average potholes per image:    {total_bxs / total_imgs:.2f}")

    if all_passed and total_imgs > 0 and total_bxs > 0:
        print("\n[SUCCESS] Dataset structure is 100% VALID for YOLO training!")
        sys.exit(0)
    else:
        print("\n[FAILURE] Validation checks found issues. Review logs above before training.")
        sys.exit(1)

if __name__ == "__main__":
    main()
