from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
import app.db.models  # noqa: F401 - register all models
from app.core.security import hash_password
from app.db.models import User, Artist, Album
from app.db.session import get_db
from app.main import app


@pytest.fixture
def db() -> Session:
    # StaticPool ensures all connections share the same in-memory SQLite DB
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_fk(dbapi_conn, _):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(engine)


@pytest.fixture
def client(db: Session):
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db: Session) -> User:
    user = User(
        email="admin@test.com",
        username="admin",
        hashed_password=hash_password("password"),
        is_admin=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def regular_user(db: Session) -> User:
    user = User(
        email="user@test.com",
        username="testuser",
        hashed_password=hash_password("password"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def artist(db: Session) -> Artist:
    a = Artist(
        real_name="John Smith",
        performing_name="DJ Test",
        date_of_birth=date(1990, 1, 1),
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@pytest.fixture
def album(db: Session, artist: Artist) -> Album:
    a = Album(name="Test Album", price=Decimal("9.99"), artist_id=artist.id)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def get_token(client: TestClient, email: str, password: str) -> str:
    resp = client.post("/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]
