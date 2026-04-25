import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
AUTH_CREDENTIALS = {
    "username": "informacoesextras.01@gmail.com",
    "password": "123456vv"
}

def test_createclientendpoint():
    session = requests.Session()
    try:
        # 1. Login to get JWT token
        login_resp = session.post(
            f"{BASE_URL}/login",
            json={"username": AUTH_CREDENTIALS["username"], "password": AUTH_CREDENTIALS["password"]},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        token = login_json.get("token") or login_json.get("accessToken") or login_json.get("access_token")
        assert token and isinstance(token, str), "JWT token not found in login response"
        session.headers.update({"Authorization": f"Bearer {token}"})

        # 2. Create new client (PF or PJ)
        client_payload = {
            "type": "PF",  # PF - Pessoa Física (Individual)
            "name": "Test Client PF",
            "email": "testclient_pf@example.com",
            "document": "123.456.789-00",  # CPF format example
            "phone": "+5511999999999"
        }

        create_resp = session.post(
            f"{BASE_URL}/clients",
            json=client_payload,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Client creation failed with status {create_resp.status_code}"
        created_client = create_resp.json()
        client_id = created_client.get("id") or created_client.get("client_id") or created_client.get("id_client")
        assert client_id is not None, "Created client ID not returned"

        tenant_id = created_client.get("tenantId") or created_client.get("tenant_id")
        assert tenant_id is not None, "Tenant ID missing in created client"

        history = created_client.get("history") or created_client.get("clientHistory")
        if history is not None:
            assert isinstance(history, list), "Client history invalid type"

        get_resp = session.get(f"{BASE_URL}/clients/{client_id}", timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Fetching created client failed with status {get_resp.status_code}"
        get_client = get_resp.json()
        assert get_client.get("id") == client_id, "Fetched client ID mismatch"
        assert get_client.get("tenantId") == tenant_id, "Tenant isolation violated on client fetch"

    finally:
        if 'client_id' in locals():
            session.delete(f"{BASE_URL}/clients/{client_id}", timeout=TIMEOUT)

test_createclientendpoint()
