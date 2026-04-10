const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rlsStatus = await prisma.$queryRaw`
      SELECT 
        schemaname, 
        tablename, 
        rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'User';
    `;
    console.log('--- RLS STATUS FOR User TABLE ---');
    console.log(JSON.stringify(rlsStatus, null, 2));

    const policies = await prisma.$queryRaw`
      SELECT * FROM pg_policies WHERE tablename = 'User';
    `;
    console.log('\n--- POLICIES FOR User TABLE ---');
    console.log(JSON.stringify(policies, null, 2));

  } catch (error) {
    console.error('Error checking RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
