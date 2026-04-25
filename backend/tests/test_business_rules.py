"""
Tests for core business rules enforced by the service layer.
Uses an in-memory SQLite database — no running Postgres required.
"""

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import Album, Artist, Purchase, Rating, User
from app.services.purchase_service import get_user_library, purchase_album
from app.services.rating_service import create_rating, update_rating


class TestPurchaseRules:
    def test_purchase_album_success(self, db: Session, regular_user: User, album: Album):
        result = purchase_album(db, regular_user, album.id)
        assert result.album_id == album.id
        assert result.user_id == regular_user.id

    def test_cannot_purchase_same_album_twice(self, db: Session, regular_user: User, album: Album):
        purchase_album(db, regular_user, album.id)
        with pytest.raises(HTTPException) as exc_info:
            purchase_album(db, regular_user, album.id)
        assert exc_info.value.status_code == 409

    def test_purchase_nonexistent_album_raises_404(self, db: Session, regular_user: User):
        with pytest.raises(HTTPException) as exc_info:
            purchase_album(db, regular_user, 99999)
        assert exc_info.value.status_code == 404

    def test_library_returns_purchased_albums(self, db: Session, regular_user: User, album: Album):
        purchase_album(db, regular_user, album.id)
        library = get_user_library(db, regular_user)
        assert len(library) == 1
        assert library[0].album_id == album.id

    def test_library_empty_for_new_user(self, db: Session, regular_user: User):
        library = get_user_library(db, regular_user)
        assert library == []

    def test_library_only_shows_own_albums(self, db: Session, regular_user: User, album: Album):
        other_user = User(
            email="other@test.com",
            username="other",
            hashed_password="x",
        )
        db.add(other_user)
        db.commit()

        purchase_album(db, other_user, album.id)
        library = get_user_library(db, regular_user)
        assert len(library) == 0


class TestRatingRules:
    def test_cannot_rate_without_purchase(self, db: Session, regular_user: User, album: Album):
        with pytest.raises(HTTPException) as exc_info:
            create_rating(db, regular_user, album.id, score=5)
        assert exc_info.value.status_code == 403

    def test_can_rate_after_purchase(self, db: Session, regular_user: User, album: Album):
        purchase_album(db, regular_user, album.id)
        rating = create_rating(db, regular_user, album.id, score=4)
        assert rating.score == 4
        assert rating.user_id == regular_user.id

    def test_cannot_create_duplicate_rating(self, db: Session, regular_user: User, album: Album):
        purchase_album(db, regular_user, album.id)
        create_rating(db, regular_user, album.id, score=4)
        with pytest.raises(HTTPException) as exc_info:
            create_rating(db, regular_user, album.id, score=5)
        assert exc_info.value.status_code == 409

    def test_can_update_existing_rating(self, db: Session, regular_user: User, album: Album):
        purchase_album(db, regular_user, album.id)
        create_rating(db, regular_user, album.id, score=3)
        updated = update_rating(db, regular_user, album.id, score=5)
        assert updated.score == 5

    def test_update_rating_without_existing_raises_404(
        self, db: Session, regular_user: User, album: Album
    ):
        purchase_album(db, regular_user, album.id)
        with pytest.raises(HTTPException) as exc_info:
            update_rating(db, regular_user, album.id, score=5)
        assert exc_info.value.status_code == 404

    def test_rating_nonexistent_album_raises_404(self, db: Session, regular_user: User):
        with pytest.raises(HTTPException) as exc_info:
            create_rating(db, regular_user, 99999, score=5)
        assert exc_info.value.status_code == 404
