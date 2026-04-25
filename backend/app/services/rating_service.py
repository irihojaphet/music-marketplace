from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Album, Purchase, Rating, User
from app.schemas.rating import RatingOut


def _require_purchase(db: Session, user: User, album_id: int) -> Album:
    album = db.get(Album, album_id)
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")

    purchase = (
        db.query(Purchase)
        .filter(Purchase.user_id == user.id, Purchase.album_id == album_id)
        .first()
    )
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must purchase this album before rating it",
        )
    return album


def create_rating(db: Session, user: User, album_id: int, score: int) -> RatingOut:
    _require_purchase(db, user, album_id)

    existing = (
        db.query(Rating)
        .filter(Rating.user_id == user.id, Rating.album_id == album_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Rating already exists. Use PATCH to update it.",
        )

    rating = Rating(user_id=user.id, album_id=album_id, score=score)
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return RatingOut.model_validate(rating)


def update_rating(db: Session, user: User, album_id: int, score: int) -> RatingOut:
    _require_purchase(db, user, album_id)

    rating = (
        db.query(Rating)
        .filter(Rating.user_id == user.id, Rating.album_id == album_id)
        .first()
    )
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existing rating found. Use POST to create one.",
        )

    rating.score = score
    db.commit()
    db.refresh(rating)
    return RatingOut.model_validate(rating)
