from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.purchase import LibraryItemOut
from app.services.purchase_service import get_user_library

router = APIRouter(tags=["library"])


@router.get("/me/library", response_model=list[LibraryItemOut])
def my_library(db: DbSession, current_user: CurrentUser):
    return get_user_library(db, current_user)
