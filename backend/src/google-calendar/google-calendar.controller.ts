import { Controller, Get, Query, Res, UseGuards, Delete, Req } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

@Controller('google-calendar')
export class GoogleCalendarController {
  constructor(private readonly googleService: GoogleCalendarService) {}

  @UseGuards(JwtAuthGuard)
  @Get('auth-url')
  getAuthUrl(@Req() req) {
    return { url: this.googleService.getAuthUrl(req.user.sub) };
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') userId: string, @Res() res: Response) {
    try {
      await this.googleService.handleCallback(code, userId);
      // Redireciona de volta para a página de configurações no frontend
      return res.redirect(`${process.env.FRONTEND_URL}/app/settings?google=success`);
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/app/settings?google=error`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect')
  disconnect(@Req() req) {
    return this.googleService.disconnect(req.user.sub);
  }
}
