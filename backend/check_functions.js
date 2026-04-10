const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const functions = await prisma.$queryRaw`
      SELECT 
        routine_name, 
        routine_definition 
      FROM information_schema.routines 
      WHERE routine_name IN ('get_current_tenant_id', 'is_rls_bypassed');
    `;
    console.log('--- DATABASE FUNCTIONS ---');
    console.log(JSON.stringify(functions, null, 2));

  } catch (error) {
    console.error('Error fetching functions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
