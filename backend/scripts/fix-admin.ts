import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function main() {
    const prisma = new PrismaClient();
    const email = 'admin@escritorio.com';
    const password = 'password123';

    try {
        console.log('Checking database state...');

        // 1. Ensure Tenant exists
        let tenant = await prisma.tenant.findUnique({
            where: { slug: 'dev-tenant' }
        });

        if (!tenant) {
            console.log('Creating dev-tenant...');
            tenant = await prisma.tenant.create({
                data: {
                    id: 'dev-tenant-001',
                    name: 'Development Tenant',
                    slug: 'dev-tenant',
                }
            });
        }
        console.log('Tenant ID:', tenant.id);

        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('New hash generated:', hashedPassword);

        // 3. Upsert User
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                tenantId: tenant.id,
                role: 'ADMIN',
                twoFactorEnabled: false,
                twoFactorSecret: null,
            },
            create: {
                email,
                password: hashedPassword,
                name: 'Administrador',
                role: 'ADMIN',
                tenantId: tenant.id,
                twoFactorEnabled: false,
            },
        });

        console.log('User fixed:', {
            id: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role
        });

        console.log('SUCCESS: Admin user credentials have been reset.');
    } catch (error) {
        console.error('ERROR fixing admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
