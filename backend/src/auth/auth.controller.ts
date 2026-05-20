import { Controller, Post, Body, Get, UseGuards, Request, Param, Patch, Delete, Query, Headers, Req, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/create-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from './roles.enum';

// Helper to decode JWT payload without verification (just for user info extraction)
function decodeJwtPayload(token: string): any {
  try {
    if (!token) return null;
    const parts = token.replace('Bearer ', '').split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Post('auth/login')
  @HttpCode(200)
  login(@Body() loginDto: LoginDto, @Req() req: any) {
    // Extract IP and User-Agent for login tracking
    const ipAddress = req.headers?.['x-forwarded-for'] || req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers?.['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('forgot-password')
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  // ========== 2FA Endpoints ==========

  @Post('2fa/setup')
  @UseGuards(AuthGuard('jwt'))
  setup2FA(@Request() req) {
    return this.authService.setup2FA(req.user.sub);
  }

  @Post('2fa/verify')
  @UseGuards(AuthGuard('jwt'))
  verify2FA(@Request() req, @Body('code') code: string) {
    return this.authService.verify2FA(req.user.sub, code);
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard('jwt'))
  disable2FA(@Request() req, @Body('code') code: string) {
    return this.authService.disable2FA(req.user.sub, code);
  }

  // ========== Profile Endpoints ==========

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Get('login-history')
  @UseGuards(AuthGuard('jwt'))
  getLoginHistory(@Request() req) {
    return this.authService.getLoginHistory(req.user.sub);
  }

  // ========== User Management Endpoints ==========

  @Get('users')
  @UseGuards(AuthGuard('jwt'))
  async getUsers(@Request() req) {
    return this.authService.getUsers(req.user.tenantId);
  }

  @Post('users')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async createUser(@Request() req, @Body() body: { name: string; email: string; password: string; role: string }) {
    // Get the name of the user who is creating the new member
    const inviter = await this.authService.getProfile(req.user.sub);
    const inviterName = inviter?.name || 'Um administrador';
    return this.authService.createUserForTenant(req.user.tenantId, body, inviterName);
  }

  @Patch('users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async updateUser(@Request() req, @Param('id') id: string, @Body() body: {
    name?: string;
    role?: string;
    avatar?: string;
    permissions?: string;
  }) {
    return this.authService.updateUser(id, req.user.tenantId, body);
  }

  // Self-update profile (for the logged-in user to update their own profile)
  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Request() req, @Body() body: {
    name?: string;
    avatar?: string;
    cpf?: string;
    birthDate?: string;
    bio?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    oabNumber?: string;
    oabState?: string;
    specialties?: string;
  }) {
    return this.authService.updateUser(req.user.sub, req.user.tenantId, body);
  }

  @Delete('users/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async deleteUser(@Request() req, @Param('id') id: string) {
    return this.authService.deleteUser(id, req.user.tenantId);
  }

  // Search users for @ mention autocomplete (use header extraction for flexibility)
  @Get('users/search')
  async searchUsers(@Headers('authorization') authHeader: string, @Query('q') query: string) {
    const decoded = decodeJwtPayload(authHeader);
    if (!decoded?.tenantId) {
      return [];
    }
    return this.authService.searchUsers(decoded.tenantId, query || '');
  }

  // ========== Storage Management Endpoints ==========

  // Get storage info for a user
  @Get('users/:id/storage')
  @UseGuards(AuthGuard('jwt'))
  async getStorageInfo(@Request() req, @Param('id') id: string) {
    return this.authService.getStorageInfo(id, req.user.tenantId);
  }

  // Update storage quota (admin only)
  @Patch('users/:id/storage/quota')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async updateStorageQuota(@Request() req, @Param('id') id: string, @Body() body: { quotaGb: number }) {
    return this.authService.updateStorageQuota(id, req.user.tenantId, body.quotaGb);
  }

  // Increment used storage (for file uploads)
  @Post('users/:id/storage/increment')
  @UseGuards(AuthGuard('jwt'))
  async incrementStorage(@Request() req, @Param('id') id: string, @Body() body: { mb: number }) {
    return this.authService.incrementUsedStorage(id, req.user.tenantId, body.mb);
  }

  // Decrement used storage (for file deletions)
  @Post('users/:id/storage/decrement')
  @UseGuards(AuthGuard('jwt'))
  async decrementStorage(@Request() req, @Param('id') id: string, @Body() body: { mb: number }) {
    return this.authService.decrementUsedStorage(id, req.user.tenantId, body.mb);
  }
}
