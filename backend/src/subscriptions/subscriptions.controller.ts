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

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<ExpressRequest>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    
    // In NestJS, to get the raw body we need special configuration.
    // Assuming the app is configured to provide rawBody.
    return this.stripeService.handleWebhook(signature, req.rawBody);
  }
}
