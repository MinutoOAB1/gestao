import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly asaasService: AsaasService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generatePayment(@Request() req, @Body() data: {
    clientId: string;
    amount: number;
    dueDate: string;
    description: string;
    billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
  }) {
    return this.asaasService.createPayment({
      ...data,
      tenantId: req.user.tenantId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.asaasService.syncPaymentStatus(id);
  }

  // Public webhook for Asaas
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    const paymentId = body.event?.payment?.id || body.payment?.id;
    if (paymentId) {
      return this.asaasService.syncPaymentStatus(paymentId);
    }
  }
}
