import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { DailySummaryService } from './daily-summary.service';
import { EmailController } from './email.controller';

@Global()
@Module({
    controllers: [EmailController],
    providers: [EmailService, DailySummaryService],
    exports: [EmailService, DailySummaryService],
})
export class EmailModule { }
