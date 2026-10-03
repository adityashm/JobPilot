import os
import sys
from pathlib import Path

# Add apps/api directory to sys.path so 'app' is importable from anywhere
api_root = str(Path(__file__).resolve().parent.parent)
if api_root not in sys.path:
    sys.path.insert(0, api_root)

# Ensure test DB is set to in-memory sqlite before loading settings/db
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.core.config import settings
settings.DATABASE_URL = "sqlite:///:memory:"

from app.core.database import Base, get_db
from app.main import app

# In-memory SQLite database for isolated unit/integration tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture
def anyio_backend():
    """Ensure anyio tests run under asyncio which is required by Playwright."""
    return "asyncio"


@pytest.fixture(autouse=True)
def isolate_db_tables():
    """Ensure every test executes against a pristine schema with no leaked state."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
