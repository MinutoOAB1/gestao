import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = 'dev-tenant-001';
    
    // Check if user exists for assignees, else get the first one
    const user = await prisma.user.findFirst({ where: { tenantId } });
    if (!user) {
        console.error("No user found for tenant.");
        return;
    }

    // Insert 15 processes over the last 7 days
    for (let i = 0; i < 15; i++) {
        const daysAgo = Math.floor(Math.random() * 7); // 0 to 6 days ago
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        await prisma.process.create({
            data: {
                number: '000' + i + '-2026.8.19.0001',
                title: 'Processo Seeding ' + i,
                tenantId,
                createdAt,
                deadline: createdAt // Just some random deadline in the same timeframe
            }
        });
    }
    
    // Insert 10 completed events over the last 7 days
    for (let i = 0; i < 10; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const updatedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        await prisma.event.create({
            data: {
                title: 'Tarefa Concluída ' + i,
                type: 'TASK',
                start: updatedAt,
                end: updatedAt,
                tenantId,
                completed: true,
                updatedAt
            }
        });
    }

    // Insert 10 closed contracts with different areas
    const areas = ['Cível', 'Trabalhista', 'Empresarial', 'Família'];
    for (let i = 0; i < 10; i++) {
        const area = areas[Math.floor(Math.random() * areas.length)];
        
        await prisma.contract.create({
            data: {
                number: 'CNT-SEED-' + i,
                title: 'Contrato ' + area + ' ' + i,
                status: 'CLOSED',
                value: 5000 + i * 100,
                area,
                tenantId
            }
        });
    }

    console.log("Mock data inserted successfully!");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
