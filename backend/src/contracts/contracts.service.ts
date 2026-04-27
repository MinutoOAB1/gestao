import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutentiqueService } from './autentique.service';

@Injectable()
export class ContractsService {
    constructor(
        private prisma: PrismaService,
        private autentique: AutentiqueService
    ) { }

    async create(data: {
        number: string;
        title: string;
        description?: string;
        status?: string;
        value: number;
        clientId?: string;
    }, tenantId: string) {
        return this.prisma.contract.create({
            data: {
                ...data,
                tenantId,
            },
            include: {
                client: true,
            },
        });
    }

    async findAll(tenantId: string, status?: string) {
        const where: any = { tenantId };
        if (status && status !== 'ALL') {
            where.status = status;
        }
        return this.prisma.contract.findMany({
            where,
            include: {
                client: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.prisma.contract.findFirst({
            where: { id, tenantId },
            include: {
                client: true,
            },
        });
    }

    async update(id: string, data: {
        number?: string;
        title?: string;
        description?: string;
        status?: string;
        value?: number;
        clientId?: string;
    }, tenantId: string) {
        return this.prisma.contract.updateMany({
            where: { id, tenantId },
            data,
        });
    }

    async remove(id: string, tenantId: string) {
        return this.prisma.contract.deleteMany({
            where: { id, tenantId },
        });
    }

    async getStats(tenantId: string) {
        const contracts = await this.prisma.contract.findMany({
            where: { tenantId },
        });

        const initiated = contracts.filter(c => c.status === 'INITIATED').length;
        const made = contracts.filter(c => c.status === 'MADE').length;
        const signed = contracts.filter(c => c.status === 'SIGNED').length;
        const closed = contracts.filter(c => c.status === 'CLOSED').length;
        const cancelled = contracts.filter(c => c.status === 'CANCELLED').length;

        const estimatedRevenue = contracts
            .filter(c => c.status !== 'CANCELLED')
            .reduce((acc, c) => acc + c.value, 0);

        return {
            initiated,
            made,
            signed,
            closed,
            cancelled,
            total: contracts.length,
            estimatedRevenue,
        };
    }

    async requestSignature(id: string, tenantId: string) {
        // Check signature limit (max 10)
        const signatureCount = await this.prisma.contract.count({
            where: {
                tenantId,
                autentiqueId: { not: null }
            }
        });

        if (signatureCount >= 10) {
            throw new BadRequestException('Limite de 10 assinaturas atingido para esta conta. Entre em contato com o suporte para aumentar seu limite.');
        }

        const contract = await this.prisma.contract.findFirst({
            where: { id, tenantId },
            include: { client: true },
        });

        if (!contract) throw new NotFoundException('Contrato não encontrado');
        if (!contract.client?.email) throw new BadRequestException('O cliente vinculado a este contrato não possui e-mail cadastrado.');

        const apiKey = process.env.AUTENTIQUE_API_KEY;

        if (!apiKey) {
            throw new BadRequestException('Serviço de assinatura temporariamente indisponível (Erro de Configuração).');
        }

        // Generate simple text-based content
        const content = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS

Título: ${contract.title}
Número: ${contract.number}
Valor: R$ ${contract.value.toFixed(2)}
Data: ${contract.createdAt.toLocaleDateString('pt-BR')}

CONTRATANTE: ${contract.client.name} (E-mail: ${contract.client.email})

DESCRIÇÃO DOS SERVIÇOS:
${contract.description || 'Nenhuma descrição detalhada fornecida.'}

Este documento é uma solicitação de assinatura gerada via Plataforma Advus.
        `;

        const fileBuffer = Buffer.from(content);

        const result = await this.autentique.createSignatureRequest(
            apiKey,
            contract.title,
            contract.client.email,
            fileBuffer
        );

        // Update contract status
        await this.prisma.contract.update({
            where: { id },
            data: {
                autentiqueId: result.id,
                autentiqueStatus: 'PENDING',
                status: 'MADE'
            }
        });

        return result;
    }

    async syncSignatureStatus(id: string, tenantId: string) {
        const contract = await this.prisma.contract.findFirst({
            where: { id, tenantId },
        });

        if (!contract?.autentiqueId) return;

        const apiKey = process.env.AUTENTIQUE_API_KEY;
        if (!apiKey) return;

        const doc = await this.autentique.getDocumentStatus(apiKey, contract.autentiqueId);
        
        if (doc.status === 'SIGNED' || doc.status === 'COMPLETED') {
            await this.prisma.contract.update({
                where: { id },
                data: {
                    autentiqueStatus: 'SIGNED',
                    status: 'SIGNED'
                }
            });
        }

        return doc;
    }
}
