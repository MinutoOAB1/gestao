import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../services/socket';

interface Notification {
    id: string;
    type: string;
    title: string;
    message?: string;
    isRead: boolean;
    entityType?: string;
    entityId?: string;
    createdBy?: {
        id: string;
        name: string;
    };
    createdAt: string;
}

export default function NotificationBell() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/notifications');
            setNotifications(res.data || []);
            setUnreadCount((res.data || []).filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            setUnreadCount(res.data?.count || 0);
        } catch (error) {
            console.error('Erro ao buscar contagem:', error);
        }
    }, []);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) { }
    }, []);

    useEffect(() => {
        fetchNotifications();

        // Poll every 30 seconds as backup
        const interval = setInterval(fetchUnreadCount, 30000);

        // Real-time Socket.IO listener
        const handleNewNotification = (notification: Notification) => {
            console.log('[NotificationBell] New notification received:', notification);
            setNotifications(prev => [notification, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
            playNotificationSound();
        };

        const handleNotificationUpdate = () => {
            // Refresh notifications when something changes
            fetchNotifications();
        };

        socketService.on('newNotification', handleNewNotification);
        socketService.on('notificationUpdate', handleNotificationUpdate);

        return () => {
            clearInterval(interval);
            socketService.off('newNotification', handleNewNotification);
            socketService.off('notificationUpdate', handleNotificationUpdate);
        };
    }, [fetchNotifications, fetchUnreadCount, playNotificationSound]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erro ao marcar como lida:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }

        // Navigate based on entity type
        if (notification.entityType && notification.entityId) {
            switch (notification.entityType) {
                case 'PROCESS_NOTE':
                case 'PROCESS_UPDATE':
                    // Extract process ID and navigate
                    navigate(`/processos`);
                    break;
                case 'EVENT':
                    navigate('/agenda');
                    break;
            }
        }
        setOpen(false);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `${diffMins}min`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
            >
                <Bell size={20} className="text-white/70" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-app-card border border-app-stroke rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-3 border-b border-app-stroke flex justify-between items-center bg-app-bg/50">
                        <span className="font-bold text-app-text-main text-sm">Notificações</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-primary hover:underline font-medium"
                            >
                                Marcar todas como lidas
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-app-text-muted">
                                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Nenhuma notificação</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={clsx(
                                        "p-3 border-b border-app-stroke last:border-b-0 cursor-pointer transition-colors flex gap-3",
                                        notification.isRead ? "bg-transparent hover:bg-app-stroke/10" : "bg-primary/5 hover:bg-primary/10"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        {notification.createdBy ? (
                                            <span className="text-primary font-bold text-sm">
                                                {notification.createdBy.name.charAt(0).toUpperCase()}
                                            </span>
                                        ) : (
                                            <Bell size={14} className="text-primary" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={clsx(
                                            "text-sm leading-tight",
                                            notification.isRead ? "text-app-text-muted" : "text-app-text-main font-medium"
                                        )}>
                                            {notification.title}
                                        </p>
                                        {notification.message && (
                                            <p className="text-xs text-app-text-muted mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-app-text-muted mt-1 flex items-center gap-1">
                                            <Clock size={10} />
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>

                                    {/* Unread indicator */}
                                    {!notification.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 10 && (
                        <div className="p-2 border-t border-app-stroke text-center">
                            <button className="text-xs text-primary hover:underline">
                                Ver todas as notificações
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
