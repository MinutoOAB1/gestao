import { Injectable } from '@nestjs/common';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { UpdateFinancialDto } from './dto/update-financial.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService, AuditAction } from '../audit/audit-log.service';
import { PartnershipsService } from '../partnerships/partnerships.service';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class FinancialService {
    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
        private partnershipsService: PartnershipsService,
        private notificationsGateway: NotificationsGateway
    ) { }

    // --- Aggregation Helpers ---

    async getTotalsByType(tenantId: string) {
        const stats = await this.prisma.financialRecord.groupBy({
            by: ['type'],
            where: { tenantId },
            _sum: { amount: true },
            _count: { _all: true }
        });

        const income = stats.find(s => s.type === 'INCOME')?._sum.amount || 0;
        const expense = stats.find(s => s.type === 'EXPENSE')?._sum.amount || 0;
        const count = stats.reduce((acc, current) => acc + current._count._all, 0);

        return { income, expense, count };
    }

    async getTotalsByTypeAndStatus(tenantId: string, status: string) {
        const stats = await this.prisma.financialRecord.groupBy({
            by: ['type'],
            where: { tenantId, status },
            _sum: { amount: true }
        });

        const income = stats.find(s => s.type === 'INCOME')?._sum.amount || 0;
        const expense = stats.find(s => s.type === 'EXPENSE')?._sum.amount || 0;

        return { income, expense };
    }

    async countByStatus(tenantId: string, type: string, status: string) {
        return this.prisma.financialRecord.count({
            where: { tenantId, type, status }
        });
    }

    async getDueTodayStats(tenantId: string) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const stats = await this.prisma.financialRecord.aggregate({
            where: {
                tenantId,
                status: 'PENDING',
                type: 'EXPENSE',
                date: { gte: todayStart, lte: todayEnd }
            },
            _sum: { amount: true },
            _count: { _all: true }
        });

        return {
            amount: stats._sum.amount || 0,
            count: stats._count._all
        };
    }

    // --- CRUD ---

    async create(createFinancialDto: CreateFinancialDto, tenantId: string, userId?: string, userName?: string) {
        let baseDate: Date;

        if (createFinancialDto.date) {
            // Parse YYYY-MM-DD manually to avoid UTC shift
            const [year, month, day] = createFinancialDto.date.split('-').map(Number);
            baseDate = new Date(year, month - 1, day, 12, 0, 0);
        } else {
            baseDate = new Date();
            baseDate.setHours(12, 0, 0, 0);
        }

        // Handle recurring payments - create all installments
        if (createFinancialDto.recurrenceType &&
            createFinancialDto.recurrenceType !== 'UNICA' &&
            createFinancialDto.totalInstallments &&
            createFinancialDto.totalInstallments > 1) {

            const installments = createFinancialDto.totalInstallments;
            const records: any[] = [];

            // Create parent record (first installment)
            const parentRecord = await this.prisma.financialRecord.create({
                data: {
                    type: createFinancialDto.type,
                    category: createFinancialDto.category,
                    amount: createFinancialDto.amount,
                    description: createFinancialDto.description,
                    date: baseDate,
                    status: createFinancialDto.status || 'PENDING',
                    clientId: createFinancialDto.clientId || null,
                    isRecurring: true,
                    recurrenceType: createFinancialDto.recurrenceType,
                    totalInstallments: installments,
                    currentInstallment: 1,
                    isUrgent: createFinancialDto.isUrgent || false,
                    notes: createFinancialDto.notes || null,
                    tenantId,
                } as any,
            });
            records.push(parentRecord);

            // Create remaining installments
            for (let i = 2; i <= installments; i++) {
                const installmentDate = new Date(baseDate);

                if (createFinancialDto.recurrenceType === 'MENSAL') {
                    installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
                } else if (createFinancialDto.recurrenceType === 'ANUAL') {
                    installmentDate.setFullYear(installmentDate.getFullYear() + (i - 1));
                } else {
                    // PERSONALIZADO - default to monthly
                    installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
                }

                const installmentRecord = await this.prisma.financialRecord.create({
                    data: {
                        type: createFinancialDto.type,
                        category: createFinancialDto.category,
                        amount: createFinancialDto.amount,
                        description: createFinancialDto.description,
                        date: installmentDate,
                        status: 'PENDING',
                        clientId: createFinancialDto.clientId || null,
                        isRecurring: true,
                        recurrenceType: createFinancialDto.recurrenceType,
                        totalInstallments: installments,
                        currentInstallment: i,
                        parentRecordId: parentRecord.id,
                        isUrgent: createFinancialDto.isUrgent || false,
                        notes: createFinancialDto.notes || null,
                        tenantId,
                    } as any,
                });
                records.push(installmentRecord);
            }

            // Create specific split for all installments
            if (createFinancialDto.type === 'INCOME' && createFinancialDto.partnerId) {
                for (const rec of records) {
                    await this.partnershipsService.handleSpecificSplit(
                        rec.id,
                        rec.amount,
                        tenantId,
                        rec.description,
                        createFinancialDto.partnerId,
                        createFinancialDto.partnerPercentage
                    );
                }
            }

            return records;
        }

        // Single payment (UNICA) or no recurrence
        const record = await this.prisma.financialRecord.create({
            data: {
                type: createFinancialDto.type,
                category: createFinancialDto.category,
                amount: createFinancialDto.amount,
                description: createFinancialDto.description,
                date: baseDate,
                status: createFinancialDto.status || 'PENDING',
                clientId: createFinancialDto.clientId || null,
                isRecurring: false,
                recurrenceType: 'UNICA',
                totalInstallments: 1,
                currentInstallment: 1,
                isUrgent: createFinancialDto.isUrgent || false,
                notes: createFinancialDto.notes || null,
                tenantId,
            } as any,
        });

        // Audit log
        if (userId) {
            await this.auditLogService.log({
                action: AuditAction.CREATE,
                entityType: 'FinancialRecord',
                entityId: record.id,
                userId,
                userName,
                tenantId,
                newValues: {
                    type: record.type,
                    amount: record.amount,
                    description: record.description,
                    category: record.category,
                },
            }).catch(() => { }); // Don't fail if audit fails
        }

        // Create specific split if it's an income and partner is provided
        if (record.type === 'INCOME') {
            await this.partnershipsService.handleSpecificSplit(
                record.id,
                record.amount,
                tenantId,
                record.description,
                createFinancialDto.partnerId,
                createFinancialDto.partnerPercentage
            );
        }

        return record;
    }

    async findAll(tenantId: string, take = 50, skip = 0) {
        const records = await this.prisma.financialRecord.findMany({
            where: { tenantId },
            orderBy: { date: 'desc' },
            include: { 
                client: true,
                invoices: true 
            },
            take,
            skip,
        });

        // Parallel fetch splits to embed in records
        const splits = await this.prisma.partnershipTransaction.findMany({
            where: {
                tenantId,
                financialRecordId: { in: records.map(r => r.id) }
            },
            select: { financialRecordId: true, partnerId: true, amount: true }
        });

        const splitMap = new Map<string, any>(splits.map(s => [s.financialRecordId as string, s]));

        return records.map(record => {
            const split = splitMap.get(record.id);
            if (split && record.amount > 0) {
                return {
                    ...record,
                    partnerId: split.partnerId,
                    partnerPercentage: (split.amount / record.amount) * 100
                } as any;
            }
            return record;
        });
    }

    findOne(id: string, tenantId: string) {
        return this.prisma.financialRecord.findFirst({
            where: { id, tenantId },
            include: { client: true },
        });
    }

    // Get urgent payments
    async findUrgent(tenantId: string) {
        return this.prisma.financialRecord.findMany({
            where: {
                tenantId,
                isUrgent: true,
                status: 'PENDING',
            } as any,
            orderBy: { date: 'asc' },
            include: { client: true },
        });
    }

    // Get upcoming payments (next 7 days)
    async findUpcoming(tenantId: string) {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        return this.prisma.financialRecord.findMany({
            where: {
                tenantId,
                status: 'PENDING',
                date: {
                    gte: today,
                    lte: nextWeek,
                },
            },
            orderBy: { date: 'asc' },
            include: { client: true },
        });
    }

    // Get overdue payments
    async findOverdue(tenantId: string) {
        const today = new Date();

        return this.prisma.financialRecord.findMany({
            where: {
                tenantId,
                status: 'PENDING',
                date: {
                    lt: today,
                },
            },
            orderBy: { date: 'asc' },
            include: { client: true },
        });
    }

    async update(id: string, updateFinancialDto: UpdateFinancialDto, tenantId: string, userId?: string, userName?: string) {
        // Verify tenant ownership and get old values for audit
        const oldRecord = await this.prisma.financialRecord.findFirst({ where: { id, tenantId } });
        if (!oldRecord) {
            throw new Error('Registro financeiro não encontrado');
        }

        const data: any = { ...updateFinancialDto };
        if (data.date && typeof data.date === 'string') {
            const [year, month, day] = data.date.split('-').map(Number);
            data.date = new Date(year, month - 1, day, 12, 0, 0);
        } else if (data.date) {
            data.date = new Date(data.date);
            data.date.setHours(12, 0, 0, 0);
        }
        // Sanitize empty strings to null
        for (const key of Object.keys(data)) {
            if (data[key] === '') {
                data[key] = null;
            }
        }
        // Ensure amount is a number
        if (data.amount !== undefined && data.amount !== null) {
            data.amount = parseFloat(data.amount);
        }

        const { partnerId, partnerPercentage, ...prismaData } = data;

        const newRecord = await this.prisma.financialRecord.update({
            where: { id },
            data: prismaData,
        });

        // Audit log
        if (userId && oldRecord) {
            await this.auditLogService.log({
                action: AuditAction.UPDATE,
                entityType: 'FinancialRecord',
                entityId: id,
                userId,
                userName,
                tenantId,
                oldValues: {
                    type: oldRecord.type,
                    amount: oldRecord.amount,
                    description: oldRecord.description,
                    status: oldRecord.status,
                },
                newValues: {
                    type: newRecord.type,
                    amount: newRecord.amount,
                    description: newRecord.description,
                    status: newRecord.status,
                },
            }).catch(() => { }); // Don't fail if audit fails
        }

        // Handle Split Update
        if (newRecord.type === 'INCOME') {
            await this.partnershipsService.handleSpecificSplit(
                newRecord.id,
                newRecord.amount,
                tenantId,
                newRecord.description,
                updateFinancialDto.partnerId,
                updateFinancialDto.partnerPercentage
            );
        }

        return newRecord;
    }

    async remove(id: string, tenantId: string, userId?: string, userName?: string) {
        // Verify tenant ownership and get record for audit before deleting
        const record = await this.prisma.financialRecord.findFirst({ where: { id, tenantId } });
        if (!record) {
            throw new Error('Registro financeiro não encontrado');
        }

        const deleted = await this.prisma.financialRecord.delete({
            where: { id },
        });

        // Audit log
        if (userId && record) {
            await this.auditLogService.log({
                action: AuditAction.DELETE,
                entityType: 'FinancialRecord',
                entityId: id,
                userId,
                userName,
                tenantId,
                oldValues: {
                    type: record.type,
                    amount: record.amount,
                    description: record.description,
                },
            }).catch(() => { }); // Don't fail if audit fails
        }

        return deleted;
    }

    @OnEvent('process.won')
    async handleProcessWon(payload: any) {
        const { processId, tenantId, title, value, clientId } = payload;
        
        // Crio a fatura automaticamente (assumindo honorários de 30%)
        if (value && value > 0) {
            try {
                const record = await this.prisma.financialRecord.create({
                    data: {
                        type: 'INCOME',
                        category: 'HONORARIOS_SUCESSO',
                        amount: value * 0.3,
                        description: `Honorários de Sucesso automático - Processo: ${title}`,
                        date: new Date(),
                        status: 'PENDING',
                        clientId: clientId || null,
                        isRecurring: false,
                        recurrenceType: 'UNICA',
                        totalInstallments: 1,
                        currentInstallment: 1,
                        isUrgent: true,
                        notes: `Fatura gerada automaticamente via evento do ecossistema porque o processo foi marcado como ganho.`,
                        tenantId,
                    } as any,
                });
                
                // Real-time flash notification for everyone in the tenant
                this.notificationsGateway.sendToTenant(tenantId, {
                    type: 'FINANCIAL',
                    title: 'Fatura de Êxito Gerada! 💰',
                    message: `Honorários automáticos (${(value * 0.3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) do processo ${title}.`,
                    entityType: 'FINANCIAL',
                    entityId: record.id
                });
                
                console.log(`[Event Ecosystem] Fatura de sucesso (30%) criada para o processo ${processId}`);
            } catch (err) {
                console.error(`[Event Ecosystem Error] Falha ao auto-criar fatura para processo ${processId}:`, err);
            }
        }
    }
}
