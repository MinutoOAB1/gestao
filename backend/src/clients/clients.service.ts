import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { SecurityService } from '../common/security/security.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClientsService {
    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
        private security: SecurityService
    ) { }

    async create(createClientDto: CreateClientDto, tenantId: string, userId?: string) {
        // Sanitize: remove unknown fields for Prisma
        const { type, urgency, ...cleanDto } = createClientDto as any;
        const data: any = { ...cleanDto, tenantId };

        // Separate tags from client data
        const tags = data.tags;
        delete data.tags;

        // Convert empty strings to null
        for (const key of Object.keys(data)) {
            if (data[key] === '' && key !== 'name') {
                data[key] = null;
            }
        }

        // Encrypt sensitive fields
        if (data.document) data.document = this.security.encrypt(data.document);
        if (data.email) data.email = this.security.encrypt(data.email);

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
            
            // Decrypt for returning to caller
            if (client.document) client.document = this.security.decrypt(client.document);
            if (client.email) client.email = this.security.decrypt(client.email);

            await this.logActivity(client.id, tenantId, 'CLIENT_CREATED', `Cliente ${client.name} cadastrado na plataforma.`);
            
            this.eventEmitter.emit('client.created', {
                clientId: client.id,
                name: client.name,
                tenantId,
                createdById: data.createdById // Need to ensure this is passed if available
            });

            return client;
        } catch (error: any) {
            console.error('ERROR SAVING CLIENT:', error);
            // Handle specific Prisma errors or throw a general one with the message
            throw new BadRequestException(`Erro ao salvar no banco de dados: ${error.message}`);
        }
    }

    async findAll(tenantId: string, take = 50, skip = 0) {
        const clients = await this.prisma.client.findMany({
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

        // Decrypt sensitive fields
        return clients.map(client => ({
            ...client,
            document: client.document ? this.security.decrypt(client.document) : client.document,
            email: client.email ? this.security.decrypt(client.email) : client.email,
        }));
    }

    async findOne(id: string, tenantId: string) {
        const client = await this.prisma.client.findFirst({
            where: { id, tenantId },
            include: { 
                tags: { orderBy: { order: 'asc' } },
                serviceLogs: { orderBy: { date: 'desc' } },
                checklistItems: { orderBy: { createdAt: 'asc' } },
                activities: { orderBy: { createdAt: 'desc' }, take: 50 }
            },
        });

        if (client) {
            client.document = client.document ? this.security.decrypt(client.document) : client.document;
            client.email = client.email ? this.security.decrypt(client.email) : client.email;
        }

        return client;
    }

    async update(id: string, updateClientDto: UpdateClientDto, tenantId: string, userId?: string) {
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

        // Encrypt sensitive fields if they are being updated
        if (data.document) data.document = this.security.encrypt(data.document);
        if (data.email) data.email = this.security.encrypt(data.email);

        // Handle DateTime fields
        if (data.birthDate) {
            data.birthDate = parseDate(data.birthDate);
        }
        if (data.nextActionDate) {
            data.nextActionDate = parseDate(data.nextActionDate);
        }

        const updated = await this.prisma.client.update({
            where: { id },
            data,
            include: { tags: { orderBy: { order: 'asc' } } },
        });

        // Decrypt for returning
        updated.document = updated.document ? this.security.decrypt(updated.document) : updated.document;
        updated.email = updated.email ? this.security.decrypt(updated.email) : updated.email;

        this.eventEmitter.emit('client.updated', {
            clientId: updated.id,
            name: updated.name,
            tenantId
        });

        return updated;
    }

    async remove(id: string, tenantId: string, userId?: string) {
        // Verify tenant ownership first
        const existing = await this.prisma.client.findFirst({ where: { id, tenantId } });
        if (!existing) {
            throw new Error('Cliente não encontrado');
        }
        const deleted = await this.prisma.client.delete({
            where: { id },
        });

        this.eventEmitter.emit('client.removed', {
            clientId: id,
            name: existing.name,
            tenantId,
            userId
        });

        return deleted;
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
        return this.prisma.clientTag.deleteMany({ 
            where: { id: tagId, tenantId } 
        });
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
        return this.prisma.clientNote.deleteMany({ 
            where: { id: noteId, tenantId } 
        });
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
        return this.prisma.clientChecklistItem.deleteMany({ 
            where: { id: itemId, tenantId } 
        });
    }

    // === Portal Access ===
    async createPortalAccess(clientId: string, email: string, passwordPlain: string, tenantId: string) {
        try {
            if (!email) {
                throw new BadRequestException('O cliente não possui um e-mail cadastrado.');
            }
            if (!passwordPlain || passwordPlain.length < 6) {
                throw new BadRequestException('A senha deve ter no mínimo 6 caracteres.');
            }
            
            const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
            if (!client) throw new BadRequestException('Cliente não encontrado');

            // Check if another client already uses this email for portal access
            const existingAccess = await this.prisma.clientPortalAccess.findFirst({
                where: { email, clientId: { not: clientId } }
            });
            if (existingAccess) {
                throw new BadRequestException('Este e-mail já está sendo utilizado por outro cliente para acesso ao portal.');
            }

            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(passwordPlain, salt);

            const access = await this.prisma.clientPortalAccess.upsert({
                where: { clientId },
                update: { email, passwordHash: hashed },
                create: { clientId, email, passwordHash: hashed },
            });

            await this.logActivity(clientId, tenantId, 'PORTAL_ACCESS_CREATED', `Acesso ao portal configurado.`);
            
            return { success: true, email: access.email };
        } catch (error) {
            console.error('[PortalAccess] createPortalAccess error:', error.message);
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException(error.message || 'Erro ao configurar acesso ao portal');
        }
    }

    async getPortalAccess(clientId: string, tenantId: string) {
        try {
            const client = await this.prisma.client.findFirst({ where: { id: clientId, tenantId } });
            if (!client) return null;

            const access = await this.prisma.clientPortalAccess.findUnique({
                where: { clientId },
                select: { email: true, createdAt: true, updatedAt: true }
            });

            return access;
        } catch (error) {
            console.error('[PortalAccess] getPortalAccess error:', error.message);
            return null;
        }
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
