import { Module } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiModule } from '../ai/ai.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';

@Module({
  imports: [NotificationsModule, AiModule, GoogleCalendarModule],
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule { }
