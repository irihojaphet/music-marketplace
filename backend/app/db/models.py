from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    purchases: Mapped[list["Purchase"]] = relationship("Purchase", back_populates="user")
    ratings: Mapped[list["Rating"]] = relationship("Rating", back_populates="user")


class Artist(Base):
    __tablename__ = "artists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    real_name: Mapped[str] = mapped_column(String, nullable=False)
    performing_name: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    bio: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    albums: Mapped[list["Album"]] = relationship(
        "Album", back_populates="artist", cascade="all, delete-orphan"
    )


class Album(Base):
    __tablename__ = "albums"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    artist_id: Mapped[int] = mapped_column(Integer, ForeignKey("artists.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    artist: Mapped["Artist"] = relationship("Artist", back_populates="albums")
    purchases: Mapped[list["Purchase"]] = relationship(
        "Purchase", back_populates="album", cascade="all, delete-orphan"
    )
    ratings: Mapped[list["Rating"]] = relationship(
        "Rating", back_populates="album", cascade="all, delete-orphan"
    )


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    album_id: Mapped[int] = mapped_column(Integer, ForeignKey("albums.id"), nullable=False)
    purchased_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "album_id", name="uq_purchase_user_album"),)

    user: Mapped["User"] = relationship("User", back_populates="purchases")
    album: Mapped["Album"] = relationship("Album", back_populates="purchases")


class Rating(Base):
    __tablename__ = "ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    album_id: Mapped[int] = mapped_column(Integer, ForeignKey("albums.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (UniqueConstraint("user_id", "album_id", name="uq_rating_user_album"),)

    user: Mapped["User"] = relationship("User", back_populates="ratings")
    album: Mapped["Album"] = relationship("Album", back_populates="ratings")
