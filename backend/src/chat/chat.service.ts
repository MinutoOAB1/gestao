import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    // ==================== CHANNELS ====================

    async getChannels(tenantId: string) {
        return this.prisma.chatChannel.findMany({
            where: { tenantId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    async getOrCreateProcessChannel(tenantId: string, processId: string, processNumber: string) {
        let channel = await this.prisma.chatChannel.findFirst({
            where: { tenantId, processId, type: 'PROCESS' },
        });

        if (!channel) {
            channel = await this.prisma.chatChannel.create({
                data: {
                    name: `Processo ${processNumber}`,
                    type: 'PROCESS',
                    processId,
                    tenantId,
                },
            });
        }

        return channel;
    }

    async getOrCreateGeneralChannel(tenantId: string, name: string) {
        let channel = await this.prisma.chatChannel.findFirst({
            where: { tenantId, name, type: 'GENERAL' },
        });

        if (!channel) {
            channel = await this.prisma.chatChannel.create({
                data: {
                    name,
                    type: 'GENERAL',
                    tenantId,
                },
            });
        }

        return channel;
    }

    async createChannel(tenantId: string, data: { name: string; type: string; processId?: string }) {
        return this.prisma.chatChannel.create({
            data: {
                name: data.name,
                type: data.type,
                processId: data.processId,
                tenantId,
            },
        });
    }

    async deleteChannel(tenantId: string, channelId: string, userId: string) {
        // Verify user role directly from DB to handle stale tokens
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.role?.toUpperCase() !== 'ADMIN') {
            throw new ForbiddenException('Apenas administradores podem excluir canais.');
        }

        // Verify ownership/tenant
        const channel = await this.prisma.chatChannel.findFirst({
            where: { id: channelId, tenantId },
        });

        if (!channel) return null;

        // Delete all messages first (cascade usually handles this, but explicit is safer if no cascade)
        await this.prisma.chatMessage.deleteMany({
            where: { channelId },
        });

        return this.prisma.chatChannel.delete({
            where: { id: channelId },
        });
    }

    // ==================== MESSAGES ====================

    async getChannelMessages(channelId: string, limit = 50, before?: string) {
        const where: any = { channelId };
        if (before) {
            where.createdAt = { lt: new Date(before) };
        }

        return this.prisma.chatMessage.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async createMessage(data: {
        channelId: string;
        senderId: string;
        senderName: string;
        senderAvatar?: string;
        content: string;
        fileName?: string;
        fileUrl?: string;
        fileSize?: string;
        fileType?: string;
        replyToId?: string;
    }) {
        const message = await this.prisma.chatMessage.create({
            data: {
                channelId: data.channelId,
                senderId: data.senderId,
                senderName: data.senderName,
                senderAvatar: data.senderAvatar,
                content: data.content,
                fileName: data.fileName,
                fileUrl: data.fileUrl,
                fileSize: data.fileSize,
                fileType: data.fileType,
                replyToId: data.replyToId,
            },
        });

        // Detect and handle @mentions
        const mentionRegex = /@([a-zA-Z0-9À-ÿ ]+)/g;
        const matches = [...data.content.matchAll(mentionRegex)];

        for (const match of matches) {
            const mentionedName = match[1].trim();
            // Find user by name (approximate)
            const mentionedUser = await this.prisma.user.findFirst({
                where: { name: { contains: mentionedName } }
            });

            if (mentionedUser && mentionedUser.id !== data.senderId) {
                // Get tenantId from channel or sender (assuming sender's tenant for now via prisma lookup if needed, but we don't have it in args. 
                // We'll fetch the channel to be sure or just assume sender's tenant context if we passed it.
                // Since createMessage doesn't take tenantId, we fetch the channel to find tenantId.
                const channel = await this.prisma.chatChannel.findUnique({ where: { id: data.channelId }, select: { tenantId: true } });

                if (channel) {
                    await this.prisma.notification.create({
                        data: {
                            type: 'MENTION',
                            title: `Você foi mencionado por ${data.senderName}`,
                            message: data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content,
                            userId: mentionedUser.id,
                            createdById: data.senderId,
                            tenantId: channel.tenantId,
                            isRead: false
                        }
                    });
                }
            }
        }

        // Update channel's updatedAt
        await this.prisma.chatChannel.update({
            where: { id: data.channelId },
            data: { updatedAt: new Date() },
        });

        return message;
    }

    async addReaction(messageId: string, userId: string, emoji: string) {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });

        if (!message) return null;

        let reactions: { emoji: string; userId: string }[] = [];
        if (message.reactions) {
            reactions = JSON.parse(message.reactions);
        }

        // Toggle reaction
        const existingIndex = reactions.findIndex(
            (r) => r.emoji === emoji && r.userId === userId
        );

        if (existingIndex >= 0) {
            reactions.splice(existingIndex, 1);
        } else {
            reactions.push({ emoji, userId });
        }

        return this.prisma.chatMessage.update({
            where: { id: messageId },
            data: { reactions: JSON.stringify(reactions) },
        });
    }

    async togglePin(messageId: string) {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
        });

        if (!message) return null;

        return this.prisma.chatMessage.update({
            where: { id: messageId },
            data: { isPinned: !message.isPinned },
        });
    }

    // ==================== DIRECT MESSAGES ====================

    async getDirectMessages(userId: string, otherUserId: string, tenantId: string, limit = 50) {
        return this.prisma.directMessage.findMany({
            where: {
                tenantId,
                OR: [
                    { senderId: userId, recipientId: otherUserId },
                    { senderId: otherUserId, recipientId: userId },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async sendDirectMessage(data: {
        senderId: string;
        senderName: string;
        senderAvatar?: string;
        recipientId: string;
        content: string;
        tenantId: string;
    }) {
        return this.prisma.directMessage.create({
            data: {
                senderId: data.senderId,
                senderName: data.senderName,
                senderAvatar: data.senderAvatar,
                recipientId: data.recipientId,
                content: data.content,
                tenantId: data.tenantId,
            },
        });
    }

    async markDirectMessagesAsRead(userId: string, senderId: string, tenantId: string) {
        return this.prisma.directMessage.updateMany({
            where: {
                recipientId: userId,
                senderId: senderId,
                tenantId,
                isRead: false,
            },
            data: { isRead: true },
        });
    }

    async getUnreadCounts(userId: string, tenantId: string) {
        const unread = await this.prisma.directMessage.groupBy({
            by: ['senderId'],
            where: {
                recipientId: userId,
                tenantId,
                isRead: false,
            },
            _count: true,
        });

        return unread.reduce((acc, item) => {
            acc[item.senderId] = item._count;
            return acc;
        }, {} as Record<string, number>);
    }

    // ==================== USERS ====================

    async getTeamMembers(tenantId: string) {
        return this.prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
            },
        });
    }
}
