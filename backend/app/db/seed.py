"""
Seed script: creates demo users, artists, albums, purchases, and ratings.

Run from backend/ directory:
    python -m app.db.seed
"""

from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.models import Album, Artist, Purchase, Rating, User
from app.db.session import SessionLocal, engine
from app.db.base import Base


ARTISTS = [
    {
        "real_name": "Aubrey Drake Graham",
        "performing_name": "Drake",
        "date_of_birth": date(1986, 10, 24),
        "bio": "Canadian rapper, singer, and songwriter from Toronto.",
    },
    {
        "real_name": "Shawn Corey Carter",
        "performing_name": "Jay-Z",
        "date_of_birth": date(1969, 12, 4),
        "bio": "Rapper, entrepreneur, and record executive from Brooklyn, New York.",
    },
    {
        "real_name": "Robyn Rihanna Fenty",
        "performing_name": "Rihanna",
        "date_of_birth": date(1988, 2, 20),
        "bio": "Barbadian singer, actress, and businesswoman.",
    },
    {
        "real_name": "Kendrick Lamar Duckworth",
        "performing_name": "Kendrick Lamar",
        "date_of_birth": date(1987, 6, 17),
        "bio": "Rapper and songwriter from Compton, California.",
    },
    {
        "real_name": "Abel Makkonen Tesfaye",
        "performing_name": "The Weeknd",
        "date_of_birth": date(1990, 2, 16),
        "bio": "Canadian singer, songwriter, and record producer from Toronto.",
    },
]

ALBUMS = [
    {"name": "Take Care", "price": Decimal("12.99"), "artist_name": "Drake"},
    {"name": "Nothing Was the Same", "price": Decimal("11.99"), "artist_name": "Drake"},
    {"name": "Scorpion", "price": Decimal("13.99"), "artist_name": "Drake"},
    {"name": "The Black Album", "price": Decimal("14.99"), "artist_name": "Jay-Z"},
    {"name": "4:44", "price": Decimal("12.99"), "artist_name": "Jay-Z"},
    {"name": "Rated R", "price": Decimal("10.99"), "artist_name": "Rihanna"},
    {"name": "Anti", "price": Decimal("13.99"), "artist_name": "Rihanna"},
    {"name": "good kid, m.A.A.d city", "price": Decimal("11.99"), "artist_name": "Kendrick Lamar"},
    {"name": "To Pimp a Butterfly", "price": Decimal("13.99"), "artist_name": "Kendrick Lamar"},
    {"name": "DAMN.", "price": Decimal("12.99"), "artist_name": "Kendrick Lamar"},
    {"name": "Starboy", "price": Decimal("11.99"), "artist_name": "The Weeknd"},
    {"name": "After Hours", "price": Decimal("12.99"), "artist_name": "The Weeknd"},
]


def seed(db: Session) -> None:
    if db.query(User).first():
        print("Database already seeded. Skipping.")
        return

    # Users
    admin = User(
        email="admin@musicmarket.com",
        username="admin",
        hashed_password=hash_password("admin123"),
        is_admin=True,
    )
    user1 = User(
        email="alice@example.com",
        username="alice",
        hashed_password=hash_password("password123"),
    )
    user2 = User(
        email="bob@example.com",
        username="bob",
        hashed_password=hash_password("password123"),
    )
    db.add_all([admin, user1, user2])
    db.flush()

    # Artists
    artist_map: dict[str, Artist] = {}
    for a_data in ARTISTS:
        artist = Artist(**a_data)
        db.add(artist)
        db.flush()
        artist_map[artist.performing_name] = artist

    # Albums
    album_map: dict[str, Album] = {}
    for al_data in ALBUMS:
        artist = artist_map[al_data["artist_name"]]
        album = Album(name=al_data["name"], price=al_data["price"], artist_id=artist.id)
        db.add(album)
        db.flush()
        album_map[al_data["name"]] = album

    # Purchases for alice
    alice_purchases = ["Take Care", "To Pimp a Butterfly", "After Hours", "Anti", "DAMN."]
    for name in alice_purchases:
        db.add(Purchase(user_id=user1.id, album_id=album_map[name].id))

    # Purchases for bob
    bob_purchases = ["Scorpion", "4:44", "good kid, m.A.A.d city", "Starboy"]
    for name in bob_purchases:
        db.add(Purchase(user_id=user2.id, album_id=album_map[name].id))

    db.flush()

    # Ratings from alice
    alice_ratings = {
        "Take Care": 5,
        "To Pimp a Butterfly": 5,
        "After Hours": 4,
        "Anti": 4,
    }
    for name, score in alice_ratings.items():
        db.add(Rating(user_id=user1.id, album_id=album_map[name].id, score=score))

    # Ratings from bob
    bob_ratings = {
        "4:44": 5,
        "good kid, m.A.A.d city": 5,
        "Starboy": 3,
    }
    for name, score in bob_ratings.items():
        db.add(Rating(user_id=user2.id, album_id=album_map[name].id, score=score))

    db.commit()
    print("Seed complete.")
    print("  Admin:  admin@musicmarket.com / admin123")
    print("  User 1: alice@example.com / password123")
    print("  User 2: bob@example.com / password123")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
