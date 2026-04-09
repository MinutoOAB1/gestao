import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditLogService, AuditAction } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    // Get recent audit logs (Admin only)
    @Get()
    @Roles(Role.ADMIN)
    async getRecentLogs(
        @Request() req: any,
        @Query('limit') limit?: string,
    ) {
        const tenantId = req.user.tenantId;
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        return this.auditLogService.getRecentLogs(tenantId, parsedLimit);
    }

    // Search audit logs with filters (Admin only)
    @Get('search')
    @Roles(Role.ADMIN)
    async searchLogs(
        @Request() req: any,
        @Query('action') action?: string,
        @Query('entityType') entityType?: string,
        @Query('userId') userId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const tenantId = req.user.tenantId;

        return this.auditLogService.searchLogs(tenantId, {
            action: action as AuditAction,
            entityType,
            userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    // Get logs for a specific entity (Admin only)
    @Get('entity')
    @Roles(Role.ADMIN)
    async getLogsForEntity(
        @Request() req: any,
        @Query('entityType') entityType: string,
        @Query('entityId') entityId: string,
    ) {
        const tenantId = req.user.tenantId;
        return this.auditLogService.getLogsForEntity(entityType, entityId, tenantId);
    }

    // Get logs for a specific user (Admin only)
    @Get('user/:userId')
    @Roles(Role.ADMIN)
    async getLogsForUser(
        @Request() req: any,
        @Query('userId') userId: string,
    ) {
        const tenantId = req.user.tenantId;
        return this.auditLogService.getLogsForUser(userId, tenantId);
    }
}
