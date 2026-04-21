import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecurringPaymentService {
    private readonly logger = new Logger(RecurringPaymentService.name);

    constructor(
        private prisma: PrismaService,
    ) { }

    // Run every day at 9:00 AM to check for upcoming and overdue payments
    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async checkPaymentDueDates() {
        this.logger.log('Checking for upcoming and overdue payments...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysAhead = new Date(today);
        threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

        try {
            // Find payments due in 3 days (upcoming)
            const upcomingPayments = await this.prisma.financialRecord.findMany({
                where: {
                    status: 'PENDING',
                    date: {
                        gte: today,
                        lte: threeDaysAhead,
                    },
                },
                include: { client: true, tenant: { select: { users: { take: 1, select: { id: true, role: true } } } } },
            });

            // Send notifications for upcoming payments
            for (const payment of upcomingPayments) {
                const daysUntilDue = Math.ceil(
                    (new Date(payment.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                const installmentInfo = payment.totalInstallments && payment.totalInstallments > 1
                    ? ` (Parcela ${payment.currentInstallment}/${payment.totalInstallments})`
                    : '';

                // Get admin user of this tenant to receive notification
                const adminUser = payment.tenant?.users?.find(u => u.role === 'admin') || payment.tenant?.users?.[0];

                if (adminUser) {
                    await this.prisma.notification.create({
                        data: {
                            type: 'payment_reminder',
                            title: `Pagamento próximo do vencimento${installmentInfo}`,
                            message: `${payment.description} - R$ ${payment.amount.toFixed(2)} vence em ${daysUntilDue} dia(s)`,
                            userId: adminUser.id,
                            tenantId: payment.tenantId,
                        }
                    });

                    this.logger.log(`Notification sent for upcoming payment: ${payment.description}`);
                }
            }

            // Find overdue payments
            const overduePayments = await this.prisma.financialRecord.findMany({
                where: {
                    status: 'PENDING',
                    date: {
                        lt: today,
                    },
                },
                include: { client: true, tenant: { select: { users: { take: 1, select: { id: true, role: true } } } } },
            });

            // Send notifications for overdue payments (only once per day)
            for (const payment of overduePayments) {
                const daysOverdue = Math.ceil(
                    (today.getTime() - new Date(payment.date).getTime()) / (1000 * 60 * 60 * 24)
                );

                const installmentInfo = payment.totalInstallments && payment.totalInstallments > 1
                    ? ` (Parcela ${payment.currentInstallment}/${payment.totalInstallments})`
                    : '';

                // Only send overdue notification if it's the first day overdue or every 7 days
                if (daysOverdue === 1 || daysOverdue % 7 === 0) {
                    const adminUser = payment.tenant?.users?.find(u => u.role === 'admin') || payment.tenant?.users?.[0];

                    if (adminUser) {
                        await this.prisma.notification.create({
                            data: {
                                type: 'payment_overdue',
                                title: `⚠️ Pagamento atrasado${installmentInfo}`,
                                message: `${payment.description} - R$ ${payment.amount.toFixed(2)} está ${daysOverdue} dia(s) atrasado`,
                                userId: adminUser.id,
                                tenantId: payment.tenantId,
                            }
                        });

                        this.logger.warn(`Overdue notification sent for: ${payment.description}`);
                    }
                }
            }

            this.logger.log(`Checked ${upcomingPayments.length} upcoming and ${overduePayments.length} overdue payments`);
        } catch (error) {
            this.logger.error('Error checking payment due dates:', error);
        }
    }

    // Manual trigger for testing
    async triggerPaymentCheck() {
        await this.checkPaymentDueDates();
        return { message: 'Payment check triggered successfully' };
    }
}
