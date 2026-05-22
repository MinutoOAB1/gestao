import { Controller, Get, Post, Body, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ValueChainService } from './value-chain.service';

@UseGuards(AuthGuard('jwt'))
@Controller('value-chain')
export class ValueChainController {
    constructor(private readonly valueChainService: ValueChainService) {}

    @Get()
    async getMap(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        
        const map = await this.valueChainService.findOne(tenantId);
        if (!map) {
            return { nodes: [], connections: [] };
        }
        return map;
    }

    @Post()
    async saveMap(@Request() req, @Body() body: { nodes: any[]; connections: any[] }) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        
        return this.valueChainService.upsert(tenantId, body);
    }
}
