const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'informacoesextras.01@gmail.com';
  console.log(`Resetting plan for user: ${email}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true }
  });

  if (!user) {
    console.error('User not found');
    return;
  }

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      plan: 'FREE',
      stripeSubscriptionId: null,
      subscriptionStatus: null
    }
  });

  console.log('Successfully reset tenant plan to FREE');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
