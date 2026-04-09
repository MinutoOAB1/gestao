import { Controller, Get, Request, Headers } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEV_TENANT_ID = 'dev-tenant-001';

// Helper to decode JWT payload
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

@Controller('dashboard')
export class DashboardController {
    constructor(private prisma: PrismaService) { }

    @Get('stats')
    async getStats(@Request() req, @Headers('authorization') authHeader: string) {
        // Extract tenantId from JWT if req.user is not populated
        const decoded = decodeJwtPayload(authHeader || '');
        const tenantId = req.user?.tenantId || decoded?.tenantId || DEV_TENANT_ID;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [
            upcomingDeadlines,
            newProcesses,
            totalProcesses,
            totalClients,
            upcomingHearings,
            activeClients,
            pendingPayments,
            recentUpdates,
            urgentPayments,
            newComments,
            unreadNotifications,
            recentProcessComments,
            recentClientNotes,
            pendingActions,
        ] = await Promise.all([
            // Prazos vencendo em 15 dias (Processos + Eventos)
            Promise.all([
                this.prisma.process.count({
                    where: {
                        tenantId,
                        deadline: { gte: now, lte: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) }
                    }
                }),
                this.prisma.event.count({
                    where: {
                        tenantId,
                        OR: [
                            { type: { contains: 'prazo', mode: 'insensitive' } },
                            { title: { contains: 'prazo', mode: 'insensitive' } }
                        ],
                        start: { gte: now, lte: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) }
                    }
                })
            ]).then(([p, e]) => p + e),
            // Processos criados esta semana
            this.prisma.process.count({
                where: {
                    tenantId,
                    createdAt: { gte: weekAgo }
                }
            }),
            // Total de processos
            this.prisma.process.count({
                where: { tenantId }
            }),
            // Total de clientes
            this.prisma.client.count({
                where: { tenantId }
            }),
            // Audiências próximas (do módulo de agenda)
            this.prisma.event.findMany({
                where: {
                    tenantId,
                    type: 'hearing',
                    start: { gte: now }
                },
                take: 5,
                orderBy: { start: 'asc' }
            }),
            // Clientes ativos (Todos menos os inativos/ex-clientes)
            this.prisma.client.count({
                where: {
                    tenantId,
                    NOT: {
                        status: {
                            in: ['INATIVO', 'Inativo', 'inativo', 'EX-CLIENTE', 'Ex-Cliente', 'ARQUIVADO', 'Arquivado'],
                            mode: 'insensitive'
                        }
                    }
                }
            }),
            // Total pendente de recebimento
            this.prisma.financialRecord.aggregate({
                where: {
                    tenantId,
                    status: 'PENDING',
                    type: 'INCOME'
                },
                _sum: { amount: true }
            }),
            // Andamentos recentes
            this.prisma.processUpdate.findMany({
                where: {
                    process: { tenantId }
                },
                include: {
                    process: { select: { number: true, title: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            }),
            // Pagamentos urgentes (marcados como isUrgent = true e pendentes)
            this.prisma.financialRecord.findMany({
                where: {
                    tenantId,
                    isUrgent: true,
                    status: 'PENDING'
                },
                orderBy: { date: 'asc' },
                take: 10
            }),
            // Novos comentários (Processos e Documentos) nos últimos 7 dias
            this.prisma.processComment.count({
                where: {
                    process: { tenantId },
                    createdAt: { gte: weekAgo }
                }
            }),
            // Notificações não lidas
            this.prisma.notification.count({
                where: {
                    tenantId,
                    isRead: false
                }
            }),
            // Últimos 5 comentários em processos (com relação ao título do processo)
            this.prisma.processComment.findMany({
                where: { process: { tenantId } },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    process: { select: { title: true, number: true } }
                }
            }),
            // Últimas 5 notas em clientes (com relação ao nome do cliente)
            this.prisma.clientNote.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    client: { select: { name: true } }
                }
            }),
            // Ações Pendentes
            Promise.all([
                // Processos sem atualização há mais de 30 dias
                this.prisma.process.findMany({
                    where: {
                        tenantId,
                        status: 'OPEN',
                        updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                    },
                    select: { id: true, title: true, number: true },
                    take: 3
                }),
                // Clientes com dados de contato faltando
                this.prisma.client.findMany({
                    where: {
                        tenantId,
                        OR: [
                            { email: null },
                            { phone: null },
                            { email: '' },
                            { phone: '' }
                        ]
                    },
                    select: { id: true, name: true },
                    take: 3
                })
            ]).then(([oldProcesses, incompleteClients]) => ({
                oldProcesses,
                incompleteClients
            }))
        ]);

        return {
            upcomingDeadlines,
            newProcesses,
            totalProcesses,
            totalClients,
            upcomingHearings,
            activeClients,
            pendingPayments: pendingPayments._sum.amount || 0,
            urgentPayments,
            recentUpdates,
            newComments,
            unreadNotifications,
            recentProcessComments,
            recentClientNotes,
            pendingActions,
        };
    }

    @Get('team-performance')
    async getTeamPerformance(@Request() req, @Headers('authorization') authHeader: string) {
        const decoded = decodeJwtPayload(authHeader || '');
        const tenantId = req.user?.tenantId || decoded?.tenantId || DEV_TENANT_ID;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

        // Fetch new processes grouped by creation date
        const processesByDay = await this.prisma.process.groupBy({
            by: ['createdAt'],
            where: {
                tenantId,
                createdAt: { gte: weekAgo }
            },
            _count: { _all: true }
        });

        // Fetch completed tasks grouped by completion date
        const tasksByDay = await this.prisma.event.groupBy({
            by: ['updatedAt'],
            where: {
                tenantId,
                completed: true,
                updatedAt: { gte: weekAgo },
            },
            _count: { _all: true }
        });

        // Fetch deadlines grouped by deadline date
        const deadlinesByDay = await this.prisma.process.groupBy({
            by: ['deadline'],
            where: {
                tenantId,
                deadline: { gte: weekAgo }
            },
            _count: { _all: true }
        });

        // Helper to format days and collect stats
        const days: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
            const dString = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
            const startStr = d.toISOString().split('T')[0];

            const procCount = processesByDay
                .filter(p => p.createdAt.toISOString().startsWith(startStr))
                .reduce((acc, current) => acc + current._count._all, 0);

            const taskCount = tasksByDay
                .filter(t => t.updatedAt?.toISOString().startsWith(startStr))
                .reduce((acc, current) => acc + current._count._all, 0);

            const deadlineCount = deadlinesByDay
                .filter(dl => dl.deadline?.toISOString().startsWith(startStr))
                .reduce((acc, current) => acc + current._count._all, 0);

            days.push({
                name: dString,
                processos: procCount,
                tarefas: taskCount,
                prazos: deadlineCount
            });
        }

        // Contracts by Area using groupBy
        const areaStats = await this.prisma.contract.groupBy({
            by: ['area'],
            where: {
                tenantId,
                status: 'CLOSED'
            },
            _count: { _all: true }
        });

        const pieData = areaStats.map(stat => ({
            name: stat.area || 'Não informada',
            value: stat._count._all
        }));

        return {
            barData: days,
            pieData: pieData.length > 0 ? pieData : [{ name: 'Nenhum contrato', value: 0 }]
        };
    }
}

