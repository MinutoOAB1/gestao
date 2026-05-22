import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ValueChainService {
    constructor(private prisma: PrismaService) {}

    async findAll(tenantId: string) {
        return this.prisma.valueChain.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'asc' }
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.valueChain.findFirst({
            where: { id, tenantId }
        });
    }

    async create(tenantId: string, data: { name: string; description?: string; nodes?: any[]; connections?: any[] }) {
        return this.prisma.valueChain.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description || '',
                nodes: (data.nodes || []) as any,
                connections: (data.connections || []) as any
            }
        });
    }

    async update(id: string, tenantId: string, data: { name?: string; description?: string; nodes?: any[]; connections?: any[] }) {
        return this.prisma.valueChain.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.nodes !== undefined && { nodes: data.nodes as any }),
                ...(data.connections !== undefined && { connections: data.connections as any })
            }
        });
    }

    async delete(id: string, tenantId: string) {
        return this.prisma.valueChain.delete({
            where: { id }
        });
    }
}
