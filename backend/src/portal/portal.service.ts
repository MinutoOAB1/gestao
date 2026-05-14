import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PortalService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) {}

    async login(email: string, passwordPlain: string) {
        const access = await this.prisma.clientPortalAccess.findUnique({
            where: { email },
            include: { client: true }
        });

        if (!access) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        const passwordMatch = await bcrypt.compare(passwordPlain, access.passwordHash);
        if (!passwordMatch) {
            throw new UnauthorizedException('Credenciais inválidas.');
        }

        const payload = { 
            sub: access.clientId, 
            email: access.email, 
            tenantId: access.client.tenantId,
            role: 'CLIENT' 
        };
        const token = this.jwtService.sign(payload);

        return {
            token,
            client: {
                id: access.client.id,
                name: access.client.name,
                email: access.client.email,
                tenantId: access.client.tenantId
            }
        };
    }

    async getDashboard(clientId: string, tenantId: string) {
        const processes = await this.prisma.process.findMany({
            where: { clientId, tenantId },
            include: {
                updates: { orderBy: { date: 'desc' }, take: 5 }
            }
        });

        const activeProcesses = processes.filter(p => p.status === 'OPEN' || p.status === 'ATIVO');
        const closedProcesses = processes.filter(p => p.status !== 'OPEN' && p.status !== 'ATIVO');

        return {
            activeProcesses: activeProcesses.length,
            closedProcesses: closedProcesses.length,
            totalProcesses: processes.length,
            recentUpdates: processes.flatMap(p => p.updates.map(u => ({ ...u, processTitle: p.title, processNumber: p.number }))).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)
        };
    }

    async getProcesses(clientId: string, tenantId: string) {
        return this.prisma.process.findMany({
            where: { clientId, tenantId },
            include: { updates: { orderBy: { date: 'desc' }, take: 1 } },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getProcessDetails(processId: string, clientId: string, tenantId: string) {
        const process = await this.prisma.process.findFirst({
            where: { id: processId, clientId, tenantId },
            include: {
                updates: { orderBy: { date: 'desc' } },
                // Assuming process documents might need filtering, we return all here
            }
        });

        if (!process) throw new NotFoundException('Processo não encontrado');

        return process;
    }
}
