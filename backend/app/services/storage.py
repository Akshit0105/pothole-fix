import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from ..config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

def get_upload_dir() -> Path:
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path

async def save_uploaded_image(file: UploadFile, prefix: str = "img") -> str:
    """
    Validates and securely persists an uploaded image.
    Returns the public relative URL (e.g. /uploads/img_uuid.jpg).
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    # 1. Extension validation & sanitization (prevent path traversal)
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: JPEG, PNG, WebP."
        )

    # 2. MIME type check
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{content_type}'. Must be image/jpeg, image/png, or image/webp."
        )

    # 3. Read content & validate file size limit (10 MB max)
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    # 4. Generate random safe filename
    safe_filename = f"{prefix}_{uuid.uuid4().hex}{ext}"
    dest_dir = get_upload_dir()
    dest_path = dest_dir / safe_filename

    # Ensure path stays within upload_dir (prevent traversal)
    if not dest_path.resolve().is_relative_to(dest_dir.resolve()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Illegal filename or directory traversal attempt."
        )

    with open(dest_path, "wb") as f:
        f.write(content)

    # Return URL path accessible via the mounted /uploads route
    return f"/uploads/{safe_filename}"
