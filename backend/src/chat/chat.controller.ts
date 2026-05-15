import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ChatService } from './chat.service';
import { StorageService } from '../supabase/storage.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly storageService: StorageService,
    ) { }

    // ==================== FILE UPLOAD ====================

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(), // Use memory storage for Supabase compatibility
        limits: {
            fileSize: 25 * 1024 * 1024, // 25MB limit
        },
        fileFilter: (req, file, cb) => {
            // Allow most common file types
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
                cb(new BadRequestException('Tipo de arquivo não suportado'), false);
            }
        },
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado');
        }

        // Upload using unified storage service
        const result = await this.storageService.uploadFile('chat', file, req.user.tenantId);

        return result;
    }

    // ==================== CHANNELS ====================

    @Get('channels')
    async getChannels(@Request() req) {
        return this.chatService.getChannels(req.user.tenantId);
    }

    @Post('channels')
    async createChannel(
        @Request() req,
        @Body() data: { name: string; type: string; processId?: string },
    ) {
        return this.chatService.createChannel(req.user.tenantId, data);
    }

    @Delete('channels/:id')
    async deleteChannel(@Request() req, @Param('id') id: string) {
        // Validation moved to service to check against DB (fresh data)
        return this.chatService.deleteChannel(req.user.tenantId, id, req.user.sub);
    }

    @Get('channels/process/:processId')
    async getOrCreateProcessChannel(
        @Request() req,
        @Param('processId') processId: string,
        @Query('number') processNumber: string,
    ) {
        return this.chatService.getOrCreateProcessChannel(
            req.user.tenantId,
            processId,
            processNumber || 'Sem número',
        );
    }

    @Get('channels/general/:name')
    async getOrCreateGeneralChannel(
        @Request() req,
        @Param('name') name: string,
    ) {
        return this.chatService.getOrCreateGeneralChannel(req.user.tenantId, name);
    }

    // ==================== MESSAGES ====================

    @Get('channels/:channelId/messages')
    async getChannelMessages(
        @Param('channelId') channelId: string,
        @Query('limit') limit?: string,
        @Query('before') before?: string,
    ) {
        return this.chatService.getChannelMessages(
            channelId,
            limit ? parseInt(limit, 10) : 50,
            before,
        );
    }

    // ==================== DIRECT MESSAGES ====================

    @Get('dm/:otherUserId')
    async getDirectMessages(
        @Request() req,
        @Param('otherUserId') otherUserId: string,
        @Query('limit') limit?: string,
    ) {
        return this.chatService.getDirectMessages(
            req.user.id,
            otherUserId,
            req.user.tenantId,
            limit ? parseInt(limit, 10) : 50,
        );
    }

    @Get('unread')
    async getUnreadCounts(@Request() req) {
        return this.chatService.getUnreadCounts(req.user.id, req.user.tenantId);
    }

    // ==================== TEAM MEMBERS ====================

    @Get('team')
    async getTeamMembers(@Request() req) {
        return this.chatService.getTeamMembers(req.user.tenantId);
    }
}
