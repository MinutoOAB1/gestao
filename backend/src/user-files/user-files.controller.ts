import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserFilesService } from './user-files.service';
import { UpdateUserFileDto } from './dto/update-user-file.dto';

@Controller('user-files')
@UseGuards(JwtAuthGuard)
export class UserFilesController {
    constructor(private readonly userFilesService: UserFilesService) { }

    /**
     * Upload a file
     * POST /user-files/upload
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    }))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Query('folder') folder: string,
        @Req() req: any,
    ) {
        return this.userFilesService.uploadFile(
            file,
            req.user.sub,
            req.user.tenantId,
            folder,
        );
    }

    /**
     * List user files
     * GET /user-files?folder=xxx
     */
    @Get()
    async listFiles(
        @Query('folder') folder: string,
        @Req() req: any,
    ) {
        return this.userFilesService.listFiles(
            req.user.sub,
            req.user.tenantId,
            folder,
        );
    }

    /**
     * Get storage statistics
     * GET /user-files/stats
     */
    @Get('stats')
    async getStats(@Req() req: any) {
        return this.userFilesService.getStorageStats(
            req.user.sub,
            req.user.tenantId,
        );
    }

    /**
     * List folders
     * GET /user-files/folders
     */
    @Get('folders')
    async listFolders(@Req() req: any) {
        return this.userFilesService.listFolders(
            req.user.sub,
            req.user.tenantId,
        );
    }

    /**
     * Get a single file
     * GET /user-files/:id
     */
    @Get(':id')
    async getFile(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        return this.userFilesService.findOne(
            id,
            req.user.sub,
            req.user.tenantId,
        );
    }

    /**
     * Update file metadata
     * PATCH /user-files/:id
     */
    @Patch(':id')
    async updateFile(
        @Param('id') id: string,
        @Body() dto: UpdateUserFileDto,
        @Req() req: any,
    ) {
        return this.userFilesService.update(
            id,
            dto,
            req.user.sub,
            req.user.tenantId,
        );
    }

    /**
     * Delete a file
     * DELETE /user-files/:id
     */
    @Delete(':id')
    async deleteFile(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        return this.userFilesService.delete(
            id,
            req.user.sub,
            req.user.tenantId,
        );
    }
}
