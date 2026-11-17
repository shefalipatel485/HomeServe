def test_create_customer(client, customer_headers):

    response = client.post(
        "/api/customers",
        headers={
            "Authorization": customer_headers["Authorization"]
        },
        json={
            "name": "Test Customer",
            "email": customer_headers["email"],
            "phone": "9876543210",
            "city": "Vadodara",
            "status": "Active"
        }
    )

    assert response.status_code in [200, 201], response.text


def test_get_customers(client, admin_headers):

    response = client.get(
        "/api/customers",
        headers=admin_headers
    )

    assert response.status_code == 200