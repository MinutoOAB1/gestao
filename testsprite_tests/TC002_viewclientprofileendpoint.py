import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
AUTH_CREDENTIALS = {
    "username": "informacoesextras.01@gmail.com",
    "password": "123456vv"
}

def test_view_client_profile_endpoint():
    # Login to get JWT token
    login_url = f"{BASE_URL}/login"
    login_payload = {
        "authType": "basic",
        "username": AUTH_CREDENTIALS["username"],
        "password": AUTH_CREDENTIALS["password"]
    }
    login_headers = {"Content-Type": "application/json"}
    login_resp = requests.post(login_url, json=login_payload, headers=login_headers, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
    login_data = login_resp.json()
    assert "token" in login_data, "JWT token missing in login response"
    token = login_data["token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Create a new client to view its profile
    create_client_url = f"{BASE_URL}/clients"
    new_client = {
        "name": "Test Client",
        "email": "testclient@example.com",
        "type": "PF",  # Assuming PF or PJ required
        "phone": "1234567890",
        "address": "123 Test St",
        "status": "active"
    }
    create_resp = requests.post(create_client_url, json=new_client, headers={**auth_headers, "Content-Type": "application/json"}, timeout=TIMEOUT)
    assert create_resp.status_code == 201, f"Client creation failed with status {create_resp.status_code}"
    created_client = create_resp.json()
    assert "id" in created_client, "Created client response missing id"
    client_id = created_client["id"]

    try:
        # View client profile
        view_profile_url = f"{BASE_URL}/clients/{client_id}"
        view_resp = requests.get(view_profile_url, headers=auth_headers, timeout=TIMEOUT)
        assert view_resp.status_code == 200, f"View profile failed with status {view_resp.status_code}"
        profile_data = view_resp.json()

        # Validate that profile contains accurate client data (both camelCase and snake_case)
        # Check at least key fields are present and equal
        def check_field_equivalence(data, camel, snake):
            assert camel in data, f"{camel} field missing in profile data"
            assert snake in data, f"{snake} field missing in profile data"
            assert data[camel] == data[snake], f"Mismatch between {camel} and {snake}"

        check_field_equivalence(profile_data, "name", "name")
        check_field_equivalence(profile_data, "email", "email")
        check_field_equivalence(profile_data, "phone", "phone")
        check_field_equivalence(profile_data, "address", "address")
        check_field_equivalence(profile_data, "status", "status")
        # Additional validation: fields equal to original creation data
        assert profile_data["name"] == new_client["name"]
        assert profile_data["email"] == new_client["email"]
        assert profile_data["status"] == new_client["status"]
    finally:
        # Clean up - delete the created client
        delete_url = f"{BASE_URL}/clients/{client_id}"
        del_resp = requests.delete(delete_url, headers=auth_headers, timeout=TIMEOUT)
        assert del_resp.status_code in (200, 204), f"Failed to delete client with status {del_resp.status_code}"

test_view_client_profile_endpoint()
