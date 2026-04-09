import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcessUpdatesService {
    constructor(private prisma: PrismaService) { }

    // Create a new andamento
    async create(processId: string, data: { description: string; type?: string; date?: Date; isImportant?: boolean; createdBy?: string }) {
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
    async findByProcess(processId: string) {
        return this.prisma.processUpdate.findMany({
            where: { processId },
            orderBy: { date: 'desc' },
        });
    }

    // Get a single andamento
    async findOne(id: string) {
        return this.prisma.processUpdate.findUnique({
            where: { id },
        });
    }

    // Update andamento
    async update(id: string, data: { description?: string; type?: string; date?: Date; isImportant?: boolean }) {
        return this.prisma.processUpdate.update({
            where: { id },
            data,
        });
    }

    // Delete andamento
    async remove(id: string) {
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
