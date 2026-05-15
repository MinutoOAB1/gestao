import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function check() {
  const prisma = new PrismaClient();
  
  // List ALL users
  const allUsers = await prisma.user.findMany({
    select: { email: true, name: true, tenantId: true }
  });
  console.log('=== ALL USERS IN SUPABASE ===');
  allUsers.forEach(u => console.log(`  ${u.email} | ${u.name} | tenant: ${u.tenantId}`));
  
  // Check the specific user
  const user = await prisma.user.findUnique({
    where: { email: 'admin@escritorio.com' }
  });
  
  if (!user) {
    console.log('\n❌ User admin@escritorio.com NOT FOUND in Supabase');
  } else {
    console.log('\n✅ User found:', user.email, user.name);
    console.log('Password hash:', user.password);
    
    const passwords = ['password123', 'Password123!', 'admin123', '123456', 'admin'];
    for (const pwd of passwords) {
      const match = await bcrypt.compare(pwd, user.password);
      console.log(`  "${pwd}" => ${match ? '✅ MATCH' : '❌ no match'}`);
    }
  }
  
  await prisma.$disconnect();
}

check();
