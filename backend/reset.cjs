const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:82Eqvyqvv.%40%23@db.ngsuvpqxyrnpatuquppl.supabase.co:5432/postgres'
    }
  }
});

async function main() {
  const email = 'usoaleatorio.2323@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('USER_NOT_FOUND');
    return;
  }
  
  const pw = 'password123';
  const match = await bcrypt.compare(pw, user.password);
  console.log('Current Match (password123):', match);
  
  if (!match) {
    console.log('Forcing hash update to bcrypt(password123)...');
    const hashed = await bcrypt.hash(pw, 10);
    const updated = await prisma.user.update({
      where: { email },
      data: { password: hashed }
    });
    console.log('Updated! Hash in DB is now:', updated.password);
  } else {
    console.log('Password is already password123. The hash in DB is:', user.password);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
