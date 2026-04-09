import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreatePartnershipDto,
    UpdatePartnershipDto,
    CreatePartnershipTransactionDto,
    UpdatePartnershipTransactionDto
} from './dto/partnership.dto';

@Injectable()
export class PartnershipsService {
    constructor(private prisma: PrismaService) { }

    // Get all partnerships for a tenant
    async findAll(tenantId: string) {
        const partnerships = await this.prisma.partnership.findMany({
            where: { tenantId, active: true },
            include: {
                transactions: {
                    where: { status: 'PENDING' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate pending amount for each partner
        return partnerships.map(partner => ({
            ...partner,
            pendingAmount: partner.transactions.reduce((sum, t) => sum + t.amount, 0)
        }));
    }

    // Get a single partnership by ID
    async findOne(id: string, tenantId: string) {
        return this.prisma.partnership.findFirst({
            where: { id, tenantId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }

    // Create a new partnership
    async create(tenantId: string, data: CreatePartnershipDto) {
        return this.prisma.partnership.create({
            data: {
                ...data,
                tenantId,
                color: data.color || 'bg-blue-500'
            }
        });
    }

    // Update a partnership
    async update(id: string, tenantId: string, data: UpdatePartnershipDto) {
        return this.prisma.partnership.updateMany({
            where: { id, tenantId },
            data
        });
    }

    // Delete (deactivate) a partnership
    async remove(id: string, tenantId: string) {
        return this.prisma.partnership.updateMany({
            where: { id, tenantId },
            data: { active: false }
        });
    }

    // Get all transactions for a partner
    async findTransactions(partnerId: string, tenantId: string) {
        return this.prisma.partnershipTransaction.findMany({
            where: { partnerId, tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Get all transactions across all partners (for the spreadsheet)
    async findAllTransactions(tenantId: string) {
        return this.prisma.partnershipTransaction.findMany({
            where: { tenantId },
            include: { partner: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Create a transaction
    async createTransaction(tenantId: string, data: CreatePartnershipTransactionDto) {
        return this.prisma.partnershipTransaction.create({
            data: {
                ...data,
                tenantId,
                dueDate: data.dueDate ? new Date(data.dueDate) : null
            }
        });
    }

    // Update a transaction
    async updateTransaction(id: string, tenantId: string, data: UpdatePartnershipTransactionDto) {
        const updateData: any = { ...data };
        if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
        if (data.paidDate) updateData.paidDate = new Date(data.paidDate);
        if (data.status === 'PAID' && !data.paidDate) {
            updateData.paidDate = new Date();
        }

        return this.prisma.partnershipTransaction.updateMany({
            where: { id, tenantId },
            data: updateData
        });
    }

    // Mark transaction as paid
    async markTransactionPaid(id: string, tenantId: string) {
        return this.prisma.partnershipTransaction.updateMany({
            where: { id, tenantId },
            data: {
                status: 'PAID',
                paidDate: new Date()
            }
        });
    }

    // Get total pending repasses for tenant
    async getTotalPendingRepasses(tenantId: string) {
        const partnerships = await this.prisma.partnership.findMany({
            where: { tenantId, active: true },
            include: {
                transactions: {
                    where: { status: 'PENDING' }
                }
            }
        });

        return partnerships.reduce((total, partner) => {
            return total + partner.transactions.reduce((sum, t) => sum + t.amount, 0);
        }, 0);
    }

    // Auto-calculate and create splits for an income
    async calculateSplits(financialRecordId: string, amount: number, tenantId: string, originDescription: string) {
        // Find all active partners that have a percentage set
        const partners = await this.prisma.partnership.findMany({
            where: { tenantId, active: true, percentage: { not: null } }
        });

        if (partners.length === 0) return;

        // For each partner, calculate their share and create a pending transaction
        const transactions = partners.map(partner => {
            const percentage = partner.percentage ?? 0;
            const shareAmount = amount * (percentage / 100);
            return {
                partnerId: partner.id,
                amount: shareAmount,
                description: `Repasse ref. ${originDescription}`,
                status: 'PENDING',
                financialRecordId,
                tenantId
            };
        });

        if (transactions.length > 0) {
            await this.prisma.partnershipTransaction.createMany({
                data: transactions
            });
        }
    }

    // Handle single partner split explicitly defined (for income creation/editing)
    async handleSpecificSplit(financialRecordId: string, amount: number, tenantId: string, description: string, partnerId?: string, partnerPercentage?: number) {
        // Find existing transaction linked to this record
        const existingTrans = await this.prisma.partnershipTransaction.findFirst({
            where: { financialRecordId, tenantId }
        });

        // 1. If no partner provided, remove any existing split
        if (!partnerId) {
            if (existingTrans) {
                await this.prisma.partnershipTransaction.delete({ where: { id: existingTrans.id } });
            }
            return;
        }

        // 2. Partner provided: calculate share amount
        const percentage = partnerPercentage || 0;
        const shareAmount = amount * (percentage / 100);

        if (existingTrans) {
            // Update existing split
            await this.prisma.partnershipTransaction.update({
                where: { id: existingTrans.id },
                data: {
                    partnerId,
                    amount: shareAmount,
                    description: `Repasse ref. ${description}`,
                }
            });
        } else {
            // Create new split
            await this.prisma.partnershipTransaction.create({
                data: {
                    partnerId,
                    amount: shareAmount,
                    description: `Repasse ref. ${description}`,
                    status: 'PENDING',
                    financialRecordId,
                    tenantId
                }
            });
        }
    }
}
