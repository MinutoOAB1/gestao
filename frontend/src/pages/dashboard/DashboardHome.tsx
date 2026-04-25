import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Plus, Users, Calendar, Calculator, AlertTriangle, Gavel, FileText, Eye, EyeOff, ChevronRight, Zap, Settings2, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import TeamPerformanceChart from '../../components/dashboard/TeamPerformanceChart';
import WeeklyAgenda from '../../components/dashboard/WeeklyAgenda';
import { useNotifications } from '../../context/NotificationContext';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import WelcomeOverlay from '../../components/dashboard/WelcomeOverlay';

// Sortable Block Component
const SortableBlock = memo(({ id, children, isEditMode }: { id: string, children: React.ReactNode, isEditMode: boolean }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isEditMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.7 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`relative ${isEditMode ? 'p-2 rounded-3xl bg-black/5 dark:bg-white/5 ring-2 ring-black dark:ring-white' : ''}`}>
            {isEditMode && (
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="absolute -top-3 -right-3 w-8 h-8 bg-black dark:bg-white border border-black/10 dark:border-white/10 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-50 text-white dark:text-black hover:scale-110 transition-transform"
                >
                    <GripVertical size={16} />
                </div>
            )}
            <div className={isEditMode ? 'pointer-events-none opacity-80' : ''}>
                {children}
            </div>
        </div>
    );
});

// Brazilian currency formatter
const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const formatBRLCompact = (value: number) => {
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
    }
    return formatBRL(value);
};

// Sparkline Chart Component (Relaces WaveChart)




const MovingWaveChart = memo(() => {
    return (
        <div className="w-full h-full opacity-40 overflow-hidden relative">
            <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                <motion.path
                    d="M 0 100 C 200 80 400 120 600 90 C 700 75 800 110 800 110"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={{
                        d: [
                            "M 0 100 C 200 80 400 120 600 90 C 700 75 800 110 800 110",
                            "M 0 110 C 200 120 400 80 600 110 C 700 125 800 90 800 90",
                            "M 0 100 C 200 80 400 120 600 90 C 700 75 800 110 800 110"
                        ]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                {/* Subtle fill under the line */}
                <motion.path
                    d="M 0 100 C 200 80 400 120 600 90 C 700 75 800 110 800 110 V 200 H 0 Z"
                    fill="url(#waveGradient)"
                    animate={{
                        d: [
                            "M 0 100 C 200 80 400 120 600 90 C 700 75 800 110 800 110 V 200 H 0 Z",
                            "M 0 110 C 200 120 400 80 600 110 C 700 125 800 90 800 90 V 200 H 0 Z",
                            "M 0 100 C 200 80 400 120 600 90 C 700 75 800 110 800 110 V 200 H 0 Z"
                        ]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
});

const QuickAction = memo(({ icon: Icon, label, colorClass, onClick }: any) => (
    <motion.button
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 sm:gap-2 group touch-manipulation no-tap-highlight"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
        <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${colorClass} bg-opacity-10 flex items-center justify-center transition-fast group-hover:bg-opacity-25 group-hover:shadow-lg backdrop-blur-sm border border-white/5 will-animate`}>
            <Icon size={20} className={`sm:w-6 sm:h-6 ${colorClass.replace('bg-', 'text-')} transition-fast group-hover:scale-110`} />
        </div>
        <span className="text-[10px] sm:text-xs font-medium text-app-text-muted transition-fast group-hover:text-app-text-main text-center leading-tight">{label}</span>
    </motion.button>
));

const DeadlineCard = memo(({ type, title, subtitle, time, color }: any) => (
    <div
        className="bg-app-card p-4 rounded-xl border border-app-stroke relative overflow-hidden flex items-center gap-4 cursor-pointer transition-colors hover:border-black/20 dark:hover:border-white/20"
        style={{ boxShadow: premiumShadow }}
    >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${color} transition-all duration-300`}></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-opacity-10 ${color.replace('bg-', 'bg-').replace('text-', '')} bg-app-stroke/30 transition-all duration-300`}>
            {type === 'urgent' && <AlertTriangle size={18} className={color.replace('bg-', 'text-')} />}
            {type === 'warning' && <Gavel size={18} className={color.replace('bg-', 'text-')} />}
            {type === 'info' && <FileText size={18} className={color.replace('bg-', 'text-')} />}
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${color.replace('bg-', 'text-')}`}>
                    {type === 'urgent' ? 'Urgente' : type === 'warning' ? 'Amanhã' : '3 Dias'}
                </span>
                <span className="text-xs text-app-text-muted">{time}</span>
            </div>
            <h4 className="font-semibold text-app-text-main text-sm line-clamp-1 mt-0.5">{title}</h4>
            <p className="text-xs text-app-text-muted line-clamp-1">{subtitle}</p>
        </div>
    </div>
));

// Snappy animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0.01,
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 500,
            damping: 30,
        }
    }
};

