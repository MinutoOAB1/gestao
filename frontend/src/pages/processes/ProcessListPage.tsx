import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Layout, X, Clock, FileText, ExternalLink, Calendar, AlertTriangle, Filter, ChevronRight, Hash, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { clsx } from 'clsx';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { haptics } from '../../utils/haptics';

// Optimized animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 260, damping: 20 }
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
    const [searchQuery, setSearchQuery] = useState('');
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

    // Filter processes based on active filter and search query
    const filteredProcesses = useMemo(() => {
        return processes.filter(proc => {
            const matchesSearch = proc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                proc.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                proc.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (!matchesSearch) return false;

            if (activeFilter === 'Todos') return true;
            if (activeFilter === 'Em Andamento') {
                return proc.status === 'EM_ANDAMENTO' || proc.status === 'ATIVO' ||
                    (proc.kanbanColumn !== 'concluido' && proc.kanbanColumn !== 'arquivado');
            }
            if (activeFilter === 'Urgentes') {
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
    }, [processes, activeFilter, searchQuery]);

    return (
        <div className="flex h-full gap-8 pb-20 md:pb-0 overflow-hidden bg-app-bg/50">
            <div className="flex-1 flex flex-col space-y-8 overflow-y-auto custom-scrollbar px-1 pt-2">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                                <FileText className="text-primary" size={16} />
                            </div>
                            <h1 className="text-3xl font-black text-app-text-main tracking-tighter">Processos</h1>
                        </div>
                        <p className="text-app-text-muted text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                            {filteredProcesses.length} casos {activeFilter !== 'Todos' ? `em ${activeFilter}` : 'localizados'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative group min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-primary transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Buscar processo, número ou cliente..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 bg-app-card border border-app-stroke rounded-xl text-sm font-bold text-app-text-main focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-sm group-hover:border-app-stroke/80"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { navigate('/app/processos/kanban'); haptics.light(); }}
                                className="flex-1 sm:flex-none bg-app-card border border-app-stroke text-app-text-main px-4 py-2.5 rounded-xl items-center gap-2 hover:bg-app-stroke/30 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 shadow-sm"
                            >
                                <Layout size={18} />
                                Quadro
                            </button>
                            <button
                                onClick={() => { navigate('/app/processos/novo'); haptics.medium(); }}
                                className="flex-1 sm:flex-none bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-xl items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-black/20 active:scale-95"
                            >
                                <Plus size={18} />
                                Novo
                            </button>
                        </div>
                    </div>
                </header>

                {/* Filter Toolbar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-1 px-1">
                    <div className="p-1 bg-app-card border border-app-stroke rounded-2xl flex gap-1 shadow-sm">
                        {['Todos', 'Em Andamento', 'Urgentes', 'Arquivados'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => { setActiveFilter(filter); haptics.light(); }}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                                    activeFilter === filter
                                        ? "bg-black text-white dark:bg-white dark:text-black shadow-lg"
                                        : "text-app-text-muted hover:bg-app-stroke/50 hover:text-app-text-main"
                                )}
                            >
                                {filter === 'Urgentes' && <AlertTriangle size={14} className={activeFilter === filter ? "" : "text-amber-500"} />}
                                {filter}
                                {filter === 'Urgentes' && (
                                    <span className={clsx("w-2 h-2 rounded-full", activeFilter === filter ? "bg-white dark:bg-black" : "bg-red-500 animate-pulse")}></span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="h-8 w-px bg-app-stroke/50 hidden sm:block mx-2"></div>
                    <button className="p-2.5 bg-app-card border border-app-stroke rounded-xl text-app-text-muted hover:text-primary transition-all shadow-sm active:scale-90">
                        <Filter size={18} />
                    </button>
                </div>

                {/* Main Content */}
                <main className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <ListSkeleton count={6} />
                        </div>
                    ) : filteredProcesses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 px-6 text-center bg-app-card/30 rounded-[3rem] border border-dashed border-app-stroke/60 backdrop-blur-sm">
                            <div className="w-24 h-24 bg-app-stroke/20 rounded-[2.5rem] flex items-center justify-center mb-8">
                                <Search size={40} className="text-app-text-muted opacity-40 animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-app-text-main mb-3 uppercase tracking-tighter">Nada por aqui...</h3>
                            <p className="text-app-text-muted text-sm max-w-sm mx-auto mb-10 font-medium leading-relaxed">
                                Não encontramos nenhum caso que corresponda aos seus critérios de busca atual.
                            </p>
                            <button
                                onClick={() => { setActiveFilter('Todos'); setSearchQuery(''); haptics.light(); }}
                                className="px-8 py-4 bg-app-card border border-app-stroke text-app-text-main rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-app-stroke/50 transition-all shadow-sm active:scale-95"
                            >
                                Limpar filtros e ver todos
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 xl:grid-cols-2 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {filteredProcesses.map((proc) => (
                                <ProcessCard 
                                    key={proc.id} 
                                    proc={proc} 
                                    isSelected={selectedProcessId === proc.id}
                                    onSelect={() => { setSelectedProcessId(selectedProcessId === proc.id ? null : proc.id); haptics.light(); }}
                                    onNavigate={() => { navigate(`/app/processos/${proc.id}`); haptics.medium(); }} 
                                />
                            ))}
                        </motion.div>
                    )}
                </main>
            </div>

            {/* Side Panel Preview */}
            <AnimatePresence>
                {selectedProcessId && (
                    <SelectedProcessSidebar 
                        processId={selectedProcessId} 
                        onClose={() => setSelectedProcessId(null)} 
                        onNavigate={(id) => { navigate(`/app/processos/${id}`); haptics.medium(); }}
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

    const UPDATE_TYPE_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
        'MOVIMENTO': { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        'DECISAO': { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        'SENTENCA': { icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        'DESPACHO': { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        'AUDIENCIA': { icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
        'PRAZO': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
        'OUTRO': { icon: Clock, color: 'text-app-text-muted', bg: 'bg-app-stroke/30' },
    };

    return (
        <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed lg:relative top-0 right-0 h-full w-full lg:w-[450px] bg-app-card/80 backdrop-blur-2xl border-l border-app-stroke shadow-2xl z-[60] lg:z-0 flex flex-col"
        >
            <div className="p-8 border-b border-app-stroke flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full"></div>
                    <h3 className="font-black text-app-text-main uppercase tracking-[0.2em] text-[11px]">Resumo do Processo</h3>
                </div>
                <button onClick={() => { onClose(); haptics.light(); }} className="p-3 bg-app-stroke/20 hover:bg-app-stroke/40 rounded-2xl text-app-text-muted transition-all active:scale-90">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {loading || !process ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] text-app-text-muted font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando dados...</p>
                    </div>
                ) : (
                    <>
                        {/* Case Header */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">{process.area}</span>
                                <h2 className="text-3xl font-black text-app-text-main leading-none tracking-tighter">{process.title}</h2>
                            </div>
                            
                            <div className="p-4 bg-app-bg/50 rounded-3xl border border-app-stroke flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Hash size={16} className="text-app-text-muted" />
                                    <span className="text-xs font-black font-mono text-app-text-main">{process.number}</span>
                                </div>
                                <button className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"><ExternalLink size={16} /></button>
                            </div>

                            <button 
                                onClick={() => onNavigate(process.id)}
                                className="w-full py-5 bg-black dark:bg-white text-white dark:text-black rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
                            >
                                <Eye size={18} /> Detalhes Completos
                            </button>
                        </div>

                        {/* Recent Activity */}
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black text-app-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock size={16} className="text-primary" /> Histórico Recente
                                </h4>
                                <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md">{process.updates?.length || 0} andamentos</span>
                            </div>
                            
                            <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-app-stroke before:to-transparent">
                                {process.updates?.slice(0, 5).map((upd: any) => {
                                    const typeInfo = UPDATE_TYPE_ICONS[upd.type] || UPDATE_TYPE_ICONS['OUTRO'];
                                    const Icon = typeInfo.icon;
                                    return (
                                        <div key={upd.id} className="relative group">
                                            <div className={clsx(
                                                "absolute -left-[28px] top-0 w-8 h-8 rounded-xl border-2 border-app-card flex items-center justify-center shrink-0 shadow-lg z-10 transition-transform group-hover:scale-110",
                                                typeInfo.bg, typeInfo.color
                                            )}>
                                                <Icon size={14} />
                                            </div>
                                            <div className="bg-app-bg/40 p-5 rounded-[2rem] border border-app-stroke/50 group-hover:border-primary/30 transition-all group-hover:shadow-xl group-hover:shadow-primary/5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-[10px] font-black text-app-text-main uppercase tracking-widest">{upd.type}</p>
                                                    <span className="text-[10px] font-bold text-app-text-muted">{new Date(upd.date).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                <p className="text-xs text-app-text-muted leading-relaxed font-medium">{upd.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!process.updates || process.updates.length === 0) && (
                                    <div className="py-12 text-center bg-app-bg/20 rounded-[2rem] border border-dashed border-app-stroke">
                                        <p className="text-xs text-app-text-muted font-bold uppercase tracking-widest italic">Nenhum andamento</p>
                                    </div>
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

    // Determine Area Color - Using more vibrant and refined colors
    const getAreaStyles = (areaStr: string) => {
        const area = areaStr || 'Cível';
        if (area.toLowerCase().includes('cível')) return { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', accent: 'bg-emerald-500' };
        if (area.toLowerCase().includes('trabalho') || area.toLowerCase().includes('trabalh')) return { badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', accent: 'bg-blue-500' };
        if (area.toLowerCase().includes('família')) return { badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20', accent: 'bg-pink-500' };
        if (area.toLowerCase().includes('criminal') || area.toLowerCase().includes('penal')) return { badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', accent: 'bg-orange-500' };
        if (area.toLowerCase().includes('tribut')) return { badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20', accent: 'bg-cyan-500' };
        return { badge: 'bg-app-stroke/30 text-app-text-muted border-app-stroke/50', accent: 'bg-primary' };
    };

    const areaStyles = getAreaStyles(proc.area);

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
            layout
            className={clsx(
                "bg-app-card rounded-[1.5rem] border p-6 transition-all cursor-pointer shadow-sm relative overflow-hidden group touch-manipulation",
                isSelected ? "border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/5" : "border-app-stroke hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
            )}
            onClick={onSelect}
        >
            {/* Priority Pulse Background */}
            {isUrgent && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/5 blur-[50px] animate-pulse"></div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 rounded-xl bg-app-bg border border-app-stroke text-[10px] font-black text-app-text-muted uppercase tracking-widest font-mono">
                        #{proc.number.split('.').slice(0, 1)}
                    </span>
                    <span className={clsx("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border", areaStyles.badge)}>
                        {proc.area || 'Cível'}
                    </span>
                    {isUrgent && (
                        <span className="px-3 py-1 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            Urgente
                        </span>
                    )}
                </div>
                <div className="w-2 h-8 bg-app-stroke/50 rounded-full group-hover:bg-primary/20 transition-all"></div>
            </div>

            <div className="mb-6 space-y-2">
                <h3 className="text-xl font-black text-app-text-main tracking-tighter line-clamp-2 leading-tight group-hover:text-primary transition-colors">{proc.title}</h3>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-app-stroke/20 rounded-lg flex items-center justify-center shrink-0">
                        <Users size={12} className="text-app-text-muted" />
                    </div>
                    <span className="text-sm text-app-text-muted font-bold tracking-tight">
                        Cliente: <span className="text-app-text-main">{proc.client?.name || 'Não atribuído'}</span>
                    </span>
                </div>
            </div>

            {/* Progress Visualization */}
            <div className="space-y-3 mb-8">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-app-text-main uppercase tracking-widest">{proc.kanbanColumn?.replace('_', ' ') || 'Processo Ativo'}</span>
                    </div>
                    <span className="text-base font-black text-app-text-main tracking-tighter">{progress}%</span>
                </div>
                <div className="h-3 w-full bg-app-stroke/20 rounded-full overflow-hidden p-0.5 border border-app-stroke/30">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={clsx("h-full rounded-full transition-all shadow-[0_0_10px_rgba(0,0,0,0.1)]", 
                            progress === 100 ? "bg-emerald-500" : areaStyles.accent
                        )}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-app-stroke/50">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-xl bg-app-stroke/50 border-2 border-app-card flex items-center justify-center text-[10px] font-black">
                                {i === 1 ? 'VA' : 'MB'}
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">+2 equipe</span>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-text-main bg-app-stroke/20 hover:bg-primary hover:text-white px-4 py-2 rounded-xl transition-all active:scale-95 border border-app-stroke/50 hover:border-primary shadow-sm"
                >
                    Acessar <ChevronRight size={14} />
                </button>
            </div>
        </motion.div>
    );
});

