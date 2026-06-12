import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AsaasService } from './asaas.service';
import { PaymentsController } from './payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../common/security/security.module';

@Module({
  imports: [ConfigModule, PrismaModule, SecurityModule],
  controllers: [PaymentsController],
  providers: [AsaasService],
  exports: [AsaasService],
})
export class PaymentsModule {}
