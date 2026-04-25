from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class LibraryAlbumOut(BaseModel):
    id: int
    name: str
    price: Decimal
    artist_id: int
    artist_name: str
    rating: float | None
    rating_count: int
    user_rating: int | None


class LibraryItemOut(BaseModel):
    id: int
    album_id: int
    purchased_at: datetime
    album: LibraryAlbumOut


class PurchaseOut(BaseModel):
    id: int
    user_id: int
    album_id: int
    purchased_at: datetime
