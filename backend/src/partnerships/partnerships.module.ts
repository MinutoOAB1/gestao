import { Module } from '@nestjs/common';
import { PartnershipsController } from './partnerships.controller';
import { PartnershipsService } from './partnerships.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PartnershipsController],
    providers: [PartnershipsService],
    exports: [PartnershipsService]
})
export class PartnershipsModule { }
