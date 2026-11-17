def test_get_notifications(client, customer_headers):
    response = client.get(
        "/api/notifications",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )
    assert response.status_code == 200


def test_customer_can_access_notifications(client, customer_headers):
    response = client.get(
        "/api/notifications",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )
    assert response.status_code == 200