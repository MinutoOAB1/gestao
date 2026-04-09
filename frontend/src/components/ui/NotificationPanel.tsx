import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Calendar, AlertTriangle, MessageSquare, DollarSign, FileText, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotifications } from '../../context/NotificationContext';
import type { Notification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'event':
            return <Calendar size={16} className="text-purple-400" />;
        case 'deadline':
            return <AlertTriangle size={16} className="text-amber-400" />;
        case 'message':
            return <MessageSquare size={16} className="text-blue-400" />;
        case 'success':
            return <DollarSign size={16} className="text-green-400" />;
        case 'error':
            return <X size={16} className="text-red-400" />;
        case 'warning':
            return <AlertTriangle size={16} className="text-orange-400" />;
        default:
            return <FileText size={16} className="text-app-text-muted" />;
    }
};

const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

export default function NotificationPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = (notification: Notification) => {
        // Ignora clique principal se for sugestão da IA (força uso dos botões)
        const isAiSuggestion = notification.title?.includes('[IA]') || notification.title?.includes('Copiloto');
        if (isAiSuggestion && !notification.read) return;

        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    const handleAcceptAi = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation();
        try {
            const api = (await import('../../services/api')).default;
            if (notification.entityId) {
                // PATCH event to ATIVO
                await api.patch(`/agenda/${notification.entityId}`, { status: 'ATIVO' });
                toast.success('Tarefa adicionada à agenda!');
                
                // Refresh to show in calendar/list immediately
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
            markAsRead(notification.id);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao aprovar sugestão');
        }
    };

    const handleRejectAi = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation();
        try {
            const api = (await import('../../services/api')).default;
            if (notification.entityId) {
                // Delete the draft event
                await api.delete(`/agenda/${notification.entityId}`);
            }
            markAsRead(notification.id);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao recusar sugestão');
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-app-text-muted hover:text-primary hover:bg-primary/5 rounded-full transition-all"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative flex items-center justify-center rounded-full h-4 w-4 bg-rose-500 text-[9px] font-bold text-white border-2 border-app-bg">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-80 md:w-96 bg-app-card border border-app-stroke rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="p-4 border-b border-app-stroke flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-app-text-main">Notificações</h3>
                            {unreadCount > 0 && (
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} novas
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {notifications.length > 0 && (
                                <>
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-1.5 text-app-text-muted hover:text-primary rounded-lg hover:bg-app-stroke/30 transition-colors"
                                        title="Marcar todas como lidas"
                                    >
                                        <CheckCheck size={16} />
                                    </button>
                                    <button
                                        onClick={clearAll}
                                        className="p-1.5 text-app-text-muted hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                                        title="Limpar todas"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-app-bg/30">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={32} className="mx-auto mb-2 text-app-text-muted opacity-30" />
                                <p className="text-app-text-muted text-sm">Nenhuma notificação</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {(() => {
                                    const grouped = notifications.reduce((acc, notif) => {
                                        const now = new Date();
                                        const date = new Date(notif.timestamp);
                                        const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
                                        const diffHours = Math.floor(diffMins / 60);
                                        const diffDays = Math.floor(diffHours / 24);
                                        
                                        let group = 'Anteriores';
                                        if (diffDays === 0 && now.getDate() === date.getDate()) group = 'Hoje';
                                        else if (diffDays <= 1) group = 'Ontem';
                                        else if (diffDays < 7) group = 'Esta semana';
                                        
                                        if (!acc[group]) acc[group] = [];
                                        acc[group].push(notif);
                                        return acc;
                                    }, {} as Record<string, Notification[]>);

                                    const order = ['Hoje', 'Ontem', 'Esta semana', 'Anteriores'];
                                    return order.map(groupName => {
                                        if (!grouped[groupName] || grouped[groupName].length === 0) return null;
                                        return (
                                            <div key={groupName} className="border-b border-app-stroke/50 group/section last:border-0">
                                                <div className="sticky top-0 bg-app-card/95 backdrop-blur-sm z-10 px-4 py-1.5 border-b border-app-stroke/50">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">{groupName}</span>
                                                </div>
                                                <AnimatePresence>
                                                    {grouped[groupName].map((notification, idx) => (
                                                        <motion.div
                                                            key={notification.id}
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                                                            onClick={() => handleNotificationClick(notification)}
                                                            className={clsx(
                                                                "p-4 flex gap-3 cursor-pointer transition-colors relative",
                                                                !notification.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-app-stroke/20"
                                                            )}
                                                        >
                                                            {!notification.read && (
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md" />
                                                            )}
                                                            <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center shrink-0 border", 
                                                                !notification.read ? "bg-white dark:bg-slate-800 border-primary/20 shadow-sm" : "bg-app-stroke/30 border-transparent")}>
                                                                {getNotificationIcon(notification.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h4 className={clsx(
                                                                            "text-sm truncate",
                                                                            notification.read ? "text-app-text-muted transition-colors group-hover:text-app-text-main" : "text-app-text-main font-bold"
                                                                        )}>
                                                                            {notification.title}
                                                                        </h4>
                                                                        <span className="text-[10px] text-app-text-muted whitespace-nowrap mt-0.5">
                                                                            {getTimeAgo(notification.timestamp)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-app-text-muted mt-1 leading-relaxed line-clamp-2">
                                                                        {notification.message}
                                                                    </p>

                                                                    {/* AI Suggestion Buttons */}
                                                                    {!notification.read && (notification.title?.includes('[IA]') || notification.title?.includes('Copiloto')) && (
                                                                        <div className="flex gap-2 mt-3 relative z-20">
                                                                            <button 
                                                                                onClick={(e) => handleAcceptAi(e, notification)}
                                                                                className="flex-1 text-xs font-semibold bg-primary text-white py-1.5 rounded-lg hover:bg-primary-light transition-colors"
                                                                            >
                                                                                Aceitar
                                                                            </button>
                                                                            <button 
                                                                                onClick={(e) => handleRejectAi(e, notification)}
                                                                                className="flex-1 text-xs font-semibold bg-app-stroke/50 text-app-text-main py-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                                                            >
                                                                                Recusar
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-app-stroke">
                            <button
                                onClick={() => {
                                    navigate('/configuracoes');
                                    setIsOpen(false);
                                }}
                                className="w-full text-center text-xs font-medium text-primary hover:text-primary-light transition-colors py-1"
                            >
                                Configurar Notificações
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
