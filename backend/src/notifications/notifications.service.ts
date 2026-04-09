import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => NotificationsGateway))
        private notificationsGateway: NotificationsGateway
    ) { }

    // Create a notification and send real-time update
    async create(data: {
        type: string;
        title: string;
        message?: string;
        entityType?: string;
        entityId?: string;
        userId: string;
        createdById?: string;
        tenantId: string;
    }) {
        const notification = await this.prisma.notification.create({
            data,
            include: {
                createdBy: {
                    select: { id: true, name: true }
                }
            }
        });

        // Send real-time notification via WebSocket
        try {
            this.notificationsGateway.sendToUser(data.userId, {
                tenantId: notification.tenantId,
                type: notification.type as any,
                title: notification.title,
                message: notification.message || '',
                entityType: notification.entityType || undefined,
                entityId: notification.entityId || undefined
            });
        } catch (e) {
            console.log('[NotificationsService] Could not send real-time notification:', e);
        }

        return notification;
    }

    // Get all notifications for a user
    async findByUser(userId: string, tenantId: string) {
        return this.prisma.notification.findMany({
            where: { userId, tenantId },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    // Get unread count
    async getUnreadCount(userId: string, tenantId: string): Promise<number> {
        return this.prisma.notification.count({
            where: { userId, tenantId, isRead: false },
        });
    }

    // Mark as read
    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    // Mark all as read
    async markAllAsRead(userId: string, tenantId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, tenantId, isRead: false },
            data: { isRead: true },
        });
    }

    // Delete notification
    async remove(id: string, userId: string) {
        return this.prisma.notification.deleteMany({
            where: { id, userId },
        });
    }

    // Delete all notifications for a user
    async removeAll(userId: string, tenantId: string) {
        return this.prisma.notification.deleteMany({
            where: { userId, tenantId },
        });
    }

    // Extract mentions from text and create notifications
    async processMentions(
        text: string,
        entityType: string,
        entityId: string,
        createdById: string,
        createdByName: string,
        tenantId: string
    ) {
        try {
            // Regex to match @[Name](userId) format
            const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
            const matches = [...text.matchAll(mentionRegex)];

            if (matches.length === 0) {
                return 0;
            }

            const userIds = matches.map(m => m[2]);
            const uniqueUserIds = [...new Set(userIds)];

            let notificationCount = 0;

            for (const userId of uniqueUserIds) {
                // Don't notify yourself
                if (userId === createdById) {
                    continue;
                }

                try {
                    // Verify the mentioned user exists
                    const mentionedUser = await this.prisma.user.findUnique({
                        where: { id: userId },
                        select: { id: true, tenantId: true }
                    });

                    if (!mentionedUser) {
                        console.log(`User ${userId} not found, skipping notification`);
                        continue;
                    }

                    // Create notification using the create method (includes real-time WebSocket)
                    await this.create({
                        type: 'MENTION',
                        title: `${createdByName} mencionou você`,
                        message: text.substring(0, 150),
                        entityType,
                        entityId,
                        userId,
                        tenantId: mentionedUser.tenantId,
                    });
                    notificationCount++;
                } catch (innerError) {
                    console.error(`Error creating notification for user ${userId}:`, innerError);
                    // Continue with other mentions
                }
            }

            return notificationCount;
        } catch (error) {
            console.error('Error processing mentions:', error);
            return 0; // Don't fail the note creation
        }
    }
}

