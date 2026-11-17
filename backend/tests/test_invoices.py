def test_get_invoices(client, customer_headers):
    response = client.get(
        "/api/invoices",
        headers={
            "Authorization": customer_headers["Authorization"]
        }
    )
    assert response.status_code == 200