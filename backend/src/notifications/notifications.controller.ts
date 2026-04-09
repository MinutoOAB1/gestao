import { Controller, Get, Post, Patch, Delete, Param, Request, Headers, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// Helper to decode JWT payload without verification (just for extracting user info)
function decodeJwtPayload(token: string): any {
    try {
        if (!token) return null;
        const parts = token.replace('Bearer ', '').split('.');
        if (parts.length !== 3) return null;
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    // Helper to get user from request
    private getUserFromRequest(authHeader: string): { userId: string; tenantId: string } | null {
        const decoded = decodeJwtPayload(authHeader);
        if (decoded && decoded.sub && decoded.tenantId) {
            return { userId: decoded.sub, tenantId: decoded.tenantId };
        }
        return null;
    }

    // Get all notifications for current user
    @Get()
    async findAll(@Headers('authorization') authHeader: string) {
        const user = this.getUserFromRequest(authHeader);
        if (!user) {
            return []; // No auth = no notifications
        }
        return this.notificationsService.findByUser(user.userId, user.tenantId);
    }

    // Get unread count
    @Get('unread-count')
    async getUnreadCount(@Headers('authorization') authHeader: string) {
        const user = this.getUserFromRequest(authHeader);
        if (!user) {
            return { count: 0 };
        }
        const count = await this.notificationsService.getUnreadCount(user.userId, user.tenantId);
        return { count };
    }

    // Mark single as read
    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @Headers('authorization') authHeader: string) {
        const user = this.getUserFromRequest(authHeader);
        if (!user) return { success: false };
        return this.notificationsService.markAsRead(id, user.userId);
    }

    // Mark all as read
    @Patch('read-all')
    async markAllAsRead(@Headers('authorization') authHeader: string) {
        const user = this.getUserFromRequest(authHeader);
        if (!user) return { success: false };
        return this.notificationsService.markAllAsRead(user.userId, user.tenantId);
    }

    // Delete ALL notifications for current user
    @Delete('all')
    async removeAll(@Headers('authorization') authHeader: string) {
        const user = this.getUserFromRequest(authHeader);
        if (!user) return { success: false };
        await this.notificationsService.removeAll(user.userId, user.tenantId);
        return { success: true };
    }

    // Delete notification
    @Delete(':id')
    async remove(@Param('id') id: string, @Headers('authorization') authHeader: string) {
        const user = this.getUserFromRequest(authHeader);
        if (!user) return { success: false };
        return this.notificationsService.remove(id, user.userId);
    }

    // Send a test notification to the current user
    @Post('test')
    async sendTestNotification(@Headers('authorization') authHeader: string) {
        const user = this.getUserFromRequest(authHeader);
        if (!user) return { success: false };

        const notification = await this.notificationsService.create({
            type: 'SYSTEM',
            title: '🚀 Plataforma Atualizada!',
            message: 'Novas funcionalidades: Busca Global (Ctrl+K), Sistema de Auditoria, Rate Limiting, Testes Automatizados e WebSocket para notificações em tempo real!',
            userId: user.userId,
            tenantId: user.tenantId,
        });

        return { success: true, notification };
    }

    // Broadcast notification to all users in tenant
    @Post('broadcast')
    async broadcastNotification(
        @Body() body: { title: string; message?: string; type?: string },
        @Headers('authorization') authHeader: string
    ) {
        const user = this.getUserFromRequest(authHeader);
        if (!user) return { success: false, message: 'Not authenticated' };

        // Get all users in this tenant using the service's prisma
        const users = await (this.notificationsService as any).prisma.user.findMany({
            where: { tenantId: user.tenantId },
            select: { id: true }
        });

        let count = 0;
        for (const targetUser of users) {
            await this.notificationsService.create({
                type: body.type || 'SYSTEM',
                title: body.title,
                message: body.message,
                userId: targetUser.id,
                tenantId: user.tenantId,
            });
            count++;
        }

        return { success: true, count };
    }

    // Create a custom notification (for internal use)
    @Post()
    async create(
        @Body() body: { title: string; message?: string; type?: string; userId?: string },
        @Headers('authorization') authHeader: string
    ) {
        const user = this.getUserFromRequest(authHeader);
        if (!user) return { success: false };

        const notification = await this.notificationsService.create({
            type: body.type || 'INFO',
            title: body.title,
            message: body.message,
            userId: body.userId || user.userId,
            tenantId: user.tenantId,
        });

        return { success: true, notification };
    }
}


