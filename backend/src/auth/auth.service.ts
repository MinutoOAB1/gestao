import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { TenantContextService } from '../prisma/tenant-context.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private tenantContext: TenantContextService,
  ) { }

  async register(registerDto: RegisterDto) {
    return this.tenantContext.runWithTenant(null, true, async () => {
      const { name, password, companyName } = registerDto;
      const email = registerDto.email.toLowerCase().trim();

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new UnauthorizedException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create Tenant first
      const tenant = await this.prisma.tenant.create({
        data: {
          name: companyName,
          slug: companyName.toLowerCase().replace(/\s+/g, '-'),
        },
      });

      // Create User linked to Tenant
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          tenantId: tenant.id,
          role: 'ADMIN',
        },
      });

      // Return token so user is logged in after registration
      const payload = { email: user.email, sub: user.id, tenantId: user.tenantId, role: user.role };
      return {
        message: 'User registered successfully',
        access_token: this.jwtService.sign(payload),
        user: { id: user.id, name: user.name, email: user.email, tenantId: user.tenantId },
      };
    });
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    // Normal account login without tenant context to allow finding the user first
    return this.tenantContext.runWithTenant(null, true, async () => {
      const { password, twoFactorCode } = loginDto;
      const email = loginDto.email.toLowerCase().trim();

      console.log(`[AUTH] Login attempt for email: ${email}`);

      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          tenant: {
            include: {
              settings: true,
            }
          }
        }
      });

      if (!user) {
        console.log(`User not found: ${email}`);
        throw new UnauthorizedException(`DEBUG: Usuário ${email} não encontrado no banco de dados.`);
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log(`Password match for ${email}: ${passwordMatch}`);

      if (!passwordMatch) {
        throw new UnauthorizedException(`DEBUG: Senha incorreta para o usuário ${email}. Verifique se há maiúsculas/minúsculas.`);
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!twoFactorCode) {
          // Return indicator that 2FA is required
          return {
            requiresTwoFactor: true,
            message: 'Two-factor authentication code required',
          };
        }

        // Verify 2FA code
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorCode,
          window: 1, // Allow 1 step before/after for clock drift
        });

        if (!verified) {
          throw new UnauthorizedException('Invalid two-factor authentication code');
        }
      }

      // Login successful - record login history
      const deviceHash = this.generateDeviceHash(ipAddress, userAgent);

      try {
        // Check if this is a new device
        const existingDevice = await this.prisma.loginHistory.findFirst({
          where: {
            userId: user.id,
            deviceHash,
          },
        });

        // Record this login
        await this.prisma.loginHistory.create({
          data: {
            userId: user.id,
            ipAddress,
            userAgent,
            deviceHash,
            success: true,
          },
        });

        // If new device and user has login alerts enabled, send email
        if (!existingDevice && user.tenant.settings?.loginAlerts) {
          await this.emailService.sendLoginAlert(
            user.email,
            user.name,
            {
              ip: ipAddress || 'Unknown',
              userAgent: userAgent || 'Unknown',
            }
          ).catch(err => console.error('Failed to send login alert:', err));
        }
      } catch (logError) {
        console.error('SERVERLESS LOGGING ERROR (LoginHistory):', logError);
        // Non-blocking error - we still want the user to log in
      }

      const payload = { email: user.email, sub: user.id, tenantId: user.tenantId, role: user.role };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          avatar: user.avatar,
          twoFactorEnabled: user.twoFactorEnabled,
        },
      };
    });
  }

  private generateDeviceHash(ip?: string, userAgent?: string): string {
    const data = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  async forgotPassword(email: string) {
    return this.tenantContext.runWithTenant(null, true, async () => {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Don't reveal if user exists or not for security
        return { message: 'If an account exists, a reset link will be sent.' };
      }

      // Generate a reset token
      const resetToken = this.jwtService.sign(
        { email: user.email, sub: user.id, type: 'password_reset' },
        { expiresIn: '1h' }
      );

      // Send password reset email
      await this.emailService.sendPasswordReset(user.email, resetToken, user.name);

      return {
        message: 'If an account exists, a reset link will be sent.',
      };
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.tenantContext.runWithTenant(null, true, async () => {
      try {
        const decoded = this.jwtService.verify(token) as any;
        if (decoded.type !== 'password_reset') {
          throw new UnauthorizedException('Invalid reset token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
          where: { id: decoded.sub },
          data: { password: hashedPassword },
        });

        return { message: 'Password updated successfully' };
      } catch {
        throw new UnauthorizedException('Invalid or expired reset token');
      }
    });
  }

  // ============= 2FA Methods =============

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `SistemaJuridico:${user.email}`,
      length: 20,
    });

    // Store the secret temporarily (not enabled yet)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan the QR code with your authenticator app and verify with a code',
    };
  }

  async verify2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Two-factor setup not initiated');
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: 'Two-factor authentication enabled successfully' };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify the code before disabling
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: 'Two-factor authentication disabled successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        avatar: true,
        cpf: true,
        birthDate: true,
        bio: true,
        phone: true,
        mobile: true,
        address: true,
        oabNumber: true,
        oabState: true,
        specialties: true,
        twoFactorEnabled: true,
        permissions: true,
        createdAt: true
      }
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Get all users for a tenant
  async getUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        permissions: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create user within existing tenant (for admins adding team members)
  async createUserForTenant(
    tenantId: string,
    data: { name: string; email: string; password: string; role: string },
    invitedByName?: string,
  ) {
    console.log('Creating user for tenant:', { tenantId, email: data.email, role: data.role });

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      console.log('User already exists:', data.email, 'in tenant:', existingUser.tenantId);
      // If user exists in DIFFERENT tenant, update their tenant to join this one
      if (existingUser.tenantId !== tenantId) {
        console.log('Moving user to tenant:', tenantId);
        const updatedUser = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { tenantId, role: data.role || existingUser.role },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });
        return updatedUser;
      }
      // If already in same tenant, just return them
      return {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        createdAt: existingUser.createdAt,
        message: 'Usuário já existe no seu escritório'
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'LAWYER',
        tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Send welcome email with credentials (async, don't block)
    this.emailService.sendWelcomeEmail(
      data.email,
      data.name,
      data.password, // The original plain password before hashing
      invitedByName,
    ).catch(err => console.error('Failed to send welcome email:', err));

    return user;
  }

  // Update user
  async updateUser(userId: string, tenantId: string, data: {
    name?: string;
    role?: string;
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
    permissions?: string;
  }) {
    // Ensure user belongs to same tenant
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');

    // Build update data, handling birthDate conversion
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.cpf !== undefined) updateData.cpf = data.cpf;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.oabNumber !== undefined) updateData.oabNumber = data.oabNumber;
    if (data.oabState !== undefined) updateData.oabState = data.oabState;
    if (data.specialties !== undefined) updateData.specialties = data.specialties;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        cpf: true,
        birthDate: true,
        bio: true,
        phone: true,
        mobile: true,
        address: true,
        oabNumber: true,
        oabState: true,
        specialties: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Delete user
  async deleteUser(userId: string, tenantId: string) {
    // Ensure user belongs to same tenant
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  // Search users for @ mention autocomplete
  async searchUsers(tenantId: string, query: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        name: {
          contains: query,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: 10,
    });
  }

  // Get login history for user
  async getLoginHistory(userId: string) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        success: true,
      },
    });
  }

  // ==================== Storage Management ====================

  // Get storage info for a user
  async getStorageInfo(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    }) as any;
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const quotaMb = (user.storageQuotaGb || 10) * 1024;
    const usedMb = user.usedStorageMb || 0;
    const percentUsed = quotaMb > 0 ? Math.round((usedMb / quotaMb) * 100) : 0;
    const freeMb = Math.max(0, quotaMb - usedMb);

    return {
      userId: user.id,
      userName: user.name,
      quotaGb: user.storageQuotaGb || 1,
      quotaMb,
      usedMb,
      usedGb: parseFloat((usedMb / 1024).toFixed(2)),
      freeMb,
      freeGb: parseFloat((freeMb / 1024).toFixed(2)),
      percentUsed,
    };
  }

  // Update storage quota (admin only)
  async updateStorageQuota(userId: string, tenantId: string, quotaGb: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (quotaGb < 0) throw new BadRequestException('Quota não pode ser negativa');

    return this.prisma.user.update({
      where: { id: userId },
      data: { storageQuotaGb: quotaGb } as any,
    });
  }

  // Increment used storage (called when file is uploaded)
  async incrementUsedStorage(userId: string, tenantId: string, mb: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    }) as any;
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const quotaMb = (user.storageQuotaGb || 10) * 1024;
    const usedMb = user.usedStorageMb || 0;
    const newUsed = usedMb + mb;

    if (newUsed > quotaMb) {
      throw new BadRequestException(
        `Quota de armazenamento excedida. Disponível: ${(quotaMb - usedMb).toFixed(2)} MB`
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { usedStorageMb: newUsed } as any,
    });
  }

  // Decrement used storage (called when file is deleted)
  async decrementUsedStorage(userId: string, tenantId: string, mb: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    }) as any;
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const usedMb = user.usedStorageMb || 0;
    const newUsed = Math.max(0, usedMb - mb);

    return this.prisma.user.update({
      where: { id: userId },
      data: { usedStorageMb: newUsed } as any,
    });
  }
}
