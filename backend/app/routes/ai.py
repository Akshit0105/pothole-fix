from fastapi import APIRouter, UploadFile, File, HTTPException, status
from ..schemas import AIDetectionResponse
from ..services.storage import ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES
from ..services.yolo_inference import run_pothole_detection
from pathlib import Path

router = APIRouter(prefix="/ai", tags=["AI & Computer Vision"])

@router.post("/detect", response_model=AIDetectionResponse)
async def detect_pothole_placeholder(file: UploadFile = File(...)):
    """
    POST /ai/detect
    Validates uploaded road image and performs live YOLO inference if weights exist.
    If weights/best.pt is missing, returns honest AI_UNAVAILABLE status without fabricating synthetic predictions.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid image file is required for road defect detection."
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format '{ext}'. Expected JPEG, PNG, or WebP."
        )

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{content_type}'."
        )

    # Read bytes to verify content
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file contains 0 bytes."
        )

    # Run detection (delegates to live YOLO if weights/best.pt exists, or returns honest AI_UNAVAILABLE)
    result = run_pothole_detection(content)
    return AIDetectionResponse(**result)
