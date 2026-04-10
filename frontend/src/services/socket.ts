import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;
    private listeners: Map<string, Function[]> = new Map();

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public connect(user: { id: string, name: string, avatar?: string | null, tenantId: string }) {
        if (this.socket?.connected) return;

        // If exists but disconnected, reconnect
        if (this.socket) {
            this.socket.connect();
            return;
        }

        const socketUrl = import.meta.env.PROD
            ? `${window.location.origin}/api/chat`
            : `http://${window.location.hostname}:3000/chat`;

        const token = localStorage.getItem('token');

        // Standard transports
        this.socket = io(socketUrl, {
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            autoConnect: false, // Manual connect after listeners
            auth: { token },
            query: { userId: user.id }
        });

        // Debug events
        this.socket.io.on("error", (error) => {
            console.error('[SocketService] Transport Error:', error);
        });

        this.socket.io.on("reconnect_attempt", (attempt) => {
            console.log('[SocketService] Reconnecting attempt:', attempt);
        });

        this.socket.on('connect', () => {
            console.log('[SocketService] Connected via WebSocket');
            this.emit('connectionChange', true);

            // Authenticate
            this.socket?.emit('authenticate', {
                userId: user.id,
                name: user.name,
                avatar: user.avatar,
                tenantId: user.tenantId,
                token
            });
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('[SocketService] Disconnected:', reason);
            this.emit('connectionChange', false);

            if (reason === 'io server disconnect') {
                setTimeout(() => this.socket?.connect(), 5000);
            }
        });

        this.socket.on('connect_error', (err) => {
            console.error('[SocketService] Connection Error:', err.message);
            this.emit('connectionChange', false);
        });

        // Proxy events
        const events = ['onlineUsers', 'userOnline', 'userOffline', 'newMessage', 'newDirectMessage', 'userTyping', 'userTypingDirect', 'newNotification', 'notificationUpdate', 'messageReaction'];
        events.forEach(event => {
            this.socket?.on(event, (data) => {
                this.emit(event, data);
            });
        });

        // CONNECT MANUALLY
        this.socket.connect();
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.emit('connectionChange', false);
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    public isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // Simple Event Emitter Implementation
    public on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    public off(event: string, callback: Function) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            this.listeners.set(event, callbacks.filter(cb => cb !== callback));
        }
    }

    private emit(event: string, data: any) {
        this.listeners.get(event)?.forEach(cb => cb(data));
    }
}

export const socketService = SocketService.getInstance();
