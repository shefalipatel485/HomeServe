import uuid


def test_register_customer(client):

    email = f"user_{uuid.uuid4().hex[:8]}@test.com"

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": email,
            "phone": None,
            "password": "Test@123",
            "role": "Customer"
        }
    )

    assert response.status_code in [200, 201]


def test_login_success(client, customer_headers):

    response = client.get(
        "/api/auth/me",
        headers=customer_headers["Authorization"] if False else customer_headers
    )

    assert response.status_code == 200


def test_invalid_login(client):

    response = client.post(
        "/api/auth/login",
        json={
            "email": "wrong@example.com",
            "password": "WrongPassword"
        }
    )

    assert response.status_code == 401