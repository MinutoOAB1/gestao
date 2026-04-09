
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://postgres:82Eqvyqvv.%40%23@db.ngsuvpqxyrnpatuquppl.supabase.co:5432/postgres"
            }
        }
    });

    const report: any = {
        publicUsers: [],
        authUsers: [],
        error: null
    };

    try {
        report.publicUsers = await prisma.user.findMany({
            select: {
                email: true,
                name: true,
                role: true
            }
        });

        try {
            report.authUsers = await prisma.$queryRawUnsafe(`SELECT email, id, last_sign_in_at FROM auth.users`);
        } catch (e) {
            report.error = `Auth query failed: ${e.message}`;
        }
    } catch (error) {
        report.error = `Prisma query failed: ${error.message}`;
    } finally {
        console.log('START_REPORT');
        console.log(JSON.stringify(report, null, 2));
        console.log('END_REPORT');
        await prisma.$disconnect();
    }
}

main();
