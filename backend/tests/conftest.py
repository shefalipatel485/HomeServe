import os
import sys
import uuid
from pathlib import Path

# =================================
# BACKEND PATH CONFIGURATION
# =================================

BACKEND_DIR = Path(__file__).resolve().parent.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# =================================
# TEST DATABASE CONFIGURATION
# =================================

os.environ["DATABASE_URL"] = (
    "mysql+pymysql://root:@localhost:3306/homeserve_test_db"
)


# =================================
# IMPORTS
# =================================

import pytest
from fastapi.testclient import TestClient

import main
import models

from database import engine, Base, SessionLocal


# =================================
# DATABASE SETUP
# =================================

@pytest.fixture(scope="session", autouse=True)
def setup_database():

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    yield


# =================================
# TEST CLIENT
# =================================

@pytest.fixture
def client():

    with TestClient(main.app) as test_client:
        yield test_client


# =================================
# ADMIN AUTHENTICATION
# =================================

@pytest.fixture
def admin_headers(client):

    db = SessionLocal()

    try:

        existing = db.query(models.User).filter(
            models.User.email == "admin_test@example.com"
        ).first()

        if not existing:

            admin = models.User(
                full_name="Test Admin",
                email="admin_test@example.com",
                phone="9999990001",
                hashed_password=main.password_hash.hash("Admin@123"),
                role="Super Admin",
                status="Active"
            )

            db.add(admin)
            db.commit()

    finally:
        db.close()

    response = client.post(
        "/api/auth/login",
        json={
            "email": "admin_test@example.com",
            "password": "Admin@123"
        }
    )

    assert response.status_code == 200, response.text

    token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


# =================================
# CUSTOMER AUTHENTICATION
# =================================

@pytest.fixture
def customer_headers(client):
    unique_id = uuid.uuid4().hex[:8]
    email = f"customer_{unique_id}@example.com"
    password = "Customer@123"

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Customer",
            "email": email,
            "phone": None,
            "password": password,
            "role": "Customer"
        }
    )

    assert register_response.status_code in [200, 201], register_response.text

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert login_response.status_code == 200, login_response.text

    token = login_response.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}",
        "email": email
    }

# =================================
# CUSTOMER EMAIL
# =================================

@pytest.fixture
def customer_email(client):

    unique_id = uuid.uuid4().hex[:8]

    email = f"customer_{unique_id}@example.com"

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Customer",
            "email": email,
            "phone": None,
            "password": "Customer@123",
            "role": "Customer"
        }
    )

    assert response.status_code in [200, 201], response.text

    return {
    "Authorization": f"Bearer {token}",
    "email": email
}