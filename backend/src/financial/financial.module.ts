import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { FinancialCategoryService } from './financial-category.service';
import { FinancialCategoryController } from './financial-category.controller';
import { RecurringPaymentService } from './recurring-payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PartnershipsModule } from '../partnerships/partnerships.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, ScheduleModule.forRoot(), PartnershipsModule, NotificationsModule],
    controllers: [FinancialController, FinancialCategoryController],
    providers: [FinancialService, RecurringPaymentService, FinancialCategoryService],
    exports: [FinancialService, FinancialCategoryService],
})
export class FinancialModule { }
