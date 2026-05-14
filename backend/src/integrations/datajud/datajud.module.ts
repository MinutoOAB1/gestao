import { Module } from '@nestjs/common';
import { DatajudService } from './datajud.service';
import { DatajudController } from './datajud.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [DatajudController],
  providers: [DatajudService],
  exports: [DatajudService],
})
export class DatajudModule {}
