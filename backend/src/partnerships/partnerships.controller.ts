import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { PartnershipsService } from './partnerships.service';
import {
    CreatePartnershipDto,
    UpdatePartnershipDto,
    CreatePartnershipTransactionDto,
    UpdatePartnershipTransactionDto
} from './dto/partnership.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('partnerships')
export class PartnershipsController {
    constructor(private readonly partnershipsService: PartnershipsService) { }

    // Get all partnerships
    @Get()
    async findAll(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.findAll(tenantId);
    }

    // Get single partnership
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.findOne(id, tenantId);
    }

    // Create partnership
    @Post()
    async create(@Body() data: CreatePartnershipDto, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.create(tenantId, data);
    }

    // Update partnership
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: UpdatePartnershipDto, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.update(id, tenantId, data);
    }

    // Delete partnership
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.remove(id, tenantId);
    }

    // === Transactions ===

    // Get all transactions across all partners
    @Get('transactions/all')
    async findAllTransactions(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.findAllTransactions(tenantId);
    }

    // Get transactions for a partner
    @Get(':id/transactions')
    async findTransactions(@Param('id') partnerId: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.findTransactions(partnerId, tenantId);
    }

    // Create transaction
    @Post('transactions')
    async createTransaction(@Body() data: CreatePartnershipTransactionDto, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.createTransaction(tenantId, data);
    }

    // Update transaction
    @Patch('transactions/:id')
    async updateTransaction(
        @Param('id') id: string,
        @Body() data: UpdatePartnershipTransactionDto,
        @Request() req
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.updateTransaction(id, tenantId, data);
    }

    // Mark transaction as paid
    @Patch('transactions/:id/pay')
    async markTransactionPaid(@Param('id') id: string, @Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.partnershipsService.markTransactionPaid(id, tenantId);
    }

    // Get total pending repasses
    @Get('stats/pending-repasses')
    async getTotalPendingRepasses(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        const total = await this.partnershipsService.getTotalPendingRepasses(tenantId);
        return { total };
    }
}
