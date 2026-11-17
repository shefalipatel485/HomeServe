def create_test_complaint(client, customer_headers):
    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "booking_id": None,
            "subject": "Service Delay",
            "description": "Technician did not arrive on time"
        }
    )

    assert response.status_code == 200, response.text
    return response.json()


def test_create_complaint(client, customer_headers):
    complaint = create_test_complaint(client, customer_headers)

    assert complaint["subject"] == "Service Delay"
    assert complaint["status"] == "Open"


def test_get_complaints(client, customer_headers):
    response = client.get(
        "/api/complaints",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )

    assert response.status_code == 200


def test_admin_can_get_all_complaints(client, admin_headers):
    response = client.get(
        "/api/complaints",
        headers=admin_headers
    )

    assert response.status_code == 200


def test_update_complaint(client, customer_headers, admin_headers):
    complaint = create_test_complaint(client, customer_headers)

    response = client.put(
        f"/api/complaints/{complaint['id']}",
        headers=admin_headers,
        json={
            "status": "Resolved",
            "admin_response": "Your complaint has been resolved"
        }
    )

    assert response.status_code == 200, response.text
    assert response.json()["status"] == "Resolved"
    assert response.json()["admin_response"] == "Your complaint has been resolved"


def test_delete_complaint(client, customer_headers, admin_headers):
    complaint = create_test_complaint(client, customer_headers)

    response = client.delete(
        f"/api/complaints/{complaint['id']}",
        headers=admin_headers
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Complaint deleted successfully"


def test_complaint_invalid_booking(client, customer_headers):
    response = client.post(
        "/api/complaints",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "booking_id": 99999999,
            "subject": "Invalid Booking",
            "description": "Testing invalid booking"
        }
    )

    assert response.status_code == 404


def test_customer_cannot_update_complaint(
    client, customer_headers
):
    complaint = create_test_complaint(client, customer_headers)

    response = client.put(
        f"/api/complaints/{complaint['id']}",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "status": "Resolved",
            "admin_response": "Test response"
        }
    )

    assert response.status_code == 403


def test_customer_cannot_delete_complaint(
    client, customer_headers
):
    complaint = create_test_complaint(client, customer_headers)

    response = client.delete(
        f"/api/complaints/{complaint['id']}",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )

    assert response.status_code == 403