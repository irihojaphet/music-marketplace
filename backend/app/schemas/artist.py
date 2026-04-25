from datetime import date, datetime

from pydantic import BaseModel


class ArtistCreate(BaseModel):
    real_name: str
    performing_name: str
    date_of_birth: date
    bio: str | None = None


class ArtistUpdate(BaseModel):
    real_name: str | None = None
    performing_name: str | None = None
    date_of_birth: date | None = None
    bio: str | None = None


class ArtistOut(BaseModel):
    id: int
    real_name: str
    performing_name: str
    date_of_birth: date
    bio: str | None
    created_at: datetime
    album_count: int = 0

    model_config = {"from_attributes": True}
