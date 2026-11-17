
def test_create_service(client, admin_headers):

    response = client.post(
        "/api/services",
        headers=admin_headers,
        json={
            "name": "AC Repair",
            "category": "Home Appliances",
            "description": "AC repair service",
            "price": 1500,
            "duration": "2 Hours",
            "status": "Active"
        }
    )

    assert response.status_code in [200, 201]

    assert response.json()["name"] == "AC Repair"


def test_get_services(client, admin_headers):

    response = client.get(
        "/api/services",
        headers=admin_headers
    )

    assert response.status_code == 200


def test_customer_cannot_create_service(client, customer_headers):

    response = client.post(
        "/api/services",
        headers=customer_headers["Authorization"] if False else customer_headers,
        json={
            "name": "Test Service",
            "category": "Test",
            "price": 500
        }
    )

    assert response.status_code == 403