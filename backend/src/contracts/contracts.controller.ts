import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req } from '@nestjs/common';
import { ContractsService } from './contracts.service';

const DEV_TENANT_ID = 'dev-tenant-001';

@Controller('contracts')
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Post()
    create(@Body() createContractDto: {
        number: string;
        title: string;
        description?: string;
        status?: string;
        value: number;
        clientId?: string;
    }, @Req() req: any) {
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
        return this.contractsService.create(createContractDto, tenantId);
    }

    @Get()
    findAll(@Query('status') status: string, @Req() req: any) {
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
        return this.contractsService.findAll(tenantId, status);
    }

    @Get('stats')
    getStats(@Req() req: any) {
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
        return this.contractsService.getStats(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
        return this.contractsService.findOne(id, tenantId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateContractDto: {
        number?: string;
        title?: string;
        description?: string;
        status?: string;
        value?: number;
        clientId?: string;
    }, @Req() req: any) {
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
        return this.contractsService.update(id, updateContractDto, tenantId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId || DEV_TENANT_ID;
        return this.contractsService.remove(id, tenantId);
    }
}
