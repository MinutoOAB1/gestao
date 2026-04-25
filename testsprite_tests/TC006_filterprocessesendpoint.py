import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
AUTH_CREDENTIALS = {
    "username": "informacoesextras.01@gmail.com",
    "password": "123456vv"
}

def test_filterprocessesendpoint():
    # Authenticate and get JWT token
    login_url = f"{BASE_URL}/login"
    resp = requests.post(login_url, json=AUTH_CREDENTIALS, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed with status code {resp.status_code}"
    token = resp.json().get("token")
    assert token, "No token found in login response"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Setup: create a new legal process to filter later
    # Since no direct create process endpoint is given, assume creating a client, then process is out of scope
    # We will create a dummy process via POST /process-updates with a new processId

    # Create a dummy process via adding an update with a unique processId (simulate process creation step)
    # Generate a unique processId (e.g. a random string or number)
    import uuid
    process_id = str(uuid.uuid4())

    # Add an update to create the process
    process_updates_url = f"{BASE_URL}/process-updates"
    update_payload = {
        "processId": process_id,
        "updateText": "Initial update for filtering test",
        "tribunal": "Tribunal de Justiça",
        "area": "Civil"
    }
    try:
        add_update_resp = requests.post(process_updates_url, json=update_payload, headers=headers, timeout=TIMEOUT)
        assert add_update_resp.status_code == 201 or add_update_resp.status_code == 200, \
            f"Failed to add process update: {add_update_resp.status_code}, {add_update_resp.text}"

        # Test filtering by tribunal
        filter_url = f"{BASE_URL}/processes/filter"
        filter_by_tribunal_payload = {"tribunal": "Tribunal de Justiça"}
        filter_tribunal_resp = requests.get(filter_url, headers=headers, json=filter_by_tribunal_payload, timeout=TIMEOUT)
        assert filter_tribunal_resp.status_code == 200, f"Filter by tribunal failed: {filter_tribunal_resp.status_code}"
        filtered_tribunal_processes = filter_tribunal_resp.json()
        assert any(p.get("processId") == process_id for p in filtered_tribunal_processes), \
            "Process not found in filter by tribunal response"

        # Test filtering by area
        filter_by_area_payload = {"area": "Civil"}
        filter_area_resp = requests.get(filter_url, headers=headers, json=filter_by_area_payload, timeout=TIMEOUT)
        assert filter_area_resp.status_code == 200, f"Filter by area failed: {filter_area_resp.status_code}"
        filtered_area_processes = filter_area_resp.json()
        assert any(p.get("processId") == process_id for p in filtered_area_processes), \
            "Process not found in filter by area response"

    finally:
        # Clean up: delete the process if DELETE endpoint existed - Not specified in PRD.
        # Assuming a DELETE /processes/{processId} exists for cleanup; if not, skip cleanup.
        delete_url = f"{BASE_URL}/processes/{process_id}"
        try:
            delete_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
            # If DELETE not supported, ignore errors
        except Exception:
            pass


test_filterprocessesendpoint()
