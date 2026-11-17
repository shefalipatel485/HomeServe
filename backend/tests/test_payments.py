def create_test_booking(client, customer_headers):
    headers = {
        "Authorization": customer_headers["Authorization"]
    }

    response = client.post(
        "/api/bookings",
        headers=headers,
        json={
            "customer": "Test Customer",
            "service": "AC Repair",
            "provider_id": None,
            "date": "2026-12-10",
            "time_slot": "10:00 AM - 12:00 PM",
            "address": "Vadodara",
            "description": "AC is not cooling",
            "amount": 1500,
            "status": "Pending"
        }
    )

    assert response.status_code in [200, 201], response.text
    return response.json()["booking_code"]


def create_test_payment(client, customer_headers):
    booking_code = create_test_booking(client, customer_headers)

    response = client.post(
        "/api/payments",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "customer": "Test Customer",
            "booking_id": booking_code,
            "date": "2026-12-10",
            "amount": 1500,
            "method": "UPI",
            "status": "Pending"
        }
    )

    assert response.status_code in [200, 201], response.text
    return response.json()


def test_create_payment(client, customer_headers):
    payment = create_test_payment(client, customer_headers)

    assert payment["amount"] == 1500
    assert payment["method"] == "UPI"
    assert payment["status"] == "Pending"
    assert payment["payment_code"]


def test_get_payments(client, admin_headers):
    response = client.get(
        "/api/payments",
        headers=admin_headers
    )
    assert response.status_code == 200


def test_customer_can_access_payments(client, customer_headers):
    response = client.get(
        "/api/payments",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )
    assert response.status_code == 200


def test_get_single_payment(client, customer_headers):
    payment = create_test_payment(client, customer_headers)

    response = client.get(
        f"/api/payments/{payment['id']}",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )

    assert response.status_code == 200
    assert response.json()["id"] == payment["id"]


def test_update_payment(client, customer_headers):
    payment = create_test_payment(client, customer_headers)

    response = client.put(
        f"/api/payments/{payment['id']}",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "status": "Paid",
            "method": "Cash"
        }
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "Paid"
    assert response.json()["method"] == "Cash"


def test_delete_payment(client, customer_headers, admin_headers):
    payment = create_test_payment(client, customer_headers)

    response = client.delete(
        f"/api/payments/{payment['id']}",
        headers=admin_headers
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Payment deleted successfully"


def test_payment_invalid_booking(client, customer_headers):
    response = client.post(
        "/api/payments",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "customer": "Test Customer",
            "booking_id": "INVALID_BOOKING",
            "date": "2026-12-10",
            "amount": 1500,
            "method": "UPI",
            "status": "Pending"
        }
    )

    assert response.status_code == 404