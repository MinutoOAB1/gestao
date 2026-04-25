import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

AUTH_CREDENTIALS = {
    "username": "informacoesextras.01@gmail.com",
    "password": "123456vv"
}

def login():
    url = f"{BASE_URL}/login"
    payload = {
        "username": AUTH_CREDENTIALS["username"],
        "password": AUTH_CREDENTIALS["password"]
    }
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    token = response.json().get("token")
    assert token is not None, "Login failed, no token returned"
    return token

def create_process(auth_token):
    url = f"{BASE_URL}/processes"
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "title": "Test Process for Update",
        "description": "Created for testing add process update endpoint",
        "status": "open"
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    assert response.status_code == 201
    process = response.json()
    process_id = process.get("id")
    assert process_id is not None
    return process_id

def delete_process(auth_token, process_id):
    url = f"{BASE_URL}/processes/{process_id}"
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.delete(url, headers=headers, timeout=TIMEOUT)
    if response.status_code not in (200, 204, 404):
        response.raise_for_status()

def add_process_update(auth_token, process_id, update_text):
    url = f"{BASE_URL}/process-updates"
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "process_id": process_id,
        "text": update_text
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    return response

def get_process_updates(auth_token, process_id):
    url = f"{BASE_URL}/processes/filter"
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    params = {"processId": process_id}
    response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()

def test_addprocessupdateendpoint():
    auth_token = login()
    process_id = None
    try:
        process_id = create_process(auth_token)
        update_text = "Test update for process"
        response = add_process_update(auth_token, process_id, update_text)
        assert response.status_code == 201
        update_response = response.json()
        assert update_response.get("process_id") == process_id
        assert "text" in update_response and update_response["text"] == update_text
        filtered_processes = get_process_updates(auth_token, process_id)
        processes_list = filtered_processes.get("processes")
        assert processes_list is not None
        assert any(p.get("id") == process_id for p in processes_list)
        for proc in processes_list:
            if proc.get("id") == process_id:
                updates = proc.get("updates") or proc.get("processUpdates") or []
                assert any(update_text == (upd.get("text") or upd.get("update")) for upd in updates)
                break
    finally:
        if process_id:
            delete_process(auth_token, process_id)

test_addprocessupdateendpoint()
