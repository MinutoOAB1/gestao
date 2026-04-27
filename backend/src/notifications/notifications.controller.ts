import { Controller, Get, Post, Patch, Delete, Param, Request, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    // Get all notifications for current user
    @Get()
    async findAll(@Request() req) {
        const userId = req.user?.sub;
        const tenantId = req.user?.tenantId;
        if (!userId || !tenantId) throw new UnauthorizedException();
        return this.notificationsService.findByUser(userId, tenantId);
    }

    // Get unread count
    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        const userId = req.user?.sub;
        const tenantId = req.user?.tenantId;
        if (!userId || !tenantId) throw new UnauthorizedException();
        const count = await this.notificationsService.getUnreadCount(userId, tenantId);
        return { count };
    }

    // Mark single as read
    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @Request() req) {
        const userId = req.user?.sub;
        if (!userId) throw new UnauthorizedException();
        return this.notificationsService.markAsRead(id, userId);
    }

    // Mark all as read
    @Patch('read-all')
    async markAllAsRead(@Request() req) {
        const userId = req.user?.sub;
        const tenantId = req.user?.tenantId;
        if (!userId || !tenantId) throw new UnauthorizedException();
        return this.notificationsService.markAllAsRead(userId, tenantId);
    }

    // Delete ALL notifications for current user
    @Delete('all')
    async removeAll(@Request() req) {
        const userId = req.user?.sub;
        const tenantId = req.user?.tenantId;
        if (!userId || !tenantId) throw new UnauthorizedException();
        await this.notificationsService.removeAll(userId, tenantId);
        return { success: true };
    }

    // Delete notification
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req) {
        const userId = req.user?.sub;
        if (!userId) throw new UnauthorizedException();
        return this.notificationsService.remove(id, userId);
    }

    // Send a test notification to the current user
    @Post('test')
    async sendTestNotification(@Request() req) {
        const userId = req.user?.sub;
        const tenantId = req.user?.tenantId;
        if (!userId || !tenantId) throw new UnauthorizedException();

        const notification = await this.notificationsService.create({
            type: 'SYSTEM',
            title: '🚀 Plataforma Atualizada!',
            message: 'Novas funcionalidades: Busca Global (Ctrl+K), Sistema de Auditoria, Rate Limiting, Testes Automatizados e WebSocket para notificações em tempo real!',
            userId: userId,
            tenantId: tenantId,
        });

        return { success: true, notification };
    }

    // Broadcast notification to all users in tenant
    @Post('broadcast')
    async broadcastNotification(
        @Body() body: { title: string; message?: string; type?: string },
        @Request() req
    ) {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new UnauthorizedException();

        // Get all users in this tenant using the service's prisma
        const users = await (this.notificationsService as any).prisma.user.findMany({
            where: { tenantId },
            select: { id: true }
        });

        let count = 0;
        for (const targetUser of users) {
            await this.notificationsService.create({
                type: body.type || 'SYSTEM',
                title: body.title,
                message: body.message,
                userId: targetUser.id,
                tenantId: tenantId,
            });
            count++;
        }

        return { success: true, count };
    }

    // Create a custom notification (for internal use)
    @Post()
    async create(
        @Body() body: { title: string; message?: string; type?: string; userId?: string },
        @Request() req
    ) {
        const userId = req.user?.sub;
        const tenantId = req.user?.tenantId;
        if (!userId || !tenantId) throw new UnauthorizedException();

        const notification = await this.notificationsService.create({
            type: body.type || 'INFO',
            title: body.title,
            message: body.message,
            userId: body.userId || userId,
            tenantId: tenantId,
        });

        return { success: true, notification };
    }
}


