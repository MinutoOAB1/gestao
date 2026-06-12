import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Plus, Users, Calendar, Calculator, AlertTriangle, Gavel, FileText, Eye, EyeOff, ChevronRight, Zap, Settings2, GripVertical, TrendingUp, Clock, Hash, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import TeamPerformanceChart from '../../components/dashboard/TeamPerformanceChart';
import WeeklyAgenda from '../../components/dashboard/WeeklyAgenda';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../../components/ui/Avatar';
import { haptics } from '../../utils/haptics';
import { clsx } from 'clsx';

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
        <div ref={setNodeRef} style={style} className={clsx(
            "relative transition-all duration-500",
            isEditMode ? 'p-4 rounded-[3rem] bg-primary/5 ring-2 ring-primary/20 shadow-2xl shadow-primary/5' : ''
        )}>
            {isEditMode && (
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="absolute -top-3 -right-3 w-10 h-10 bg-black dark:bg-white border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing z-50 text-white dark:text-black hover:scale-110 transition-transform"
                >
                    <GripVertical size={20} />
                </div>
            )}
            <div className={isEditMode ? 'pointer-events-none opacity-40 blur-sm' : ''}>
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

const MovingWaveChart = memo(() => {
    return (
        <div className="w-full h-full opacity-60 overflow-hidden relative">
            <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                <motion.path
                    d="M 0 100 C 200 80 400 120 600 90 C 700 75 800 110 800 110"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    animate={{
                        d: [
                            "M 0 100 C 200 80 400 120 600 90 C 700 75 800 110 800 110",
                            "M 0 110 C 200 120 400 80 600 110 C 700 125 800 90 800 90",
                            "M 0 100 C 200 80 400 120 600 90 C 700 75 800 110 800 110"
                        ]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
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
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
});

// Snappy animation variants
const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        }
    }
};

