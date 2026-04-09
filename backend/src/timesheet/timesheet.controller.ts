import { Controller, Get, Post, Body, Param, Delete, Request, Headers } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';

const DEV_TENANT_ID = 'dev-tenant-001';

// Helper to decode JWT payload
function decodeJwtPayload(token: string): any {
    try {
        if (!token) return null;
        const parts = token.replace('Bearer ', '').split('.');
        if (parts.length !== 3) return null;
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

@Controller('timesheet')
export class TimesheetController {
    constructor(private readonly timesheetService: TimesheetService) { }

    @Post()
    async create(@Headers('authorization') authHeader: string, @Body() createTimeEntryDto: any) {
        const decoded = decodeJwtPayload(authHeader);
        const tenantId = decoded?.tenantId || DEV_TENANT_ID;
        const userId = decoded?.sub;

        if (!userId) {
            return { error: 'User not authenticated', success: false };
        }

        try {
            const result = await this.timesheetService.create(createTimeEntryDto, tenantId, userId);
            return result;
        } catch (error: any) {
            console.error('Timesheet create error:', error);
            return { error: error.message, success: false };
        }
    }

    @Get()
    findAll(@Headers('authorization') authHeader: string) {
        const decoded = decodeJwtPayload(authHeader);
        const tenantId = decoded?.tenantId || DEV_TENANT_ID;
        return this.timesheetService.findAll(tenantId);
    }

    @Delete(':id')
    remove(@Headers('authorization') authHeader: string, @Param('id') id: string) {
        const decoded = decodeJwtPayload(authHeader);
        const tenantId = decoded?.tenantId || DEV_TENANT_ID;
        return this.timesheetService.remove(id, tenantId);
    }
}

