from fastapi import APIRouter, Query

from app.api.deps import AdminUser, DbSession
from app.schemas.album import AlbumCreate, AlbumListResponse, AlbumOut, AlbumUpdate
from app.services.album_service import (
    create_album,
    delete_album,
    get_album,
    list_albums,
    update_album,
)

router = APIRouter(prefix="/albums", tags=["albums"])


@router.get("", response_model=AlbumListResponse)
def list_albums_route(
    db: DbSession,
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    return list_albums(db, search=search, skip=skip, limit=limit)


@router.get("/{album_id}", response_model=AlbumOut)
def get_album_route(album_id: int, db: DbSession):
    return get_album(db, album_id)


@router.post("", response_model=AlbumOut, status_code=201)
def create_album_route(data: AlbumCreate, db: DbSession, _admin: AdminUser):
    return create_album(db, data)


@router.patch("/{album_id}", response_model=AlbumOut)
def update_album_route(album_id: int, data: AlbumUpdate, db: DbSession, _admin: AdminUser):
    return update_album(db, album_id, data)


@router.delete("/{album_id}", status_code=204)
def delete_album_route(album_id: int, db: DbSession, _admin: AdminUser):
    delete_album(db, album_id)
