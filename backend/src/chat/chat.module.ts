import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
    exports: [ChatService, ChatGateway],
})
export class ChatModule { }

