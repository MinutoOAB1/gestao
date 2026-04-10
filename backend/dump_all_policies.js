const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const allPolicies = await prisma.$queryRaw`
      SELECT 
        schemaname, 
        tablename, 
        policyname, 
        permissive, 
        roles, 
        cmd, 
        qual, 
        with_check 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    console.log('--- ALL RLS POLICIES ---');
    console.log(JSON.stringify(allPolicies, null, 2));

  } catch (error) {
    console.error('Error fetching policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
