require('dotenv').config({ path: 'backend/.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@escritorio.com' }
    });
    console.log('User found:', !!user);
    if (user) {
      const match = await bcrypt.compare('vamosvencer123', user.password);
      console.log('Password match:', match);
      if (!match) {
         console.log('Actual hash in DB:', user.password);
      }
    } else {
      console.log('Users in DB:');
      const allUsers = await prisma.user.findMany({ select: { email: true }});
      console.log(allUsers);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
