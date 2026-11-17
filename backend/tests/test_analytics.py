import uuid
import pytest


# ==========================
# ANALYTICS OVERVIEW
# ==========================

def test_analytics_overview(client, admin_headers):
    response = client.get(
        "/api/analytics/overview",
        headers=admin_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert "customers" in data
    assert "providers" in data
    assert "technicians" in data
    assert "services" in data
    assert "bookings" in data
    assert "payments" in data
    assert "revenue" in data
    assert "reviews" in data
    assert "complaints" in data
    assert "provider_performance" in data


# ==========================
# COMMISSION ANALYTICS
# ==========================

def test_analytics_commission(client, admin_headers):
    response = client.get(
        "/api/analytics/commission",
        headers=admin_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert "total_revenue" in data
    assert "total_commission" in data
    assert "total_provider_earnings" in data


# ==========================
# BOOKING ANALYTICS
# ==========================

def test_analytics_bookings(client, admin_headers):
    response = client.get(
        "/api/analytics/bookings",
        headers=admin_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert "total_bookings" in data
    assert "pending" in data
    assert "completed" in data
    assert "cancelled" in data


# ==========================
# REVENUE ANALYTICS
# ==========================

def test_analytics_revenue(client, admin_headers):
    response = client.get(
        "/api/analytics/revenue",
        headers=admin_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert "total_payments" in data
    assert "completed_payments" in data
    assert "pending_payments" in data
    assert "total_revenue" in data
    assert "total_commission" in data
    assert "provider_earnings" in data


# ==========================
# MONTHLY REVENUE
# ==========================

def test_analytics_monthly_revenue(client, admin_headers):
    response = client.get(
        "/api/analytics/monthly-revenue",
        headers=admin_headers
    )

    assert response.status_code == 200

    assert isinstance(response.json(), list)


# ==========================
# PROVIDER EARNINGS REPORT
# ==========================

def test_analytics_provider_earnings_report(
    client,
    admin_headers
):
    response = client.get(
        "/api/analytics/provider-earnings",
        headers=admin_headers
    )

    assert response.status_code == 200

    assert isinstance(response.json(), list)


# ==========================
# SERVICES ANALYTICS
# ==========================

def test_analytics_services(client, admin_headers):
    response = client.get(
        "/api/analytics/services",
        headers=admin_headers
    )

    assert response.status_code == 200

    assert isinstance(response.json(), list)


# ==========================
# DATE REPORT
# ==========================

def test_analytics_date_report(client, admin_headers):
    response = client.get(
        "/api/analytics/date-report",
        params={
            "start_date": "2026-01-01",
            "end_date": "2027-01-01"
        },
        headers=admin_headers
    )

    assert response.status_code == 200

    assert isinstance(response.json(), list)


# ==========================
# PROVIDER PERFORMANCE
# ==========================

def test_analytics_provider_performance(
    client,
    admin_headers
):
    response = client.get(
        "/api/analytics/provider-performance",
        headers=admin_headers
    )

    assert response.status_code == 200

    assert isinstance(response.json(), list)


# ==========================
# PROVIDER PERSONAL EARNINGS
# ==========================

def test_provider_personal_earnings(client):

    unique_id = uuid.uuid4().hex[:8]

    email = f"provider_{unique_id}@example.com"
    password = "Provider@123"

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Provider",
            "email": email,
            "phone": None,
            "password": password,
            "role": "Service Provider"
        }
    )

    assert register_response.status_code in [200, 201], (
        register_response.text
    )

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert login_response.status_code == 200, (
        login_response.text
    )

    token = login_response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = client.get(
        "/api/provider/earnings",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert "provider_id" in data
    assert "total_revenue" in data
    assert "total_commission" in data
    assert "total_earnings" in data
    assert "total_payments" in data


# ==========================
# CUSTOMER ACCESS RESTRICTION
# ==========================

@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/analytics/overview",
        "/api/analytics/commission",
        "/api/analytics/bookings",
        "/api/analytics/revenue",
        "/api/analytics/monthly-revenue",
        "/api/analytics/provider-earnings",
        "/api/analytics/services",
        "/api/analytics/provider-performance"
    ]
)
def test_customer_cannot_access_admin_analytics(
    client,
    customer_headers,
    endpoint
):
    response = client.get(
        endpoint,
        headers=customer_headers
    )

    assert response.status_code == 403