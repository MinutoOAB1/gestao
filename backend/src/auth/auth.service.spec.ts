import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
    let service: AuthService;
    let prisma: PrismaService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        tenant: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        loginHistory: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const mockJwtService = {
        signAsync: jest.fn().mockResolvedValue('mock-token'),
        sign: jest.fn().mockReturnValue('mock-token'),
    };

    const mockEmailService = {
        sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
        sendNewDeviceLoginAlert: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
                { provide: EmailService, useValue: mockEmailService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('validateUser', () => {
        it('should return user data without password when credentials are valid', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: hashedPassword,
                name: 'Test User',
                role: 'LAWYER',
                tenantId: 'tenant-1',
                twoFactorEnabled: false,
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.validateUser('test@example.com', 'password123');

            expect(result).toBeDefined();
            expect(result.email).toBe('test@example.com');
            expect(result.password).toBeUndefined();
        });

        it('should return null when user is not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await service.validateUser('nonexistent@example.com', 'password');

            expect(result).toBeNull();
        });

        it('should return null when password is incorrect', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: hashedPassword,
                name: 'Test User',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await service.validateUser('test@example.com', 'wrongpassword');

            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        it('should return access token and user data on successful login', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'LAWYER',
                tenantId: 'tenant-1',
                twoFactorEnabled: false,
            };

            mockPrismaService.loginHistory.findMany.mockResolvedValue([]);
            mockPrismaService.loginHistory.create.mockResolvedValue({});

            const result = await service.login(mockUser, '127.0.0.1', 'Mozilla/5.0');

            expect(result).toHaveProperty('access_token');
            expect(result.user.email).toBe('test@example.com');
            expect(mockJwtService.signAsync).toHaveBeenCalled();
        });
    });

    describe('register', () => {
        it('should create a new tenant and admin user', async () => {
            const registerDto = {
                email: 'newuser@example.com',
                password: 'StrongPassword123!',
                name: 'New User',
                officeName: 'New Office',
            };

            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.tenant.create.mockResolvedValue({
                id: 'new-tenant-id',
                name: 'New Office',
                slug: 'new-office',
            });
            mockPrismaService.user.create.mockResolvedValue({
                id: 'new-user-id',
                email: registerDto.email,
                name: registerDto.name,
                role: 'ADMIN',
                tenantId: 'new-tenant-id',
            });

            const result = await service.register(registerDto);

            expect(result).toHaveProperty('access_token');
            expect(mockPrismaService.tenant.create).toHaveBeenCalled();
            expect(mockPrismaService.user.create).toHaveBeenCalled();
        });

        it('should throw error when email already exists', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({ id: '1' });

            await expect(
                service.register({
                    email: 'existing@example.com',
                    password: 'password',
                    name: 'Test',
                    officeName: 'Office',
                }),
            ).rejects.toThrow();
        });
    });
});
