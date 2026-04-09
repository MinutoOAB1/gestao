import { Module } from '@nestjs/common';
import { ProcessUpdatesController } from './process-updates.controller';
import { ProcessUpdatesService } from './process-updates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ProcessUpdatesController],
    providers: [ProcessUpdatesService],
    exports: [ProcessUpdatesService],
})
export class ProcessUpdatesModule { }
