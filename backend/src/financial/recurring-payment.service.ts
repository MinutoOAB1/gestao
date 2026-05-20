import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class RecurringPaymentService {
    private readonly logger = new Logger(RecurringPaymentService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
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
                    await this.notificationsService.create({
                        type: 'payment_reminder',
                        title: `Pagamento próximo do vencimento${installmentInfo}`,
                        message: `${payment.description} - R$ ${payment.amount.toFixed(2)} vence em ${daysUntilDue} dia(s)`,
                        userId: adminUser.id,
                        tenantId: payment.tenantId,
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
                        await this.notificationsService.create({
                            type: 'payment_overdue',
                            title: `⚠️ Pagamento atrasado${installmentInfo}`,
                            message: `${payment.description} - R$ ${payment.amount.toFixed(2)} está ${daysOverdue} dia(s) atrasado`,
                            userId: adminUser.id,
                            tenantId: payment.tenantId,
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

    // Real-time notification handler on financial creation or update
    @OnEvent('financial.created')
    @OnEvent('financial.updated')
    async handleFinancialEvent(payload: { id: string; tenantId: string }) {
        this.logger.log(`Real-time financial check triggered for record: ${payload.id}`);
        try {
            const payment = await this.prisma.financialRecord.findFirst({
                where: { id: payload.id, tenantId: payload.tenantId },
                include: { client: true, tenant: { select: { users: { select: { id: true, role: true } } } } },
            });

            if (!payment || payment.status !== 'PENDING') {
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const paymentDate = new Date(payment.date);
            paymentDate.setHours(0, 0, 0, 0);

            const installmentInfo = payment.totalInstallments && payment.totalInstallments > 1
                ? ` (Parcela ${payment.currentInstallment}/${payment.totalInstallments})`
                : '';

            const adminUser = payment.tenant?.users?.find(u => u.role === 'ADMIN' || u.role === 'admin') || payment.tenant?.users?.[0];
            if (!adminUser) return;

            // Check if upcoming
            const threeDaysAhead = new Date(today);
            threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

            if (paymentDate >= today && paymentDate <= threeDaysAhead) {
                const daysUntilDue = Math.ceil(
                    (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Check if notification already exists to avoid duplication
                const exists = await this.prisma.notification.findFirst({
                    where: {
                        userId: adminUser.id,
                        tenantId: payment.tenantId,
                        type: 'payment_reminder',
                        message: { contains: payment.description }
                    }
                });

                if (!exists) {
                    await this.notificationsService.create({
                        type: 'payment_reminder',
                        title: `Pagamento próximo do vencimento${installmentInfo}`,
                        message: `${payment.description} - R$ ${payment.amount.toFixed(2)} vence em ${daysUntilDue} dia(s)`,
                        userId: adminUser.id,
                        tenantId: payment.tenantId,
                    });
                    this.logger.log(`Real-time notification sent for upcoming payment: ${payment.description}`);
                }
            }

            // Check if overdue
            if (paymentDate < today) {
                const daysOverdue = Math.ceil(
                    (today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                const exists = await this.prisma.notification.findFirst({
                    where: {
                        userId: adminUser.id,
                        tenantId: payment.tenantId,
                        type: 'payment_overdue',
                        message: { contains: payment.description }
                    }
                });

                if (!exists) {
                    await this.notificationsService.create({
                        type: 'payment_overdue',
                        title: `⚠️ Pagamento atrasado${installmentInfo}`,
                        message: `${payment.description} - R$ ${payment.amount.toFixed(2)} está ${daysOverdue} dia(s) atrasado`,
                        userId: adminUser.id,
                        tenantId: payment.tenantId,
                    });
                    this.logger.warn(`Real-time notification sent for overdue payment: ${payment.description}`);
                }
            }
        } catch (error) {
            this.logger.error('Error in real-time financial notification handling:', error);
        }
    }

    // Manual trigger for testing
    async triggerPaymentCheck() {
        await this.checkPaymentDueDates();
        return { message: 'Payment check triggered successfully' };
    }
}
