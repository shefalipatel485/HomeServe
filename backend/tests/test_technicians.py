import uuid

import models
from database import SessionLocal


def create_technician_user(client):
    email = f"technician_{uuid.uuid4().hex[:8]}@test.com"

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Technician",
            "email": email,
            "phone": None,
            "password": "Technician@123",
            "role": "Technician"
        }
    )

    assert response.status_code in [200, 201], response.text

    db = SessionLocal()
    try:
        user = db.query(models.User).filter(
            models.User.email == email
        ).first()

        assert user is not None
        return user.id
    finally:
        db.close()


def test_create_technician(client, admin_headers):
    user_id = create_technician_user(client)

    response = client.post(
        "/api/technicians",
        headers=admin_headers,
        json={
            "user_id": user_id,
            "provider_id": None,
            "skills": "AC Repair, Plumbing",
            "experience": 3,
            "availability": "Available",
            "status": "Active"
        }
    )

    assert response.status_code == 200, response.text
    assert response.json()["user_id"] == user_id


def test_get_technicians(client, admin_headers):
    response = client.get(
        "/api/technicians",
        headers=admin_headers
    )

    assert response.status_code == 200


def test_get_single_technician(client, admin_headers):
    user_id = create_technician_user(client)

    create_response = client.post(
        "/api/technicians",
        headers=admin_headers,
        json={
            "user_id": user_id,
            "provider_id": None,
            "skills": "Electrician",
            "experience": 2,
            "availability": "Available",
            "status": "Active"
        }
    )

    assert create_response.status_code == 200, create_response.text
    technician_id = create_response.json()["id"]

    response = client.get(
        f"/api/technicians/{technician_id}",
        headers=admin_headers
    )

    assert response.status_code == 200


def test_update_technician(client, admin_headers):
    user_id = create_technician_user(client)

    create_response = client.post(
        "/api/technicians",
        headers=admin_headers,
        json={
            "user_id": user_id,
            "provider_id": None,
            "skills": "Plumbing",
            "experience": 2,
            "availability": "Available",
            "status": "Active"
        }
    )

    assert create_response.status_code == 200, create_response.text
    technician_id = create_response.json()["id"]

    response = client.put(
        f"/api/technicians/{technician_id}",
        headers=admin_headers,
        json={
            "skills": "Plumbing, Electrical",
            "experience": 4
        }
    )

    assert response.status_code == 200, response.text


def test_delete_technician(client, admin_headers):
    user_id = create_technician_user(client)

    create_response = client.post(
        "/api/technicians",
        headers=admin_headers,
        json={
            "user_id": user_id,
            "provider_id": None,
            "skills": "AC Repair",
            "experience": 3,
            "availability": "Available",
            "status": "Active"
        }
    )

    assert create_response.status_code == 200, create_response.text
    technician_id = create_response.json()["id"]

    response = client.delete(
        f"/api/technicians/{technician_id}",
        headers=admin_headers
    )

    assert response.status_code == 200, response.text