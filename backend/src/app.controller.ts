import { Controller, Get, Post, Body, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: any, @Req() req: any) {
    // Safely extract fields with null guard
    const safeBody = body || {};
    // Accept 'username' as alias for 'email' (some test frameworks use this)
    const loginDto = {
      email: safeBody.email || safeBody.username || '',
      password: safeBody.password || '',
      twoFactorCode: safeBody.twoFactorCode || safeBody.two_factor_code,
    };
    const ip = req.headers?.['x-forwarded-for'] || req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers?.['user-agent'];
    return this.authService.login(loginDto, ip, userAgent);
  }
}
