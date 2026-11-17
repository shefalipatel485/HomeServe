def test_get_providers(client, admin_headers):

    response = client.get(
        "/api/providers",
        headers=admin_headers
    )

    assert response.status_code == 200


def test_customer_cannot_access_providers(client, customer_headers):

    response = client.get(
        "/api/providers",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )

    assert response.status_code == 403