import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcessUpdatesService {
    constructor(private prisma: PrismaService) { }

    // Create a new andamento
    async create(processId: string, data: { description: string; type?: string; date?: Date; isImportant?: boolean; createdBy?: string }, tenantId: string) {
        // Verify process ownership
        await this.prisma.process.findFirstOrThrow({
            where: { id: processId, tenantId }
        });

        return this.prisma.processUpdate.create({
            data: {
                processId,
                description: data.description,
                type: data.type || 'MOVIMENTO',
                date: data.date || new Date(),
                isImportant: data.isImportant || false,
                createdBy: data.createdBy,
            },
        });
    }

    // Get all andamentos for a process
    async findByProcess(processId: string, tenantId: string) {
        return this.prisma.processUpdate.findMany({
            where: { 
                processId,
                process: { tenantId }
            },
            orderBy: { date: 'desc' },
        });
    }

    // Get a single andamento
    async findOne(id: string, tenantId: string) {
        return this.prisma.processUpdate.findFirst({
            where: { 
                id,
                process: { tenantId }
            },
        });
    }

    // Update andamento
    async update(id: string, data: { description?: string; type?: string; date?: Date; isImportant?: boolean }, tenantId: string) {
        // Verify ownership before update
        await this.prisma.processUpdate.findFirstOrThrow({
            where: { id, process: { tenantId } }
        });

        return this.prisma.processUpdate.update({
            where: { id },
            data,
        });
    }

    // Delete andamento
    async remove(id: string, tenantId: string) {
        // Verify ownership before delete
        await this.prisma.processUpdate.findFirstOrThrow({
            where: { id, process: { tenantId } }
        });

        return this.prisma.processUpdate.delete({
            where: { id },
        });
    }

    // Get recent andamentos across all processes
    async findRecent(tenantId: string, limit: number = 10) {
        return this.prisma.processUpdate.findMany({
            where: {
                process: {
                    tenantId,
                },
            },
            include: {
                process: {
                    select: {
                        number: true,
                        title: true,
                        clientId: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
            take: limit,
        });
    }
}
