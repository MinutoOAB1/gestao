import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinancialCategoryService {
    constructor(private prisma: PrismaService) {}

    async findAll(tenantId: string) {
        const categories = await this.prisma.financialCategory.findMany({
            where: { tenantId },
            include: { children: true },
            orderBy: { code: 'asc' }
        });

        // If no categories, seed defaults
        if (categories.length === 0) {
            await this.seedDefaults(tenantId);
            return this.prisma.financialCategory.findMany({
                where: { tenantId },
                include: { children: true },
                orderBy: { code: 'asc' }
            });
        }

        return categories;
    }

    async create(data: { name: string, type: string, parentId?: string, code?: string, defaultIss?: number, defaultIrrf?: number, defaultPis?: number, defaultCofins?: number }, tenantId: string) {
        return this.prisma.financialCategory.create({
            data: {
                ...data,
                tenantId
            }
        });
    }

    async seedDefaults(tenantId: string) {
        const incomeDefaults = [
            { name: 'Honorários', code: '1.1', iss: 5, children: ['Contratuais', 'Sucumbenciais', 'Consultoria'] },
            { name: 'Reembolsos', code: '1.2', children: ['Custas', 'Viagens'] },
            { name: 'Outras Receitas', code: '1.3', children: ['Rendimentos', 'Venda de Ativos'] }
        ];

        const expenseDefaults = [
            { name: 'Pessoal', code: '2.1', children: ['Salários', 'Pró-labore', 'Encargos'] },
            { name: 'Operacional', code: '2.2', children: ['Aluguel', 'Energia', 'Internet', 'Sistemas/Software'] },
            { name: 'Marketing', code: '2.3', children: ['Anúncios', 'Eventos'] },
            { name: 'Tributário', code: '2.4', children: ['Impostos', 'Taxas OAB'] }
        ];

        for (const cat of incomeDefaults) {
            const parent = await this.prisma.financialCategory.create({
                data: { 
                    name: cat.name, 
                    code: cat.code, 
                    type: 'INCOME', 
                    tenantId,
                    defaultIss: (cat as any).iss || 0 
                }
            });
            for (const [idx, child] of cat.children.entries()) {
                await this.prisma.financialCategory.create({
                    data: { 
                        name: child, 
                        code: `${cat.code}.${idx + 1}`, 
                        type: 'INCOME', 
                        parentId: parent.id, 
                        tenantId 
                    }
                });
            }
        }

        for (const cat of expenseDefaults) {
            const parent = await this.prisma.financialCategory.create({
                data: { name: cat.name, code: cat.code, type: 'EXPENSE', tenantId }
            });
            for (const [idx, child] of cat.children.entries()) {
                await this.prisma.financialCategory.create({
                    data: { 
                        name: child, 
                        code: `${cat.code}.${idx + 1}`, 
                        type: 'EXPENSE', 
                        parentId: parent.id, 
                        tenantId 
                    }
                });
            }
        }
    }
}
