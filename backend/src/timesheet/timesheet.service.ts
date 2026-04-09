import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimesheetService {
    constructor(private prisma: PrismaService) { }

    async create(createTimeEntryDto: any, tenantId: string, userId: string) {
        const { description, duration, date, processId, processTitle } = createTimeEntryDto;

        // Ensure duration is int
        const dur = parseInt(duration);

        return this.prisma.timeEntry.create({
            data: {
                description,
                duration: isNaN(dur) ? 0 : dur,
                date: new Date(date),
                processId: processId || null,
                processTitle: processTitle || null,
                tenantId,
                userId
            }
        });
    }

    async findAll(tenantId: string) {
        return this.prisma.timeEntry.findMany({
            where: {
                tenantId
            },
            orderBy: {
                date: 'desc'
            }
        });
    }

    async remove(id: string, tenantId: string) {
        // Verify ownership or tenant check
        const entry = await this.prisma.timeEntry.findUnique({
            where: { id }
        });

        if (entry && entry.tenantId === tenantId) {
            return this.prisma.timeEntry.delete({
                where: { id }
            });
        }
        return { count: 0 };
    }
}
