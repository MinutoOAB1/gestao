import { Test, TestingModule } from '@nestjs/testing';
import { FinancialService } from './financial.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FinancialService', () => {
    let service: FinancialService;

    const mockPrismaService = {
        financialRecord: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            aggregate: jest.fn(),
        },
        partnership: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        partnershipTransaction: {
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FinancialService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<FinancialService>(FinancialService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all financial records for a tenant', async () => {
            const mockRecords = [
                { id: '1', type: 'INCOME', amount: 1000, description: 'Payment', tenantId: 'tenant-1' },
                { id: '2', type: 'EXPENSE', amount: 500, description: 'Office supplies', tenantId: 'tenant-1' },
            ];

            mockPrismaService.financialRecord.findMany.mockResolvedValue(mockRecords);

            const result = await service.findAll('tenant-1');

            expect(result).toHaveLength(2);
            expect(mockPrismaService.financialRecord.findMany).toHaveBeenCalledWith({
                where: { tenantId: 'tenant-1' },
                include: { client: true },
                orderBy: { date: 'desc' },
            });
        });
    });

    describe('create', () => {
        it('should create a new financial record', async () => {
            const createDto = {
                type: 'INCOME',
                category: 'Honorários',
                amount: 5000,
                description: 'Legal fees',
                date: new Date(),
            };

            const mockCreated = { id: '1', ...createDto, tenantId: 'tenant-1' };
            mockPrismaService.financialRecord.create.mockResolvedValue(mockCreated);

            const result = await service.create(createDto, 'tenant-1');

            expect(result.id).toBe('1');
            expect(result.amount).toBe(5000);
            expect(mockPrismaService.financialRecord.create).toHaveBeenCalled();
        });

        it('should create recurring records when isRecurring is true', async () => {
            const createDto = {
                type: 'EXPENSE',
                category: 'Aluguel',
                amount: 2000,
                description: 'Monthly rent',
                isRecurring: true,
                recurrenceType: 'MENSAL',
                totalInstallments: 12,
            };

            mockPrismaService.financialRecord.create.mockResolvedValue({ id: '1', ...createDto });

            await service.create(createDto, 'tenant-1');

            // Should create multiple records for recurring payments
            expect(mockPrismaService.financialRecord.create).toHaveBeenCalled();
        });
    });

    describe('getSummary', () => {
        it('should calculate correct financial summary', async () => {
            const mockRecords = [
                { type: 'INCOME', amount: 10000, status: 'PAID' },
                { type: 'INCOME', amount: 5000, status: 'PENDING' },
                { type: 'EXPENSE', amount: 3000, status: 'PAID' },
                { type: 'EXPENSE', amount: 1000, status: 'PENDING' },
            ];

            mockPrismaService.financialRecord.findMany.mockResolvedValue(mockRecords);

            const result = await service.getSummary('tenant-1');

            expect(result.totalIncome).toBe(15000);
            expect(result.totalExpenses).toBe(4000);
            expect(result.balance).toBe(11000);
            expect(result.pendingIncome).toBe(5000);
            expect(result.pendingExpenses).toBe(1000);
        });
    });

    describe('update', () => {
        it('should update a financial record', async () => {
            const updateDto = { amount: 6000, description: 'Updated payment' };
            const existingRecord = { id: '1', tenantId: 'tenant-1', amount: 5000 };

            mockPrismaService.financialRecord.findUnique.mockResolvedValue(existingRecord);
            mockPrismaService.financialRecord.update.mockResolvedValue({ ...existingRecord, ...updateDto });

            const result = await service.update('1', updateDto, 'tenant-1');

            expect(result.amount).toBe(6000);
            expect(mockPrismaService.financialRecord.update).toHaveBeenCalled();
        });

        it('should throw error when record not found', async () => {
            mockPrismaService.financialRecord.findUnique.mockResolvedValue(null);

            await expect(
                service.update('nonexistent', { amount: 1000 }, 'tenant-1'),
            ).rejects.toThrow();
        });
    });

    describe('delete', () => {
        it('should delete a financial record', async () => {
            const existingRecord = { id: '1', tenantId: 'tenant-1' };

            mockPrismaService.financialRecord.findUnique.mockResolvedValue(existingRecord);
            mockPrismaService.financialRecord.delete.mockResolvedValue(existingRecord);

            await service.remove('1', 'tenant-1');

            expect(mockPrismaService.financialRecord.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });
    });
});
