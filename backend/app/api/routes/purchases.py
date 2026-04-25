from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.purchase import PurchaseOut
from app.services.purchase_service import purchase_album

router = APIRouter(tags=["purchases"])


@router.post("/albums/{album_id}/purchase", response_model=PurchaseOut, status_code=201)
def purchase(album_id: int, db: DbSession, current_user: CurrentUser):
    return purchase_album(db, current_user, album_id)
