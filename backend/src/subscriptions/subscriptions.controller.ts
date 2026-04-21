import { Controller, Post, UseGuards, Request, Headers, Req, BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RawBodyRequest } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly stripeService: StripeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(@Request() req) {
    return this.stripeService.createCheckoutSession(req.user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifySession(@Request() req, @Body('sessionId') sessionId: string) {
    return this.stripeService.verifySession(req.user.tenantId, sessionId);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<ExpressRequest>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!req.rawBody) {
      throw new BadRequestException('Missing rawBody for stripe webhook');
    }
    
    return this.stripeService.handleWebhook(signature, req.rawBody as Buffer);
  }
}
