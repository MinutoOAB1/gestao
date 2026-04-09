import { Controller, Get, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { ProcessNotesService } from './process-notes.service';

const DEV_TENANT_ID = 'dev-tenant-001';
const DEV_USER_ID = 'dev-user-001';

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
        const userId = req.user?.sub || DEV_USER_ID;
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
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
    async findByProcess(@Param('processId') processId: string) {
        return this.processNotesService.findByProcess(processId);
    }

    // Get single note
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.processNotesService.findOne(id);
    }

    // Update note
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { content?: string; color?: string; isPinned?: boolean },
    ) {
        return this.processNotesService.update(id, body);
    }

    // Delete note
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.processNotesService.remove(id);
    }
}
