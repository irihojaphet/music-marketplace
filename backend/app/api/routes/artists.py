from fastapi import APIRouter, HTTPException, status

from app.api.deps import AdminUser, DbSession
from app.db.models import Artist
from app.schemas.artist import ArtistCreate, ArtistOut, ArtistUpdate

router = APIRouter(prefix="/artists", tags=["artists"])


def _to_out(artist: Artist) -> ArtistOut:
    return ArtistOut(
        id=artist.id,
        real_name=artist.real_name,
        performing_name=artist.performing_name,
        date_of_birth=artist.date_of_birth,
        bio=artist.bio,
        created_at=artist.created_at,
        album_count=len(artist.albums),
    )


@router.get("", response_model=list[ArtistOut])
def list_artists(db: DbSession, search: str | None = None):
    query = db.query(Artist)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Artist.performing_name.ilike(pattern) | Artist.real_name.ilike(pattern)
        )
    return [_to_out(a) for a in query.order_by(Artist.performing_name).all()]


@router.get("/{artist_id}", response_model=ArtistOut)
def get_artist(artist_id: int, db: DbSession):
    artist = db.get(Artist, artist_id)
    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")
    return _to_out(artist)


@router.post("", response_model=ArtistOut, status_code=201)
def create_artist(data: ArtistCreate, db: DbSession, _admin: AdminUser):
    if db.query(Artist).filter(Artist.performing_name == data.performing_name).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An artist with that performing name already exists",
        )
    artist = Artist(**data.model_dump())
    db.add(artist)
    db.commit()
    db.refresh(artist)
    return _to_out(artist)


@router.patch("/{artist_id}", response_model=ArtistOut)
def update_artist(artist_id: int, data: ArtistUpdate, db: DbSession, _admin: AdminUser):
    artist = db.get(Artist, artist_id)
    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")

    updates = data.model_dump(exclude_unset=True)
    if "performing_name" in updates:
        conflict = (
            db.query(Artist)
            .filter(Artist.performing_name == updates["performing_name"], Artist.id != artist_id)
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An artist with that performing name already exists",
            )

    for field, value in updates.items():
        setattr(artist, field, value)

    db.commit()
    db.refresh(artist)
    return _to_out(artist)


@router.delete("/{artist_id}", status_code=204)
def delete_artist(artist_id: int, db: DbSession, _admin: AdminUser):
    artist = db.get(Artist, artist_id)
    if not artist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found")
    db.delete(artist)
    db.commit()
