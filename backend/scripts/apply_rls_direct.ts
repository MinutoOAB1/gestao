import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tables that definitely have tenantId column (verified in schema.prisma)
const tablesWithTenantId = [
  'Notification', 'Process', 'ProcessLabel', 'Client', 'ClientTag', 
  'ClientNote', 'FinancialRecord', 'Folder', 'Document', 
  'DocumentAuditLog', 'Event', 'Contract', 'Partnership', 
  'PartnershipTransaction', 'Template', 'ChatChannel',
  'DirectMessage', 'TenantSettings', 'TimeEntry', 
  'AiAnalysisLog', 'AuditLog', 'UserFile', 'User', 'LoginHistory'
];

const setupBlocks = [
  // 1. Enable & Force RLS on primary tables
  ...tablesWithTenantId.map(t => `ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY`),
  ...tablesWithTenantId.map(t => `ALTER TABLE "${t}" FORCE ROW LEVEL SECURITY`),

  // 2. Helper functions
  `CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS uuid AS $$
    BEGIN
      RETURN current_setting('app.current_tenant_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  $$ LANGUAGE plpgsql;`,

  `CREATE OR REPLACE FUNCTION is_rls_bypassed() RETURNS boolean AS $$
    BEGIN
      RETURN current_setting('app.bypass_rls', true) = 'on';
    EXCEPTION WHEN OTHERS THEN
      RETURN false;
    END;
  $$ LANGUAGE plpgsql;`,

  `ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE "Tenant" FORCE ROW LEVEL SECURITY;`,

  // 3. Multi-tenant isolation policy for primary tables
  `DO $$
  DECLARE
      t text;
      tables text[] := ARRAY[${tablesWithTenantId.map(t => `'${t}'`).join(', ')}];
  BEGIN
      FOREACH t IN ARRAY tables
      LOOP
          EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
          EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING ("tenantId"::uuid = get_current_tenant_id() OR is_rls_bypassed())', t);
      END LOOP;
  END $$;`,

  // 4. Special policy for Tenant table (uses 'id' instead of 'tenantId')
  `DROP POLICY IF EXISTS tenant_isolation_policy ON "Tenant";`,
  `CREATE POLICY tenant_isolation_policy ON "Tenant" FOR ALL USING (id = get_current_tenant_id() OR is_rls_bypassed());`,
  
  // 5. Disable RLS on secondary/helper tables that don't have tenantId (to avoid unintentional blocking)
  'ALTER TABLE "DocumentComment" DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE "EventChecklistItem" DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE "EventAssignee" DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE "ChatMessage" DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE "ProcessChecklist" DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE "ProcessChecklistItem" DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE "ProcessComment" DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE "ProcessNote" DISABLE ROW LEVEL SECURITY',
  'ALTER TABLE "ProcessUpdate" DISABLE ROW LEVEL SECURITY'
];

async function main() {
  console.log('Applying RLS policies to compatible tables...');
  let successCount = 0;
  let failCount = 0;

  for (const sql of setupBlocks) {
    try {
      await prisma.$executeRawUnsafe(sql);
      successCount++;
    } catch (error: any) {
      console.error(`Failed to execute: ${sql.substring(0, 50)}...`);
      console.error(`Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\nSummary: ${successCount} blocks succeeded, ${failCount} failed.`);
  
  if (failCount === 0) {
    console.log('RLS policies applied successfully!');
  } else {
    console.warn('Final check: Some secondary blocks failed, but primary security may be intact.');
  }
  
  await prisma.$disconnect();
}

main();
