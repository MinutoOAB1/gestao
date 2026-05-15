import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Pause, Plus, Trash2, Save, PlayCircle, Timer, PenTool, Calendar, Folder, ChevronRight, History, Activity, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { useTimer } from '../../context/TimerContext';
import { useToast } from '../../context/ToastContext';
import { haptics } from '../../utils/haptics';

interface TimeEntry {
    id: string;
    description: string;
    processId?: string;
    processTitle?: string;
    duration: number; // in minutes
    date: string;
    createdAt: string;
}

interface Process {
    id: string;
    title: string;
    number: string;
}

const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
};

const PremiumInput = memo(({ label, ...props }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">{label}</label>
        <input
            {...props}
            className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner focus:ring-4 focus:ring-primary/10"
        />
    </div>
));

export default function TimesheetPage() {
    const { timer, startTimer, stopTimer } = useTimer();
    const { addToast } = useToast();
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [timerDescription, setTimerDescription] = useState(timer.description || '');
    const [timerProcessId, setTimerProcessId] = useState(timer.processId || '');
    const [newEntry, setNewEntry] = useState({
        description: '',
        processId: '',
        duration: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [processRes, entriesRes] = await Promise.all([
                api.get('/processes'),
                api.get('/timesheet')
            ]);
            setProcesses(processRes.data || []);
            setEntries(entriesRes.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStartStop = async () => {
        haptics.medium();
        if (timer.isRunning) {
            const result = stopTimer();
            if (result && result.duration > 0) {
                const durationMinutes = Math.floor(result.duration / 60);
                if (durationMinutes > 0) {
                    try {
                        const res = await api.post('/timesheet', {
                            description: result.description || 'Trabalho registrado',
                            processId: result.processId || undefined,
                            processTitle: result.processTitle,
                            duration: durationMinutes,
                            date: new Date().toISOString()
                        });
                        setEntries(prev => [res.data, ...prev]);
                        addToast('Tempo registrado com sucesso!', 'success');
                    } catch (error) {
                        addToast('Erro ao salvar no servidor.', 'error');
                    }
                }
            }
            setTimerDescription('');
            setTimerProcessId('');
        } else {
            const processTitle = processes.find(p => p.id === timerProcessId)?.title || '';
            startTimer(timerDescription, timerProcessId, processTitle);
        }
    };

    const handleManualAdd = async () => {
        if (!newEntry.duration || parseInt(newEntry.duration) <= 0) {
            addToast('Informe uma duração válida', 'warning');
            return;
        }
        haptics.medium();
        try {
            const res = await api.post('/timesheet', {
                description: newEntry.description || 'Trabalho manual',
                processId: newEntry.processId || undefined,
                processTitle: processes.find(p => p.id === newEntry.processId)?.title,
                duration: parseInt(newEntry.duration),
                date: newEntry.date
            });
            setEntries(prev => [res.data, ...prev]);
            setNewEntry({ description: '', processId: '', duration: '', date: new Date().toISOString().split('T')[0] });
            setShowForm(false);
            addToast('Tempo registrado manualmente!', 'success');
        } catch (error) {
            addToast('Erro ao salvar registro.', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        haptics.heavy();
        try {
            await api.delete(`/timesheet/${id}`);
            setEntries(prev => prev.filter(e => e.id !== id));
            addToast('Registro excluído!', 'success');
        } catch (error) {
            addToast('Erro ao excluir.', 'error');
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const groupEntriesByDate = useMemo(() => {
        const groups: Record<string, TimeEntry[]> = {};
        entries.forEach(entry => {
            const dateStr = new Date(entry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(entry);
        });
        return groups;
    }, [entries]);

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = entries.filter(e => e.date.startsWith(today));
        const totalToday = todayEntries.reduce((sum, e) => sum + e.duration, 0);
        
        const processMap: Record<string, { duration: number, title: string, color: string }> = {};
        const colors = ['bg-primary', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
        
        todayEntries.forEach((e) => {
            const pId = e.processId || 'outros';
            const title = e.processTitle || 'Geral / Administrativo';
            if (!processMap[pId]) processMap[pId] = { duration: 0, title, color: '' };
            processMap[pId].duration += e.duration;
        });
        
        const processList = Object.values(processMap).sort((a,b) => b.duration - a.duration);
        processList.forEach((p, idx) => p.color = colors[idx % colors.length]);

        return { totalToday, processList };
    }, [entries]);

    if (loading) {
        return (
            <div className="space-y-12 animate-pulse p-4">
                <div className="flex justify-between items-center">
                    <div className="space-y-2"><div className="h-10 w-48 bg-app-stroke rounded-2xl" /><div className="h-4 w-32 bg-app-stroke rounded-lg" /></div>
                    <div className="h-12 w-40 bg-app-stroke rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-48 bg-app-card rounded-[2.5rem] border border-app-stroke" />
                    <div className="h-48 bg-app-card rounded-[2.5rem] border border-app-stroke" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-[1400px] mx-auto space-y-10 pb-20"
        >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text-muted mb-1">Produtividade</p>
                    <h1 className="text-4xl font-black text-app-text-main tracking-tighter leading-none flex items-center gap-4">
                        Timesheet
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </h1>
                </div>
                <button
                    onClick={() => { haptics.light(); setShowForm(!showForm); }}
                    className="flex items-center gap-3 px-8 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                >
                    <Plus size={18} />
                    {showForm ? 'Fechar Formulário' : 'Entrada Manual'}
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-app-card rounded-[2.5rem] border border-app-stroke p-8 shadow-xl shadow-black/5 relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 text-primary/5 group-hover:text-primary/10 transition-colors duration-700 -rotate-12">
                        <Activity size={240} />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                        <div>
                            <h2 className="text-xl font-black text-app-text-main tracking-tight uppercase">Distribuição de Hoje</h2>
                            <p className="text-sm text-app-text-muted font-medium">Foco por processo e administrativo</p>
                        </div>

                        {stats.processList.length === 0 ? (
                            <div className="h-24 flex items-center justify-center border-2 border-dashed border-app-stroke rounded-3xl">
                                <p className="text-sm text-app-text-muted font-medium italic">Nenhum registro hoje.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="h-6 w-full bg-app-bg border border-app-stroke rounded-full overflow-hidden flex shadow-inner p-1">
                                    {stats.processList.map((p, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(p.duration / stats.totalToday) * 100}%` }}
                                            className={clsx("h-full rounded-full transition-all duration-1000", p.color)}
                                        />
                                    ))}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {stats.processList.map((p, idx) => (
                                        <div key={idx} className="bg-app-bg/50 border border-app-stroke rounded-2xl p-4 flex items-center justify-between group/item hover:border-primary/30 transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={clsx("w-3 h-3 rounded-full shrink-0", p.color)} />
                                                <span className="text-sm font-bold text-app-text-main truncate group-hover/item:text-primary transition-colors">{p.title}</span>
                                            </div>
                                            <span className="text-xs font-black font-mono text-app-text-muted bg-app-card px-2 py-1 rounded-lg">{formatDuration(p.duration)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-primary rounded-[2.5rem] p-8 flex flex-col justify-center items-center relative overflow-hidden shadow-2xl shadow-primary/30 group">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                    <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" 
                    />
                    
                    <div className="relative z-10 text-center space-y-2">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Acumulado Hoje</p>
                        <h3 className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                            {formatDuration(stats.totalToday)}
                        </h3>
                        <div className="pt-4 flex items-center justify-center gap-2 text-white/80 font-bold text-sm">
                            <Activity size={16} />
                            Foco total
                        </div>
                    </div>
                </div>
            </div>

            <motion.div 
                layout
                className={clsx(
                    "rounded-[3rem] p-10 transition-all duration-700 border-2",
                    timer.isRunning 
                        ? "bg-primary/[0.02] border-primary shadow-2xl shadow-primary/20" 
                        : "bg-app-card border-app-stroke shadow-xl shadow-black/5"
                )}
            >
                <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="relative shrink-0">
                        <div className={clsx(
                            "text-7xl font-mono font-black tracking-tight transition-all duration-500",
                            timer.isRunning ? "text-primary scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "text-app-text-main"
                        )}>
                            {formatTime(timer.seconds)}
                        </div>
                        {timer.isRunning && (
                            <motion.div 
                                animate={{ opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -inset-4 bg-primary/5 rounded-[2rem] -z-10"
                            />
                        )}
                    </div>

                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PremiumInput 
                            label="O que está fazendo?"
                            value={timer.isRunning ? timer.description : timerDescription}
                            onChange={(e: any) => setTimerDescription(e.target.value)}
                            placeholder="Descreva a atividade..."
                            disabled={timer.isRunning}
                        />
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Vincular Processo</label>
                            <select
                                value={timer.isRunning ? timer.processId : timerProcessId}
                                onChange={(e) => setTimerProcessId(e.target.value)}
                                className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner appearance-none cursor-pointer"
                                disabled={timer.isRunning}
                            >
                                <option value="">Administrativo / Geral</option>
                                {processes.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleStartStop}
                        className={clsx(
                            "w-full lg:w-auto px-12 py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all shadow-2xl flex items-center justify-center gap-4 hover:-translate-y-1 active:translate-y-0",
                            timer.isRunning
                                ? "bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-600"
                                : "bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600"
                        )}
                    >
                        {timer.isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        {timer.isRunning ? 'Parar Agora' : 'Iniciar'}
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-app-card border border-app-stroke rounded-[2.5rem] p-8 shadow-xl shadow-black/5">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <PenTool size={20} />
                                </div>
                                <h2 className="text-xl font-black text-app-text-main tracking-tight uppercase">Entrada Manual</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <PremiumInput 
                                    label="Descrição"
                                    value={newEntry.description}
                                    onChange={(e: any) => setNewEntry({ ...newEntry, description: e.target.value })}
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Processo</label>
                                    <select
                                        value={newEntry.processId}
                                        onChange={(e) => setNewEntry({ ...newEntry, processId: e.target.value })}
                                        className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none appearance-none"
                                    >
                                        <option value="">Nenhum vínculo</option>
                                        {processes.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>
                                <PremiumInput 
                                    label="Duração (Minutos)"
                                    type="number"
                                    value={newEntry.duration}
                                    onChange={(e: any) => setNewEntry({ ...newEntry, duration: e.target.value })}
                                />
                                <PremiumInput 
                                    label="Data"
                                    type="date"
                                    value={newEntry.date}
                                    onChange={(e: any) => setNewEntry({ ...newEntry, date: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end mt-8">
                                <button
                                    onClick={handleManualAdd}
                                    className="px-10 py-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3"
                                >
                                    <Save size={18} />
                                    Confirmar Lançamento
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <section className="bg-app-card border border-app-stroke rounded-[3rem] p-10 shadow-xl shadow-black/5">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <History size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-app-text-main tracking-tighter uppercase">Histórico Cronológico</h2>
                            <p className="text-sm text-app-text-muted font-medium">Linha do tempo de atividades</p>
                        </div>
                    </div>
                </div>

                {entries.length === 0 ? (
                    <div className="py-24 text-center space-y-6">
                        <div className="w-24 h-24 rounded-[2rem] bg-app-bg border-2 border-dashed border-app-stroke flex items-center justify-center mx-auto text-app-text-muted">
                            <Clock size={40} />
                        </div>
                        <h3 className="text-xl font-black text-app-text-main">Silêncio no estúdio...</h3>
                        <p className="text-sm text-app-text-muted font-medium max-w-sm mx-auto leading-relaxed">Você ainda não registrou atividades. O tempo é seu bem mais precioso, comece a medi-lo agora.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(groupEntriesByDate).map(([dateStr, dayEntries]) => (
                            <div key={dateStr} className="space-y-6 relative">
                                <div className="flex items-center gap-6 sticky top-0 bg-app-card py-2 z-10">
                                    <div className="px-5 py-2 rounded-2xl bg-app-bg border border-app-stroke text-[10px] font-black text-app-text-main uppercase tracking-widest shadow-sm">
                                        {dateStr}
                                    </div>
                                    <div className="flex-1 h-px bg-gradient-to-r from-app-stroke to-transparent" />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {dayEntries.map((entry) => (
                                        <motion.div 
                                            key={entry.id} 
                                            whileHover={{ x: 4 }}
                                            className="group bg-app-bg/40 hover:bg-app-card border border-app-stroke rounded-[2rem] p-6 transition-all hover:shadow-xl hover:shadow-black/5"
                                        >
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                <div className="flex-1 space-y-3">
                                                    <h4 className="text-lg font-black text-app-text-main leading-tight group-hover:text-primary transition-colors">{entry.description}</h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {entry.processTitle ? (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                                                                <Folder size={12} /> {entry.processTitle}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-app-stroke/50 border border-app-stroke text-app-text-muted text-[10px] font-black uppercase tracking-widest">
                                                                <Activity size={12} /> Administrativo
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8 shrink-0">
                                                    <div className="text-right space-y-1">
                                                        <p className="text-3xl font-black font-mono text-primary tracking-tighter">{formatDuration(entry.duration)}</p>
                                                        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Total Faturável</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                haptics.light();
                                                                setTimerDescription(entry.description);
                                                                setTimerProcessId(entry.processId || '');
                                                                startTimer(entry.description, entry.processId || '', entry.processTitle || '');
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }}
                                                            className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <PlayCircle size={20} />
                                                        </button>
                                                        
                                                        {deleteConfirmId === entry.id ? (
                                                            <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                                                                <button onClick={() => handleDelete(entry.id)} className="px-4 py-3 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20">Confirmar</button>
                                                                <button onClick={() => setDeleteConfirmId(null)} className="p-3 bg-app-stroke text-app-text-muted rounded-xl hover:bg-app-stroke/80 transition-all"><ChevronRight size={18} /></button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => { haptics.light(); setDeleteConfirmId(entry.id); }}
                                                                className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </motion.div>
    );
}
