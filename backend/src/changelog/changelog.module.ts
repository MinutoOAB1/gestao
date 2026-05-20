import { Module } from '@nestjs/common';
import { ChangelogService } from './changelog.service';
import { ChangelogController } from './changelog.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ChangelogController],
    providers: [ChangelogService],
    exports: [ChangelogService]
})
export class ChangelogModule { }
