from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Album, Artist, Rating
from app.schemas.album import AlbumCreate, AlbumListItem, AlbumListResponse, AlbumOut, AlbumUpdate
from app.schemas.artist import ArtistOut


def _rating_subquery(db: Session):
    return (
        db.query(
            Rating.album_id,
            func.avg(Rating.score).label("avg_rating"),
            func.count(Rating.id).label("rating_count"),
        )
        .group_by(Rating.album_id)
        .subquery("rating_sq")
    )


def _artist_out(artist: Artist, album_count: int) -> ArtistOut:
    return ArtistOut(
        id=artist.id,
        real_name=artist.real_name,
        performing_name=artist.performing_name,
        date_of_birth=artist.date_of_birth,
        bio=artist.bio,
        created_at=artist.created_at,
        album_count=album_count,
    )


def list_albums(
    db: Session,
    search: str | None = None,
    skip: int = 0,
    limit: int = 20,
    sort_by: str = "newest",
    min_rating: float | None = None,
) -> AlbumListResponse:
    rating_sq = _rating_subquery(db)

    query = (
        db.query(Album, Artist, rating_sq.c.avg_rating, rating_sq.c.rating_count)
        .join(Artist, Album.artist_id == Artist.id)
        .outerjoin(rating_sq, Album.id == rating_sq.c.album_id)
    )

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Album.name.ilike(pattern) | Artist.performing_name.ilike(pattern)
        )

    if min_rating is not None:
        query = query.filter(rating_sq.c.avg_rating.is_not(None), rating_sq.c.avg_rating >= min_rating)

    order_map = {
        "newest": Album.created_at.desc(),
        "oldest": Album.created_at.asc(),
        "name_asc": Album.name.asc(),
        "name_desc": Album.name.desc(),
        "price_asc": Album.price.asc(),
        "price_desc": Album.price.desc(),
        "rating_desc": rating_sq.c.avg_rating.desc().nullslast(),
        "rating_asc": rating_sq.c.avg_rating.asc().nullslast(),
    }
    order_by = order_map.get(sort_by, order_map["newest"])

    total = query.count()
    rows = query.order_by(order_by, Album.id.desc()).offset(skip).limit(limit).all()

    items = [
        AlbumListItem(
            id=album.id,
            name=album.name,
            price=album.price,
            artist_id=album.artist_id,
            artist_name=artist.performing_name,
            rating=round(float(avg_rating), 2) if avg_rating is not None else None,
            rating_count=rating_count or 0,
            created_at=album.created_at,
        )
        for album, artist, avg_rating, rating_count in rows
    ]

    return AlbumListResponse(items=items, total=total, skip=skip, limit=limit)


def get_album(db: Session, album_id: int) -> AlbumOut:
    rating_sq = _rating_subquery(db)

    row = (
        db.query(Album, Artist, rating_sq.c.avg_rating, rating_sq.c.rating_count)
        .join(Artist, Album.artist_id == Artist.id)
        .outerjoin(rating_sq, Album.id == rating_sq.c.album_id)
        .filter(Album.id == album_id)
        .first()
    )

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")

    album, artist, avg_rating, rating_count = row
    album_count = db.query(Album).filter(Album.artist_id == artist.id).count()

    return AlbumOut(
        id=album.id,
        name=album.name,
        price=album.price,
        artist_id=album.artist_id,
        artist=_artist_out(artist, album_count),
        rating=round(float(avg_rating), 2) if avg_rating is not None else None,
        rating_count=rating_count or 0,
        created_at=album.created_at,
    )


def create_album(db: Session, data: AlbumCreate) -> AlbumOut:
    artist = db.get(Artist, data.artist_id)
    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")

    album = Album(name=data.name, price=data.price, artist_id=data.artist_id)
    db.add(album)
    db.commit()
    db.refresh(album)
    album_count = db.query(Album).filter(Album.artist_id == artist.id).count()

    return AlbumOut(
        id=album.id,
        name=album.name,
        price=album.price,
        artist_id=album.artist_id,
        artist=_artist_out(artist, album_count),
        rating=None,
        rating_count=0,
        created_at=album.created_at,
    )


def update_album(db: Session, album_id: int, data: AlbumUpdate) -> AlbumOut:
    album = db.get(Album, album_id)
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")

    updates = data.model_dump(exclude_unset=True)
    if "artist_id" in updates:
        artist = db.get(Artist, updates["artist_id"])
        if not artist:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")

    for field, value in updates.items():
        setattr(album, field, value)

    db.commit()
    db.refresh(album)
    return get_album(db, album_id)


def delete_album(db: Session, album_id: int) -> None:
    album = db.get(Album, album_id)
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Album not found")
    db.delete(album)
    db.commit()
