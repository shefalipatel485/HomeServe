import uuid
import models
from database import SessionLocal


def create_test_provider(client, admin_headers):
    email = f"provider_{uuid.uuid4().hex[:8]}@test.com"

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Provider",
            "email": email,
            "phone": None,
            "password": "Provider@123",
            "role": "Service Provider"
        }
    )

    assert response.status_code in [200, 201], response.text

    user_id = response.json()["user"]["id"]

    db = SessionLocal()
    try:
        provider = db.query(models.ServiceProvider).filter(
            models.ServiceProvider.user_id == user_id
        ).first()

        assert provider is not None
        provider_id = provider.id
    finally:
        db.close()

    approve_response = client.put(
        f"/api/providers/{provider_id}/approve",
        headers=admin_headers
    )

    assert approve_response.status_code == 200, approve_response.text

    return provider_id


def create_test_booking(client, customer_headers, provider_id):
    response = client.post(
        "/api/bookings",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "customer": "Test Customer",
            "service": "AC Repair",
            "provider_id": provider_id,
            "date": "2026-12-15",
            "time_slot": "10:00 AM - 12:00 PM",
            "address": "Vadodara",
            "description": "AC is not cooling",
            "amount": 1500,
            "status": "Pending"
        }
    )

    assert response.status_code in [200, 201], response.text

    return response.json()["id"]


def create_test_review(client, customer_headers, admin_headers):
    provider_id = create_test_provider(client, admin_headers)

    booking_id = create_test_booking(
        client, customer_headers, provider_id
    )

    response = client.post(
        "/api/reviews",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "provider_id": provider_id,
            "booking_id": booking_id,
            "rating": 5,
            "comment": "Excellent service"
        }
    )

    assert response.status_code == 200, response.text

    return response.json()


def test_create_review(client, customer_headers, admin_headers):
    review = create_test_review(
        client, customer_headers, admin_headers
    )

    assert review["rating"] == 5
    assert review["comment"] == "Excellent service"


def test_get_reviews(client, customer_headers):
    response = client.get(
        "/api/reviews",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )

    assert response.status_code == 200


def test_get_reviews_by_provider(
    client, customer_headers, admin_headers
):
    review = create_test_review(
        client, customer_headers, admin_headers
    )

    response = client.get(
        f"/api/reviews?provider_id={review['provider_id']}",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )

    assert response.status_code == 200


def test_get_provider_rating(
    client, customer_headers, admin_headers
):
    review = create_test_review(
        client, customer_headers, admin_headers
    )

    response = client.get(
        f"/api/providers/{review['provider_id']}/rating",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )

    assert response.status_code == 200
    assert response.json()["average_rating"] == 5
    assert response.json()["total_reviews"] == 1


def test_review_invalid_provider(client, customer_headers):
    response = client.post(
        "/api/reviews",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "provider_id": 99999999,
            "booking_id": 1,
            "rating": 5,
            "comment": "Test review"
        }
    )

    assert response.status_code == 404


def test_review_invalid_booking(
    client, customer_headers, admin_headers
):
    provider_id = create_test_provider(client, admin_headers)

    response = client.post(
        "/api/reviews",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "provider_id": provider_id,
            "booking_id": 99999999,
            "rating": 5,
            "comment": "Test review"
        }
    )

    assert response.status_code == 404


def test_review_invalid_rating(
    client, customer_headers, admin_headers
):
    provider_id = create_test_provider(client, admin_headers)

    booking_id = create_test_booking(
        client, customer_headers, provider_id
    )

    response = client.post(
        "/api/reviews",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "provider_id": provider_id,
            "booking_id": booking_id,
            "rating": 6,
            "comment": "Invalid rating"
        }
    )

    assert response.status_code == 400