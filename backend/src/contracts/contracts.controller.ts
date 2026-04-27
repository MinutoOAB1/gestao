import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards, UnauthorizedException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(AuthGuard('jwt'))
@Controller('contracts')
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Post('upload-signature')
    @UseInterceptors(FileInterceptor('file'))
    uploadSignature(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { title: string; signerName: string; signerEmail: string },
        @Req() req: any
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.requestManualSignature(file, body, tenantId);
    }

    @Post()
    create(@Body() createContractDto: {
        number: string;
        title: string;
        description?: string;
        status?: string;
        value: number;
        clientId?: string;
    }, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.create(createContractDto, tenantId);
    }

    @Get()
    findAll(@Query('status') status: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.findAll(tenantId, status);
    }

    @Get('stats')
    getStats(@Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.getStats(tenantId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
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
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.update(id, updateContractDto, tenantId);
    }

    @Post(':id/request-signature')
    requestSignature(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.requestSignature(id, tenantId);
    }

    @Get(':id/sync-signature')
    syncSignature(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.syncSignatureStatus(id, tenantId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.remove(id, tenantId);
    }
}
