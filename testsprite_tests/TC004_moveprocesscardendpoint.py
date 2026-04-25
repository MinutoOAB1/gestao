import requests
import time

BASE_URL = "http://localhost:3000"
EMAIL = "informacoesextras.01@gmail.com"
PASSWORD = "123456vv"
TIMEOUT = 30


def test_moveprocesscardendpoint():
    session = requests.Session()

    # Authenticate and get JWT token
    try:
        login_resp = session.post(
            f"{BASE_URL}/auth/login",
            json={"email": EMAIL, "password": PASSWORD},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        token = login_data.get("accessToken") or login_data.get("access_token")
        assert token, "JWT token not found in login response"
        headers = {"Authorization": f"Bearer {token}"}
    except Exception as e:
        raise AssertionError(f"Authentication failed: {e}")

    # Step 1: Create a new process (assume POST /processes to create)
    # Since PRD does not specify process creation endpoint, we try to create a dummy process
    # to have a processId to work with. If not available, fetch existing process from filter.
    process_id = None
    try:
        # Try to filter processes to get one existing processId
        filter_resp = session.get(f"{BASE_URL}/processes/filter", headers=headers, timeout=TIMEOUT)
        assert filter_resp.status_code == 200, f"Filter processes failed: {filter_resp.text}"
        content = filter_resp.content
        assert content, "Filter processes response is empty"
        processes = filter_resp.json()
        if isinstance(processes, list) and len(processes) > 0:
            process_id = processes[0].get("id") or processes[0].get("processId")
        else:
            raise AssertionError("No existing processes found to test moving process card.")
        assert process_id, "Process ID not found in filtered processes"
    except Exception as e:
        raise AssertionError(f"Failed to get process for testing: {e}")

    # Step 2: Post an update to move process card - update status and maybe urgency
    try:
        # The body should include processId and new status and urgency info
        # PRD is not fully explicit on the exact schema, so we assume minimal necessary fields:
        # We'll simulate moving the process card by sending a status update
        new_status = "In Progress"
        urgency_flag = True  # example urgency indicator

        update_payload = {
            "processId": process_id,
            "status": new_status,
            "urgency": urgency_flag,
            "timestamp": int(time.time())
        }

        post_resp = session.post(f"{BASE_URL}/process-updates", json=update_payload, headers=headers, timeout=TIMEOUT)
        assert post_resp.status_code in (200, 201), f"Failed to post process update: {post_resp.text}"
        update_response = post_resp.json()

        # Validate response has confirmation of status change and urgency
        assert "status" in update_response, "Response missing 'status' field"
        assert update_response["status"] == new_status, "Process status not updated correctly"
        assert "urgency" in update_response, "Response missing 'urgency' field"
        assert update_response["urgency"] == urgency_flag, "Urgency flag not updated correctly"
    except Exception as e:
        raise AssertionError(f"Failed to move process card: {e}")

    # Step 3: Verify the process status and urgency updated by filtering and checking process details
    try:
        filter_resp_after = session.get(f"{BASE_URL}/processes/filter", headers=headers, timeout=TIMEOUT)
        assert filter_resp_after.status_code == 200, f"Filter after update failed: {filter_resp_after.text}"
        content_after = filter_resp_after.content
        assert content_after, "Filter after update response is empty"
        processes_after = filter_resp_after.json()

        # Find the updated process by id
        updated_process = None
        for p in processes_after:
            pid = p.get("id") or p.get("processId")
            if pid == process_id:
                updated_process = p
                break
        assert updated_process, "Updated process not found in filter response"

        # Validate the status and urgency in updated process
        proc_status = updated_process.get("status")
        proc_urgency = updated_process.get("urgency")  # assuming urgency is top-level field

        assert proc_status == new_status, f"Process status mismatch after update: expected {new_status}, got {proc_status}"
        # urgency might be boolean or some indicator, ensure it reflects urgency_flag
        assert proc_urgency == urgency_flag, f"Process urgency mismatch after update: expected {urgency_flag}, got {proc_urgency}"

    except Exception as e:
        raise AssertionError(f"Verification after move failed: {e}")


test_moveprocesscardendpoint()
