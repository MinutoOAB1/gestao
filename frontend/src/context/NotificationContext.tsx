import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

export interface Notification {
    id: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'event' | 'deadline' | 'message';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    entityId?: string;
    link?: string;
    icon?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTIFICATIONS_KEY = 'app_notifications';

// Generate unique ID
const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const saved = localStorage.getItem(NOTIFICATIONS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }));
            }
        } catch (e) {
            console.error('Error loading notifications:', e);
        }
        return [];
    });

    // Persist notifications to localStorage
    useEffect(() => {
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }, [notifications]);

    // Calculate unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    // Add a new notification
    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: generateId(),
            timestamp: new Date(),
            read: false,
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications

        // Play notification sound
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleB4EPZbjwXxIITaC8ut0RAo5juz6fEN8PTiZ+OplUE8yqP/jY1hALq7/3l1SSy+w/9daT0Uvr//XXE9GL6//1lxPRi+v/9ZdT0Uvr//WXU9FL6//1l1PRS+v/9ZdT0Uvr//WXU9FL6//1l1PRS+v/9ZdTkUvr//WXU5FL6//1l1ORS+v/9ZdTkUvr//WXU5FL6//1l1ORS+v/9ZdTkUvsP/VXU5FLq//1V5NRi6w/9VfTUYurf/VYE1GLa7/1WBNRi2u/9VgTUYtrv/VYE1GLa7/1WBNRi2u/9VgTEYtrv/VYEtGLa7/1WBLRi2u/9VgS0Ytrv/VYEtGLa7/1WBLRi2u/9VgS0Ytrv/VYEtGLa7/1WBLRi2u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/VYEpGLq7/1WBKRi6u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/UYEpGLa7/1GBKRi2u/9RgSkYtrv/UYEpGLa7/1GBKRi2u/9RgSkYtrv/UYEpGLa7/1GBKRi2v/9RgSkYtr//UYEpGLa//1GBKRi2v/9RgSkYtr//UYEpGLa//1GBKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2x/9RhSkYtsf/UYUpGLbH/1GFKRi2x/9RhSkYtsf/UYUpGLbH/1GFKRi2x/9RhSkYtsf/UYUpGLbH/1GFKRi2x/9RhSkYtsf/TYUpGLbH/02FKRi2x/9NhSkYtsf/TYUpGLbH/02FKRi2x/9NhSkYtsf/TYUpGLbH/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/SAAA=');
            audio.volume = 0.3;
            audio.play().catch(() => { }); // Ignore autoplay restrictions
        } catch (e) { }
    }, []);

    // Mark a notification as read (also calls backend)
    const markAsRead = useCallback(async (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        try {
            const api = (await import('../services/api')).default;
            await api.patch(`/notifications/${id}/read`);
        } catch (e) {
            console.log('Could not mark notification as read in backend');
        }
    }, []);

    // Mark all notifications as read (also calls backend)
    const markAllAsRead = useCallback(async () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
        try {
            const api = (await import('../services/api')).default;
            await api.patch('/notifications/read-all');
        } catch (e) {
            console.log('Could not mark all notifications as read in backend');
        }
    }, []);

    // Remove a notification (also calls backend)
    const removeNotification = useCallback(async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            const api = (await import('../services/api')).default;
            await api.delete(`/notifications/${id}`);
        } catch (e) {
            console.log('Could not delete notification from backend');
        }
    }, []);

    // Clear all notifications (delete from backend)
    const clearAll = useCallback(async () => {
        setNotifications([]);
        localStorage.removeItem(NOTIFICATIONS_KEY);
        try {
            const api = (await import('../services/api')).default;
            await api.delete('/notifications/all').catch(() => { });
        } catch (e) {
            console.log('Could not clear notifications from backend');
        }
    }, []);

    // Setup for realtime notifications - WebSockets
    useEffect(() => {
        let socket: Socket;

        const setupSocket = async () => {
            try {
                // Fetch existing standard notifications
                const api = (await import('../services/api')).default;
                const response = await api.get('/notifications');
                const backendNotifications = response.data || [];

                const converted = backendNotifications.map((n: any) => ({
                    id: n.id,
                    type: n.type === 'MENTION' ? 'message' : 'info',
                    title: n.title,
                    message: n.message || '',
                    timestamp: new Date(n.createdAt),
                    read: n.isRead,
                    link: n.entityType === 'PROCESS_NOTE' ? '/processos' :
                        n.entityType === 'EVENT' ? '/agenda' : undefined
                }));

                if (converted.length > 0) {
                    setNotifications(converted);
                }

                // Connect WebSocket
                const token = localStorage.getItem('token');
                const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

                socket = io(`${backendUrl}/notifications`, {
                    auth: { token },
                    transports: ['websocket', 'polling']
                });

                socket.on('connect', () => {
                    console.log('Real-time notifications connected');
                });

                socket.on('notification', (payload: any) => {
                    // Update state
                    const newNotification: Notification = {
                        id: payload.id || generateId(),
                        type: payload.type === 'FINANCIAL' ? 'success' : payload.type === 'MENTION' ? 'message' : 'info',
                        title: payload.title,
                        message: payload.message || '',
                        timestamp: new Date(payload.timestamp || new Date()),
                        read: false,
                        entityId: payload.entityId, // store the entity reference for AI Suggestion tasks
                        link: payload.entityType === 'PROCESS_NOTE' ? '/processos' :
                            payload.entityType === 'EVENT' ? '/agenda' :
                            payload.entityType === 'FINANCIAL' ? '/financeiro' : undefined
                    };
                    
                    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
                    
                    // Play sound and show visual toast ONLY if not an AI Suggestion
                    const isAiSuggestion = payload.title?.includes('[IA]') || payload.title?.includes('Copiloto');
                    
                    if (!isAiSuggestion) {
                        try {
                            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleB4EPZbjwXxIITaC8ut0RAo5juz6fEN8PTiZ+OplUE8yqP/jY1hALq7/3l1SSy+w/9daT0Uvr//XXE9GL6//1lxPRi+v/9ZdT0Uvr//WXU9FL6//1l1PRS+v/9ZdT0Uvr//WXU9FL6//1l1PRS+v/9ZdTkUvr//WXU5FL6//1l1ORS+v/9ZdTkUvr//WXU5FL6//1l1ORS+v/9ZdTkUvsP/VXU5FLq//1V5NRi6w/9VfTUYurf/VYE1GLa7/1WBNRi2u/9VgTUYtrv/VYE1GLa7/1WBNRi2u/9VgTEYtrv/VYEtGLa7/1WBLRi2u/9VgS0Ytrv/VYEtGLa7/1WBLRi2u/9VgS0Ytrv/VYEtGLa7/1WBLRi2u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/VYEpGLq7/1WBKRi6u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/UYEpGLa7/1GBKRi2u/9RgSkYtrv/UYEpGLa7/1GBKRi2u/9RgSkYtrv/UYEpGLa7/1GBKRi2v/9RgSkYtr//UYEpGLa//1GBKRi2v/9RgSkYtr//UYEpGLa//1GBKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2x/9RhSkYtsf/UYUpGLbH/1GFKRi2x/9RhSkYtsf/UYUpGLbH/1GFKRi2x/9RhSkYtsf/UYUpGLbH/1GFKRi2x/9RhSkYtsf/TYUpGLbH/02FKRi2x/9NhSkYtsf/TYUpGLbH/02FKRi2x/9NhSkYtsf/TYUpGLbH/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/SAAA=');
                            audio.volume = 0.3;
                            audio.play().catch(() => { });
                        } catch (e) { }

                        // Show visual toast
                        if (payload.type === 'FINANCIAL') {
                             toast.success(payload.title, { description: payload.message });
                        } else if (payload.type === 'SYSTEM') {
                             toast.info(payload.title, { description: payload.message });
                        } else {
                             toast(payload.title, { description: payload.message });
                        }
                    }
                });

            } catch (error) {
                console.log('Notifications API not available');
            }
        };

        setupSocket();

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const contextValue = useMemo(() => ({
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
    }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification, clearAll]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
