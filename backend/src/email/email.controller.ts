import { Controller, Post, Headers, UnauthorizedException, HttpCode, Logger } from '@nestjs/common';
import { DailySummaryService } from './daily-summary.service';
import { ConfigService } from '@nestjs/config';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly dailySummaryService: DailySummaryService,
    private readonly configService: ConfigService,
  ) {}

  @Post('daily-summary-trigger')
  @HttpCode(200)
  async triggerDailySummary(
    @Headers('Authorization') authHeader?: string,
  ) {
    this.logger.log('📥 Daily summary cron trigger request received.');
    
    // We can secure the endpoint using a secret token configured in the environment (.env)
    const expectedSecret = this.configService.get<string>('CRON_SECRET');
    const token = authHeader?.replace('Bearer ', '');

    if (expectedSecret && token !== expectedSecret) {
      this.logger.warn('⚠️ Unauthorized attempt to trigger daily summary.');
      throw new UnauthorizedException('Invalid cron token');
    }

    this.logger.log('🚀 Triggering manual/scheduled daily summary generation...');
    await this.dailySummaryService.handleDailySummariesCron();
    
    return { 
      success: true, 
      message: 'Daily summaries generated and sent successfully.' 
    };
  }
}
