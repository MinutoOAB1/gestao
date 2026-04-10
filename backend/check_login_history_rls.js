const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const policies = await prisma.$queryRaw`
      SELECT * FROM pg_policies WHERE tablename = 'LoginHistory';
    `;
    console.log('--- POLICIES FOR LoginHistory TABLE ---');
    console.log(JSON.stringify(policies, null, 2));

  } catch (error) {
    console.error('Error fetching policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