// Subtle premium shadow (replaces intense neon glow)
const premiumShadow = '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)';

interface DashboardData {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    clientsCount: number;
    processesCount: number;
    eventsCount: number;
    recentClients: any[];
    upcomingEvents: any[];
}

interface ProductivityStats {
    upcomingDeadlines: number;
    newProcesses: number;
    totalProcesses: number;
    totalClients: number;
    activeClients: number;
    pendingPayments: number;
    newComments: number;
    unreadNotifications: number;
    recentProcessComments?: any[];
    recentClientNotes?: any[];
    pendingActions?: {
        oldProcesses: any[];
        incompleteClients: any[];
    };
    urgentPayments: any[];
    upcomingHearings: any[];
    recentUpdates: any[];
}

export default function DashboardHome() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData>({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        clientsCount: 0,
        processesCount: 0,
        eventsCount: 0,
        recentClients: [],
        upcomingEvents: []
    });
    const [productivity, setProductivity] = useState<ProductivityStats>({
        upcomingDeadlines: 0,
        newProcesses: 0,
        totalProcesses: 0,
        totalClients: 0,
        activeClients: 0,
        pendingPayments: 0,
        newComments: 0,
        unreadNotifications: 0,
        recentProcessComments: [],
        recentClientNotes: [],
        pendingActions: { oldProcesses: [], incompleteClients: [] },
        urgentPayments: [],
        upcomingHearings: [],
        recentUpdates: []
    });
    const [loading, setLoading] = useState(true);
    const [isFinanceHidden, setIsFinanceHidden] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [clientsRes, , eventsRes, statsRes] = await Promise.all([
                api.get('/clients?take=3').catch(() => ({ data: [] })),
                api.get('/processes?take=1').catch(() => ({ data: [] })),
                api.get('/agenda').catch(() => ({ data: [] })),
                api.get('/dashboard/stats').catch(() => ({ data: null }))
            ]);

            const stats = statsRes.data;
            if (stats) {
                setProductivity(stats);
            }

            const clients = clientsRes.data || [];
            const events = eventsRes.data || [];

            const allEvents = events.sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

            setData({
                totalIncome: stats?.pendingPayments || 0,
                totalExpense: 0,
                balance: (stats?.pendingPayments || 0),
                clientsCount: stats?.totalClients || clients.length,
                processesCount: stats?.totalProcesses || 0,
                eventsCount: events.length,
                recentClients: clients.slice(0, 3),
                upcomingEvents: allEvents
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const { addNotification } = useNotifications();

    useEffect(() => {
        fetchDashboardData();
        
        // Show welcome overlay on every dashboard visit UNLESS opted out
        const shouldHide = localStorage.getItem('hide_welcome_overlay') === 'true';
        if (!shouldHide) {
            setShowWelcome(true);
        }

        // Send welcome notification once on first visit after update
        const notifSentKey = 'performance_chart_notif_sent_v2';
        
        if (!localStorage.getItem(notifSentKey)) {
            // Recibos
            addNotification({
                type: 'success',
                title: 'Novo: Recibos com Logo',
                message: 'Agora você pode carregar a logo do seu escritório nas configurações e gerar recibos PDF profissionais.',
                link: '/app/settings'
            });

            // Conversão de Clientes
            addNotification({
                type: 'info',
                title: 'Novo: Conversão de Clientes',
                message: 'Crie processos judiciais diretamente da lista de clientes ou da tela de detalhes.',
                link: '/app/clientes'
            });

            // Agenda Quick View
            addNotification({
                type: 'event',
                title: 'Novo: Visualização Rápida',
                message: 'Consulte detalhes de eventos na agenda com um clique sem precisar abrir o formulário de edição.',
                link: '/app/agenda'
            });

            localStorage.setItem(notifSentKey, 'true');
        }
        
        // Handle Stripe Checkout return
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        if (sessionId) {
            console.log('Verifying Stripe Session:', sessionId);
            api.post('/subscriptions/verify', { sessionId })
                .then((res) => {
                    if (res.data.success) {
                        // Force refresh of the profile to update AuthContext state
                        api.get('/auth/profile').then(profileRes => {
                            if (profileRes.data) {
                                // Since we don't have direct access to updateUser from here easily, 
                                // forcing a reload is the safest way to ensure all components see the ADV_PLUS plan.
                                window.history.replaceState({}, document.title, window.location.pathname);
                                window.location.reload();
                            }
                        });
                    }
                })
                .catch(err => console.error('Failed to verify session', err));
        }
    }, [fetchDashboardData, addNotification]);

    const percentChange = useMemo(() => data.balance > 0 ? '+12%' : '-5%', [data.balance]);

    const displayUrgentPayments = useMemo(() => productivity.urgentPayments?.slice(0, 3) || [], [productivity.urgentPayments]);
    const displayUpcomingEvents = useMemo(() => data.upcomingEvents || [], [data.upcomingEvents]);
    const displayRecentClients = useMemo(() => data.recentClients || [], [data.recentClients]);

    const handleNovoProcesso = useCallback(() => navigate('/app/processos/novo'), [navigate]);
    const handleNovoCliente = useCallback(() => navigate('/app/clientes/novo'), [navigate]);
    const handleAgendar = useCallback(() => navigate('/app/agenda'), [navigate]);
    const handleHonorarios = useCallback(() => navigate('/app/financeiro/novo'), [navigate]);

    const [blocksOrder, setBlocksOrder] = useState<string[]>(() => {
        const defaultBlocks = ['finance', 'stats', 'productivity', 'urgent', 'chart', 'agenda', 'clients'];
        const saved = localStorage.getItem('dashboard_blocks_order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && defaultBlocks.every(b => parsed.includes(b))) {
                    return parsed;
                }
            } catch(e) {}
        }
        return defaultBlocks;
    });
    const [isEditMode, setIsEditMode] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    if (loading) {
        return <DashboardSkeleton />;
    }



    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setBlocksOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('dashboard_blocks_order', JSON.stringify(newOrder));
                return newOrder;
            });
        }
    };

    const renderBlock = (id: string) => {
        switch(id) {
            case 'finance':
                return (
                    <motion.div variants={itemVariants}>
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h2 className="text-lg font-bold text-app-text-main">Resumo Financeiro</h2>
                                <button
                                onClick={() => navigate('/app/financeiro')}
                                className="text-xs text-primary font-black uppercase tracking-widest hover:opacity-80 transition-all"
                            >
                                Ver tudo
                            </button>
                        </div>
                        <div
                            className="bg-app-card rounded-2xl border border-app-stroke p-4 sm:p-6 relative overflow-hidden transition-colors hover:border-black/20 dark:hover:border-white/20"
                            style={{ boxShadow: premiumShadow }}
                        >
                            <button
                                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-lg bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                title={isFinanceHidden ? "Mostrar valores" : "Ocultar valores"}
                            >
                                {isFinanceHidden ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
                            </button>

                            <div className="relative z-10">
                                <p className="text-xs sm:text-sm text-app-text-muted mb-1">Saldo Total</p>
                                <div className="flex items-center gap-3">
                                    <h3 className={`text-2xl sm:text-3xl font-bold text-app-text-main transition-all duration-300 ${isFinanceHidden ? 'blur-md select-none' : ''}`}>
                                        {formatBRL(data.balance)}
                                    </h3>
                                    <span className={`${data.balance >= 0 ? 'bg-black dark:bg-white text-white dark:text-black border-black/10' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'} text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all duration-300 ${isFinanceHidden ? 'blur-md select-none' : ''}`}>
                                        {percentChange}
                                    </span>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none">
                                <MovingWaveChart />
                            </div>

                            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-app-stroke grid grid-cols-2 gap-4 sm:gap-8 relative z-10">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-app-text-muted mb-0.5 sm:mb-1">Receitas</p>
                                    <p className={`text-base sm:text-lg font-bold text-black dark:text-white transition-all duration-300 ${isFinanceHidden ? 'blur-md select-none' : ''}`}>{formatBRLCompact(data.totalIncome)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] sm:text-xs text-app-text-muted mb-0.5 sm:mb-1">Despesas</p>
                                    <p className={`text-base sm:text-lg font-bold text-gray-500 transition-all duration-300 ${isFinanceHidden ? 'blur-md select-none' : ''}`}>{formatBRLCompact(data.totalExpense)}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'stats':
                return (
                    <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[
                            { value: productivity.totalClients || data.clientsCount, label: 'Clientes', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-500/10', path: '/app/clientes' },
                            { value: productivity.totalProcesses || data.processesCount, label: 'Processos', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-500/10', path: '/app/processos' },
                            { value: data.eventsCount, label: 'Eventos', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-500/10', path: '/app/agenda' }
                        ].map((stat, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(stat.path)}
                                className="bg-app-card rounded-xl border border-app-stroke p-3 sm:p-4 transition-all hover:border-black/20 dark:hover:border-white/20 cursor-pointer touch-manipulation group"
                                style={{ boxShadow: premiumShadow }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${stat.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <stat.icon size={16} className={`sm:w-[18px] sm:h-[18px] ${stat.color}`} />
                                    </div>
                                    <ChevronRight size={14} className="text-app-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-app-text-main">{stat.value}</p>
                                <p className="text-[10px] sm:text-xs text-app-text-muted">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>
                );
            case 'productivity':
                return (
                    <motion.div variants={itemVariants}>
                        <h2 className="text-lg font-bold text-app-text-main mb-4 px-2">Métricas de Produtividade</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                            <div className="col-span-2 lg:col-span-2 bg-primary rounded-xl border border-white/10 p-4 sm:p-5 transition-colors hover:opacity-90 relative overflow-hidden" style={{ boxShadow: premiumShadow }}>
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 dark:bg-black/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Calculator size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[12px] sm:text-xs text-white font-black uppercase tracking-widest font-display">A Receber</p>
                                        <p className="text-[10px] text-white/60 font-medium">Valores pendentes</p>
                                    </div>
                                </div>
                                <p className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display">{formatBRLCompact(productivity.pendingPayments)}</p>
                            </div>
                            <div className="bg-app-card rounded-xl border border-app-stroke p-3 sm:p-4 transition-colors hover:border-orange-500/30 flex flex-col justify-center" style={{ boxShadow: premiumShadow }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                        <AlertTriangle size={16} className="text-orange-500" />
                                    </div>
                                </div>
                                <p className="text-xl sm:text-2xl font-bold text-app-text-main">{productivity.upcomingDeadlines}</p>
                                <p className="text-[11px] sm:text-xs text-app-text-muted">Prazos</p>
                            </div>
                            <div className="bg-app-card rounded-xl border border-app-stroke p-3 sm:p-4 transition-colors hover:border-primary/30 flex flex-col justify-center" style={{ boxShadow: premiumShadow }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <FileText size={16} className="text-primary" />
                                    </div>
                                </div>
                                <p className="text-xl sm:text-2xl font-black text-app-text-main">{productivity.newProcesses}</p>
                                <p className="text-[11px] sm:text-xs text-app-text-muted uppercase tracking-tighter font-bold">Novos Process.</p>
                            </div>
                            <div className="bg-app-card rounded-xl border border-app-stroke p-3 sm:p-4 transition-colors hover:border-emerald-500/30 flex flex-col justify-center" style={{ boxShadow: premiumShadow }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Users size={16} className="text-emerald-500" />
                                    </div>
                                </div>
                                <p className="text-xl sm:text-2xl font-black text-app-text-main">{productivity.activeClients}</p>
                                <p className="text-[11px] sm:text-xs text-app-text-muted uppercase tracking-tighter font-bold">Clientes Ativos</p>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'urgent':
                return productivity.urgentPayments && productivity.urgentPayments.length > 0 ? (
                    <motion.div variants={itemVariants}>
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center">
                                        <AlertTriangle size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-app-text-main font-display">Pagamentos Urgentes</h3>
                                        <p className="text-xs text-app-text-muted">{productivity.urgentPayments.length} pagamento(s) marcado(s) como urgente</p>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/app/financeiro')} className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline transition-colors">
                                    Ver todos →
                                </button>
                            </div>
                            <div className="space-y-2">
                                {displayUrgentPayments.map((payment: any, i: number) => (
                                    <div key={payment.id || i} className="bg-app-card/50 backdrop-blur-sm border border-app-stroke rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full bg-rose-500 animate-pulse`} />
                                            <div>
                                                <p className="text-sm font-medium text-app-text-main">{payment.description}</p>
                                                <p className="text-xs text-app-text-muted">
                                                    Vence: {new Date(payment.date).toLocaleDateString('pt-BR')}
                                                    {payment.totalInstallments > 1 && ` • Parcela ${payment.currentInstallment}/${payment.totalInstallments}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold text-app-text-main`}>
                                            {formatBRL(payment.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : null;
            case 'chart':
                return (
                    <motion.div variants={itemVariants}>
                        <TeamPerformanceChart />
                    </motion.div>
                );
            case 'agenda':
                return (
                    <motion.div variants={itemVariants}>
                        <WeeklyAgenda events={displayUpcomingEvents} />
                    </motion.div>
                );
            case 'clients':
                return (
                    <motion.div variants={itemVariants}>
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h2 className="text-lg font-bold text-app-text-main">Últimos Clientes</h2>
                            <button onClick={() => navigate('/app/clientes')} className="text-xs text-primary font-black uppercase tracking-widest hover:opacity-80 transition-all">
                                Ver todos
                            </button>
                        </div>
                        <div className="bg-app-card rounded-2xl border border-app-stroke divide-y divide-app-stroke/50 transition-colors hover:border-black/10 dark:hover:border-white/10" style={{ boxShadow: premiumShadow }}>
                            {displayRecentClients.length > 0 ? (
                                displayRecentClients.map((client: any, i: number) => {
                                    const colors = ['bg-black', 'bg-neutral-800', 'bg-neutral-600', 'bg-neutral-400', 'bg-neutral-200'];
                                    const avatarBg = colors[i % colors.length];
                                    const isNew = client.createdAt && (new Date().getTime() - new Date(client.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
                                    return (
                                        <div key={client.id || i} className="p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 group" onClick={() => navigate(`/app/clientes/${client.id}`)}>
                                            <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center shrink-0 shadow-md shadow-black/10`}>
                                                <span className={`${avatarBg === 'bg-neutral-200' ? 'text-black' : 'text-white'} font-bold text-sm`}>{client.name?.charAt(0)?.toUpperCase() || 'C'}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-black text-app-text-main truncate">{client.name}</h4>
                                                    {isNew && <span className="text-[9px] bg-black dark:bg-white text-white dark:text-black font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Novo</span>}
                                                </div>
                                                <p className="text-xs text-app-text-muted truncate">{client.email || 'Sem email'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-app-text-muted">{new Date(client.createdAt).toLocaleDateString('pt-BR')}</span>
                                                <ChevronRight size={14} className="text-app-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-app-text-muted">Nenhum cliente cadastrado</p>
                                    <button onClick={handleNovoCliente} className="text-primary text-sm font-medium mt-2 hover:underline transition-colors">
                                        Cadastrar primeiro cliente
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5 px-1 sm:px-0 pb-24 md:pb-8"
        >
            <div className="pt-2 flex items-center justify-between px-2">
                <h1 className="text-2xl font-black text-app-text-main">Dashboard</h1>
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105' : 'bg-app-card border border-app-stroke text-app-text-muted hover:text-app-text-main'}`}
                >
                    <Settings2 size={16} />
                    {isEditMode ? 'Concluído' : 'Layout'}
                </button>
            </div>
            
            {/* Subscription Notice */}
            {user?.plan === 'FREE' && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-2 mb-4 p-4 bg-black dark:bg-white rounded-2xl text-white dark:text-black shadow-lg shadow-black/20 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3 text-center sm:text-left">
                        <div className="w-10 h-10 bg-white/20 dark:bg-black/20 rounded-full flex items-center justify-center shrink-0">
                            <Zap size={20} className="text-white dark:text-black" />
                        </div>
                        <div>
                            <p className="font-bold text-sm sm:text-base font-display">Upgrade para o Advus Plus</p>
                            <p className="text-xs text-white/80 dark:text-black/80">Libere usuários ilimitados, IA de análise e muito mais por apenas R$ 47/mês.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/app/faturamento')}
                        className="px-6 py-2 bg-white dark:bg-black text-black dark:text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-sm active:scale-95"
                    >
                        Ver Detalhes
                    </button>
                </motion.div>
            )}


            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocksOrder} strategy={verticalListSortingStrategy}>
                    <div className="space-y-5">
                        {blocksOrder.map(blockId => (
                            <SortableBlock key={blockId} id={blockId} isEditMode={isEditMode}>
                                {renderBlock(blockId)}
                            </SortableBlock>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Welcome Floating Card */}
            <WelcomeOverlay 
                isOpen={showWelcome} 
                onClose={() => setShowWelcome(false)} 
                userName={JSON.parse(localStorage.getItem('user') || '{}')?.name?.split(' ')[0] || 'Advogado'}
                stats={{
                    deadlines: productivity.upcomingDeadlines,
                    newProcesses: productivity.newProcesses,
                    updates: productivity.recentUpdates?.length || 0,
                    comments: productivity.newComments || 0,
                    mentions: productivity.unreadNotifications || 0,
                    recentProcessComments: productivity.recentProcessComments || [],
                    recentClientNotes: productivity.recentClientNotes || [],
                    pendingActions: productivity.pendingActions || { oldProcesses: [], incompleteClients: [] }
                }}
                onShowAgainChange={(hide) => {
                    localStorage.setItem('hide_welcome_overlay', hide ? 'true' : 'false');
                }}
            />
        </motion.div >
    );
}
