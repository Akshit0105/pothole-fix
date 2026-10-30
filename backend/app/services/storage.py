import os
import uuid
import logging
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException, status, Request
from ..config import settings

logger = logging.getLogger("potholefix.storage")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Cached Supabase Client instance for reuse across requests
_supabase_client = None

def get_supabase_client():
    """
    Lazily initializes and returns the Supabase client using server-side credentials.
    Returns None if SUPABASE_URL or SUPABASE_SECRET_KEY is not configured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = (settings.SUPABASE_URL or "").strip()
    key = (settings.SUPABASE_SECRET_KEY or "").strip()

    if not url or not key:
        return None

    try:
        import httpx
        from supabase import create_client, ClientOptions

        # Supabase Python SDK storage calls on Windows benefit from http2=False
        # to prevent TCP connection resets and timeouts
        http_client = httpx.Client(http2=False, timeout=30.0)
        options = ClientOptions(httpx_client=http_client)
        _supabase_client = create_client(url, key, options=options)
        return _supabase_client
    except Exception as e:
        logger.error(f"[Storage] Failed to initialize Supabase client: {str(e)}")
        return None

def get_upload_dir() -> Path:
    """Returns local uploads directory path, ensuring it exists."""
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path

def validate_image_file(file: UploadFile, content: bytes) -> Tuple[str, str]:
    """
    Validates file extension, MIME type, and size constraints.
    Returns (ext, content_type) on success or raises HTTPException.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    # 1. Extension validation & sanitization
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

    # 3. Size check (10 MB max)
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

    return ext, content_type

def get_bucket_for_type(bucket_type: str = "pothole", prefix: str = "img") -> str:
    """Selects the designated private bucket for reports or repair evidence."""
    if bucket_type == "repair" or prefix == "evidence":
        return settings.SUPABASE_REPAIR_BUCKET or "repair-evidence"
    return settings.SUPABASE_POTHOLE_BUCKET or "pothole-images"

async def save_uploaded_image(
    file: UploadFile,
    prefix: str = "img",
    bucket_type: str = "pothole"
) -> str:
    """
    Validates and securely persists an uploaded image.
    Supports STORAGE_BACKEND='supabase' and fallback STORAGE_BACKEND='local'.

    Returns:
    - If Supabase: 'supabase://<bucket>/<safe_filename>' (stable storage reference stored in PostgreSQL)
    - If Local: '/uploads/<safe_filename>' (relative static URL)
    """
    content = await file.read()
    ext, content_type = validate_image_file(file, content)
    safe_filename = f"{prefix}_{uuid.uuid4().hex}{ext}"

    storage_backend = (settings.STORAGE_BACKEND or "local").lower().strip()

    if storage_backend == "supabase":
        # Check required Supabase credentials
        if not settings.SUPABASE_URL or not settings.SUPABASE_SECRET_KEY:
            logger.error("[Storage] STORAGE_BACKEND=supabase but credentials are missing in settings.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase Storage credentials not configured: SUPABASE_URL and SUPABASE_SECRET_KEY are required."
            )

        client = get_supabase_client()
        if not client:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize Supabase Storage client."
            )

        target_bucket = get_bucket_for_type(bucket_type=bucket_type, prefix=prefix)

        try:
            # Upload to the target private bucket
            client.storage.from_(target_bucket).upload(
                path=safe_filename,
                file=content,
                file_options={"content-type": content_type}
            )
            # Return stable storage URI (never a temporary signed URL in PostgreSQL)
            return f"supabase://{target_bucket}/{safe_filename}"
        except Exception as e:
            logger.error(f"[Storage] Upload failed to Supabase bucket '{target_bucket}': {str(e)}")
            # Do NOT silently fall back to local when STORAGE_BACKEND=supabase
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to upload image to Supabase Storage bucket '{target_bucket}'. Ensure bucket exists and server key has write permissions."
            )

    else:
        # Local Filesystem Storage Fallback
        dest_dir = get_upload_dir()
        dest_path = dest_dir / safe_filename

        # Path traversal guard
        if not dest_path.resolve().is_relative_to(dest_dir.resolve()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Illegal filename or directory traversal attempt."
            )

        with open(dest_path, "wb") as f:
            f.write(content)

        return f"/uploads/{safe_filename}"

