from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.rating import RatingCreate, RatingOut, RatingUpdate
from app.services.rating_service import create_rating, update_rating

router = APIRouter(tags=["ratings"])


@router.post("/albums/{album_id}/rating", response_model=RatingOut, status_code=201)
def rate_album(album_id: int, data: RatingCreate, db: DbSession, current_user: CurrentUser):
    return create_rating(db, current_user, album_id, data.score)


@router.patch("/albums/{album_id}/rating", response_model=RatingOut)
def update_album_rating(album_id: int, data: RatingUpdate, db: DbSession, current_user: CurrentUser):
    return update_rating(db, current_user, album_id, data.score)
