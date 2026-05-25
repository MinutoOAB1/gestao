import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Headers,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Res,
    BadRequestException,
    UseGuards,
    Req,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, FillTemplateDto } from './dto/template.dto';
import { StorageService } from '../supabase/storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as path from 'path';
import * as fs from 'fs';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
    constructor(
        private readonly templatesService: TemplatesService,
        private readonly storageService: StorageService,
    ) { }

    private getTenantId(req: any): string {
        return req.user?.tenantId || 'dev-tenant-001';
    }

    @Get()
    async findAll(
        @Req() req: any,
        @Query('category') category?: string,
        @Query('search') search?: string,
    ) {
        const tenantId = this.getTenantId(req);
        return this.templatesService.findAll(tenantId, category, search);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: any) {
        const tenantId = this.getTenantId(req);
        return this.templatesService.findOne(id, tenantId);
    }

    @Get(':id/download')
    async downloadFile(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
        const tenantId = this.getTenantId(req);
        const template = await this.templatesService.findOne(id, tenantId) as any;
        if (template?.docxPath) {
            // Check if it's a URL (Supabase) or local path
            if (template.docxPath.startsWith('http')) {
                // Redirect to Supabase URL
                res.redirect(template.docxPath);
            } else if (fs.existsSync(template.docxPath)) {
                res.download(template.docxPath, `${template.title}.docx`);
            } else {
                res.status(404).json({ error: 'File not found' });
            }
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    }

    @Get(':id/file')
    async getFile(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
        const tenantId = this.getTenantId(req);
        const template = await this.templatesService.findOne(id, tenantId) as any;
        if (template?.docxPath) {
            if (template.docxPath.startsWith('http')) {
                res.redirect(template.docxPath);
            } else if (fs.existsSync(template.docxPath)) {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `inline; filename="${template.title}.docx"`);
                const fileStream = fs.createReadStream(template.docxPath);
                fileStream.pipe(res);
            } else {
                res.status(404).json({ error: 'File not found' });
            }
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    }

    // Preview image
    @Get(':id/preview')
    async getPreview(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
        const tenantId = this.getTenantId(req);
        const template = await this.templatesService.findOne(id, tenantId) as any;
        if (template?.previewImagePath) {
            if (template.previewImagePath.startsWith('http')) {
                res.redirect(template.previewImagePath);
            } else if (fs.existsSync(template.previewImagePath)) {
                const ext = path.extname(template.previewImagePath).toLowerCase();
                const mimeTypes: Record<string, string> = {
                    '.png': 'image/png',
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.webp': 'image/webp',
                };
                res.setHeader('Content-Type', mimeTypes[ext] || 'image/png');
                res.setHeader('Cache-Control', 'public, max-age=31536000');
                const fileStream = fs.createReadStream(template.previewImagePath);
                fileStream.pipe(res);
            } else {
                res.status(404).json({ error: 'Preview not found' });
            }
        } else {
            res.status(404).json({ error: 'Preview not found' });
        }
    }

    @Post()
    async create(@Body() dto: CreateTemplateDto, @Req() req: any) {
        const tenantId = this.getTenantId(req);
        return this.templatesService.create(tenantId, dto);
    }

    // Upload DOCX file
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                cb(null, true);
            } else {
                cb(new BadRequestException('Only .docx files are allowed'), false);
            }
        },
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado');
        }
        const tenantId = this.getTenantId(req);
        const result = await this.storageService.uploadFile('templates', file, tenantId);
        return {
            filename: file.originalname,
            path: result.fileUrl,
            originalName: file.originalname,
        };
    }

    // Upload preview image
    @Post('upload-preview')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        fileFilter: (req, file, cb) => {
            const allowedMimes = ['image/png', 'image/jpeg', 'image/webp'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Only PNG, JPG, and WEBP files are allowed'), false);
            }
        },
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
    }))
    async uploadPreview(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado');
        }
        const tenantId = this.getTenantId(req);
        const result = await this.storageService.uploadFile('previews', file, tenantId);
        return {
            filename: file.originalname,
            path: result.fileUrl,
            originalName: file.originalname,
        };
    }

    // Upload both DOCX and preview image together
    @Post('upload-complete')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'docx', maxCount: 1 },
        { name: 'preview', maxCount: 1 },
    ], {
        storage: memoryStorage(),
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB max per file
        }
    }))
    async uploadComplete(
        @UploadedFiles() files: { docx?: Express.Multer.File[], preview?: Express.Multer.File[] },
        @Req() req: any,
    ) {
        const tenantId = this.getTenantId(req);
        let docxResult: { filename: string; path: string } | null = null;
        let previewResult: { filename: string; path: string } | null = null;

        if (files.docx?.[0]) {
            const file = files.docx[0];
            // 🔒 SEGURANÇA [FILE-UPLOAD-VALIDATION]: Garante que o arquivo do modelo seja estritamente DOCX [CWE-434]
            if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                throw new BadRequestException('Apenas arquivos de modelo .docx são permitidos.');
            }

            const result = await this.storageService.uploadFile('templates', file, tenantId);
            docxResult = {
                filename: file.originalname,
                path: result.fileUrl,
            };
        }

        if (files.preview?.[0]) {
            const file = files.preview[0];
            // 🔒 SEGURANÇA [FILE-UPLOAD-VALIDATION]: Garante que a pré-visualização seja PNG, JPG ou WEBP [CWE-434]
            const allowedPreviewMimes = ['image/png', 'image/jpeg', 'image/webp'];
            if (!allowedPreviewMimes.includes(file.mimetype)) {
                throw new BadRequestException('Apenas imagens nos formatos PNG, JPG e WEBP são permitidas para pré-visualização.');
            }

            const result = await this.storageService.uploadFile('previews', file, tenantId);
            previewResult = {
                filename: file.originalname,
                path: result.fileUrl,
            };
        }

        return {
            docx: docxResult,
            preview: previewResult,
        };
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateTemplateDto,
        @Req() req: any,
    ) {
        const tenantId = this.getTenantId(req);
        return this.templatesService.update(id, tenantId, dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: any) {
        const tenantId = this.getTenantId(req);
        return this.templatesService.remove(id, tenantId);
    }

    @Post(':id/fill')
    async fillTemplate(
        @Param('id') id: string,
        @Body() dto: FillTemplateDto,
        @Req() req: any,
    ) {
        const tenantId = this.getTenantId(req);
        return this.templatesService.fillTemplate(id, tenantId, dto.variables);
    }
}
