import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProcessNotesService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private eventEmitter: EventEmitter2
    ) { }

    async create(
        processId: string,
        data: { content: string; color?: string; isPinned?: boolean; createdBy?: string },
        createdById?: string,
        tenantId?: string
    ) {
        // Verify process ownership if tenantId is provided
        if (tenantId) {
            await this.prisma.process.findFirstOrThrow({
                where: { id: processId, tenantId }
            });
        }

        // Create the note
        const note = await this.prisma.processNote.create({
            data: {
                content: data.content,
                color: data.color || 'yellow',
                isPinned: data.isPinned || false,
                createdBy: data.createdBy,
                processId,
            },
        });

        // Process mentions if we have the required context
        if (createdById && tenantId && data.content) {
            await this.notificationsService.processMentions(
                data.content,
                'PROCESS_NOTE',
                note.id,
                createdById,
                data.createdBy || 'Sistema',
                tenantId
            );
        }

        // Emit an event so AI Copilot can analyze it
        if (tenantId) {
            this.eventEmitter.emit('process.note.created', {
                noteId: note.id,
                processId,
                tenantId,
                content: data.content,
                createdById
            });
        }

        return note;
    }

    async findByProcess(processId: string, tenantId: string) {
        return this.prisma.processNote.findMany({
            where: { 
                processId,
                process: { tenantId }
            },
            orderBy: [
                { isPinned: 'desc' },  // Pinned notes first
                { createdAt: 'desc' }, // Then by creation date
            ],
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.processNote.findFirst({
            where: { 
                id,
                process: { tenantId }
            },
        });
    }

    async update(id: string, data: { content?: string; color?: string; isPinned?: boolean }, tenantId: string) {
        // Verify ownership before update
        await this.prisma.processNote.findFirstOrThrow({
            where: { id, process: { tenantId } }
        });

        return this.prisma.processNote.update({
            where: { id },
            data,
        });
    }

    async remove(id: string, tenantId: string) {
        // Verify ownership before delete
        await this.prisma.processNote.findFirstOrThrow({
            where: { id, process: { tenantId } }
        });

        return this.prisma.processNote.delete({
            where: { id },
        });
    }
}
