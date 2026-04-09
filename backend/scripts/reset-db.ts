import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function reset() {
    console.log('🚀 Iniciando reset total de dados...');

    try {
        console.log('--- Limpando todas as tabelas via TRUNCATE CASCADE ---');

        // Lista de todas as tabelas em ordem de dependência ou apenas CASCADE
        const tables = [
            'PartnershipTransaction', 'Partnership', 'FinancialRecord',
            'ProcessComment', 'ProcessNote', 'ProcessUpdate', 'ProcessChecklistItem', 'ProcessChecklist',
            'TimeEntry', 'EventAssignee', 'Event', 'ChatMessage', 'ChatChannel', 'Process',
            'Contract', 'ClientTag', 'ClientNote', 'Client',
            'DocumentAuditLog', 'Document', 'Folder',
            'AiAnalysisLog', 'LoginHistory', 'Notification', 'AuditLog', 'UserFile',
            'DirectMessage', 'Template', 'User', 'TenantSettings', 'Tenant'
        ];

        for (const table of tables) {
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
            } catch (e: any) { // Explicitly type 'e' as 'any' or 'Error'
                // Silently ignore if table doesn't exist or other minor issues
                console.log(`⚠️  Aviso ao limpar ${table}: ${e.message}`);
            }
        }

        console.log('✅ Todos os dados foram removidos com sucesso.');

        // Re-seeding Admin Base
        console.log('🌱 Criando usuário administrador padrão...');

        const tenant = await prisma.tenant.create({
            data: {
                id: 'dev-tenant-001',
                name: 'Escritório Padrão',
                slug: 'dev-tenant',
            },
        });

        const hashedPassword = await bcrypt.hash('password123', 10);

        await prisma.user.create({
            data: {
                email: 'admin@escritorio.com',
                password: hashedPassword,
                name: 'Administrador',
                role: 'ADMIN',
                tenantId: tenant.id,
            },
        });

        await prisma.tenantSettings.create({
            data: {
                officeName: 'Meu Escritório',
                tenantId: tenant.id,
            },
        });

        console.log('✨ Reset concluído! Logins: admin@escritorio.com / password123');

    } catch (error) {
        console.error('❌ Erro durante o reset:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reset();
