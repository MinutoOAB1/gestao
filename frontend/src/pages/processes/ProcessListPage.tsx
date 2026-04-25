import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Layout, X, Clock, FileText, ExternalLink, Calendar, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { clsx } from 'clsx';
import { ListSkeleton } from '../../components/ui/Skeleton';

// Optimized animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.02, delayChildren: 0.01 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 25 }
    }
};

interface Process {
    id: string;
    number: string;
    title: string;
    status: string;
    area: string;
    value: number;
    clientId?: string;
    client?: {
        name: string;
    };
    kanbanColumn?: string;
    deadline?: string;
}

export default function ProcessListPage() {
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const navigate = useNavigate();

    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

    const fetchProcesses = useCallback(async () => {
        try {
            const response = await api.get('/processes');
            setProcesses(response.data);
        } catch (error) {
            console.error('Erro ao buscar processos:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProcesses();
    }, [fetchProcesses]);

    // Filter processes based on active filter
    const filteredProcesses = useMemo(() => {
        return processes.filter(proc => {
            if (activeFilter === 'Todos') return true;
            if (activeFilter === 'Em Andamento') {
                return proc.status === 'EM_ANDAMENTO' || proc.status === 'ATIVO' ||
                    (proc.kanbanColumn !== 'concluido' && proc.kanbanColumn !== 'arquivado');
            }
            if (activeFilter === 'Urgentes') {
                // Check if deadline is within 3 days or overdue
                if (!proc.deadline) return false;
                const deadline = new Date(proc.deadline);
                const today = new Date();
                const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return diffDays <= 3;
            }
            if (activeFilter === 'Arquivados') {
                return proc.status === 'ARQUIVADO' || proc.kanbanColumn === 'concluido';
            }
            return true;
        });
    }, [processes, activeFilter]);

    // Adapting styles for Dark Mode Pixel Perfect
    return (
        <div className="flex h-full gap-6 pb-20 md:pb-0 overflow-hidden">
            <div className="flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-app-text-main">Processos</h1>
                        <p className="text-app-text-muted text-sm">{filteredProcesses.length} casos {activeFilter !== 'Todos' ? `(${activeFilter})` : 'ativos'}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/app/processos/kanban')}
                            className="hidden md:flex bg-app-card border border-app-stroke text-app-text-main px-4 py-2 rounded-lg items-center gap-2 hover:bg-app-stroke/50 transition-colors"
                        >
                            <Layout size={20} />
                            Quadro
                        </button>
                        <button
                            onClick={() => navigate('/app/processos/novo')}
                            className="hidden md:flex bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg items-center gap-2 font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-black/20"
                        >
                            <Plus size={20} />
                            Novo
                        </button>
                    </div>
                </div>

                {/* Mobile Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide touch-pan-x -mx-2 px-2">
                    {['Todos', 'Em Andamento', 'Urgentes', 'Arquivados'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={clsx(
                                "px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border touch-manipulation shrink-0 flex items-center gap-1.5",
                                activeFilter === filter
                                    ? "bg-black text-white dark:bg-white dark:text-black border-black/10 dark:border-white/10 shadow-lg"
                                    : "bg-transparent text-app-text-muted border-app-stroke hover:border-black/30 dark:hover:border-white/30"
                            )}
                        >
                            {filter}
                            {filter === 'Urgentes' && (
                                <span className={clsx("w-2 h-2 rounded-full", activeFilter === filter ? "bg-white dark:bg-black" : "bg-black dark:bg-white animate-pulse")}></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Main List Area */}
                <div className="flex-1">
                    {loading ? (
                        <ListSkeleton count={5} />
                    ) : filteredProcesses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-app-card rounded-2xl border border-dashed border-app-stroke/60">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-black/5 dark:bg-white/5 blur-3xl rounded-full"></div>
                                <Search size={64} className="relative text-app-text-muted opacity-40 animate-pulse" />
                            </div>
                            <h3 className="text-lg font-black text-app-text-main mb-2 uppercase tracking-widest">Nenhum processo encontrado</h3>
                            <p className="text-app-text-muted text-sm max-w-xs mx-auto mb-8">
                                Não encontramos nenhum caso para o filtro <span className="text-black dark:text-white font-black">{activeFilter}</span>.
                            </p>
                            <button
                                onClick={() => setActiveFilter('Todos')}
                                className="px-6 py-2 bg-app-bg border border-app-stroke text-app-text-main rounded-xl text-sm font-semibold hover:bg-app-stroke/30 transition-all active:scale-95"
                            >
                                Ver todos os casos
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            className="space-y-3 sm:space-y-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {filteredProcesses.map((proc) => (
                                <ProcessCard 
                                    key={proc.id} 
                                    proc={proc} 
                                    isSelected={selectedProcessId === proc.id}
                                    onSelect={() => setSelectedProcessId(selectedProcessId === proc.id ? null : proc.id)}
                                    onNavigate={() => navigate(`/app/processos/${proc.id}`)} 
                                />
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Side Panel Preview */}
            <AnimatePresence>
                {selectedProcessId && (
                    <SelectedProcessSidebar 
                        processId={selectedProcessId} 
                        onClose={() => setSelectedProcessId(null)} 
                        onNavigate={(id) => navigate(`/app/processos/${id}`)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Side Panel Component ───────────────────────────────────

function SelectedProcessSidebar({ 
    processId, onClose, onNavigate 
}: { 
    processId: string, onClose: () => void, onNavigate: (id: string) => void 
}) {
    const [process, setProcess] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/processes/${processId}`);
                setProcess(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [processId]);

    const UPDATE_TYPE_ICONS: Record<string, { icon: any; color: string }> = {
        'MOVIMENTO': { icon: FileText, color: 'text-neutral-500' },
        'DECISAO': { icon: FileText, color: 'text-black dark:text-white' },
        'SENTENCA': { icon: FileText, color: 'text-black dark:text-white' },
        'DESPACHO': { icon: FileText, color: 'text-neutral-600' },
        'AUDIENCIA': { icon: Calendar, color: 'text-neutral-800 dark:text-neutral-200' },
        'PRAZO': { icon: AlertTriangle, color: 'text-black dark:text-white' },
        'OUTRO': { icon: Clock, color: 'text-neutral-400' },
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:relative top-0 right-0 h-full w-full md:w-[400px] bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800 shadow-2xl z-[60] md:z-0 flex flex-col"
        >
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Prévia do Caso</h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-400 transition-all">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {loading || !process ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Carregando...</p>
                    </div>
                ) : (
                    <>
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{process.title}</h2>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-[10px] font-black text-neutral-500">{process.number}</span>
                                <span className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black rounded text-[10px] font-black uppercase tracking-widest">{process.area}</span>
                            </div>
                            <button 
                                onClick={() => onNavigate(process.id)}
                                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-2 hover:opacity-90"
                            >
                                <ExternalLink size={14} /> ABRIR DETALHES
                            </button>
                        </div>

                        {/* History Timeline */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} /> LINHA DO TEMPO
                            </h4>
                            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100 dark:before:bg-slate-800">
                                {process.updates?.map((upd: any) => {
                                    const typeInfo = UPDATE_TYPE_ICONS[upd.type] || UPDATE_TYPE_ICONS['OUTRO'];
                                    const Icon = typeInfo.icon;
                                    return (
                                        <div key={upd.id} className="relative group">
                                            <div className={`absolute -left-[27px] top-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 flex items-center justify-center shrink-0 ${typeInfo.color} shadow-sm z-10 transition-transform group-hover:scale-110`}>
                                                <Icon size={14} />
                                            </div>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{upd.type}</p>
                                                <span className="text-[9px] font-bold text-gray-400">{new Date(upd.date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight p-2 bg-gray-50/30 dark:bg-slate-800/20 rounded-xl border border-gray-100 dark:border-slate-800/50">{upd.description}</p>
                                        </div>
                                    );
                                })}
                                {(!process.updates || process.updates.length === 0) && (
                                    <p className="text-xs text-gray-400 italic">Nenhum andamento registrado ainda.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}

// Memoized Process Card to prevent unnecessary re-renders when filtering
const ProcessCard = memo(({ proc, isSelected, onSelect, onNavigate }: { proc: Process, isSelected?: boolean, onSelect?: () => void, onNavigate: () => void }) => {

    // Determine Area Color
    const getAreaColor = (areaStr: string) => {
        const area = areaStr || 'Cível';
        if (area.toLowerCase().includes('cível')) return 'bg-black text-white dark:bg-white dark:text-black border-black/10 dark:border-white/10';
        if (area.toLowerCase().includes('trabalho') || area.toLowerCase().includes('trabalh')) return 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black border-black/10 dark:border-white/10';
        if (area.toLowerCase().includes('família')) return 'bg-neutral-400 text-white dark:bg-neutral-600 dark:text-white border-neutral-300 dark:border-neutral-700';
        if (area.toLowerCase().includes('criminal') || area.toLowerCase().includes('penal')) return 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white ring-1 ring-black dark:ring-white';
        if (area.toLowerCase().includes('tribut')) return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700';
        return 'bg-neutral-200 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800';
    };

    // Determine Urgency
    const isUrgent = proc.deadline && Math.ceil((new Date(proc.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3;

    // Determine Progress Width based on Kanban Column
    let progress = 20;
    const col = proc.kanbanColumn?.toLowerCase() || '';
    if (col === 'triagem') progress = 25;
    else if (col === 'analise' || col.includes('análise')) progress = 50;
    else if (col === 'andamento' || col.includes('andamento')) progress = 75;
    else if (col === 'concluido' || proc.status === 'ARQUIVADO') progress = 100;

    return (
        <motion.div
            variants={itemVariants}
            className={clsx(
                "bg-app-card rounded-xl border p-4 sm:p-5 transition-all cursor-pointer shadow-sm relative overflow-hidden group touch-manipulation will-animate",
                isSelected ? "border-black dark:border-white ring-4 ring-black/5 dark:ring-white/5" : "border-app-stroke hover:border-black/20 dark:hover:border-white/20"
            )}
            whileHover={{ scale: isSelected ? 1 : 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onSelect}
        >
            {/* Priority Indicator */}
            <div className={clsx("absolute left-0 top-0 bottom-0 w-1 transition-all", isUrgent ? "bg-black dark:bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]" : "bg-neutral-200 dark:bg-neutral-800 group-hover:bg-neutral-400 dark:group-hover:bg-neutral-600")}></div>

            <div className="flex justify-between items-start mb-2 pl-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-app-bg border border-app-stroke text-[10px] text-app-text-muted uppercase tracking-wider font-mono">
                        #{proc.number.slice(-4)}
                    </span>
                    <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getAreaColor(proc.area))}>
                        {proc.area || 'Cível'}
                    </span>
                    {isUrgent && (
                        <span className="px-2 py-0.5 rounded border bg-black dark:bg-white text-white dark:text-black border-black/10 dark:border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black animate-pulse"></span>
                            Urgente
                        </span>
                    )}
                </div>
                <button className="text-app-text-muted hover:text-black dark:hover:text-white transition-colors p-1" onClick={(e) => e.stopPropagation()}>
                    <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
                    <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
                    <div className="w-1 h-1 rounded-full bg-current"></div>
                </button>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-app-text-main mb-1 pl-2 line-clamp-2">{proc.title}</h3>

            <div className="flex items-center gap-2 pl-2 mb-3 sm:mb-4">
                <Users size={14} className="text-app-text-muted shrink-0" />
                <span className="text-xs sm:text-sm text-app-text-muted truncate">Cliente: <span className="text-app-text-main font-semibold">{proc.client?.name || 'Não atribuído'}</span></span>
            </div>

            {/* Visual Progress Bar */}
            <div className="pl-2 mb-4 w-full">
                <div className="flex justify-between text-[10px] text-app-text-muted mb-1 font-medium px-0.5">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-black to-neutral-500 dark:from-white dark:to-neutral-400 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-app-stroke pt-3 pl-2">
                <div className="flex items-center gap-2 text-xs text-app-text-muted">
                    <div className="w-4 h-4 rounded bg-app-bg flex items-center justify-center border border-app-stroke">
                        <div className={clsx("w-2 h-2 rounded-full", progress === 100 ? "bg-black dark:bg-white" : isUrgent ? "bg-black dark:bg-white animate-pulse" : "bg-neutral-400")}></div>
                    </div>
                    <span className="hidden sm:inline capitalize">{proc.kanbanColumn?.replace('_', ' ') || 'Processo Ativo'}</span>
                    <span className="sm:hidden capitalize truncate max-w-[100px]">{proc.kanbanColumn?.replace('_', ' ') || 'Ativo'}</span>
                </div>
                <div 
                    onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                    className="text-[10px] font-black uppercase tracking-widest text-white dark:text-black bg-black dark:bg-white px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 hover:opacity-80 transition-all shadow-lg"
                >
                    Detalhes
                </div>
            </div>
        </motion.div>
    );
});
