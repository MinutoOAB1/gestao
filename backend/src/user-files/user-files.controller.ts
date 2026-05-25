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
    BadRequestException,
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
        fileFilter: (req, file, cb) => {
            // 🔒 SEGURANÇA [FILE-UPLOAD-VALIDATION]: Permite apenas tipos de arquivos seguros para escritórios de advocacia
            // Impede o upload de arquivos maliciosos contendo scripts (ex: .html, .svg, .js, .exe) [CWE-434]
            const allowedMimes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'text/csv',
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/zip',
                'application/x-rar-compressed',
            ];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Tipo de arquivo não suportado para armazenamento de documentos de advocacia (apenas PDFs, Office, imagens e arquivos compactados são permitidos)'), false);
            }
        }
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
