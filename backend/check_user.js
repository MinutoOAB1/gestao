const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:82Eqvyqvv.%40%23@db.ngsuvpqxyrnpatuquppl.supabase.co:5432/postgres'
        }
    }
});

async function main() {
    const email = 'usoaleatorio.2323@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });

    if (!user) {
        console.log('User not found by exact email match.');
        // Check if it exists with different casing or spaces
        const allUsers = await prisma.user.findMany({
            where: {
                email: { contains: 'usoaleatorio' }
            }
        });
        console.log('Users containing "usoaleatorio":', allUsers.map(u => `"${u.email}"`));
        return;
    }

    console.log('User found!');
    console.log('- ID:', user.id);
    console.log('- Email: "' + user.email + '"');
    console.log('- Role:', user.role);
    console.log('- TenantId:', user.tenantId);
    console.log('- Tenant Object:', user.tenant);
}

main().catch(console.error).finally(() => prisma.$disconnect());
