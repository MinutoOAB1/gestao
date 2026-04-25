import requests

BASE_URL = "http://localhost:3000"
EMAIL = "informacoesextras.01@gmail.com"
PASSWORD = "123456vv"
TIMEOUT = 30

def test_recordpaymentendpoint():
    # Authenticate and get JWT token
    login_url = f"{BASE_URL}/login"
    login_payload = {
        "authType": "basic",
        "credential": {
            "email": EMAIL,
            "password": PASSWORD
        }
    }
    login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json().get("token")
    assert token, "Token not found in login response"

    headers = {"Authorization": f"Bearer {token}"}

    created_process_id = None
    try:
        # Step 1: Create a process to record a payment against by filtering or manually creating a new one
        # We'll try to create a minimal fake process to have a valid processId for updates
        # Since no create process endpoint is provided, we'll filter existing processes to get one processId
        filter_url = f"{BASE_URL}/processes/filter"
        filter_resp = requests.get(filter_url, headers=headers, timeout=TIMEOUT)
        assert filter_resp.status_code == 200, f"Filter processes failed: {filter_resp.text}"
        processes = filter_resp.json()
        assert isinstance(processes, list) and len(processes) > 0, "No processes found to record payment against"
        process_id = processes[0].get("id") or processes[0].get("processId")
        assert process_id, "Process ID not found in filtered processes"

        # Step 2: Record income payment with POST /process-updates including processId in body
        record_url = f"{BASE_URL}/process-updates"
        income_payment_payload = {
            "processId": process_id,
            "updateType": "payment",
            "payment": {
                "type": "income",
                "amount": 1500.00,
                "description": "Test income payment"
            }
        }
        income_resp = requests.post(record_url, json=income_payment_payload, headers=headers, timeout=TIMEOUT)
        assert income_resp.status_code == 201 or income_resp.status_code == 200, f"Income payment failed: {income_resp.text}"
        income_data = income_resp.json()
        assert income_data.get("payment") and income_data["payment"].get("type") == "income", "Income payment not recorded correctly"

        # Step 3: Record expense payment with POST /process-updates including processId in body
        expense_payment_payload = {
            "processId": process_id,
            "updateType": "payment",
            "payment": {
                "type": "expense",
                "amount": 500.00,
                "description": "Test expense payment"
            }
        }
        expense_resp = requests.post(record_url, json=expense_payment_payload, headers=headers, timeout=TIMEOUT)
        assert expense_resp.status_code == 201 or expense_resp.status_code == 200, f"Expense payment failed: {expense_resp.text}"
        expense_data = expense_resp.json()
        assert expense_data.get("payment") and expense_data["payment"].get("type") == "expense", "Expense payment not recorded correctly"

        # Step 4: Verify payments are associated by filtering processes to check updates or by re-fetching updates if applicable
        # Because no direct GET for updates provided, we re-filter processes and check any payments info within process details
        filter_resp_2 = requests.get(filter_url, headers=headers, timeout=TIMEOUT)
        assert filter_resp_2.status_code == 200, f"Filter processes second call failed: {filter_resp_2.text}"
        filtered_processes = filter_resp_2.json()
        filtered_process = next((p for p in filtered_processes if (p.get("id") == process_id or p.get("processId") == process_id)), None)
        assert filtered_process, "Filtered process with recorded payments not found"
        updates = filtered_process.get("updates") or filtered_process.get("processUpdates") or []
        payments = [u.get("payment") for u in updates if u.get("payment")]
        payment_types = [p.get("type") for p in payments if p]
        assert "income" in payment_types, "Income payment not found in process updates"
        assert "expense" in payment_types, "Expense payment not found in process updates"

    finally:
        # No resource created that requires deletion explicitly in this test.
        pass

test_recordpaymentendpoint()
