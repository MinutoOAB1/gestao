import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/auth/login"
TIMEOUT = 30

def test_loginendpoint():
    login_url = BASE_URL + LOGIN_ENDPOINT
    payload = {
        "email": "informacoesextras.01@gmail.com",
        "password": "123456vv"
    }
    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(login_url, json=payload, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

    json_resp = response.json()

    # Validate JWT token presence and type
    assert "token" in json_resp, "JWT token not found in response"
    assert isinstance(json_resp["token"], str) and len(json_resp["token"]) > 0, "Invalid JWT token"

    token = json_resp["token"]

    # Check multi-tenancy and 2FA enforcement presence
    assert "tenant_id" in json_resp, "Tenant ID missing, multi-tenancy not enforced"
    assert "two_fa_enabled" in json_resp, "2FA enforcement flag missing in response"

    # Use the token to call a protected resource /processes/filter to test Authorization header with JWT
    filter_url = BASE_URL + "/processes/filter"
    auth_headers = {
        "Authorization": f"Bearer {token}"
    }
    filter_resp = requests.get(filter_url, headers=auth_headers, timeout=TIMEOUT)
    assert filter_resp.status_code in [200, 204], f"Access with JWT token failed with status {filter_resp.status_code}"

test_loginendpoint()