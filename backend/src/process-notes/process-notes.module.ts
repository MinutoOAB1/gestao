import { Module } from '@nestjs/common';
import { ProcessNotesService } from './process-notes.service';
import { ProcessNotesController } from './process-notes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [ProcessNotesController],
    providers: [ProcessNotesService],
    exports: [ProcessNotesService],
})
export class ProcessNotesModule { }
