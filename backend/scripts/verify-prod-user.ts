import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@escritorio.com';
  const newPassword = 'password123';
  
  console.log(`Checking user: ${email} in Production Database...`);
  
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    console.error('USER NOT FOUND IN PRODUCTION DB!');
    return;
  }
  
  console.log('User found! Checking password hash...');
  
  const isCorrect = await bcrypt.compare(newPassword, user.password);
  console.log(`Is password "${newPassword}" correct for current hash? ${isCorrect}`);
  
  if (!isCorrect) {
    console.log(`Updating password to "${newPassword}" for user ${email}...`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    console.log('Password updated successfully!');
  } else {
    console.log('Password is already correct.');
  }
}

main()
  .catch(e => {
    console.error('Error verifying user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
