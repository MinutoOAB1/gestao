import { Controller, Post, Body, Get, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { PortalService } from './portal.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('portal')
export class PortalController {
    constructor(private readonly portalService: PortalService) {}

    @Post('login')
    async login(@Body() body: any) {
        return this.portalService.login(body.email, body.password);
    }

    @Get('dashboard')
    @UseGuards(AuthGuard('jwt'))
    async getDashboard(@Request() req) {
        if (req.user.role !== 'CLIENT') throw new UnauthorizedException('Acesso negado');
        return this.portalService.getDashboard(req.user.sub, req.user.tenantId);
    }

    @Get('processes')
    @UseGuards(AuthGuard('jwt'))
    async getProcesses(@Request() req) {
        if (req.user.role !== 'CLIENT') throw new UnauthorizedException('Acesso negado');
        return this.portalService.getProcesses(req.user.sub, req.user.tenantId);
    }

    @Get('processes/:id')
    @UseGuards(AuthGuard('jwt'))
    async getProcessDetails(@Request() req, @Param('id') id: string) {
        if (req.user.role !== 'CLIENT') throw new UnauthorizedException('Acesso negado');
        return this.portalService.getProcessDetails(id, req.user.sub, req.user.tenantId);
    }
}
