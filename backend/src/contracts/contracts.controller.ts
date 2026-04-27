import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards, UnauthorizedException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('contracts')
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Post('webhook')
    handleAutentiqueWebhook(@Body() body: any) {
        return this.contractsService.handleWebhook(body);
    }

    @UseGuards(AuthGuard('jwt'))
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

    @UseGuards(AuthGuard('jwt'))
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

    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll(@Query('status') status: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.findAll(tenantId, status);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('stats')
    getStats(@Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.getStats(tenantId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    findOne(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.findOne(id, tenantId);
    }

    @UseGuards(AuthGuard('jwt'))
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

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/request-signature')
    requestSignature(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.requestSignature(id, tenantId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':id/sync-signature')
    syncSignature(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.syncSignatureStatus(id, tenantId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.contractsService.remove(id, tenantId);
    }
}
