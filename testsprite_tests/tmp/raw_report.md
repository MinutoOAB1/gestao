
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Antigravi-platadv
- **Date:** 2026-04-24
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 createclientendpoint
- **Test Code:** [TC001_createclientendpoint.py](./TC001_createclientendpoint.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/b4e15ebc-9581-45d6-809c-531e8199411f
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 viewclientprofileendpoint
- **Test Code:** [TC002_viewclientprofileendpoint.py](./TC002_viewclientprofileendpoint.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/5a19bc87-ae85-41a4-8c7c-c4d1a693c0aa
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 updateclientstatusendpoint
- **Test Code:** [TC003_updateclientstatusendpoint.py](./TC003_updateclientstatusendpoint.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 85, in <module>
  File "<string>", line 55, in test_updateclientstatusendpoint
  File "<string>", line 18, in login
AssertionError: Login failed

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/87f3fbf1-9f47-40f9-8ec9-759f4ec21d8a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 moveprocesscardendpoint
- **Test Code:** [TC004_moveprocesscardendpoint.py](./TC004_moveprocesscardendpoint.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 37, in test_moveprocesscardendpoint
AssertionError: Filter processes response is empty

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 103, in <module>
  File "<string>", line 45, in test_moveprocesscardendpoint
AssertionError: Failed to get process for testing: Filter processes response is empty

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/a41e3414-aee9-4f2c-a82a-98ab441ea6b0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 addprocessupdateendpoint
- **Test Code:** [TC005_addprocessupdateendpoint.py](./TC005_addprocessupdateendpoint.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 98, in <module>
  File "<string>", line 81, in test_addprocessupdateendpoint
AssertionError

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/40b31ce0-ca9b-4032-bbbf-9948cd360600
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 filterprocessesendpoint
- **Test Code:** [TC006_filterprocessesendpoint.py](./TC006_filterprocessesendpoint.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 73, in <module>
  File "<string>", line 42, in test_filterprocessesendpoint
AssertionError: Failed to add process update: 500, {"statusCode":500,"timestamp":"2026-04-25T00:03:53.870Z","path":"/process-updates","method":"POST","message":"Process 0d5dc3ff-363c-43dc-a8b8-75dff0386fb6 not found for tenant 8dd1a8b0-f2ab-484e-b3fb-1a7dc75f1ba4","error":"Internal Server Error","stack":"Error: Process 0d5dc3ff-363c-43dc-a8b8-75dff0386fb6 not found for tenant 8dd1a8b0-f2ab-484e-b3fb-1a7dc75f1ba4\n    at ProcessUpdatesService.create (C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\src\\process-updates\\process-updates.service.ts:16:19)\n    at async C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:46:28\n    at async C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\node_modules\\@nestjs\\core\\router\\router-proxy.js:9:17"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/be6eea45-8580-468f-8b89-a85266e1c2e9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 recordpaymentendpoint
- **Test Code:** [TC007_recordpaymentendpoint.py](./TC007_recordpaymentendpoint.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 86, in <module>
  File "<string>", line 19, in test_recordpaymentendpoint
AssertionError: Login failed: {"statusCode":400,"timestamp":"2026-04-25T00:05:19.752Z","path":"/login","method":"POST","message":"Email é obrigatório","error":"Bad Request","stack":"BadRequestException: Email é obrigatório\n    at <anonymous> (C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\src\\auth\\auth.service.ts:78:15)\n    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)\n    at TenantContextService.runWithTenant (C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\src\\prisma\\tenant-context.service.ts:14:37)\n    at AuthService.login (C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\src\\auth\\auth.service.ts:74:31)\n    at AppController.login (C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\src\\app.controller.ts:28:29)\n    at C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:38:29\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\node_modules\\@nestjs\\core\\router\\router-execution-context.js:46:28\n    at async C:\\Users\\victo\\OneDrive\\Documentos\\Antigravi-platadv\\backend\\node_modules\\@nestjs\\core\\router\\router-proxy.js:9:17"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/5ca099c8-91ca-46ae-bb08-a66ca4cfc221
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 generatefinancialstatsendpoint
- **Test Code:** [TC008_generatefinancialstatsendpoint.py](./TC008_generatefinancialstatsendpoint.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 93, in <module>
  File "<string>", line 48, in test_generatefinancialstatsendpoint
AssertionError: Adding process update failed: {"id":"fa54b8ae-5ee6-4f0d-b211-428edd52253a","date":"2026-04-25T00:06:03.629Z","description":"Consulting fee","type":"income","isImportant":false,"processId":"9148b895-d343-4ab5-abb5-a90cc974fa3c","createdBy":"Sistema","createdAt":"2026-04-25T00:06:04.080Z","updatedAt":"2026-04-25T00:06:04.080Z"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/dd718aeb-433e-4a0f-870e-4312ad101cec
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 exportpdfreportendpoint
- **Test Code:** [TC009_exportpdfreportendpoint.py](./TC009_exportpdfreportendpoint.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 65, in <module>
  File "<string>", line 29, in test_exportpdfreportendpoint
AssertionError: Processes filter did not return JSON: 

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/cd55e3cf-d389-4277-82da-45adc058ce6a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 loginendpoint
- **Test Code:** [TC010_loginendpoint.py](./TC010_loginendpoint.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 40, in <module>
  File "<string>", line 29, in test_loginendpoint
AssertionError: Tenant ID missing, multi-tenancy not enforced

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/19f9e2fe-d21d-4fb5-88af-d420f806bd73/11724153-994d-46b4-87f8-2c1f5747c0dd
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **20.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---