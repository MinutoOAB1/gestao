import { Controller, Get, Post, Body, Param, Delete, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('timesheet')
export class TimesheetController {
    constructor(private readonly timesheetService: TimesheetService) { }

    @Post()
    async create(@Request() req, @Body() createTimeEntryDto: any) {
        const tenantId = req.user?.tenantId;
        const userId = req.user?.sub || req.user?.id;

        if (!tenantId || !userId) {
            throw new UnauthorizedException('Authentication context incomplete');
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
    findAll(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.timesheetService.findAll(tenantId);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.timesheetService.remove(id, tenantId);
    }
}

