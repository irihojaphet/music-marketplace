from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Album, Purchase, Rating, User
from app.schemas.purchase import LibraryItemOut, LibraryAlbumOut, PurchaseOut


def purchase_album(db: Session, user: User, album_id: int) -> PurchaseOut:
    album = db.get(Album, album_id)
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")

    existing = (
        db.query(Purchase)
        .filter(Purchase.user_id == user.id, Purchase.album_id == album_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Album already purchased")

    purchase = Purchase(user_id=user.id, album_id=album_id)
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return PurchaseOut(
        id=purchase.id,
        user_id=purchase.user_id,
        album_id=purchase.album_id,
        purchased_at=purchase.purchased_at,
    )


def get_user_library(db: Session, user: User) -> list[LibraryItemOut]:
    purchases = (
        db.query(Purchase)
        .filter(Purchase.user_id == user.id)
        .join(Purchase.album)
        .all()
    )

    if not purchases:
        return []

    album_ids = [p.album_id for p in purchases]

    user_ratings = {
        r.album_id: r.score
        for r in db.query(Rating)
        .filter(Rating.user_id == user.id, Rating.album_id.in_(album_ids))
        .all()
    }

    rating_rows = (
        db.query(
            Rating.album_id,
            func.avg(Rating.score).label("avg_rating"),
            func.count(Rating.id).label("rating_count"),
        )
        .filter(Rating.album_id.in_(album_ids))
        .group_by(Rating.album_id)
        .all()
    )
    rating_data = {row.album_id: (float(row.avg_rating), row.rating_count) for row in rating_rows}

    result = []
    for purchase in purchases:
        album = purchase.album
        avg_rating, rating_count = rating_data.get(album.id, (None, 0))
        result.append(
            LibraryItemOut(
                id=purchase.id,
                album_id=purchase.album_id,
                purchased_at=purchase.purchased_at,
                album=LibraryAlbumOut(
                    id=album.id,
                    name=album.name,
                    price=album.price,
                    artist_id=album.artist_id,
                    artist_name=album.artist.performing_name,
                    rating=round(avg_rating, 2) if avg_rating is not None else None,
                    rating_count=rating_count,
                    user_rating=user_ratings.get(album.id),
                ),
            )
        )

    return result
