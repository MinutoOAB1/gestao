import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ProcessNotesService } from './process-notes.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('process-notes')
export class ProcessNotesController {
    constructor(private readonly processNotesService: ProcessNotesService) { }

    // Create new note for a process
    @Post(':processId')
    async create(
        @Param('processId') processId: string,
        @Body() body: { content: string; color?: string; isPinned?: boolean },
        @Request() req,
    ) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.sub || req.user?.id;
        if (!tenantId || !userId) throw new UnauthorizedException('Authentication context incomplete');
        
        const createdBy = req.user?.name || 'Sistema';

        return this.processNotesService.create(
            processId,
            { ...body, createdBy },
            userId,
            tenantId
        );
    }

    // Get all notes for a process
    @Get('process/:processId')
    async findByProcess(@Param('processId') processId: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.processNotesService.findByProcess(processId, tenantId);
    }

    // Get single note
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.processNotesService.findOne(id, tenantId);
    }

    // Update note
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { content?: string; color?: string; isPinned?: boolean },
        @Request() req
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.processNotesService.update(id, body, tenantId);
    }

    // Delete note
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.processNotesService.remove(id, tenantId);
    }
}
