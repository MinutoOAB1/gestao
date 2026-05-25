import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../supabase/storage.service';
import { SecurityService } from '../common/security/security.service';

@Injectable()
export class SettingsService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
        private security: SecurityService,
    ) { }

    async upsert(settings: any, tenantId: string) {

        // Clean up settings object to match schema (remove extra fields if any)
        // We assume the DTO passed checks, but for safety we pick fields.
        // Actually, prisma will throw if unknown fields are passed, so we should map carefully or trust the frontend matches schema.
        // Given the simple schema, we can try passing the object but ensuring tenantId is correct.

        const {
            officeName, cnpj, email, website, language, timezone, dateFormat,
            emailNotifications, processUpdates, deadlineReminders,
            twoFactor, loginAlerts, logoUrl, asaasApiKey, autentiqueApiKey,
            kanbanColumns, docKanbanTitles
        } = settings;

        // Encrypt sensitive API keys if provided
        const encryptedAsaasKey = asaasApiKey ? this.security.encrypt(asaasApiKey) : undefined;
        const encryptedAutentiqueKey = autentiqueApiKey ? this.security.encrypt(autentiqueApiKey) : undefined;

        return this.prisma.tenantSettings.upsert({
            where: {
                tenantId: tenantId
            },
            update: {
                officeName, cnpj, email, website, language, timezone, dateFormat,
                emailNotifications, processUpdates, deadlineReminders,
                twoFactor, loginAlerts, logoUrl,
                kanbanColumns, docKanbanTitles,
                ...(encryptedAsaasKey && { asaasApiKey: encryptedAsaasKey }),
                ...(encryptedAutentiqueKey && { autentiqueApiKey: encryptedAutentiqueKey }),
            },
            create: {
                tenantId,
                officeName, cnpj, email, website, language, timezone, dateFormat,
                emailNotifications, processUpdates, deadlineReminders,
                twoFactor, loginAlerts, logoUrl,
                kanbanColumns, docKanbanTitles,
                asaasApiKey: encryptedAsaasKey,
                autentiqueApiKey: encryptedAutentiqueKey,
            }
        });
    }

    async updateKanbanColumns(kanbanColumns: string, tenantId: string) {
        return this.prisma.tenantSettings.upsert({
            where: { tenantId },
            update: { kanbanColumns },
            create: { tenantId, kanbanColumns }
        });
    }

    async updateDocKanbanTitles(docKanbanTitles: string, tenantId: string) {
        return this.prisma.tenantSettings.upsert({
            where: { tenantId },
            update: { docKanbanTitles },
            create: { tenantId, docKanbanTitles }
        });
    }

    async findOne(tenantId: string) {
        const settings = await this.prisma.tenantSettings.findUnique({
            where: {
                tenantId: tenantId
            }
        });

        if (settings) {
            // Decrypt API keys for frontend
            if (settings.asaasApiKey) settings.asaasApiKey = this.security.decrypt(settings.asaasApiKey);
            if (settings.autentiqueApiKey) settings.autentiqueApiKey = this.security.decrypt(settings.autentiqueApiKey);
        }

        return settings;
    }

    // Get storage info for the tenant/account (real data)
    async getStorageInfo(tenantId: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        }) as any;

        if (!tenant) {
            throw new NotFoundException('Conta não encontrada');
        }

        const quotaGb = tenant.storageQuotaGb || 30;
        const usedMb = tenant.usedStorageMb || 0;
        const quotaMb = quotaGb * 1024;
        const usedGb = parseFloat((usedMb / 1024).toFixed(2));
        const freeMb = Math.max(0, quotaMb - usedMb);
        const freeGb = parseFloat((freeMb / 1024).toFixed(2));
        const percentUsed = quotaMb > 0 ? Math.round((usedMb / quotaMb) * 100) : 0;

        return {
            tenantId: tenant.id,
            tenantName: tenant.name,
            quotaGb,
            quotaMb,
            usedMb,
            usedGb,
            freeMb,
            freeGb,
            percentUsed,
        };
    }
}
