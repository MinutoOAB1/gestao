import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const records = await prisma.financialRecord.findMany({
        where: {
            description: { contains: 'Honorários' },
            isRecurring: true
        },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            description: true,
            currentInstallment: true,
            amount: true,
            createdAt: true
        }
    });

    fs.writeFileSync('db_records.json', JSON.stringify(records, null, 2));
    console.log('Saved to db_records.json');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
