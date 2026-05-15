const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = [
    'LoginHistory', 
    'Tenant', 
    'Template', 
    'ChatChannel', 
    'DirectMessage', 
    'DocumentAuditLog', 
    'TenantSettings', 
    'AiAnalysisLog', 
    'AuditLog', 
    'UserFile', 
    'ClientTag', 
    'ClientNote', 
    'PartnershipTransaction', 
    'Contract', 
    'Partnership'
  ];

  for (const table of tables) {
    try {
      console.log(`Disabling RLS for ${table}...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
      console.log(`Successfully disabled RLS for ${table}.`);
    } catch (error) {
      console.error(`Failed to disable RLS for ${table}:`, error.message);
    }
  }

  // Also ensure User table has RLS enabled (as it has a policy) but check if it's correct
  try {
    console.log('Ensuring RLS is ENABLED for User table (as it has isolation policies)...');
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;');
  } catch (error) {
    console.warn('Could not force enable RLS on User:', error.message);
  }

  await prisma.$disconnect();
}

main();
