import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ValueChainService {
    constructor(private prisma: PrismaService) {}

    async findOne(tenantId: string) {
        return this.prisma.valueChain.findUnique({
            where: { tenantId }
        });
    }

    async upsert(tenantId: string, data: { nodes: any[]; connections: any[] }) {
        const { nodes, connections } = data;
        return this.prisma.valueChain.upsert({
            where: { tenantId },
            update: {
                nodes: nodes as any,
                connections: connections as any,
            },
            create: {
                tenantId,
                nodes: nodes as any,
                connections: connections as any,
            }
        });
    }
}
