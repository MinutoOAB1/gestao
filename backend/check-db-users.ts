
import { PrismaClient } from '@prisma/client';

async function checkUsers() {
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
      },
      take: 5
    });
    console.log(`Total users in DB: ${userCount}`);
    console.log('Sample users:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
