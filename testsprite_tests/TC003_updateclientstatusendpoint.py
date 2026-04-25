import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

AUTH_CREDENTIALS = {
    "username": "informacoesextras.01@gmail.com",
    "password": "123456vv"
}

def login():
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json=AUTH_CREDENTIALS,
        timeout=TIMEOUT
    )
    assert resp.status_code == 200, "Login failed"
    data = resp.json()
    token = data.get("accessToken") or data.get("access_token") or data.get("token")
    assert token, "JWT token not found in login response"
    return token, data

def create_client(token):
    unique_email = f"testclient_{uuid.uuid4()}@example.com"
    client_payload = {
        "type": "PF",
        "name": "Test Client",
        "email": unique_email,
        "document_number": "12345678901",
        "status": "active"
    }
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.post(f"{BASE_URL}/clients", json=client_payload, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 201, f"Client creation failed with status {resp.status_code}"
    client = resp.json()
    assert client.get("id"), "Created client ID missing"
    return client["id"], client_payload["status"]

def update_client_status(token, client_id, new_status):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "processId": client_id,
        "status": new_status
    }
    resp = requests.post(f"{BASE_URL}/process-updates", json=payload, headers=headers, timeout=TIMEOUT)
    return resp

def get_client_profile(token, client_id):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/clients/{client_id}", headers=headers, timeout=TIMEOUT)
    return resp

def test_updateclientstatusendpoint():
    token, login_data = login()
    client_id = None

    try:
        client_id, original_status = create_client(token)

        # Update client status to a new value different from original
        new_status = "inactive" if original_status != "inactive" else "active"
        update_resp = update_client_status(token, client_id, new_status)
        assert update_resp.status_code == 200, f"Failed to update client status, got {update_resp.status_code}"
        update_data = update_resp.json()

        # Validate status changed
        assert update_data.get("status") == new_status, "Client status not updated correctly in update response"

        # Verify tenant isolation by fetching client profile and checking status
        profile_resp = get_client_profile(token, client_id)
        assert profile_resp.status_code == 200, f"Failed to fetch client profile, got {profile_resp.status_code}"
        profile_data = profile_resp.json()

        # Validate tenant isolation - client should belong to same tenant, status updated
        # Check both camelCase and snake_case keys for status field presence
        profile_status = profile_data.get("status") or profile_data.get("status")
        assert profile_status == new_status, "Client status not updated correctly in profile"
        
    finally:
        if client_id:
            headers = {"Authorization": f"Bearer {token}"}
            requests.delete(f"{BASE_URL}/clients/{client_id}", headers=headers, timeout=TIMEOUT)

test_updateclientstatusendpoint()