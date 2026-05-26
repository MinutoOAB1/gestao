import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class DailySummaryService {
  private readonly logger = new Logger(DailySummaryService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Run automatically every day at 07:00 AM Brasilia Time
  @Cron('0 0 7 * * *', {
    timeZone: 'America/Sao_Paulo',
  })
  async handleDailySummariesCron() {
    this.logger.log('🌅 Starting scheduled daily summary routine...');
    
    try {
      const users = await this.prisma.user.findMany({
        where: {
          email: { not: '' },
        },
      });

      this.logger.log(`Found ${users.length} active users to check for summaries.`);

      for (const user of users) {
        await this.generateAndSendSummaryForUser(user.id);
      }

      this.logger.log('✅ Daily summary routine finished successfully.');
    } catch (error) {
      this.logger.error('❌ Failed to run daily summaries cron job:', error);
    }
  }

  /**
   * Generates and sends a summary for a specific user ID
   */
  async generateAndSendSummaryForUser(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      this.logger.warn(`User with ID ${userId} not found or has no email.`);
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch today's events for this user (created by them or where they are assigned)
    const events = await this.prisma.event.findMany({
      where: {
        tenantId: user.tenantId,
        start: {
          gte: today,
          lte: endOfToday,
        },
        OR: [
          { createdById: user.id },
          {
            assignees: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
      orderBy: { start: 'asc' },
    });

    // Fetch today's pending financial records for this user's tenant
    const financialRecords = await this.prisma.financialRecord.findMany({
      where: {
        tenantId: user.tenantId,
        status: 'PENDING',
        date: {
          gte: today,
          lte: endOfToday,
        },
      },
      orderBy: { amount: 'desc' },
    });

    // Only send the email if there are events or pending financial records for the user
    if (events.length > 0 || financialRecords.length > 0) {
      this.logger.log(`Sending summary to ${user.email} with ${events.length} events and ${financialRecords.length} financial records.`);
      await this.emailService.sendDailySummaryEmail(
        user.email,
        user.name,
        {
          events,
          financialRecords,
          dateStr: today.toLocaleDateString('pt-BR'),
        }
      );
      return true;
    } else {
      this.logger.log(`Skipping summary for ${user.email} (no events or financial records for today).`);
      return false;
    }
  }
}
