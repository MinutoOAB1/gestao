import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';

// Strict Multi-tenancy enforcement
import { UnauthorizedException } from '@nestjs/common';

@Controller('clients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ClientsController {
    constructor(
        private readonly clientsService: ClientsService,
        private readonly aiService: AiService,
        private readonly prisma: PrismaService,
    ) { }

    @Post()
    create(@Request() req, @Body() createClientDto: CreateClientDto) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.create(createClientDto, tenantId, req.user.sub);
    }

    @Get()
    findAll(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.findAll(tenantId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.findOne(id, tenantId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.update(id, updateClientDto, tenantId, req.user.sub);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.LAWYER)
    remove(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.remove(id, tenantId, req.user.sub);
    }

    // Get client with all related data (processes with updates, financial records)
    @Get(':id/complete')
    async findComplete(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');

        const client = await this.prisma.client.findFirst({
            where: { id, tenantId },
            include: {
                tags: { orderBy: { order: 'asc' } },
                notes: { orderBy: { createdAt: 'desc' } },
                processes: {
                    include: {
                        updates: {
                            orderBy: { date: 'desc' },
                            take: 10,
                        },
                    },
                },
                financialRecords: {
                    orderBy: { date: 'desc' },
                },
                serviceLogs: { orderBy: { date: 'desc' } },
                checklistItems: { orderBy: { createdAt: 'asc' } }
            },
        });

        return client;
    }

    // Generate AI report for client
    @Post(':id/report')
    async generateReport(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');

        // Fetch complete client data
        const client = await this.prisma.client.findFirst({
            where: { id, tenantId },
            include: {
                processes: {
                    include: {
                        updates: {
                            orderBy: { date: 'desc' },
                            take: 5,
                        },
                    },
                },
                financialRecords: {
                    orderBy: { date: 'desc' },
                },
            },
        });

        if (!client) {
            throw new Error('Cliente não encontrado');
        }

        // Generate AI report
        const report = await this.aiService.generateClientReport({
            name: client.name,
            email: client.email || undefined,
            phone: client.phone || undefined,
            document: client.document || undefined,
            address: client.address || undefined,
            createdAt: client.createdAt.toISOString(),
            processes: client.processes.map(p => ({
                number: p.number,
                title: p.title,
                status: p.status,
                area: p.area || undefined,
                court: p.court || undefined,
                updates: p.updates.map(u => ({
                    date: u.date.toISOString(),
                    description: u.description,
                    type: u.type,
                })),
            })),
            financialRecords: client.financialRecords.map(f => ({
                type: f.type,
                amount: f.amount,
                description: f.description,
                status: f.status,
                date: f.date.toISOString(),
            })),
        });

        return report;
    }

    // === Status ===
    @Patch(':id/status')
    updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.updateStatus(id, status, tenantId);
    }

    // === Tags ===
    @Post(':id/tags')
    addTag(@Request() req, @Param('id') id: string, @Body() body: { name: string; color?: string; order?: number }) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.addTag(id, body.name, body.color || '#6366f1', body.order ?? 0, tenantId);
    }

    @Patch('tags/:tagId')
    updateTag(@Request() req, @Param('tagId') tagId: string, @Body() body: { name?: string; color?: string; order?: number }) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.updateTag(tagId, body, tenantId);
    }

    @Delete('tags/:tagId')
    removeTag(@Request() req, @Param('tagId') tagId: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.removeTag(tagId, tenantId);
    }

    // === Notes ===
    @Post(':id/notes')
    addNote(@Request() req, @Param('id') id: string, @Body() body: { content: string; priority?: string; isUrgent?: boolean }) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        const userId = req.user?.id || 'unknown';
        const userName = req.user?.name || 'Sistema';
        return this.clientsService.addNote(id, body.content, body.priority || 'NORMAL', body.isUrgent || false, userId, userName, tenantId);
    }

    @Get(':id/notes')
    getNotes(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.getNotes(id, tenantId);
    }

    @Delete('notes/:noteId')
    deleteNote(@Request() req, @Param('noteId') noteId: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.deleteNote(noteId, tenantId);
    }

    // === Service Logs ===
    @Post(':id/service-logs')
    addServiceLog(@Request() req, @Param('id') id: string, @Body() body: { summary: string; type?: string; durationMinutes?: number }) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        const userId = req.user?.id || 'unknown';
        return this.clientsService.addServiceLog(id, body.summary, body.type || 'MEETING', body.durationMinutes || 0, userId, tenantId);
    }

    // === Checklists ===
    @Post(':id/checklists')
    addChecklistItem(@Request() req, @Param('id') id: string, @Body() body: { text: string }) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.addChecklistItem(id, body.text, tenantId);
    }

    @Patch('checklists/:itemId')
    toggleChecklistItem(@Request() req, @Param('itemId') itemId: string, @Body() body: { completed: boolean }) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.toggleChecklistItem(itemId, body.completed, tenantId);
    }

    @Delete('checklists/:itemId')
    removeChecklistItem(@Request() req, @Param('itemId') itemId: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.clientsService.removeChecklistItem(itemId, tenantId);
    }
}
