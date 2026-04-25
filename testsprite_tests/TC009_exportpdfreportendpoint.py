import requests

BASE_URL = "http://localhost:3000"
USERNAME = "informacoesextras.01@gmail.com"
PASSWORD = "123456vv"
TIMEOUT = 30

def test_exportpdfreportendpoint():
    # Step 1: Login to get JWT token
    login_url = f"{BASE_URL}/login"
    login_payload = {"username": USERNAME, "password": PASSWORD}
    login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    token = login_data.get("token")
    assert token is not None, "JWT token not found in login response"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Step 2: Get list of processes filtered to pick a processId for adding updates
    filter_processes_url = f"{BASE_URL}/processes/filter"
    filter_resp = requests.get(filter_processes_url, headers=headers, timeout=TIMEOUT)
    assert filter_resp.status_code == 200, f"Filtering processes failed: {filter_resp.text}"
    content_type = filter_resp.headers.get("Content-Type", "")
    assert "application/json" in content_type.lower(), f"Processes filter did not return JSON: {filter_resp.text}"
    processes = filter_resp.json()
    assert isinstance(processes, list), "Processes filtering did not return a list"
    assert len(processes) > 0, "No processes found for filtering"
    process_id = processes[0].get("id")
    assert process_id is not None, "Process ID not found in filtered processes"

    # Step 3: Add an update to the selected process using POST /process-updates
    add_update_url = f"{BASE_URL}/process-updates"
    update_payload = {
        "processId": process_id,
        "update": "Automated test update for financial reporting."
    }
    add_update_resp = requests.post(add_update_url, json=update_payload, headers=headers, timeout=TIMEOUT)
    assert add_update_resp.status_code == 201, f"Adding process update failed: {add_update_resp.text}"
    update_data = add_update_resp.json()
    update_id = update_data.get("id")
    assert update_id is not None, "Process update ID not found after adding update"

    try:
        # Step 4: Request PDF financial report export
        export_pdf_url = f"{BASE_URL}/financial/export/pdf"
        pdf_resp = requests.get(export_pdf_url, headers={"Authorization": f"Bearer {token}"}, timeout=TIMEOUT)
        assert pdf_resp.status_code == 200, f"Export PDF report failed: {pdf_resp.text}"
        content_type = pdf_resp.headers.get("Content-Type", "")
        assert content_type == "application/pdf", f"Unexpected content type: {content_type}"
        content_length = pdf_resp.headers.get("Content-Length")
        assert content_length is None or int(content_length) > 0, "Empty PDF report received"
        pdf_content = pdf_resp.content
        assert len(pdf_content) > 1000, "PDF content too small, possibly invalid report"
    finally:
        # Cleanup: Delete the added process update to keep data clean
        delete_update_url = f"{BASE_URL}/process-updates/{update_id}"
        del_resp = requests.delete(delete_update_url, headers=headers, timeout=TIMEOUT)
        assert del_resp.status_code in (200, 204), f"Cleanup failed to delete process update: {del_resp.text}"

test_exportpdfreportendpoint()