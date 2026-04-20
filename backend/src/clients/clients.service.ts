import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

    async create(createClientDto: CreateClientDto, tenantId: string) {
        // Sanitize: convert empty strings to null for optional fields
        console.log('Creating client with data:', createClientDto);
        const data: any = { ...createClientDto, tenantId };

        // Separate tags from client data
        const tags = data.tags;
        delete data.tags;

        // Convert empty strings to null
        for (const key of Object.keys(data)) {
            if (data[key] === '' && key !== 'name') {
                data[key] = null;
            }
        }

        const parseDate = (d: any) => {
            if (!d) return undefined;
            if (typeof d === 'string' && d.length === 10) {
                const [year, month, day] = d.split('-').map(Number);
                return new Date(year, month - 1, day, 12, 0, 0);
            }
            const date = new Date(d);
            if (isNaN(date.getTime())) return undefined;
            return date;
        };

        // Handle DateTime fields (Prisma expects Date objects, not strings)
        if (data.birthDate) {
            data.birthDate = parseDate(data.birthDate);
        }
        if (data.nextActionDate) {
            data.nextActionDate = parseDate(data.nextActionDate);
        }

        // If tags are provided, create them inline
        if (tags && Array.isArray(tags) && tags.length > 0) {
            data.tags = {
                create: tags.map((t: any, i: number) => ({
                    name: t.name,
                    color: t.color || '#6366f1',
                    order: t.order ?? i,
                    tenantId,
                })),
            };
        }

        try {
            const client = await this.prisma.client.create({ data, include: { tags: true } });
            await this.logActivity(client.id, tenantId, 'CLIENT_CREATED', `Cliente ${client.name} cadastrado na plataforma.`);
            return client;
        } catch (error: any) {
            console.error('ERROR SAVING CLIENT:', error);
            // Handle specific Prisma errors or throw a general one with the message
            throw new BadRequestException(`Erro ao salvar no banco de dados: ${error.message}`);
        }
    }

    findAll(tenantId: string, take = 50, skip = 0) {
        return this.prisma.client.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            include: {
                tags: { orderBy: { order: 'asc' } },
                notes: {
                    where: { isUrgent: true },
                    select: { id: true, isUrgent: true },
                },
                _count: {
                    select: { processes: true }
                },
                serviceLogs: { orderBy: { date: 'desc' }, take: 10 },
                checklistItems: { orderBy: { createdAt: 'asc' } }
            },
            take,
            skip,
        });
    }

    findOne(id: string, tenantId: string) {
        return this.prisma.client.findFirst({
            where: { id, tenantId },
            include: { 
                tags: { orderBy: { order: 'asc' } },
                serviceLogs: { orderBy: { date: 'desc' } },
                checklistItems: { orderBy: { createdAt: 'asc' } },
                activities: { orderBy: { createdAt: 'desc' }, take: 50 }
            },
        });
    }

    async update(id: string, updateClientDto: UpdateClientDto, tenantId: string) {
        // Verify tenant ownership first
        const existing = await this.prisma.client.findFirst({ where: { id, tenantId } });
        if (!existing) {
            throw new Error('Cliente não encontrado');
        }

        // Sanitize: convert empty strings to null for optional fields
        const data: any = { ...updateClientDto };
        delete data.tags; // tags are managed separately
        for (const key of Object.keys(data)) {
            if (data[key] === '' && key !== 'name') {
                data[key] = null;
            }
        }

        const parseDate = (d: any) => {
            if (!d) return undefined;
            if (typeof d === 'string' && d.length === 10) {
                const [year, month, day] = d.split('-').map(Number);
                return new Date(year, month - 1, day, 12, 0, 0);
            }
            const date = new Date(d);
            if (isNaN(date.getTime())) return undefined;
            return date;
        };

        // Handle DateTime fields
        if (data.birthDate) {
            data.birthDate = parseDate(data.birthDate);
        }
        if (data.nextActionDate) {
            data.nextActionDate = parseDate(data.nextActionDate);
        }

        return this.prisma.client.update({
            where: { id },
            data,
            include: { tags: { orderBy: { order: 'asc' } } },
        });
    }

    async remove(id: string, tenantId: string) {
        // Verify tenant ownership first
        const existing = await this.prisma.client.findFirst({ where: { id, tenantId } });
        if (!existing) {
            throw new Error('Cliente não encontrado');
        }
        return this.prisma.client.delete({
            where: { id },
        });
    }

    // === Status ===
    async updateStatus(id: string, status: string, tenantId: string) {
        const existing = await this.prisma.client.findFirst({ where: { id, tenantId } });
        if (!existing) throw new Error('Cliente não encontrado');
        
        const updated = await this.prisma.client.update({
            where: { id },
            data: { status },
            include: { tags: { orderBy: { order: 'asc' } } },
        });

        await this.logActivity(id, tenantId, 'STATUS_CHANGED', `Status alterado para ${status}.`);
        
        return updated;
    }

    // === Tags ===
    async addTag(clientId: string, name: string, color: string, order: number, tenantId: string) {
        // Verify client belongs to tenant
        const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client) throw new Error('Cliente não encontrado');
        return this.prisma.clientTag.create({
            data: { name, color, order, clientId, tenantId },
        });
    }

    async updateTag(tagId: string, data: { name?: string; color?: string; order?: number }, tenantId: string) {
        const tag = await this.prisma.clientTag.findFirst({ where: { id: tagId, tenantId } });
        if (!tag) throw new Error('Tag não encontrada');
        return this.prisma.clientTag.update({
            where: { id: tagId },
            data,
        });
    }

    async removeTag(tagId: string, tenantId: string) {
        const tag = await this.prisma.clientTag.findFirst({ where: { id: tagId, tenantId } });
        if (!tag) throw new Error('Tag não encontrada');
        return this.prisma.clientTag.delete({ where: { id: tagId } });
    }

    // === Notes ===
    async addNote(clientId: string, content: string, priority: string, isUrgent: boolean, userId: string, userName: string, tenantId: string) {
        const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client) throw new Error('Cliente não encontrado');
        
        const note = await this.prisma.clientNote.create({
            data: { content, priority, isUrgent, clientId, createdBy: userName, createdById: userId, tenantId },
        });

        await this.logActivity(clientId, tenantId, 'NOTE_ADDED', `Nova anotação adicionada por ${userName}.`);
        
        return note;
    }

    async getNotes(clientId: string, tenantId: string) {
        return this.prisma.clientNote.findMany({
            where: { clientId, tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteNote(noteId: string, tenantId: string) {
        const note = await this.prisma.clientNote.findFirst({ where: { id: noteId, tenantId } });
        if (!note) throw new Error('Anotação não encontrada');
        return this.prisma.clientNote.delete({ where: { id: noteId } });
    }

    // === Service Logs (Atendimentos) ===
    async addServiceLog(clientId: string, summary: string, type: string, durationMinutes: number, userId: string, tenantId: string) {
        const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client) throw new Error('Cliente não encontrado');
        
        const log = await this.prisma.clientServiceLog.create({
            data: { summary, type, durationMinutes, clientId, createdById: userId, tenantId },
        });

        await this.logActivity(clientId, tenantId, 'SERVICE_LOG', `Atendimento do tipo ${type} registrado.`);
        
        return log;
    }

    // === Onboarding Checklists ===
    async addChecklistItem(clientId: string, text: string, tenantId: string) {
        const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
        if (!client) throw new Error('Cliente não encontrado');
        return this.prisma.clientChecklistItem.create({
            data: { text, clientId, tenantId },
        });
    }

    async toggleChecklistItem(itemId: string, completed: boolean, tenantId: string) {
        const item = await this.prisma.clientChecklistItem.findFirst({ where: { id: itemId, tenantId } });
        if (!item) throw new Error('Item do checklist não encontrado');
        return this.prisma.clientChecklistItem.update({
            where: { id: itemId },
            data: { completed },
        });
    }

    async removeChecklistItem(itemId: string, tenantId: string) {
        const item = await this.prisma.clientChecklistItem.findFirst({ where: { id: itemId, tenantId } });
        if (!item) throw new Error('Item do checklist não encontrado');
        return this.prisma.clientChecklistItem.delete({ where: { id: itemId } });
    }

    // === Event Listeners ===
    @OnEvent('process.created')
    async handleProcessCreated(payload: any) {
        if (payload.clientId) {
            await this.logActivity(payload.clientId, payload.tenantId, 'PROCESS_CREATED', `Novo processo criado: ${payload.title} (${payload.number})`);
        }
    }

    @OnEvent('process.won')
    async handleProcessWon(payload: any) {
        if (payload.clientId) {
            await this.logActivity(payload.clientId, payload.tenantId, 'PROCESS_WON', `Processo "${payload.title}" marcado como concluído/ganho!`);
        }
    }

    // === Helper: Activity Logging ===
    async logActivity(clientId: string, tenantId: string, type: string, description: string, metadata?: any, userId?: string) {
        return this.prisma.clientActivity.create({
            data: {
                clientId,
                tenantId,
                type,
                description,
                metadata: metadata || {},
                userId,
            },
        });
    }
}
