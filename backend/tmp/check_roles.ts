
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, tenantId: true }
  });
  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));

  const channels = await prisma.chatChannel.findMany({
    include: { _count: { select: { messages: true } } }
  });
  console.log('--- CHANNELS ---');
  console.log(JSON.stringify(channels, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
