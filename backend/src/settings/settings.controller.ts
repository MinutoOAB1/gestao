import { Controller, Post, Body, Get, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Post()
    upsert(@Request() req, @Body() settingsDto: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.settingsService.upsert(settingsDto, tenantId);
    }

    @Get()
    findOne(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.settingsService.findOne(tenantId);
    }

    // Get storage info for the tenant/account
    @Get('storage')
    async getStorage(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.settingsService.getStorageInfo(tenantId);
    }

    @Post('kanban-columns')
    async updateKanbanColumns(@Request() req, @Body('kanbanColumns') kanbanColumns: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.settingsService.updateKanbanColumns(kanbanColumns, tenantId);
    }

    @Post('doc-kanban-titles')
    async updateDocKanbanTitles(@Request() req, @Body('docKanbanTitles') docKanbanTitles: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.settingsService.updateDocKanbanTitles(docKanbanTitles, tenantId);
    }
}
