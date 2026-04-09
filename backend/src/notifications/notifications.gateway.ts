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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface JoinRoomPayload {
    tenantId: string;
    userId: string;
}

interface NotificationPayload {
    tenantId: string;
    userId?: string; // If undefined, broadcast to all users in tenant
    type: 'PROCESS_UPDATE' | 'FINANCIAL' | 'MENTION' | 'DEADLINE' | 'SYSTEM';
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/notifications',
})
export class NotificationsGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationsGateway.name);
    private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

    constructor(private jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.disconnect();
                return;
            }

            const payload = await this.jwtService.verifyAsync(token);
            const userId = payload.sub;
            const tenantId = payload.tenantId;

            // Store socket info
            client.data.userId = userId;
            client.data.tenantId = tenantId;

            // Join tenant room
            client.join(`tenant:${tenantId}`);
            // Join personal room
            client.join(`user:${userId}`);

            // Track user sockets
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, new Set());
            }
            this.userSockets.get(userId)!.add(client.id);

            this.logger.log(`Client ${client.id} connected - User: ${userId}, Tenant: ${tenantId}`);
        } catch (error) {
            this.logger.warn(`Client ${client.id} failed authentication: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        if (userId && this.userSockets.has(userId)) {
            this.userSockets.get(userId)!.delete(client.id);
            if (this.userSockets.get(userId)!.size === 0) {
                this.userSockets.delete(userId);
            }
        }
        this.logger.log(`Client ${client.id} disconnected`);
    }

    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket) {
        return { event: 'pong', data: { timestamp: Date.now() } };
    }

    // Send notification to specific user
    sendToUser(userId: string, notification: Omit<NotificationPayload, 'userId'>) {
        this.server.to(`user:${userId}`).emit('notification', {
            ...notification,
            timestamp: new Date().toISOString(),
        });
    }

    // Send notification to all users in a tenant
    sendToTenant(tenantId: string, notification: Omit<NotificationPayload, 'tenantId'>) {
        this.server.to(`tenant:${tenantId}`).emit('notification', {
            ...notification,
            timestamp: new Date().toISOString(),
        });
    }

    // Broadcast real-time update (e.g., process status change)
    broadcastUpdate(tenantId: string, update: {
        type: 'PROCESS' | 'FINANCIAL' | 'CLIENT' | 'DOCUMENT';
        action: 'CREATE' | 'UPDATE' | 'DELETE';
        entityId: string;
        data?: any;
    }) {
        this.server.to(`tenant:${tenantId}`).emit('entity_update', {
            ...update,
            timestamp: new Date().toISOString(),
        });
    }

    // Check if a user is online
    isUserOnline(userId: string): boolean {
        return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
    }

    // Get count of online users in a tenant
    getOnlineUsersCount(tenantId: string): number {
        const room = this.server.sockets.adapter.rooms.get(`tenant:${tenantId}`);
        return room ? room.size : 0;
    }
}
