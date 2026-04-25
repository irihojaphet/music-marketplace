from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator

from app.schemas.artist import ArtistOut


class AlbumCreate(BaseModel):
    name: str
    price: Decimal
    artist_id: int

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be positive")
        return v


class AlbumUpdate(BaseModel):
    name: str | None = None
    price: Decimal | None = None
    artist_id: int | None = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v <= 0:
            raise ValueError("Price must be positive")
        return v


class AlbumOut(BaseModel):
    id: int
    name: str
    price: Decimal
    artist_id: int
    artist: ArtistOut
    rating: float | None
    rating_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AlbumListItem(BaseModel):
    id: int
    name: str
    price: Decimal
    artist_id: int
    artist_name: str
    rating: float | None
    rating_count: int
    created_at: datetime


class AlbumListResponse(BaseModel):
    items: list[AlbumListItem]
    total: int
    skip: int
    limit: int
