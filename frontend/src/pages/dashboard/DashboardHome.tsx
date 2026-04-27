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
import { Avatar } from '../../components/ui/Avatar';

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
        className="bg-white dark:bg-white/[0.02] backdrop-blur-md p-4 rounded-2xl border border-slate-100 dark:border-white/5 relative overflow-hidden flex items-center gap-4 cursor-pointer transition-all hover:border-slate-200 dark:hover:border-white/20 hover:scale-[1.02] group shadow-sm"
        style={{ boxShadow: premiumShadow }}
    >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${color === 'bg-rose-500' ? 'bg-rose-500' : color === 'bg-amber-500' ? 'bg-amber-500' : 'bg-primary'} transition-all duration-300`}></div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/10 transition-all">
            {type === 'urgent' && <AlertTriangle size={18} className="text-rose-500" />}
            {type === 'warning' && <Gavel size={18} className="text-amber-500" />}
            {type === 'info' && <FileText size={18} className="text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black uppercase tracking-widest ${type === 'urgent' ? 'text-rose-500' : type === 'warning' ? 'text-amber-500' : 'text-primary'}`}>
                    {type === 'urgent' ? 'Urgente' : type === 'warning' ? 'Amanhã' : '3 Dias'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-wider">{time}</span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate mt-1">{title}</h4>
            <p className="text-[11px] text-slate-500 dark:text-white/40 truncate">{subtitle}</p>
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
            const res = await api.get('/dashboard/summary');
            const summary = res.data;

            if (summary) {
                setProductivity(summary);
                
                const clients = summary.recentClients || [];
                const events = summary.agenda || [];

                setData({
                    totalIncome: summary.pendingPayments || 0,
                    totalExpense: 0,
                    balance: (summary.pendingPayments || 0),
                    clientsCount: summary.totalClients || 0,
                    processesCount: summary.totalProcesses || 0,
                    eventsCount: events.length,
                    recentClients: clients,
                    upcomingEvents: events
                });
            }
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
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Resumo Financeiro</h2>
                                <button
                                onClick={() => navigate('/app/financeiro')}
                                className="text-xs text-primary font-black uppercase tracking-widest hover:opacity-80 transition-all"
                            >
                                Ver tudo
                            </button>
                        </div>
                        <div
                            className="bg-white dark:bg-white/[0.02] backdrop-blur-md rounded-2xl border border-slate-100 dark:border-white/5 p-4 sm:p-6 relative overflow-hidden transition-all hover:border-slate-200 dark:hover:border-white/10 shadow-sm"
                            style={{ boxShadow: premiumShadow }}
                        >
                            <button
                                onClick={() => setIsFinanceHidden(!isFinanceHidden)}
                                className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 transition-all group"
                                title={isFinanceHidden ? "Mostrar valores" : "Ocultar valores"}
                            >
                                {isFinanceHidden ? <EyeOff size={16} className="text-slate-400 dark:text-white/40 group-hover:text-slate-600 dark:group-hover:text-white" /> : <Eye size={16} className="text-slate-400 dark:text-white/40 group-hover:text-slate-600 dark:group-hover:text-white" />}
                            </button>

                            <div className="relative z-10">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 mb-2">Saldo Consolidado</p>
                                <div className="flex items-center gap-4">
                                    <h3 className={`text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight transition-all duration-300 ${isFinanceHidden ? 'blur-xl select-none opacity-20' : ''}`}>
                                        {formatBRL(data.balance)}
                                    </h3>
                                    <span className={`${data.balance >= 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border transition-all duration-300 ${isFinanceHidden ? 'blur-md select-none opacity-0' : ''}`}>
                                        {percentChange}
                                    </span>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none opacity-50 dark:opacity-100">
                                <MovingWaveChart />
                            </div>

                            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4 sm:gap-8 relative z-10">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-app-text-muted mb-0.5 sm:mb-1 uppercase font-black tracking-widest">Receitas</p>
                                    <p className={`text-base sm:text-lg font-bold text-slate-900 dark:text-white transition-all duration-300 ${isFinanceHidden ? 'blur-md select-none' : ''}`}>{formatBRLCompact(data.totalIncome)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-app-text-muted mb-0.5 sm:mb-1 uppercase font-black tracking-widest">Despesas</p>
                                    <p className={`text-base sm:text-lg font-bold text-slate-500 transition-all duration-300 ${isFinanceHidden ? 'blur-md select-none' : ''}`}>{formatBRLCompact(data.totalExpense)}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'stats':
                return (
                    <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[
                            { value: productivity.totalClients || data.clientsCount, label: 'Clientes', icon: Users, color: 'text-primary', bg: 'bg-primary/5', path: '/app/clientes' },
                            { value: productivity.totalProcesses || data.processesCount, label: 'Processos', icon: FileText, color: 'text-primary', bg: 'bg-primary/5', path: '/app/processos' },
                            { value: data.eventsCount, label: 'Eventos', icon: Calendar, color: 'text-primary', bg: 'bg-primary/5', path: '/app/agenda' }
                        ].map((stat, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(stat.path)}
                                className="bg-white dark:bg-white/[0.02] backdrop-blur-md rounded-2xl border border-slate-100 dark:border-white/5 p-4 sm:p-5 transition-all hover:border-slate-200 dark:hover:border-white/10 hover:scale-[1.02] cursor-pointer group shadow-sm"
                                style={{ boxShadow: premiumShadow }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-primary group-hover:text-white transition-all">
                                        <stat.icon size={18} className="text-slate-400 dark:text-white/40 group-hover:text-white" />
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300 dark:text-white/20 group-hover:text-slate-600 dark:group-hover:text-white/60 transition-colors" />
                                </div>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">{stat.value}</p>
                                <p className="text-[11px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>
                );
            case 'productivity':
                return (
                    <motion.div variants={itemVariants}>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 mb-4 px-2">Métricas de Produtividade</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                            <div className="col-span-2 lg:col-span-2 bg-primary rounded-2xl border border-white/10 p-5 sm:p-6 transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden group" style={{ boxShadow: premiumShadow }}>
                                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all" />
                                <div className="flex items-center gap-4 mb-4 relative z-10">
                                    <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                                        <Calculator size={22} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[12px] sm:text-xs text-white/70 font-black uppercase tracking-[0.2em] font-display">A Receber</p>
                                        <p className="text-[10px] text-white/50 font-medium">Valores pendentes totais</p>
                                    </div>
                                </div>
                                <p className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display relative z-10">{formatBRLCompact(productivity.pendingPayments)}</p>
                            </div>

                            <div className="bg-white dark:bg-white/[0.02] backdrop-blur-md rounded-2xl border border-slate-100 dark:border-white/5 p-4 sm:p-5 transition-all hover:border-slate-200 dark:hover:border-white/10 flex flex-col justify-center group shadow-sm" style={{ boxShadow: premiumShadow }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/10 transition-all">
                                        <AlertTriangle size={18} className="text-slate-400 dark:text-white/60 group-hover:text-amber-500 dark:group-hover:text-white" />
                                    </div>
                                </div>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">{productivity.upcomingDeadlines}</p>
                                <p className="text-[11px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1">Prazos</p>
                            </div>

                            <div className="bg-white dark:bg-white/[0.02] backdrop-blur-md rounded-2xl border border-slate-100 dark:border-white/5 p-4 sm:p-5 transition-all hover:border-slate-200 dark:hover:border-white/10 flex flex-col justify-center group shadow-sm" style={{ boxShadow: premiumShadow }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/10 transition-all">
                                        <FileText size={18} className="text-slate-400 dark:text-white/60 group-hover:text-primary dark:group-hover:text-white" />
                                    </div>
                                </div>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">{productivity.newProcesses}</p>
                                <p className="text-[11px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1">Processos</p>
                            </div>

                            <div className="bg-white dark:bg-white/[0.02] backdrop-blur-md rounded-2xl border border-slate-100 dark:border-white/5 p-4 sm:p-5 transition-all hover:border-slate-200 dark:hover:border-white/10 flex flex-col justify-center group shadow-sm" style={{ boxShadow: premiumShadow }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/10 transition-all">
                                        <Users size={18} className="text-slate-400 dark:text-white/60 group-hover:text-primary dark:group-hover:text-white" />
                                    </div>
                                </div>
                                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">{productivity.activeClients}</p>
                                <p className="text-[11px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1">Clientes</p>
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
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Últimos Clientes</h2>
                            <button onClick={() => navigate('/app/clientes')} className="text-xs text-primary font-black uppercase tracking-widest hover:opacity-80 transition-all">
                                Ver todos
                            </button>
                        </div>
                        <div className="bg-app-card rounded-2xl border border-app-stroke divide-y divide-app-stroke/50 transition-colors hover:border-black/10 dark:hover:border-white/10" style={{ boxShadow: premiumShadow }}>
                            {displayRecentClients.length > 0 ? (
                                displayRecentClients.map((client: any, i: number) => {
                                    const isNew = client.createdAt && (new Date().getTime() - new Date(client.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
                                    return (
                                        <div key={client.id || i} className="p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 group" onClick={() => navigate(`/app/clientes/${client.id}`)}>
                                            <Avatar 
                                                 name={client.name} 
                                                 size="md" 
                                                 className="shrink-0 shadow-md shadow-black/10"
                                            />
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
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30">Visão Geral</p>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">Dashboard</h1>
                </div>
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white shadow-sm'}`}
                >
                    <Settings2 size={14} />
                    {isEditMode ? 'Concluir' : 'Layout'}
                </button>
            </div>
            
            {/* Subscription Notice */}
            {user?.plan === 'FREE' && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-2 mb-4 p-5 bg-[#0F172A] rounded-[2rem] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group shadow-2xl shadow-primary/20"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-5 text-center sm:text-left relative z-10">
                        <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                            <Zap size={24} className="text-primary fill-primary/20" />
                        </div>
                        <div>
                            <p className="font-black text-lg text-white font-display tracking-tight">Upgrade para o Advus Plus</p>
                            <p className="text-sm text-white/60 font-medium">Libere usuários ilimitados, IA de análise avançada e muito mais.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/app/configuracoes?tab=billing')}
                        className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neutral-100 transition-all shadow-xl shadow-white/10 active:scale-95 shrink-0"
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
