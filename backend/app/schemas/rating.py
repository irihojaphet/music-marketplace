from datetime import datetime

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    score: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")


class RatingUpdate(BaseModel):
    score: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")


class RatingOut(BaseModel):
    id: int
    user_id: int
    album_id: int
    score: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
