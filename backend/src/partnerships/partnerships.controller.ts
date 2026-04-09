import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { PartnershipsService } from './partnerships.service';
import {
    CreatePartnershipDto,
    UpdatePartnershipDto,
    CreatePartnershipTransactionDto,
    UpdatePartnershipTransactionDto
} from './dto/partnership.dto';

// Hardcoded tenant for now (same as other modules)
const DEFAULT_TENANT_ID = 'dev-tenant-001';

@Controller('partnerships')
export class PartnershipsController {
    constructor(private readonly partnershipsService: PartnershipsService) { }

    // Get all partnerships
    @Get()
    async findAll() {
        return this.partnershipsService.findAll(DEFAULT_TENANT_ID);
    }

    // Get single partnership
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.partnershipsService.findOne(id, DEFAULT_TENANT_ID);
    }

    // Create partnership
    @Post()
    async create(@Body() data: CreatePartnershipDto) {
        return this.partnershipsService.create(DEFAULT_TENANT_ID, data);
    }

    // Update partnership
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: UpdatePartnershipDto) {
        return this.partnershipsService.update(id, DEFAULT_TENANT_ID, data);
    }

    // Delete partnership
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.partnershipsService.remove(id, DEFAULT_TENANT_ID);
    }

    // === Transactions ===

    // Get all transactions across all partners
    @Get('transactions/all')
    async findAllTransactions() {
        return this.partnershipsService.findAllTransactions(DEFAULT_TENANT_ID);
    }

    // Get transactions for a partner
    @Get(':id/transactions')
    async findTransactions(@Param('id') partnerId: string) {
        return this.partnershipsService.findTransactions(partnerId, DEFAULT_TENANT_ID);
    }

    // Create transaction
    @Post('transactions')
    async createTransaction(@Body() data: CreatePartnershipTransactionDto) {
        return this.partnershipsService.createTransaction(DEFAULT_TENANT_ID, data);
    }

    // Update transaction
    @Patch('transactions/:id')
    async updateTransaction(
        @Param('id') id: string,
        @Body() data: UpdatePartnershipTransactionDto
    ) {
        return this.partnershipsService.updateTransaction(id, DEFAULT_TENANT_ID, data);
    }

    // Mark transaction as paid
    @Patch('transactions/:id/pay')
    async markTransactionPaid(@Param('id') id: string) {
        return this.partnershipsService.markTransactionPaid(id, DEFAULT_TENANT_ID);
    }

    // Get total pending repasses
    @Get('stats/pending-repasses')
    async getTotalPendingRepasses() {
        const total = await this.partnershipsService.getTotalPendingRepasses(DEFAULT_TENANT_ID);
        return { total };
    }
}
