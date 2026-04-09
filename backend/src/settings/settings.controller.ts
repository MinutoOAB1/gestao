import { Controller, Get, Post, Body, Request, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from './settings.service';

const DEV_TENANT_ID = 'dev-tenant-001';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Post()
    upsert(@Request() req, @Body() settingsDto: any) {
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
        return this.settingsService.upsert(settingsDto, tenantId);
    }

    @Get()
    findOne(@Request() req) {
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
        return this.settingsService.findOne(tenantId);
    }

    // Get storage info for the tenant/account
    @Get('storage')
    async getStorage(@Request() req) {
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
        return this.settingsService.getStorageInfo(tenantId);
    }
    
}
