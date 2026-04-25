import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ProcessUpdatesService } from './process-updates.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('process-updates')
export class ProcessUpdatesController {
    constructor(private readonly processUpdatesService: ProcessUpdatesService) { }

    // Root POST: Create new andamento
    @Post()
    async createRoot(
        @Body() body: { processId?: string; description?: string; update?: string; type?: string; date?: string; isImportant?: boolean },
        @Request() req,
    ) {
        if (!body.processId) throw new BadRequestException('processId is required in request body');
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        const createdBy = req.user?.name || 'Sistema';
        const description = body.description || body.update || '';
        return this.processUpdatesService.create(body.processId, {
            description,
            type: body.type,
            date: body.date ? new Date(body.date) : undefined,
            isImportant: body.isImportant,
            createdBy,
        }, tenantId);
    }

    // Create new andamento via URL param
    @Post(':processId')
    async create(
        @Param('processId') processIdParam: string,
        @Body() body: { processId?: string; description?: string; update?: string; type?: string; date?: string; isImportant?: boolean },
        @Request() req,
    ) {
        const processId = processIdParam || body.processId;
        if (!processId) throw new BadRequestException('processId is required');
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        
        const createdBy = req.user?.name || 'Sistema';
        const description = body.description || body.update || '';
        return this.processUpdatesService.create(processId, {
            description,
            type: body.type,
            date: body.date ? new Date(body.date) : undefined,
            isImportant: body.isImportant,
            createdBy,
        }, tenantId);
    }

    // Get all andamentos for a process
    @Get('process/:processId')
    async findByProcess(@Param('processId') processId: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.processUpdatesService.findByProcess(processId, tenantId);
    }

    // Get single andamento
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.processUpdatesService.findOne(id, tenantId);
    }

    // Update andamento
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { description?: string; type?: string; date?: string; isImportant?: boolean },
        @Request() req
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        
        return this.processUpdatesService.update(id, {
            ...body,
            date: body.date ? new Date(body.date) : undefined,
        }, tenantId);
    }

    // Delete andamento
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        
        return this.processUpdatesService.remove(id, tenantId);
    }
}
