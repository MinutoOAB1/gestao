import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Parent records of Honorários
    const parentRecords = await prisma.financialRecord.findMany({
        where: {
            description: { contains: 'Honorários' },
            isRecurring: true,
            currentInstallment: 1
        },
        orderBy: { createdAt: 'desc' },
        take: 2
    });

    if (parentRecords.length === 2) {
        // The most recently created one is the duplicate (created 2.7s after)
        const duplicateParent = parentRecords[0]; // descending order

        console.log('Deleting duplicate parent:', duplicateParent.id);

        // Delete the duplicate parent (and cascade its children if configured, 
        // else delete children manually)
        const deletedChildren = await prisma.financialRecord.deleteMany({
            where: {
                parentRecordId: duplicateParent.id
            }
        });
        console.log(`Deleted ${deletedChildren.count} children`);

        const deletedParent = await prisma.financialRecord.delete({
            where: { id: duplicateParent.id }
        });
        console.log(`Deleted parent ${deletedParent.id}`);
    } else {
        console.log('No duplicates found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
