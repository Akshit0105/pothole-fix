# PotholeFix Model Weights Directory

Place your trained YOLO model weights (`best.pt`) in this directory.

```
backend/
  weights/
    best.pt
```

When `best.pt` is present in this folder:
- The FastAPI backend (`POST /ai/detect`) automatically detects the file
- Loads Ultralytics YOLO
- Performs real-time pothole bounding box detection and risk classification
- When `best.pt` is NOT present, the backend honestly returns `status="AI_UNAVAILABLE"`, signaling the frontend to display the "AI Model Not Connected" banner without fabricating synthetic predictions.
