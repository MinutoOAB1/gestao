import { Module } from '@nestjs/common';
import { ValueChainService } from './value-chain.service';
import { ValueChainController } from './value-chain.controller';

@Module({
    providers: [ValueChainService],
    controllers: [ValueChainController],
    exports: [ValueChainService]
})
export class ValueChainModule {}
