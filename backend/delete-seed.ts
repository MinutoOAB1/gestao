import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = 'dev-tenant-001';

    // Delete seeded contracts
    const deletedContracts = await prisma.contract.deleteMany({
        where: {
            tenantId,
            number: {
                startsWith: 'CNT-SEED-'
            }
        }
    });

    // Delete seeded processes
    const deletedProcesses = await prisma.process.deleteMany({
        where: {
            tenantId,
            number: {
                endsWith: '-2026.8.19.0001'
            }
        }
    });

    // Delete seeded events
    const deletedEvents = await prisma.event.deleteMany({
        where: {
            tenantId,
            title: {
                startsWith: 'Tarefa Concluída '
            }
        }
    });

    console.log(`Deleted ${deletedContracts.count} mocked contracts.`);
    console.log(`Deleted ${deletedProcesses.count} mocked processes.`);
    console.log(`Deleted ${deletedEvents.count} mocked events.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
