"""
Backend tests for Autoland 07 API.
Covers public endpoints, auth, admin flows, inquiry/review lifecycle.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://vin-checker-3.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "mihai@autoland07.ro"
ADMIN_PASSWORD = "Autoland2026!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and isinstance(data["access_token"], str)
    assert data["user"]["email"] == ADMIN_EMAIL
    assert "password_hash" not in data["user"]
    return data["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --- Public ---
class TestPublic:
    def test_root(self, session):
        r = session.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_get_settings(self, session):
        r = session.get(f"{BASE_URL}/api/settings")
        assert r.status_code == 200
        data = r.json()
        for key in ("phone", "email", "address", "status", "schedule_weekday"):
            assert key in data
        assert data["status"] in ("open", "break", "closed")

    def test_get_reviews(self, session):
        r = session.get(f"{BASE_URL}/api/reviews")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_inquiry(self, session):
        payload = {
            "name": "TEST_Ion Popescu",
            "contact": "0712345678",
            "vin": "wbaba91070al12345",
            "car_model": "BMW 320d E46",
            "problem": "Pompa apa face zgomot la rece, suspect curgere"
        }
        r = session.post(f"{BASE_URL}/api/inquiries", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "new"
        assert data["vin"] == "WBABA91070AL12345"  # uppercased
        assert data["name"] == payload["name"]
        assert data["review_token"] is None
        assert "id" in data
        pytest.created_inquiry_id = data["id"]

    def test_inquiry_validation(self, session):
        # too-short problem
        r = session.post(f"{BASE_URL}/api/inquiries",
                         json={"name": "Ab", "contact": "0712", "problem": "x"})
        assert r.status_code == 422


# --- Auth ---
class TestAuth:
    def test_login_wrong_password(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": ADMIN_EMAIL, "password": "Wrong!"})
        assert r.status_code == 401

    def test_login_unknown_email(self, session):
        r = session.post(f"{BASE_URL}/api/auth/login",
                         json={"email": "nope@nope.ro", "password": "abc12345"})
        assert r.status_code == 401

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL
        assert data.get("role") == "admin"
        assert "password_hash" not in data

    def test_me_without_token(self, session):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_admin_endpoints_require_auth(self, session):
        for path in ["/api/admin/inquiries", "/api/admin/inquiries/stats", "/api/admin/reviews"]:
            r = requests.get(f"{BASE_URL}{path}")
            assert r.status_code == 401, f"{path} should require auth"
        r = requests.put(f"{BASE_URL}/api/admin/settings", json={"phone": "x"})
        assert r.status_code == 401


# --- Admin Inquiries ---
class TestAdminInquiries:
    def test_list_inquiries(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/admin/inquiries", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert any(i["id"] == pytest.created_inquiry_id for i in items)

    def test_stats(self, session, auth_headers):
        r = session.get(f"{BASE_URL}/api/admin/inquiries/stats", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "new" in data and "total" in data
        assert data["total"] >= 1
        assert data["new"] >= 1

    def test_resolve_creates_token(self, session, auth_headers):
        iid = pytest.created_inquiry_id
        r = session.post(f"{BASE_URL}/api/admin/inquiries/{iid}/resolve", headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "resolved"
        assert data["review_token"]
        assert data["resolved_at"]
        pytest.review_token = data["review_token"]

    def test_resolve_404(self, session, auth_headers):
        r = session.post(f"{BASE_URL}/api/admin/inquiries/{uuid.uuid4()}/resolve", headers=auth_headers)
        assert r.status_code == 404


# --- Reviews ---
class TestReviews:
    def test_check_token_ok(self, session):
        r = session.get(f"{BASE_URL}/api/reviews/check/{pytest.review_token}")
        assert r.status_code == 200
        assert r.json().get("ok") is True
        assert "TEST_" in r.json()["name"]

    def test_check_token_invalid(self, session):
        r = session.get(f"{BASE_URL}/api/reviews/check/notatoken123")
        assert r.status_code == 404

    def test_submit_review(self, session):
        r = session.post(f"{BASE_URL}/api/reviews",
                         json={"token": pytest.review_token, "rating": 5,
                               "text": "Servicii excelente, recomand!"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["rating"] == 5
        assert data["color"] in ("yellow", "pink", "cyan", "green")
        assert "TEST_" in data["name"]
        pytest.review_id = data["id"]

    def test_submit_review_duplicate(self, session):
        r = session.post(f"{BASE_URL}/api/reviews",
                         json={"token": pytest.review_token, "rating": 4, "text": "second try"})
        assert r.status_code == 409

    def test_check_token_after_submit(self, session):
        r = session.get(f"{BASE_URL}/api/reviews/check/{pytest.review_token}")
        assert r.status_code == 409

    def test_review_appears_in_public_list(self, session):
        r = session.get(f"{BASE_URL}/api/reviews")
        assert r.status_code == 200
        ids = [rv["id"] for rv in r.json()]
        assert pytest.review_id in ids

    def test_invalid_rating(self, session):
        r = session.post(f"{BASE_URL}/api/reviews",
                         json={"token": "x", "rating": 9, "text": "bad rating"})
        assert r.status_code == 422


# --- Admin Settings ---
class TestAdminSettings:
    def test_update_settings(self, session, auth_headers):
        new_phone = "0729111222"
        r = session.put(f"{BASE_URL}/api/admin/settings",
                        headers=auth_headers, json={"phone": new_phone})
        assert r.status_code == 200
        assert r.json()["phone"] == new_phone
        # Confirm via public GET
        r2 = session.get(f"{BASE_URL}/api/settings")
        assert r2.json()["phone"] == new_phone

    def test_status_toggle_break(self, session, auth_headers):
        r = session.put(f"{BASE_URL}/api/admin/settings",
                        headers=auth_headers, json={"status": "break", "status_message": "Pauză masă"})
        assert r.status_code == 200
        r2 = session.get(f"{BASE_URL}/api/settings")
        assert r2.json()["status"] == "break"
        assert r2.json()["status_message"] == "Pauză masă"
        # restore
        session.put(f"{BASE_URL}/api/admin/settings",
                    headers=auth_headers, json={"status": "open", "status_message": ""})

    def test_status_invalid(self, session, auth_headers):
        r = session.put(f"{BASE_URL}/api/admin/settings",
                        headers=auth_headers, json={"status": "weird"})
        assert r.status_code == 400


# --- Cleanup / Delete ---
class TestCleanup:
    def test_delete_review(self, session, auth_headers):
        rid = getattr(pytest, "review_id", None)
        if rid:
            r = session.delete(f"{BASE_URL}/api/admin/reviews/{rid}", headers=auth_headers)
            assert r.status_code == 200

    def test_delete_inquiry(self, session, auth_headers):
        iid = pytest.created_inquiry_id
        r = session.delete(f"{BASE_URL}/api/admin/inquiries/{iid}", headers=auth_headers)
        assert r.status_code == 200
        # Confirm gone
        r2 = session.delete(f"{BASE_URL}/api/admin/inquiries/{iid}", headers=auth_headers)
        assert r2.status_code == 404
