import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    VIEW = 'VIEW',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    EXPORT = 'EXPORT',
}

export interface AuditLogEntry {
    action: AuditAction;
    entityType: string; // 'FinancialRecord', 'Process', 'Client', 'User', etc.
    entityId?: string;
    userId: string;
    userName?: string;
    tenantId: string;
    details?: Record<string, any>;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditLogService {
    constructor(private prisma: PrismaService) { }

    async log(entry: AuditLogEntry): Promise<void> {
        try {
            await this.prisma.auditLog.create({
                data: {
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    userId: entry.userId,
                    userName: entry.userName,
                    tenantId: entry.tenantId,
                    details: entry.details ? JSON.stringify(entry.details) : null,
                    oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
                    newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent,
                },
            });
        } catch (error) {
            // Log to console but don't throw - audit logging should never break app flow
            console.error('Failed to create audit log:', error);
        }
    }

    async getLogsForEntity(
        entityType: string,
        entityId: string,
        tenantId: string,
    ) {
        return this.prisma.auditLog.findMany({
            where: {
                entityType,
                entityId,
                tenantId,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async getLogsForUser(userId: string, tenantId: string) {
        return this.prisma.auditLog.findMany({
            where: {
                userId,
                tenantId,
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async getRecentLogs(tenantId: string, limit = 50) {
        return this.prisma.auditLog.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async searchLogs(
        tenantId: string,
        filters: {
            action?: AuditAction;
            entityType?: string;
            userId?: string;
            startDate?: Date;
            endDate?: Date;
        },
    ) {
        return this.prisma.auditLog.findMany({
            where: {
                tenantId,
                ...(filters.action && { action: filters.action }),
                ...(filters.entityType && { entityType: filters.entityType }),
                ...(filters.userId && { userId: filters.userId }),
                ...(filters.startDate || filters.endDate
                    ? {
                        createdAt: {
                            ...(filters.startDate && { gte: filters.startDate }),
                            ...(filters.endDate && { lte: filters.endDate }),
                        },
                    }
                    : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
}
