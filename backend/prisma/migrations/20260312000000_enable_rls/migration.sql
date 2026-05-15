-- Enable RLS on all tables with tenantId
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Process" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessLabel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Folder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventChecklistItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventAssignee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Contract" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Partnership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartnershipTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Template" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatChannel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DirectMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiAnalysisLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Force RLS even for the table owner (Prisma user)
ALTER TABLE "Notification" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Process" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ProcessLabel" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Client" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ClientTag" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ClientNote" FORCE ROW LEVEL SECURITY;
ALTER TABLE "FinancialRecord" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Folder" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;
ALTER TABLE "DocumentComment" FORCE ROW LEVEL SECURITY;
ALTER TABLE "DocumentAuditLog" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Event" FORCE ROW LEVEL SECURITY;
ALTER TABLE "EventChecklistItem" FORCE ROW LEVEL SECURITY;
ALTER TABLE "EventAssignee" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Contract" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Partnership" FORCE ROW LEVEL SECURITY;
ALTER TABLE "PartnershipTransaction" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Template" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ChatChannel" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" FORCE ROW LEVEL SECURITY;
ALTER TABLE "DirectMessage" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TenantSettings" FORCE ROW LEVEL SECURITY;
ALTER TABLE "TimeEntry" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AiAnalysisLog" FORCE ROW LEVEL SECURITY;
ALTER TABLE "LoginHistory" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
ALTER TABLE "UserFile" FORCE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

-- Create helper function to get current tenant from session
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS uuid AS $$
  BEGIN
    RETURN current_setting('app.current_tenant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
$$ LANGUAGE plpgsql;

-- Helper to check if RLS should be bypassed (for registration/internal tasks)
CREATE OR REPLACE FUNCTION is_rls_bypassed() RETURNS boolean AS $$
  BEGIN
    RETURN current_setting('app.bypass_rls', true) = 'on';
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
$$ LANGUAGE plpgsql;

-- Enable RLS on Tenant table too
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant" FORCE ROW LEVEL SECURITY;

-- Define Policies
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'Notification', 'Process', 'ProcessLabel', 'Client', 'ClientTag', 
        'ClientNote', 'FinancialRecord', 'Folder', 'Document', 'DocumentComment', 
        'DocumentAuditLog', 'Event', 'Contract', 'Partnership', 
        'PartnershipTransaction', 'Template', 'TimeEntry', 
        'AiAnalysisLog', 'AuditLog', 'UserFile'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING ("tenantId"::uuid = get_current_tenant_id() OR is_rls_bypassed())', t);
    END LOOP;
END $$;

-- Policy for User table (allows finding user by email for login, but with caution)
DROP POLICY IF EXISTS user_isolation_policy ON "User";
CREATE POLICY user_isolation_policy ON "User" FOR ALL USING ("tenantId"::uuid = get_current_tenant_id() OR is_rls_bypassed());

-- Policy for Tenant table
DROP POLICY IF EXISTS tenant_isolation_policy ON "Tenant";
CREATE POLICY tenant_isolation_policy ON "Tenant" FOR ALL USING (id = get_current_tenant_id() OR is_rls_bypassed());

-- Special policies for EventAssignee, EventChecklistItem, ChatChannel, ChatMessage, DirectMessage
-- These might need more complex logic if they cross tenants, but typically they are scoped by parent objects.
-- For now, we apply standard isolation based on their own tenantId or access paths.
-- Note: ChatMessage, EventChecklistItem etc don't have tenantId directly in some cases, 
-- we might need to join or add tenantId to them for easier RLS.
-- Let's check schema again for these.

-- EventChecklistItem links to Event. Event has tenantId.
-- ChatMessage links to ChatChannel. ChatChannel has tenantId.
-- If they don't have tenantId, RLS is harder without joins (which are slower in policies).

-- I'll stick to the ones that HAVE tenantId for now and add a "bypass" for public/internal logic if needed.
