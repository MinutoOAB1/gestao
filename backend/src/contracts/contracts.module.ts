import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { AutentiqueService } from './autentique.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ContractsController],
    providers: [ContractsService, AutentiqueService],
    exports: [ContractsService, AutentiqueService],
})
export class ContractsModule { }
