import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../supabase/storage.service';

@Injectable()
export class SettingsService {
    constructor(
        private prisma: PrismaService,
        private storageService: StorageService,
    ) { }

    async upsert(settings: any, tenantId: string) {

        // Clean up settings object to match schema (remove extra fields if any)
        // We assume the DTO passed checks, but for safety we pick fields.
        // Actually, prisma will throw if unknown fields are passed, so we should map carefully or trust the frontend matches schema.
        // Given the simple schema, we can try passing the object but ensuring tenantId is correct.

        const {
            officeName, cnpj, email, website, language, timezone, dateFormat,
            emailNotifications, processUpdates, deadlineReminders,
            twoFactor, loginAlerts, logoUrl
        } = settings;

        return this.prisma.tenantSettings.upsert({
            where: {
                tenantId: tenantId
            },
            update: {
                officeName, cnpj, email, website, language, timezone, dateFormat,
                emailNotifications, processUpdates, deadlineReminders,
                twoFactor, loginAlerts, logoUrl
            },
            create: {
                tenantId,
                officeName, cnpj, email, website, language, timezone, dateFormat,
                emailNotifications, processUpdates, deadlineReminders,
                twoFactor, loginAlerts, logoUrl
            }
        });
    }

    async findOne(tenantId: string) {
        return this.prisma.tenantSettings.findUnique({
            where: {
                tenantId: tenantId
            }
        });
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
