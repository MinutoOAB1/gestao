import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

interface ConnectedUser {
    id: string;
    name: string;
    avatar?: string;
    tenantId: string;
    socketId: string;
}

@WebSocketGateway({
    cors: {
        origin: true, // Allow request origin for credentials support
        methods: ['GET', 'POST'],
        credentials: true,
    },
    transports: ['websocket', 'polling'], // Explicitly allow both
    namespace: '/chat',
    maxHttpBufferSize: 1e8 // 100 MB - FIX 413 Payload Too Large
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers: Map<string, ConnectedUser> = new Map();

    constructor(private chatService: ChatService) { }

    async handleConnection(client: Socket) {
        try {
            console.log(`[ChatGateway] Client attempting connection: ${client.id}`);
            console.log(`[ChatGateway] Handshake query:`, client.handshake.query);
            console.log(`[ChatGateway] Handshake auth:`, client.handshake.auth);

            // Allow connection - auth happens via 'authenticate' message
            console.log(`[ChatGateway] Connection allowed for ${client.id}`);
        } catch (error) {
            console.error(`[ChatGateway] Connection error for ${client.id}:`, error);
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        console.log(`[ChatGateway] Client disconnected: ${client.id}`); // kept simple to avoid TS issues

        // Remove user from connected users
        for (const [key, user] of this.connectedUsers.entries()) {
            if (user.socketId === client.id) {
                console.log(`[ChatGateway] User ${user.name} (${user.id}) went offline`);
                this.connectedUsers.delete(key);

                // Notify others that user went offline
                this.server.emit('userOffline', { userId: user.id });
                break;
            }
        }
    }

    @SubscribeMessage('authenticate')
    async handleAuthenticate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; name: string; avatar?: string; tenantId: string },
    ) {
        try {
            console.log(`[ChatGateway] Authenticate request received from ${client.id} for user ${data.userId}`);

            if (!data.userId || !data.tenantId) {
                console.error('[ChatGateway] Invalid auth data:', data);
                return { success: false, error: 'Invalid data' };
            }

            const user: ConnectedUser = {
                id: data.userId,
                name: data.name,
                avatar: data.avatar,
                tenantId: data.tenantId,
                socketId: client.id,
            };

            this.connectedUsers.set(data.userId, user);

            // Join tenant room
            await client.join(`tenant:${data.tenantId}`);

            // Notify others that user came online
            this.server.to(`tenant:${data.tenantId}`).emit('userOnline', {
                userId: data.userId,
                name: data.name,
                avatar: data.avatar,
            });

            // Send list of online users to ALL users in tenant (not just connecting client)
            const onlineUsers = Array.from(this.connectedUsers.values())
                .filter((u) => u.tenantId === data.tenantId)
                .map((u) => ({ userId: u.id, name: u.name, avatar: u.avatar }));

            // Broadcast to entire tenant room so everyone has updated list
            this.server.to(`tenant:${data.tenantId}`).emit('onlineUsers', onlineUsers);

            console.log(`[ChatGateway] Authentication successful for ${client.id}, online users:`, onlineUsers.length);

            return { success: true };
        } catch (error) {
            console.error('[ChatGateway] Auth error:', error);
            return { success: false, error: 'Auth failed' };
        }
    }

    @SubscribeMessage('joinChannel')
    async handleJoinChannel(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { channelId: string },
    ) {
        client.join(`channel:${data.channelId}`);
        console.log(`Client ${client.id} joined channel ${data.channelId}`);
        return { success: true };
    }

    @SubscribeMessage('leaveChannel')
    async handleLeaveChannel(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { channelId: string },
    ) {
        client.leave(`channel:${data.channelId}`);
        return { success: true };
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
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
        },
    ) {
        try {
            const message = await this.chatService.createMessage(data);

            // Broadcast to all clients in the channel
            this.server.to(`channel:${data.channelId}`).emit('newMessage', message);

            return { success: true, message };
        } catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error: 'Failed to send message' };
        }
    }

    @SubscribeMessage('sendDirectMessage')
    async handleSendDirectMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
            senderId: string;
            senderName: string;
            senderAvatar?: string;
            recipientId: string;
            content: string;
            tenantId: string;
        },
    ) {
        try {
            const message = await this.chatService.sendDirectMessage(data);

            // Send to recipient if online
            const recipient = this.connectedUsers.get(data.recipientId);
            if (recipient) {
                this.server.to(recipient.socketId).emit('newDirectMessage', message);
            }

            // Also send back to sender for confirmation
            client.emit('newDirectMessage', message);

            return { success: true, message };
        } catch (error) {
            console.error('Error sending direct message:', error);
            return { success: false, error: 'Failed to send message' };
        }
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { channelId: string; userId: string; userName: string; isTyping: boolean },
    ) {
        // Broadcast to channel except sender
        client.to(`channel:${data.channelId}`).emit('userTyping', {
            channelId: data.channelId,
            userId: data.userId,
            userName: data.userName,
            isTyping: data.isTyping,
        });
    }

    @SubscribeMessage('typingDirect')
    async handleTypingDirect(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { recipientId: string; userId: string; userName: string; isTyping: boolean },
    ) {
        const recipient = this.connectedUsers.get(data.recipientId);
        if (recipient) {
            this.server.to(recipient.socketId).emit('userTypingDirect', {
                userId: data.userId,
                userName: data.userName,
                isTyping: data.isTyping,
            });
        }
    }

    @SubscribeMessage('addReaction')
    async handleAddReaction(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: string; userId: string; emoji: string; channelId: string },
    ) {
        try {
            const message = await this.chatService.addReaction(data.messageId, data.userId, data.emoji);

            if (message) {
                // Broadcast updated reactions to channel
                this.server.to(`channel:${data.channelId}`).emit('messageReaction', {
                    messageId: data.messageId,
                    reactions: message.reactions,
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Error adding reaction:', error);
            return { success: false };
        }
    }

    @SubscribeMessage('markRead')
    async handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; senderId: string; tenantId: string },
    ) {
        await this.chatService.markDirectMessagesAsRead(data.userId, data.senderId, data.tenantId);
        return { success: true };
    }
    @SubscribeMessage('togglePin')
    async handleTogglePin(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: string; channelId: string },
    ) {
        try {
            const message = await this.chatService.togglePin(data.messageId);
            if (message) {
                // Broadcast update to channel
                this.server.to(`channel:${data.channelId}`).emit('messageUpdated', message);
            }
            return { success: true };
        } catch (error) {
            console.error('Error toggling pin:', error);
            return { success: false };
        }
    }

    // Send notification to a specific user in real-time
    sendNotificationToUser(userId: string, notification: any) {
        // Find user socket
        for (const [, user] of this.connectedUsers.entries()) {
            if (user.id === userId) {
                this.server.to(user.socketId).emit('newNotification', notification);
                console.log(`[ChatGateway] Sent notification to user ${userId}`);
                return true;
            }
        }
        console.log(`[ChatGateway] User ${userId} not connected, notification not sent`);
        return false;
    }

    // Send notification to all users in a tenant
    sendNotificationToTenant(tenantId: string, notification: any) {
        this.server.to(`tenant:${tenantId}`).emit('newNotification', notification);
        console.log(`[ChatGateway] Sent notification to tenant ${tenantId}`);
    }

    // Broadcast notification update (refresh signal)
    broadcastNotificationUpdate(tenantId: string) {
        this.server.to(`tenant:${tenantId}`).emit('notificationUpdate', { timestamp: Date.now() });
    }
}
