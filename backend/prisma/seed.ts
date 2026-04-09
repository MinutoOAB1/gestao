import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create default tenant for development
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'dev-tenant' },
        update: {},
        create: {
            id: 'dev-tenant-001',
            name: 'Development Tenant',
            slug: 'dev-tenant',
        },
    });

    console.log('Created tenant:', tenant);

    // Create a default admin user if doesn't exist
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@escritorio.com' },
        update: {},
        create: {
            email: 'admin@escritorio.com',
            password: '$2b$10$7pRXagGH9PLcL/9w.SHHjucWQisYYnvxLN1AnbMvacgF7/j9mAhaOC', // password: 'password123'
            name: 'Administrador',
            role: 'ADMIN',
            tenantId: tenant.id,
        },
    });

    console.log('Created admin user:', adminUser);
    console.log('Seed completed - no mock data added. Create your own data through the app!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
