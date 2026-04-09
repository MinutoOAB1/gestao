import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:82Eqvyqvv.%40%23@db.ngsuvpqxyrnpatuquppl.supabase.co:5432/postgres"
        }
    }
});

async function checkOrReset() {
    const email = 'usoaleatorio.2323@gmail.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("USER_NOT_FOUND");
        return;
    }
    console.log("USER_FOUND");
    console.log("Hash:", user.password);

    const targetHash = '$2b$10$7pRXagGH9PLcL/9w.SHHjucWQisYYnvxLN1AnbMvacgF7/j9mAhaOC';

    if (user.password !== targetHash) {
        user = await prisma.user.update({
            where: { email },
            data: { password: targetHash }
        });
        console.log("PASSWORD_UPDATED_TO_PASSWORD123");
    } else {
        console.log("PASSWORD_ALREADY_PASSWORD123");
    }
}

checkOrReset()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
