
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  const prisma = new PrismaClient();
  const dataPath = path.join(__dirname, '..', 'migration-data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('Migration data file not found!');
    return;
  }

  // Handle potential UTF-16 encoding from PowerShell redirection
  let rawData = fs.readFileSync(dataPath, 'utf8');
  if (rawData.startsWith('\uFEFF')) {
    rawData = rawData.substring(1);
  }
  
  const data = JSON.parse(rawData);
  console.log(`Found ${data.tenants.length} tenants and ${data.users.length} users to migrate.`);

  for (const tenant of data.tenants) {
    console.log(`Migrating tenant: ${tenant.name} (${tenant.id})`);
    try {
      await prisma.tenant.upsert({
        where: { id: tenant.id },
        update: {},
        create: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          createdAt: new Date(tenant.createdAt),
          updatedAt: new Date(tenant.updatedAt),
          storageQuotaGb: tenant.storageQuotaGb || 30,
        }
      });
    } catch (err) {
      console.error(`Failed to migrate tenant ${tenant.id}:`, err.message);
    }
  }

  for (const user of data.users) {
    console.log(`Migrating user: ${user.email} (${user.id})`);
    try {
      // Clean up fields that might not match exactly or need conversion
      const userData = { ...user };
      delete userData.id; // Let prisma handle it if we want, or keep it.
      
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          password: user.password, // Keep the same hashed password
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
        create: {
          id: user.id,
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          avatar: user.avatar,
          phone: user.phone,
          mobile: user.mobile,
          address: user.address,
        }
      });
      console.log(`User ${user.email} migrated successfully.`);
    } catch (err) {
      console.error(`Failed to migrate user ${user.email}:`, err.message);
    }
  }

  console.log('Migration complete!');
  await prisma.$disconnect();
}

migrate().catch(console.error);
