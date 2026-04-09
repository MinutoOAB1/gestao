import { Module } from '@nestjs/common';
import { UserFilesController } from './user-files.controller';
import { UserFilesService } from './user-files.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [PrismaModule, SupabaseModule],
    controllers: [UserFilesController],
    providers: [UserFilesService],
    exports: [UserFilesService],
})
export class UserFilesModule { }
