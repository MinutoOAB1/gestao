import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ValueChainService } from './value-chain.service';

@UseGuards(AuthGuard('jwt'))
@Controller('value-chain')
export class ValueChainController {
    constructor(private readonly valueChainService: ValueChainService) {}

    @Get()
    async getAll(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.valueChainService.findAll(tenantId);
    }

    @Get(':id')
    async getOne(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.valueChainService.findOne(id, tenantId);
    }

    @Post()
    async create(@Request() req, @Body() body: { name: string; description?: string; nodes?: any[]; connections?: any[] }) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.valueChainService.create(tenantId, body);
    }

    @Put(':id')
    async update(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string; nodes?: any[]; connections?: any[] }
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.valueChainService.update(id, tenantId, body);
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.valueChainService.delete(id, tenantId);
    }
}