const itemVariants: any = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 30,
        }
    }
};

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
                    totalIncome: summary.pendingIncome || 0,
                    totalExpense: summary.monthExpenses || 0,
                    balance: summary.balance || 0,
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
    }, []);

    const { addNotification } = useNotifications();

    useEffect(() => {
        fetchDashboardData();
        
        const shouldHide = localStorage.getItem('hide_welcome_overlay') === 'true';
        if (!shouldHide) {
            setShowWelcome(true);
        }

        const notifSentKey = 'performance_chart_notif_sent_v2';
        
        if (!localStorage.getItem(notifSentKey)) {
            addNotification({
                type: 'success',
                title: 'Novo: Recibos com Logo',
                message: 'Agora você pode carregar a logo do seu escritório nas configurações e gerar recibos PDF profissionais.',
                link: '/app/settings'
            });

            addNotification({
                type: 'info',
                title: 'Novo: Conversão de Clientes',
                message: 'Crie processos judiciais diretamente da lista de clientes ou da tela de detalhes.',
                link: '/app/clientes'
            });

            addNotification({
                type: 'event',
                title: 'Novo: Visualização Rápida',
                message: 'Consulte detalhes de eventos na agenda com um clique sem precisar abrir o formulário de edição.',
                link: '/app/agenda'
            });

            localStorage.setItem(notifSentKey, 'true');
        }
        
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');
        if (sessionId) {
            api.post('/subscriptions/verify', { sessionId })
                .then((res) => {
                    if (res.data.success) {
                        api.get('/auth/profile').then(profileRes => {
                            if (profileRes.data) {
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
            haptics.medium();
        }
    };

    const renderBlock = (id: string) => {
        switch(id) {
            case 'finance':
                return (
                    <motion.div variants={itemVariants}>
                        <div className="flex justify-end mb-6 px-4">
                            <button
                                onClick={() => { navigate('/app/financeiro'); haptics.light(); }}
                                className="px-4 py-2 bg-app-card border border-app-stroke text-app-text-main font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-app-stroke/50 transition-all shadow-sm"
                            >
                                Detalhado
                            </button>
                        </div>
                        <div className="bg-app-card rounded-[1.5rem] md:rounded-[2rem] border border-app-stroke p-6 md:p-8 relative overflow-hidden group shadow-xl shadow-black/5">
                            <button
                                onClick={() => { setIsFinanceHidden(!isFinanceHidden); haptics.light(); }}
                                className="absolute top-8 right-8 z-20 p-3 rounded-2xl bg-app-bg border border-app-stroke hover:border-primary/30 transition-all text-app-text-muted hover:text-primary active:scale-90"
                            >
                                {isFinanceHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>

                            <div className="relative z-10 space-y-4">
                                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-app-text-muted">Saldo Atual</p>
                                <div className="flex items-center gap-4">
                                    <h3 className={clsx(
                                        "text-4xl font-black text-app-text-main font-display tracking-tighter transition-all duration-700",
                                        isFinanceHidden && "blur-2xl opacity-10 scale-95"
                                    )}>
                                        {formatBRL(data.balance)}
                                    </h3>
                                    <div className={clsx(
                                        "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500",
                                        data.balance >= 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20",
                                        isFinanceHidden && "opacity-0 scale-50"
                                    )}>
                                        {percentChange}
                                    </div>
                                </div>
                            </div>

                            <div className="absolute inset-0 pointer-events-none text-primary/50 dark:text-primary/40">
                                <MovingWaveChart />
                            </div>

                            <div className="mt-8 pt-6 border-t border-app-stroke/50 grid grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.2em]">Receitas Pendentes</p>
                                    <p className={clsx("text-xl font-black text-app-text-main tracking-tighter transition-all", isFinanceHidden && "blur-lg")}>
                                        {formatBRLCompact(data.totalIncome)}
                                    </p>
                                </div>
                                <div className="space-y-0.5 text-right">
                                    <p className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.2em]">Despesas do Mês</p>
                                    <p className={clsx("text-xl font-black text-app-text-main tracking-tighter transition-all", isFinanceHidden && "blur-lg")}>
                                        {formatBRLCompact(data.totalExpense)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'stats':
                return (
                    <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { value: productivity.totalClients || data.clientsCount, label: 'Clientes', icon: Users, color: 'text-primary', path: '/app/clientes', desc: 'Base ativa' },
                            { value: productivity.totalProcesses || data.processesCount, label: 'Processos', icon: FileText, color: 'text-amber-500', path: '/app/processos', desc: 'Em andamento' },
                            { value: data.eventsCount, label: 'Agenda', icon: Calendar, color: 'text-emerald-500', path: '/app/agenda', desc: 'Compromissos' }
                        ].map((stat, i) => (
                            <div
                                key={i}
                                onClick={() => { navigate(stat.path); haptics.light(); }}
                                className="bg-app-card rounded-xl md:rounded-2xl border border-app-stroke p-5 md:p-6 transition-all hover:border-primary/30 hover:scale-[1.02] cursor-pointer group shadow-lg shadow-black/5 relative overflow-hidden"
                            >
                                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                    <stat.icon size={120} />
                                </div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center border transition-all", 
                                        stat.color.replace('text-', 'bg-').replace('-500', '-500/10'),
                                        stat.color.replace('text-', 'border-').replace('-500', '-500/20')
                                    )}>
                                        <stat.icon size={22} className={stat.color} />
                                    </div>
                                    <ArrowUpRight size={18} className="text-app-text-muted group-hover:text-primary transition-colors" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-3xl font-black text-app-text-main font-display tracking-tighter">{stat.value}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[11px] font-black text-app-text-muted uppercase tracking-widest">{stat.label}</p>
                                        <span className="w-1 h-1 rounded-full bg-app-stroke"></span>
                                        <p className="text-[10px] font-bold text-app-text-muted italic opacity-60">{stat.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                );
            case 'productivity':
                return (
                    <motion.div variants={itemVariants}>
                        <div className="flex justify-between items-end mb-6 px-4">
                            <div className="space-y-1">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-app-text-muted">Eficiência Operacional</h2>
                                <p className="text-sm font-bold text-app-text-main">Métricas chave de entrega</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { value: productivity.upcomingDeadlines, label: 'Prazos', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                                { value: productivity.newProcesses, label: 'Novos Casos', icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
                                { value: productivity.activeClients, label: 'Retenção', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { value: productivity.newComments, label: 'Interações', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' }
                            ].map((p, i) => (
                                <div key={i} className="bg-app-card rounded-xl md:rounded-2xl border border-app-stroke p-5 md:p-6 flex flex-col justify-between group hover:border-app-stroke/80 transition-all shadow-sm">
                                    <div className={clsx("w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6 transition-transform group-hover:scale-110", p.bg)}>
                                        <p.icon size={18} className={p.color} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-app-text-main tracking-tighter">{p.value}</p>
                                        <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest mt-1">{p.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'urgent':
                return productivity.urgentPayments && productivity.urgentPayments.length > 0 ? (
                    <motion.div variants={itemVariants}>
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl md:rounded-2xl p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6 md:mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-rose-500 rounded-xl md:rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-rose-500/30">
                                        <AlertTriangle size={24} className="text-white" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-lg font-black text-app-text-main tracking-tighter uppercase">Alertas Financeiros</h3>
                                        <p className="text-[10px] text-app-text-muted font-bold">{productivity.urgentPayments.length} pendências críticas localizadas</p>
                                    </div>
                                </div>
                                <button onClick={() => { navigate('/app/financeiro'); haptics.light(); }} className="px-4 py-2.5 md:px-6 md:py-3 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-rose-500/20 active:scale-95">
                                    Resolver Agora
                                </button>
                            </div>
                            <div className="space-y-3">
                                {displayUrgentPayments.map((payment: any, i: number) => (
                                    <div key={payment.id || i} className="bg-app-card/60 backdrop-blur-md border border-app-stroke rounded-2xl p-4 flex items-center justify-between group hover:border-rose-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-app-bg border border-app-stroke rounded-xl flex items-center justify-center">
                                                <Calculator size={18} className="text-app-text-muted" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-black text-app-text-main uppercase tracking-tight">{payment.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock size={12} className="text-rose-500" />
                                                    <p className="text-[10px] text-rose-500 font-black">
                                                        Vencimento: {new Date(payment.date).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-app-text-main tracking-tighter">{formatBRL(payment.amount)}</p>
                                            <span className="text-[8px] font-black text-app-text-muted uppercase tracking-widest bg-app-stroke/30 px-2 py-0.5 rounded-md">ID {payment.id?.slice(0, 8)}</span>
                                        </div>
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
                        <div className="flex justify-between items-end mb-6 px-4">
                            <div className="space-y-1">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-app-text-muted">Atividades de Relacionamento</h2>
                                <p className="text-sm font-bold text-app-text-main">Últimos clientes integrados</p>
                            </div>
                            <button onClick={() => { navigate('/app/clientes'); haptics.light(); }} className="px-4 py-2 bg-app-card border border-app-stroke text-app-text-main font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-app-stroke/50 transition-all shadow-sm">
                                Listagem
                            </button>
                        </div>
                        <div className="bg-app-card rounded-xl md:rounded-2xl border border-app-stroke overflow-hidden shadow-xl shadow-black/5 divide-y divide-app-stroke/30">
                            {displayRecentClients.length > 0 ? (
                                displayRecentClients.map((client: any, i: number) => {
                                    const isNew = client.createdAt && (new Date().getTime() - new Date(client.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
                                    return (
                                        <div 
                                            key={client.id || i} 
                                            className="p-4 md:p-5 flex items-center justify-between cursor-pointer transition-all hover:bg-app-stroke/20 group" 
                                            onClick={() => { navigate(`/app/clientes/${client.id}`); haptics.light(); }}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="relative">
                                                    <Avatar name={client.name} size="lg" className="shrink-0 ring-4 ring-app-stroke/30 group-hover:ring-primary/20 transition-all" />
                                                    {isNew && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-app-card rounded-full shadow-lg"></div>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-base font-black text-app-text-main tracking-tight group-hover:text-primary transition-colors">{client.name}</h4>
                                                        {isNew && <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">Novo</span>}
                                                    </div>
                                                    <p className="text-xs text-app-text-muted font-medium flex items-center gap-2">
                                                        {client.email || 'Nenhum contato registrado'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2 bg-app-bg px-3 py-1.5 rounded-xl border border-app-stroke shadow-sm">
                                                    <Calendar size={14} className="text-app-text-muted" />
                                                    <span className="text-[10px] font-black text-app-text-main uppercase tracking-widest">{new Date(client.createdAt).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <ChevronRight size={16} className="text-app-text-muted group-hover:text-primary transition-all group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-20 text-center space-y-6">
                                    <div className="w-20 h-20 bg-app-stroke/30 rounded-[2rem] flex items-center justify-center mx-auto opacity-40">
                                        <Users size={32} className="text-app-text-muted" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-app-text-main uppercase tracking-widest">Base de Dados Vazia</p>
                                        <p className="text-xs text-app-text-muted max-w-[200px] mx-auto">Comece a cadastrar seus clientes para gerenciar seu escritório.</p>
                                    </div>
                                    <button 
                                        onClick={() => { navigate('/app/clientes/novo'); haptics.medium(); }} 
                                        className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
                                    >
                                        Primeiro Cliente
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
            className="space-y-10 px-1 sm:px-0 pb-24 md:pb-12 bg-app-bg/50"
        >
            <div className="pt-4 flex items-center justify-end px-4">
                <button
                    onClick={() => { setIsEditMode(!isEditMode); haptics.medium(); }}
                    className={clsx(
                        "flex items-center gap-3 px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-xl",
                        isEditMode 
                            ? "bg-primary text-white shadow-primary/30 scale-105" 
                            : "bg-app-card border border-app-stroke text-app-text-muted hover:text-app-text-main hover:border-app-stroke/80 shadow-black/5"
                    )}
                >
                    <Settings2 size={16} />
                    {isEditMode ? 'Fixar Layout' : 'Personalizar'}
                </button>
            </div>
            
            {/* Subscription Notice */}
            {user?.plan === 'FREE' && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-4 p-5 md:p-6 bg-[#0F172A] rounded-2xl md:rounded-[2rem] border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden group shadow-2xl shadow-primary/20"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/15 via-transparent to-transparent pointer-events-none" />
                    <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left relative z-10">
                        <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center shrink-0 shadow-2xl shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                            <Zap size={24} className="text-primary fill-primary/20" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="font-black text-xl text-white font-display tracking-tight uppercase">Desbloqueie o potencial máximo</p>
                            <p className="text-sm text-white/50 font-medium">Auditoria de contratos avançada, usuários ilimitados e relatórios analíticos premium.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { navigate('/app/configuracoes?tab=billing'); haptics.medium(); }}
                        className="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-neutral-100 transition-all shadow-2xl shadow-white/10 active:scale-95 shrink-0"
                    >
                        Experimentar Plus
                    </button>
                </motion.div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocksOrder} strategy={verticalListSortingStrategy}>
                    <div className="space-y-12">
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
                userName={user?.name ? user.name.split(' ')[0] : 'Advogado'}
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
