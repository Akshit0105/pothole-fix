# 🛣️ PotholeFix AI & YOLO Engineering Guide

This directory contains the computer vision pipeline for **PotholeFix**, preparing our team for tomorrow's model training session during the hackathon.

> **Hackathon Policy Notice:** As agreed, **no training was conducted today** and **no synthetic or random bounding boxes are generated**. The FastAPI backend and frontend operate in an honest, decoupled state (`AI_UNAVAILABLE` with an "AI Model Not Connected" banner) until actual trained weights are supplied.

---

## 📁 Directory Structure

```
ai/
├── data.yaml.template           # Template dataset config for YOLO training
├── requirements.txt             # PyTorch & Ultralytics dependencies
├── PotholeFix_YOLO_Training.ipynb # Ready-to-run Google Colab GPU training notebook
├── scripts/
│   ├── dataset_validator.py     # Validates YOLO label formats and coordinate normalization [0, 1]
│   ├── split_dataset.py         # Organizes raw images & labels into train/val/test splits
│   ├── train.py                 # Configurable Ultralytics YOLO training CLI
│   ├── evaluate.py              # Evaluates mAP@50, mAP@50-95, precision, recall
│   └── test_inference.py        # Runs standalone inference & prints frontend contract percentages
└── README.md                    # This instruction guide
```

---

## 🚀 Tomorrow's Step-by-Step Hackathon Workflow

### Step 1: Acquire the Pothole Dataset
Tomorrow morning, obtain your labeled pothole dataset. Recommended sources:
1. **Roboflow Universe (Pothole Detection):**
   - Search: `pothole detection yolov8` on Roboflow Universe
   - Download format: **YOLOv8**
2. **Kaggle Pothole Datasets:**
   - e.g. "Pothole Detection Dataset" (with YOLO formatted bounding boxes)

If your dataset is unorganized (raw images and `.txt` annotations in a single folder), split it into standard 75/15/10 partitions:
```bash
python ai/scripts/split_dataset.py --source /path/to/raw_data --output ai/dataset
```

Validate the dataset annotations to prevent training failures:
```bash
python ai/scripts/dataset_validator.py --data ai/dataset/data.yaml
```

---

### Step 2: Model Training (Recommended: Google Colab Free T4 GPU)

#### Option A: Google Colab (Fastest: ~15-20 minutes, Zero Local GPU Setup)
1. Open Google Colab: [colab.research.google.com](https://colab.research.google.com)
2. Click **File → Open notebook → Upload** and select:
   `ai/PotholeFix_YOLO_Training.ipynb`
3. Ensure GPU runtime is enabled: **Runtime → Change runtime type → T4 GPU**
4. Run through the cells:
   - Upload or mount your dataset ZIP
   - Run training (`yolov8n.pt`, 50 epochs, batch 16, imgsz 640)
   - Step 9 automatically downloads `best.pt` to your computer.

#### Option B: Train Locally (If NVIDIA GPU with CUDA is Available)
```bash
pip install -r ai/requirements.txt
python ai/scripts/train.py --data ai/dataset/data.yaml --model yolov8n.pt --epochs 50 --batch 16 --imgsz 640
```
*(The training script will automatically copy `best.pt` to `backend/weights/best.pt` if `--copy-to-backend` is enabled).*

---

### Step 3: Integrate `best.pt` into the Backend

1. Place your exported weights file into:
   ```
   backend/
     weights/
       best.pt
   ```
2. In your virtual environment, ensure `ultralytics` and `Pillow` are installed:
   ```bash
   cd backend
   .\.venv\Scripts\pip install ultralytics pillow
   ```
3. That's it! The FastAPI backend dynamically detects `backend/weights/best.pt` on the very next `POST /ai/detect` request.
   - It automatically loads the model into memory.
   - It performs live detection and formats bounding boxes as normalized percentages (`x`, `y`, `width`, `height` in 0–100%) matching the React frontend contract.
   - It categorizes estimated severity (`CRITICAL`, `HIGH`, `MODERATE`, `LOW`) without claiming depth measurement from single photos.

---

### Step 4: Verify Detection Before Running the Full Web App

Test inference from the terminal:
```bash
python ai/scripts/test_inference.py --weights backend/weights/best.pt --source path/to/sample_pothole.jpg
```
Expected output:
```
Processed 1 image(s):
Image: sample_pothole.jpg (1920x1080px) -> 1 pothole(s) detected
  [1] Conf: 91.4% | Bounding Box (%): x=24.5%, y=31.2%, w=52.1%, h=44.8%
```

---

### Step 5: Test Live in the Frontend
1. Start the FastAPI backend:
   ```bash
   cd backend
   .\.venv\Scripts\python -m uvicorn app.main:app --port 8000 --reload
   ```
2. Start the Vite React frontend:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5174/citizen/report`
4. Drag and drop any road pothole image.
5. The live YOLO model will execute, the green **"Verified Detection"** card will appear with your model's exact confidence score and risk classification, and bounding boxes will overlay the uploaded image!
