import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { ProcessesModule } from './processes/processes.module';
import { ClientsModule } from './clients/clients.module';
import { FinancialModule } from './financial/financial.module';
import { DocumentsModule } from './documents/documents.module';
import { AgendaModule } from './agenda/agenda.module';
import { ContractsModule } from './contracts/contracts.module';
import { AiModule } from './ai/ai.module';
import { PartnershipsModule } from './partnerships/partnerships.module';
import { TemplatesModule } from './templates/templates.module';
import { ProcessUpdatesModule } from './process-updates/process-updates.module';
import { ProcessNotesModule } from './process-notes/process-notes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { TimesheetModule } from './timesheet/timesheet.module';
import { SettingsModule } from './settings/settings.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { UserFilesModule } from './user-files/user-files.module';
import { BackupModule } from './backup/backup.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TenantMiddleware } from './prisma/tenant.middleware';
import { HealthController } from './health/health.controller';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    // Rate limiting: 100 requests per 60 seconds per IP
    // ThrottlerModule.forRoot([{
    //   ttl: 60000,
    //   limit: 100,
    // }]),
    // ScheduleModule.forRoot(),
    EmailModule,
    PrismaModule,
    SupabaseModule,
    AuditModule,
    AuthModule,
    ProcessesModule,
    ClientsModule,
    FinancialModule,
    DocumentsModule,
    AgendaModule,
    ContractsModule,
    AiModule,
    PartnershipsModule,
    TemplatesModule,
    ProcessUpdatesModule,
    ProcessNotesModule,
    DashboardModule,
    NotificationsModule,
    ChatModule,
    TimesheetModule,
    SettingsModule,
    UserFilesModule,
    BackupModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
