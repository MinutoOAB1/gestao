import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContractsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        number: string;
        title: string;
        description?: string;
        status?: string;
        value: number;
        clientId?: string;
    }, tenantId: string) {
        return this.prisma.contract.create({
            data: {
                ...data,
                tenantId,
            },
            include: {
                client: true,
            },
        });
    }

    async findAll(tenantId: string, status?: string) {
        const where: any = { tenantId };
        if (status && status !== 'ALL') {
            where.status = status;
        }
        return this.prisma.contract.findMany({
            where,
            include: {
                client: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.contract.findFirst({
            where: { id, tenantId },
            include: {
                client: true,
            },
        });
    }

    async update(id: string, data: {
        number?: string;
        title?: string;
        description?: string;
        status?: string;
        value?: number;
        clientId?: string;
    }, tenantId: string) {
        return this.prisma.contract.updateMany({
            where: { id, tenantId },
            data,
        });
    }

    async remove(id: string, tenantId: string) {
        return this.prisma.contract.deleteMany({
            where: { id, tenantId },
        });
    }

    async getStats(tenantId: string) {
        const contracts = await this.prisma.contract.findMany({
            where: { tenantId },
        });

        const initiated = contracts.filter(c => c.status === 'INITIATED').length;
        const made = contracts.filter(c => c.status === 'MADE').length;
        const signed = contracts.filter(c => c.status === 'SIGNED').length;
        const closed = contracts.filter(c => c.status === 'CLOSED').length;
        const cancelled = contracts.filter(c => c.status === 'CANCELLED').length;

        const estimatedRevenue = contracts
            .filter(c => c.status !== 'CANCELLED')
            .reduce((acc, c) => acc + c.value, 0);

        return {
            initiated,
            made,
            signed,
            closed,
            cancelled,
            total: contracts.length,
            estimatedRevenue,
        };
    }
}