def get_signed_url(bucket: str, path: str, expires_in: Optional[int] = None) -> Optional[str]:
    """Generates a short-lived signed URL for an object stored in a private Supabase bucket."""
    client = get_supabase_client()
    if not client:
        return None

    ttl = expires_in or settings.SUPABASE_SIGNED_URL_EXPIRES_IN or 3600
    try:
        res = client.storage.from_(bucket).create_signed_url(path=path, expires_in=ttl)
        if isinstance(res, dict):
            return res.get("signedURL") or res.get("signedUrl")
        return getattr(res, "signed_url", None) or str(res)
    except Exception as e:
        logger.error(f"[Storage] Failed to create signed URL for '{bucket}/{path}': {str(e)}")
        return None

def resolve_image_url(
    image_path: Optional[str],
    request: Optional[Request] = None,
    expires_in: Optional[int] = None
) -> Optional[str]:
    """
    Resolves any stored image reference into a full, accessible URL for the frontend.
    Handles:
    - 'supabase://<bucket>/<filename>' -> Resolves to short-lived signed URL for private bucket
    - '/uploads/<filename>' -> Prepends backend base_url (local uploads)
    - '/photos/<filename>' -> Prepends backend base_url (pre-seeded demo photos)
    - 'http://' or 'https://' -> Returned as-is
    """
    if not image_path:
        return None

    # Supabase Private Storage Reference
    if image_path.startswith("supabase://"):
        raw_ref = image_path.replace("supabase://", "", 1)
        bucket, _, filename = raw_ref.partition("/")
        if bucket and filename:
            signed = get_signed_url(bucket=bucket, path=filename, expires_in=expires_in)
            if signed:
                return signed
            # Fallback to backend proxy route if signed URL cannot be created
            base_url = str(request.base_url).rstrip("/") if request else "http://localhost:8000"
            return f"{base_url}/storage/image/{bucket}/{filename}"

    base_url = str(request.base_url).rstrip("/") if request else "http://localhost:8000"

    # Local uploaded image
    if image_path.startswith("/uploads/"):
        return f"{base_url}{image_path}"

    # Pre-seeded realistic demo photos
    if image_path.startswith("/photos/"):
        return f"{base_url}{image_path}"

    return image_path

def download_from_supabase(bucket: str, path: str) -> bytes:
    """Downloads raw image bytes from a Supabase storage bucket."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase client not initialized: verify SUPABASE_URL and SUPABASE_SECRET_KEY."
        )

    try:
        return client.storage.from_(bucket).download(path)
    except Exception as e:
        logger.error(f"[Storage] Failed to download object '{bucket}/{path}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Image object '{path}' not found in bucket '{bucket}'."
        )

def delete_from_supabase(bucket: str, path: str) -> bool:
    """Removes an object from a Supabase storage bucket."""
    client = get_supabase_client()
    if not client:
        return False
    try:
        client.storage.from_(bucket).remove([path])
        return True
    except Exception as e:
        logger.error(f"[Storage] Failed to remove object '{bucket}/{path}': {str(e)}")
        return False

def delete_uploaded_image(image_ref: Optional[str]) -> bool:
    """
    Safely deletes an uploaded file from either Supabase Storage or local filesystem.
    Ensures safe cleanup if a subsequent database transaction or insert fails.
    """
    if not image_ref:
        return False
    try:
        if image_ref.startswith("supabase://"):
            raw_ref = image_ref.replace("supabase://", "", 1)
            bucket, _, filename = raw_ref.partition("/")
            if bucket and filename:
                return delete_from_supabase(bucket, filename)
        elif image_ref.startswith("/uploads/"):
            filename = image_ref.replace("/uploads/", "", 1)
            dest_path = get_upload_dir() / filename
            if dest_path.exists():
                dest_path.unlink()
                return True
    except Exception as e:
        logger.warning(f"[Storage] Failed to cleanup image reference '{image_ref}': {str(e)}")
    return False
