import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Res, Query, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { FinancialService } from './financial.service';
import { CreateFinancialDto } from './dto/create-financial.dto';
import { UpdateFinancialDto } from './dto/update-financial.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';

// Strict Multi-tenancy enforcement
import { UnauthorizedException } from '@nestjs/common';

// Format currency for PDF
const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

@Controller('financial')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FinancialController {
    constructor(private readonly financialService: FinancialService) { }

    @Post()
    @Roles(Role.ADMIN, Role.LAWYER)
    create(@Request() req, @Body() createFinancialDto: CreateFinancialDto) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        const userId = req.user?.sub;
        const userName = req.user?.name;
        return this.financialService.create(createFinancialDto, tenantId, userId, userName);
    }

    @Get()
    findAll(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.financialService.findAll(tenantId);
    }


    @Get('stats')
    async getStats(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');

        const [
            totals,
            pendingTotals,
            paidTotals,
            pendingIncomeCount,
            dueTodayStats
        ] = await Promise.all([
            // Total amounts by type
            this.financialService.getTotalsByType(tenantId),
            // Pending amounts by type
            this.financialService.getTotalsByTypeAndStatus(tenantId, 'PENDING'),
            // Paid amounts by type
            this.financialService.getTotalsByTypeAndStatus(tenantId, 'PAID'),
            // Count of pending income
            this.financialService.countByStatus(tenantId, 'INCOME', 'PENDING'),
            // Due today stats
            this.financialService.getDueTodayStats(tenantId)
        ]);

        const totalIncome = totals.income;
        const totalExpense = totals.expense;
        const pendingIncome = pendingTotals.income;
        const pendingExpense = pendingTotals.expense;
        const paidIncome = paidTotals.income;
        const paidExpense = paidTotals.expense;

        return {
            income: totalIncome,
            expense: totalExpense,
            profit: totalIncome - totalExpense,
            balance: paidIncome - paidExpense,
            pendingIncome,
            pendingExpense,
            pendingIncomeCount,
            dueTodayCount: dueTodayStats.count,
            dueTodayAmount: dueTodayStats.amount,
            receivedPercent: (paidIncome + pendingIncome) > 0 
                ? Math.round((paidIncome / (paidIncome + pendingIncome)) * 100) 
                : 100,
            count: totals.count
        };
    }

    // Get urgent payments
    @Get('urgent')
    findUrgent(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.financialService.findUrgent(tenantId);
    }

    // Get upcoming payments (next 7 days)
    @Get('upcoming')
    findUpcoming(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.financialService.findUpcoming(tenantId);
    }

    // Get overdue payments
    @Get('overdue')
    findOverdue(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.financialService.findOverdue(tenantId);
    }

    @Get('report/dre')
    async getDRE(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');

        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();

        return this.financialService.getDREReport(tenantId, start, end);
    }

    @Get('report/audit')
    async getFinancialAudit(@Request() req) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.financialService.getFinancialAudit(tenantId);
    }

    @Get('report/pdf')
    @Get('export/pdf')
    @Get('export')
    async generatePdfReport(
        @Request() req,
        @Res() res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
        @Query('search') search?: string
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        const records = await this.financialService.findAll(tenantId);

        // Filter by date range, status and search query if provided
        let filteredRecords = records;
        if (startDate || endDate || status || search) {
            filteredRecords = records.filter((r: any) => {
                const recordDate = new Date(r.date);
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0,0,0,0);
                    if (recordDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23,59,59,999);
                    if (recordDate > end) return false;
                }
                
                if (status && status !== 'all') {
                    if (status === 'overdue') {
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        if (r.status === 'PAID' || recordDate >= today) return false;
                    } else if (status === 'pending' && r.status !== 'PENDING') return false;
                    else if (status === 'paid' && r.status !== 'PAID') return false;
                }
                
                if (search) {
                    const query = search.toLowerCase();
                    const descMatch = (r.description || '').toLowerCase().includes(query);
                    const catMatch = (r.category || '').toLowerCase().includes(query);
                    if (!descMatch && !catMatch) return false;
                }
                return true;
            });
        }

        // Calculate totals
        const totalIncome = filteredRecords.filter((r: any) => r.type === 'INCOME').reduce((acc: number, r: any) => acc + r.amount, 0);
        const totalExpense = filteredRecords.filter((r: any) => r.type === 'EXPENSE').reduce((acc: number, r: any) => acc + r.amount, 0);
        const balance = totalIncome - totalExpense;

        // Calculate additional statistics
        const paidIncome = filteredRecords.filter((r: any) => r.type === 'INCOME' && r.status === 'PAID').reduce((acc: number, r: any) => acc + r.amount, 0);
        const pendingIncome = filteredRecords.filter((r: any) => r.type === 'INCOME' && r.status === 'PENDING').reduce((acc: number, r: any) => acc + r.amount, 0);
        const paidExpense = filteredRecords.filter((r: any) => r.type === 'EXPENSE' && r.status === 'PAID').reduce((acc: number, r: any) => acc + r.amount, 0);
        const pendingExpense = filteredRecords.filter((r: any) => r.type === 'EXPENSE' && r.status === 'PENDING').reduce((acc: number, r: any) => acc + r.amount, 0);

        const urgentCount = filteredRecords.filter((r: any) => r.isUrgent).length;
        const recurringCount = filteredRecords.filter((r: any) => r.isRecurring && r.totalInstallments > 1).length;

        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        filteredRecords.forEach((r: any) => {
            if (!categoryBreakdown[r.category]) categoryBreakdown[r.category] = 0;
            categoryBreakdown[r.category] += r.amount;
        });

        // Generate HTML for PDF with enhanced design
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório Financeiro Detalhado</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #e2e8f0;
            min-height: 100vh;
            padding: 40px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        
        /* Header */
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .logo { 
            display: flex; 
            align-items: center; 
            gap: 12px;
        }
        .logo-icon { 
            width: 48px; 
            height: 48px; 
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        h1 { 
            font-size: 28px; 
            font-weight: 700;
            background: linear-gradient(90deg, #fff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .date { color: #64748b; font-size: 14px; text-align: right; }
        .period { color: #94a3b8; font-size: 12px; margin-top: 4px; }
        
        /* Summary Cards */
        .summary { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 20px; 
            margin-bottom: 40px; 
        }
        .card { 
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px; 
            padding: 24px;
            position: relative;
            overflow: hidden;
        }
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
        }
        .card.income::before { background: linear-gradient(90deg, #22c55e, #4ade80); }
        .card.expense::before { background: linear-gradient(90deg, #ef4444, #f87171); }
        .card.balance::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .card.pending::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
        
        .card h3 { 
            font-size: 11px; 
            color: #64748b; 
            text-transform: uppercase; 
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .card .value { 
            font-size: 28px; 
            font-weight: 700; 
        }
        .card .sub-value {
            font-size: 12px;
            color: #64748b;
            margin-top: 8px;
        }
        .income .value { color: #4ade80; }
        .expense .value { color: #f87171; }
        .balance .value { color: #60a5fa; }
        .pending .value { color: #fbbf24; }
        
        /* Stats Row */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }
        .stat-card .number {
            font-size: 32px;
            font-weight: 700;
            color: #fff;
        }
        .stat-card .label {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
        }
        
        /* Table */
        h2 { 
            font-size: 18px; 
            margin-bottom: 20px;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .table-container {
            background: rgba(30, 41, 59, 0.6);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
        }
        table { width: 100%; border-collapse: collapse; }
        th { 
            background: rgba(15, 23, 42, 0.8);
            color: #94a3b8;
            padding: 16px 20px; 
            text-align: left; 
            font-size: 11px; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        td { 
            padding: 16px 20px; 
            border-bottom: 1px solid rgba(255,255,255,0.05);
            font-size: 13px;
            color: #e2e8f0;
        }
        tr:last-child td { border-bottom: none; }
        tr:hover { background: rgba(255,255,255,0.02); }
        
        .type-income { color: #4ade80; }
        .type-expense { color: #f87171; }
        
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-paid { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
        .badge-pending { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        .badge-urgent { background: rgba(239, 68, 68, 0.2); color: #f87171; margin-left: 6px; }
        .badge-installment { background: rgba(59, 130, 246, 0.2); color: #60a5fa; margin-left: 6px; }
        
        .client-cell {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .client-avatar {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            color: #fff;
        }
        
        /* Footer */
        .footer { 
            margin-top: 40px; 
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: space-between;
            color: #64748b; 
            font-size: 12px; 
        }
        
        @media print {
            body { background: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <div class="logo-icon">📊</div>
                <div>
                    <h1>Relatório Financeiro</h1>
                    <p class="period">${startDate || endDate ? `Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}` : 'Todos os registros'}</p>
                </div>
            </div>
            <div>
                <p class="date">Gerado em: ${new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
                <p class="date">${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
        </div>

        <div class="summary">
            <div class="card income">
                <h3>Total de Receitas</h3>
                <div class="value">${formatBRL(totalIncome)}</div>
                <div class="sub-value">Recebido: ${formatBRL(paidIncome)} | Pendente: ${formatBRL(pendingIncome)}</div>
            </div>
            <div class="card expense">
                <h3>Total de Despesas</h3>
                <div class="value">${formatBRL(totalExpense)}</div>
                <div class="sub-value">Pago: ${formatBRL(paidExpense)} | Pendente: ${formatBRL(pendingExpense)}</div>
            </div>
            <div class="card balance">
                <h3>Saldo Líquido</h3>
                <div class="value">${formatBRL(balance)}</div>
                <div class="sub-value">${balance >= 0 ? '▲ Positivo' : '▼ Negativo'}</div>
            </div>
            <div class="card pending">
                <h3>A Receber</h3>
                <div class="value">${formatBRL(pendingIncome)}</div>
                <div class="sub-value">${filteredRecords.filter((r: any) => r.type === 'INCOME' && r.status === 'PENDING').length} transações pendentes</div>
            </div>
        </div>

        <div class="stats-row">
            <div class="stat-card">
                <div class="number">${filteredRecords.length}</div>
                <div class="label">Total de Transações</div>
            </div>
            <div class="stat-card">
                <div class="number" style="color: #f87171;">${urgentCount}</div>
                <div class="label">Pagamentos Urgentes</div>
            </div>
            <div class="stat-card">
                <div class="number" style="color: #60a5fa;">${recurringCount}</div>
                <div class="label">Parcelamentos Ativos</div>
            </div>
        </div>

        <h2>📋 Transações Detalhadas (${filteredRecords.length})</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Cliente</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th style="text-align: right;">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredRecords.map((r: any) => `
                        <tr>
                            <td>${new Date(r.date).toLocaleDateString('pt-BR')}</td>
                            <td>
                                ${r.description}
                                ${r.isUrgent ? '<span class="badge badge-urgent">URGENTE</span>' : ''}
                                ${r.totalInstallments > 1 ? `<span class="badge badge-installment">${r.currentInstallment || 1}/${r.totalInstallments}</span>` : ''}
                            </td>
                            <td>
                                ${r.client ? `
                                    <div class="client-cell">
                                        <div class="client-avatar">${r.client.name.charAt(0).toUpperCase()}</div>
                                        <span>${r.client.name}</span>
                                    </div>
                                ` : '<span style="color: #64748b;">—</span>'}
                            </td>
                            <td>${r.category}</td>
                            <td class="type-${r.type.toLowerCase()}">${r.type === 'INCOME' ? '↑ Receita' : '↓ Despesa'}</td>
                            <td><span class="badge badge-${r.status.toLowerCase()}">${r.status === 'PAID' ? 'Pago' : 'Pendente'}</span></td>
                            <td style="text-align: right;" class="type-${r.type.toLowerCase()}">${r.type === 'INCOME' ? '+' : '-'}${formatBRL(r.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>Sistema de Gestão Jurídica - Módulo Financeiro</div>
            <div>Relatório gerado automaticamente • ${new Date().toISOString()}</div>
        </div>
    </div>
</body>
</html>`;

        // Return HTML report (intended for browser printing)
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    }

    // Alias routes for PDF export - NestJS requires separate methods for multiple route paths
    @Get('export/pdf')
    async exportPdf(
        @Request() req,
        @Res() res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
        @Query('search') search?: string
    ) {
        return this.generatePdfReport(req, res, startDate, endDate, status, search);
    }

    @Get('export')
    async exportFinancial(
        @Request() req,
        @Res() res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
        @Query('search') search?: string
    ) {
        return this.generatePdfReport(req, res, startDate, endDate, status, search);
    }

    @Post(':id/cancel')
    @Roles(Role.ADMIN, Role.LAWYER)
    async cancel(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        const userId = req.user?.sub;
        const userName = req.user?.name;
        return this.financialService.cancel(id, tenantId, userId, userName);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        return this.financialService.findOne(id, tenantId);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.LAWYER)
    update(@Request() req, @Param('id') id: string, @Body() updateFinancialDto: UpdateFinancialDto) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        const userId = req.user?.sub;
        const userName = req.user?.name;
        return this.financialService.update(id, updateFinancialDto, tenantId, userId, userName);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.LAWYER)
    remove(@Request() req, @Param('id') id: string) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException('Tenant ID not found in session');
        const userId = req.user?.sub;
        const userName = req.user?.name;
        return this.financialService.remove(id, tenantId, userId, userName);
    }
}
