import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly asaasService: AsaasService) {}

  @UseGuards(JwtAuthGuard)
  @Get('asaas/config')
  async getAsaasConfig(@Request() req) {
    return this.asaasService.getIntegrationStatus(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('asaas/link')
  async linkAsaasAccount(
    @Request() req, 
    @Body('apiKey') apiKey: string,
    @Body('walletId') walletId?: string
  ) {
    return this.asaasService.linkAccount(req.user.tenantId, apiKey, walletId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('asaas/create-subaccount')
  async createAsaasSubaccount(@Request() req, @Body() data: any) {
    return this.asaasService.createSubaccount(req.user.tenantId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('asaas/disconnect')
  async disconnectAsaas(@Request() req) {
    return this.asaasService.disconnect(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generatePayment(@Request() req, @Body() data: {
    clientId: string;
    amount: number;
    dueDate: string;
    description: string;
    billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
    financialRecordId?: string;
  }) {
    return this.asaasService.createPayment({
      ...data,
      tenantId: req.user.tenantId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async listInvoices(@Request() req) {
    return this.asaasService.findAllInvoices(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelInvoice(@Request() req, @Param('id') id: string) {
    return this.asaasService.cancelPayment(id, req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.asaasService.syncPaymentStatus(id);
  }

  // Public webhook for Asaas
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    const paymentId = body.event?.payment?.id || body.payment?.id || body.paymentId;
    if (paymentId) {
      return this.asaasService.syncPaymentStatus(paymentId);
    }
  }
}
