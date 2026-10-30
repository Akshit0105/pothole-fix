from fastapi import APIRouter, Depends, HTTPException, status, Response
from pathlib import Path
from ..services.storage import download_from_supabase, ALLOWED_EXTENSIONS
from ..dependencies import get_current_user
from ..models import User

router = APIRouter(prefix="/storage", tags=["Storage"])

@router.get("/image/{bucket}/{filename}")
def get_private_image(
    bucket: str,
    filename: str,
    current_user: User = Depends(get_current_user),
):
    """
    Authenticated proxy endpoint to stream private images from Supabase Storage.
    Validates user session token before serving private content.
    """
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image extension '{ext}'."
        )

    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    media_type = mime_map.get(ext, "application/octet-stream")

    content = download_from_supabase(bucket=bucket, path=filename)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Cache-Control": "private, max-age=3600"}
    )
