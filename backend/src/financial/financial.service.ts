import { Injectable } from '@nestjs/common';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { UpdateFinancialDto } from './dto/update-financial.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService, AuditAction } from '../audit/audit-log.service';
import { PartnershipsService } from '../partnerships/partnerships.service';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class FinancialService {
    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
        private partnershipsService: PartnershipsService,
        private notificationsGateway: NotificationsGateway,
        private eventEmitter: EventEmitter2
    ) { }

    private parseDate(dateStr?: string | Date): Date {
        if (!dateStr) {
            const d = new Date();
            d.setHours(12, 0, 0, 0);
            return d;
        }
        if (dateStr instanceof Date) {
            const d = new Date(dateStr);
            d.setHours(12, 0, 0, 0);
            return d;
        }
        
        // Handle ISO strings (T separator) or simple YYYY-MM-DD
        const baseDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parts = baseDate.split('-').map(Number);
        
        if (parts.length === 3 && !parts.some(isNaN)) {
            return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
        }
        
        // Fallback to standard Date parsing if parts logic fails
        const fallback = new Date(dateStr);
        if (isNaN(fallback.getTime())) {
            const d = new Date();
            d.setHours(12, 0, 0, 0);
            return d;
        }
        fallback.setHours(12, 0, 0, 0);
        return fallback;
    }

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

    async getDREReport(tenantId: string, startDate: Date, endDate: Date) {
        // Fetch all records within range using accrualDate (Regime de Competência)
        const records = await this.prisma.financialRecord.findMany({
            where: {
                tenantId,
                accrualDate: { gte: startDate, lte: endDate },
                status: { not: 'CANCELLED' }
            },
            include: {
                categoryRef: true
            }
        });

        // Group by category code/name
        const incomeMap = new Map<string, { name: string, amount: number, code?: string }>();
        const expenseMap = new Map<string, { name: string, amount: number, code?: string }>();

        let totalGrossIncome = 0;
        let totalIss = 0;
        let totalIrrf = 0;
        let totalPis = 0;
        let totalCofins = 0;
        let totalOperatingExpenses = 0;

        records.forEach(record => {
            const amount = record.amount || 0;
            const categoryName = record.category || 'Outros';
            const categoryCode = record.categoryRef?.code || '';
            const categoryKey = categoryCode ? `${categoryCode} - ${categoryName}` : categoryName;

            if (record.type === 'INCOME') {
                totalGrossIncome += amount;
                totalIss += record.issAmount || 0;
                totalIrrf += record.irrfAmount || 0;
                totalPis += record.pisAmount || 0;
                totalCofins += record.cofinsAmount || 0;

                const existing = incomeMap.get(categoryKey) || { name: categoryName, amount: 0, code: categoryCode };
                existing.amount += amount;
                incomeMap.set(categoryKey, existing);
            } else {
                totalOperatingExpenses += amount;
                const existing = expenseMap.get(categoryKey) || { name: categoryName, amount: 0, code: categoryCode };
                existing.amount += amount;
                expenseMap.set(categoryKey, existing);
            }
        });

        const totalTaxes = totalIss + totalIrrf + totalPis + totalCofins;
        const netRevenue = totalGrossIncome - totalTaxes;
        const netProfit = netRevenue - totalOperatingExpenses;

        return {
            period: { start: startDate, end: endDate },
            grossRevenue: {
                total: totalGrossIncome,
                categories: Array.from(incomeMap.values()).sort((a, b) => (a.code || '').localeCompare(b.code || ''))
            },
            taxes: {
                total: totalTaxes,
                iss: totalIss,
                irrf: totalIrrf,
                pis: totalPis,
                cofins: totalCofins
            },
            netRevenue,
            operatingExpenses: {
                total: totalOperatingExpenses,
                categories: Array.from(expenseMap.values()).sort((a, b) => (a.code || '').localeCompare(b.code || ''))
            },
            netProfit,
            profitMargin: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0
        };
    }

    async getFinancialAudit(tenantId: string) {
        return this.prisma.auditLog.findMany({
            where: {
                tenantId,
                entityType: 'FinancialRecord'
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    }

    // --- CRUD ---

    async create(createFinancialDto: CreateFinancialDto, tenantId: string, userId?: string, userName?: string) {
        const baseDate = this.parseDate(createFinancialDto.date);
        const accrualDate = this.parseDate(createFinancialDto.accrualDate);
        const paymentDate = createFinancialDto.status === 'PAID' 
            ? this.parseDate(createFinancialDto.paymentDate || createFinancialDto.date)
            : createFinancialDto.paymentDate ? this.parseDate(createFinancialDto.paymentDate) : null;

        const commonData = {
            type: createFinancialDto.type,
            category: createFinancialDto.category,
            amount: createFinancialDto.amount,
            description: createFinancialDto.description,
            costCenter: createFinancialDto.costCenter || null,
            accrualDate,
            paymentDate,
            clientId: createFinancialDto.clientId || null,
            isUrgent: createFinancialDto.isUrgent || false,
            notes: createFinancialDto.notes || null,
            categoryId: createFinancialDto.categoryId || null,
            tenantId,
            issAmount: createFinancialDto.issAmount || 0,
            irrfAmount: createFinancialDto.irrfAmount || 0,
            pisAmount: createFinancialDto.pisAmount || 0,
            cofinsAmount: createFinancialDto.cofinsAmount || 0,
            netAmount: (createFinancialDto.amount || 0) - (
                (createFinancialDto.issAmount || 0) + 
                (createFinancialDto.irrfAmount || 0) + 
                (createFinancialDto.pisAmount || 0) + 
                (createFinancialDto.cofinsAmount || 0)
            )
        };

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
                    ...commonData,
                    date: baseDate,
                    status: createFinancialDto.status || 'PENDING',
                    isRecurring: true,
                    recurrenceType: createFinancialDto.recurrenceType,
                    totalInstallments: installments,
                    currentInstallment: 1,
                } as any,
            });
            records.push(parentRecord);

            // Create remaining installments
            for (let i = 2; i <= installments; i++) {
                const installmentDate = new Date(baseDate);
                const installmentAccrual = new Date(accrualDate);

                if (createFinancialDto.recurrenceType === 'MENSAL') {
                    installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
                    installmentAccrual.setMonth(installmentAccrual.getMonth() + (i - 1));
                } else if (createFinancialDto.recurrenceType === 'ANUAL') {
                    installmentDate.setFullYear(installmentDate.getFullYear() + (i - 1));
                    installmentAccrual.setFullYear(installmentAccrual.getFullYear() + (i - 1));
                } else {
                    installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
                    installmentAccrual.setMonth(installmentAccrual.getMonth() + (i - 1));
                }

                const installmentRecord = await this.prisma.financialRecord.create({
                    data: {
                        ...commonData,
                        date: installmentDate,
                        accrualDate: installmentAccrual,
                        paymentDate: null, // Future installments are always pending
                        status: 'PENDING',
                        isRecurring: true,
                        recurrenceType: createFinancialDto.recurrenceType,
                        totalInstallments: installments,
                        currentInstallment: i,
                        parentRecordId: parentRecord.id,
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
                ...commonData,
                date: baseDate,
                status: createFinancialDto.status || 'PENDING',
                isRecurring: false,
                recurrenceType: 'UNICA',
                totalInstallments: 1,
                currentInstallment: 1,
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
                newValues: commonData,
            }).catch(() => { });
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

        this.eventEmitter.emit('financial.created', {
            id: record.id,
            type: record.type,
            amount: record.amount,
            description: record.description,
            tenantId,
            userId
        });

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
        
        // Use helper for all date fields
        if (data.date) data.date = this.parseDate(data.date);
        if (data.accrualDate) data.accrualDate = this.parseDate(data.accrualDate);
        if (data.paymentDate) data.paymentDate = this.parseDate(data.paymentDate);

        // Logic for marking as paid
        if (data.status === 'PAID' && oldRecord.status !== 'PAID' && !data.paymentDate) {
            data.paymentDate = new Date();
            data.paymentDate.setHours(12, 0, 0, 0);
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

        // Recalculate Net Amount on update if any tax field changed
        const amount = data.amount ?? oldRecord.amount;
        const iss = data.issAmount ?? oldRecord.issAmount ?? 0;
        const irrf = data.irrfAmount ?? oldRecord.irrfAmount ?? 0;
        const pis = data.pisAmount ?? oldRecord.pisAmount ?? 0;
        const cofins = data.cofinsAmount ?? oldRecord.cofinsAmount ?? 0;
        data.netAmount = amount - (iss + irrf + pis + cofins);

        const { partnerId, partnerPercentage, ...prismaData } = data;

        await this.prisma.financialRecord.updateMany({
            where: { id, tenantId },
            data: prismaData,
        });

        const updatedRecord = await this.prisma.financialRecord.findFirst({ 
            where: { id, tenantId },
            include: { client: true }
        });

        if (!updatedRecord) throw new Error('Falha ao atualizar registro');

        // Audit log
        if (userId && oldRecord) {
            await this.auditLogService.log({
                action: AuditAction.UPDATE,
                entityType: 'FinancialRecord',
                entityId: id,
                userId,
                userName,
                tenantId,
                oldValues: oldRecord,
                newValues: updatedRecord,
            }).catch(() => { });
        }

        // Handle Split Update
        if (updatedRecord.type === 'INCOME') {
            await this.partnershipsService.handleSpecificSplit(
                updatedRecord.id,
                updatedRecord.amount,
                tenantId,
                updatedRecord.description,
                updateFinancialDto.partnerId,
                updateFinancialDto.partnerPercentage
            );
        }

        this.eventEmitter.emit('financial.updated', {
            id: updatedRecord.id,
            type: updatedRecord.type,
            amount: updatedRecord.amount,
            description: updatedRecord.description,
            tenantId,
            userId
        });

        return updatedRecord;
    }

    async cancel(id: string, tenantId: string, userId?: string, userName?: string) {
        const record = await this.prisma.financialRecord.findFirst({ where: { id, tenantId } });
        if (!record) throw new Error('Registro não encontrado');

        const updated = await this.prisma.financialRecord.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
            } as any // Use as any to bypass stale client types until rebuild
        });

        if (userId) {
            await this.auditLogService.log({
                action: AuditAction.UPDATE,
                entityType: 'FinancialRecord',
                entityId: id,
                userId,
                userName,
                tenantId,
                details: { message: 'Registro estornado/cancelado contabilmente' },
            }).catch(() => {});
        }

        return updated;
    }

    async remove(id: string, tenantId: string, userId?: string, userName?: string) {
        // Verify tenant ownership and get record for audit before deleting
        const record = await this.prisma.financialRecord.findFirst({ where: { id, tenantId } });
        if (!record) {
            throw new Error('Registro financeiro não encontrado');
        }

        const deleted = await this.prisma.financialRecord.deleteMany({
            where: { id, tenantId },
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
