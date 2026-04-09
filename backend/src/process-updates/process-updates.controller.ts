import { Controller, Get, Post, Put, Delete, Body, Param, Headers } from '@nestjs/common';
import { ProcessUpdatesService } from './process-updates.service';

@Controller('process-updates')
export class ProcessUpdatesController {
    constructor(private readonly processUpdatesService: ProcessUpdatesService) { }

    // Create new andamento for a process
    @Post(':processId')
    async create(
        @Param('processId') processId: string,
        @Body() body: { description: string; type?: string; date?: string; isImportant?: boolean },
        @Headers() headers: any,
    ) {
        const createdBy = headers['x-user-name'] || 'Sistema';
        return this.processUpdatesService.create(processId, {
            ...body,
            date: body.date ? new Date(body.date) : undefined,
            createdBy,
        });
    }

    // Get all andamentos for a process
    @Get('process/:processId')
    async findByProcess(@Param('processId') processId: string) {
        return this.processUpdatesService.findByProcess(processId);
    }

    // Get single andamento
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.processUpdatesService.findOne(id);
    }

    // Update andamento
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { description?: string; type?: string; date?: string; isImportant?: boolean },
    ) {
        return this.processUpdatesService.update(id, {
            ...body,
            date: body.date ? new Date(body.date) : undefined,
        });
    }

    // Delete andamento
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.processUpdatesService.remove(id);
    }
}
