import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFeeSplit() {
    console.log('--- Iniciando Teste de Fee Splitting ---');

    // 1. Get a test tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        console.log('Nenhum tenant encontrado.');
        return;
    }
    const tenantId = tenant.id;
    console.log(`Usando Tenant ID: ${tenantId}`);

    // 2. Create a test partner with 15% commission
    const partner = await prisma.partnership.create({
        data: {
            tenantId,
            name: 'Teste Parceiro (Automated)',
            initials: 'TP',
            type: 'CÍVEL',
            percentage: 15, // 15% commission
            status: 'ACTIVE',
        }
    });
    console.log(`Parceiro criado com 15% de comissão: ${partner.id}`);

    // 3. Create a financial income of 10,000
    // The nestjs service would normally call calculateSplits internally. Let's simulate the service call by requiring the module, or just query if we can trigger the HTTP endpoint.
    // Wait, since we are outside NestJS context, the Prisma hook won't trigger the service unless the service is called.
    // We can just call localhost:3000 API directly!
    console.log('Criando Transacao via API...');
    try {
        const response = await fetch('http://localhost:3000/api/financial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We need tenantId header if auth guard requires it. 
                // Wait, auth guard might require JWT. This is complex.
            },
            body: JSON.stringify({
                type: 'INCOME',
                category: 'Honorários',
                amount: 10000,
                description: 'Honorários Processo Teste',
                date: new Date().toISOString(),
                status: 'PENDING',
                recurrence: 'UNICA',
                installments: 1
            })
        });

        if (!response.ok) {
            console.log('API POST failed. Status:', response.status);
        } else {
            const result = await response.json();
            console.log('API Response:', result);
        }
    } catch (e) {
        console.error('Error calling API', e);
    }

    // 4. Verify Repasses directly in DB
    const repasses = await prisma.partnershipTransaction.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { partner: true }
    });

    console.log('Últimos Repasses:');
    repasses.forEach(r => {
        console.log(`- ${r.partner.name}: R$ ${r.amount} (${r.status}) - ${r.description}`);
    });

}

testFeeSplit()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
