import { PrismaClient } from '@prisma/client';

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

    console.log(records);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
