-- ==========================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ==========================================
-- Script to enable RLS on all tables and ensure data isolation.

-- Function to enable RLS and create isolation policy for a table
CREATE OR REPLACE FUNCTION setup_tenant_isolation(target_table text) RETURNS void AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', target_table);
    
    -- Drop existing policy if exists
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', target_table);
    
    -- Create the policy (using text comparison for maximum compatibility)
    EXECUTE format('
        CREATE POLICY tenant_isolation_policy ON %I
        USING (
            "tenantId"::text = current_setting(''app.current_tenant_id'', true)
            OR 
            current_setting(''app.bypass_rls'', true) = ''on''
        )', target_table);
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have a tenantId column
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'tenantId' 
        AND table_schema = 'public'
    LOOP
        PERFORM setup_tenant_isolation(t);
    END LOOP;
END $$;

-- Special Case: Tenant table
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_own_isolation_policy ON "Tenant";
CREATE POLICY tenant_own_isolation_policy ON "Tenant"
USING (
    "id"::text = current_setting('app.current_tenant_id', true)
    OR 
    current_setting('app.bypass_rls', true) = 'on'
);
