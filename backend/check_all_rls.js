const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rlsTables = await prisma.$queryRaw`
      SELECT 
        tablename, 
        rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND rowsecurity = true;
    `;
    console.log('--- TABLES WITH RLS ENABLED ---');
    console.log(JSON.stringify(rlsTables, null, 2));

  } catch (error) {
    console.error('Error checking RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
