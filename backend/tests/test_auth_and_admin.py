"""
Integration tests for auth endpoints and admin authorization.
Uses TestClient with dependency-overridden SQLite database.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Album, Artist, Rating, User
from tests.conftest import get_token


class TestAuthEndpoints:
    def test_register_creates_user_and_returns_token(self, client: TestClient):
        resp = client.post(
            "/auth/register",
            json={"email": "new@test.com", "username": "newuser", "password": "secret123"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "new@test.com"
        assert data["user"]["is_admin"] is False

    def test_register_duplicate_email_returns_409(self, client: TestClient, regular_user: User):
        resp = client.post(
            "/auth/register",
            json={"email": "user@test.com", "username": "another", "password": "secret123"},
        )
        assert resp.status_code == 409

    def test_login_valid_credentials(self, client: TestClient, regular_user: User):
        resp = client.post("/auth/login", json={"email": "user@test.com", "password": "password"})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_invalid_password_returns_401(self, client: TestClient, regular_user: User):
        resp = client.post(
            "/auth/login", json={"email": "user@test.com", "password": "wrong"}
        )
        assert resp.status_code == 401

    def test_me_returns_current_user(self, client: TestClient, regular_user: User):
        token = get_token(client, "user@test.com", "password")
        resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "user@test.com"

    def test_me_without_token_returns_401(self, client: TestClient):
        resp = client.get("/auth/me")
        assert resp.status_code == 401


class TestAdminAuthorization:
    def test_non_admin_cannot_create_artist(self, client: TestClient, regular_user: User):
        token = get_token(client, "user@test.com", "password")
        resp = client.post(
            "/artists",
            json={
                "real_name": "John",
                "performing_name": "DJ",
                "date_of_birth": "1990-01-01",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    def test_admin_can_create_artist(self, client: TestClient, admin_user: User):
        token = get_token(client, "admin@test.com", "password")
        resp = client.post(
            "/artists",
            json={
                "real_name": "John Smith",
                "performing_name": "DJ Test",
                "date_of_birth": "1990-01-01",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        assert resp.json()["performing_name"] == "DJ Test"

    def test_non_admin_cannot_create_album(
        self, client: TestClient, regular_user: User, artist: Artist
    ):
        token = get_token(client, "user@test.com", "password")
        resp = client.post(
            "/albums",
            json={"name": "Test Album", "price": "9.99", "artist_id": artist.id},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 403

    def test_admin_can_create_album(
        self, client: TestClient, admin_user: User, artist: Artist
    ):
        token = get_token(client, "admin@test.com", "password")
        resp = client.post(
            "/albums",
            json={"name": "New Album", "price": "14.99", "artist_id": artist.id},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "New Album"

    def test_unauthenticated_cannot_create_artist(self, client: TestClient):
        resp = client.post(
            "/artists",
            json={
                "real_name": "John",
                "performing_name": "DJ",
                "date_of_birth": "1990-01-01",
            },
        )
        assert resp.status_code == 401

    def test_guests_can_list_albums(self, client: TestClient, album: Album):
        resp = client.get("/albums")
        assert resp.status_code == 200
        assert "items" in resp.json()


class TestAlbumListing:
    def test_album_listing_supports_sorting_and_rating_filter(
        self, client: TestClient, db: Session, artist: Artist
    ):
        low = Album(name="Low Rated", price="8.99", artist_id=artist.id)
        high = Album(name="High Rated", price="15.99", artist_id=artist.id)
        unrated = Album(name="Unrated", price="10.99", artist_id=artist.id)
        db.add_all([low, high, unrated])
        db.flush()

        user1 = User(email="one@test.com", username="one", hashed_password="x")
        user2 = User(email="two@test.com", username="two", hashed_password="x")
        db.add_all([user1, user2])
        db.flush()

        db.add_all(
            [
                Rating(user_id=user1.id, album_id=low.id, score=2),
                Rating(user_id=user1.id, album_id=high.id, score=5),
                Rating(user_id=user2.id, album_id=high.id, score=4),
            ]
        )
        db.commit()

        resp = client.get("/albums", params={"sort_by": "rating_desc", "min_rating": 4})
        assert resp.status_code == 200

        data = resp.json()
        assert data["items"][0]["name"] == "High Rated"
        assert all(item["rating"] is None or item["rating"] >= 4 for item in data["items"])
