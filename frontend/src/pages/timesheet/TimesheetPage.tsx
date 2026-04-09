import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Pause, Plus, Trash2, Save, PlayCircle, Timer, PenTool, Calendar, Folder } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { useTimer } from '../../context/TimerContext';
import { useToast } from '../../context/ToastContext';

// Helper to group by date
const groupEntriesByDate = (entries: TimeEntry[]) => {
    const groups: Record<string, TimeEntry[]> = {};
    entries.forEach(entry => {
        const dateStr = new Date(entry.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // Simple format
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push(entry);
    });
    return groups;
};

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

// Format seconds to HH:MM:SS
const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format minutes to Xh XXmin
const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes}min`;
    }
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
};


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

    useEffect(() => {
        fetchData();
    }, []);

    // Sync local fields with timer context when page loads
    useEffect(() => {
        if (timer.isRunning) {
            setTimerDescription(timer.description);
            setTimerProcessId(timer.processId);
        }
    }, []);

    const fetchData = async () => {
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
    };

    const handleStartStop = async () => {
        if (timer.isRunning) {
            // Stop and save
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
                        setEntries([res.data, ...entries]);
                        addToast('Tempo registrado com sucesso!', 'success');
                    } catch (error) {
                        console.error('Erro ao salvar timesheet:', error);
                        addToast('Erro ao salvar registro no servidor.', 'error');
                    }
                }
            }
            setTimerDescription('');
            setTimerProcessId('');
        } else {
            // Start timer
            const processTitle = processes.find(p => p.id === timerProcessId)?.title || '';
            startTimer(timerDescription, timerProcessId, processTitle);
        }
    };

    const handleManualAdd = async () => {
        if (!newEntry.duration || parseInt(newEntry.duration) <= 0) {
            addToast('Informe uma duração válida', 'warning');
            return;
        }

        try {
            const res = await api.post('/timesheet', {
                description: newEntry.description || 'Trabalho manual',
                processId: newEntry.processId || undefined,
                processTitle: processes.find(p => p.id === newEntry.processId)?.title,
                duration: parseInt(newEntry.duration),
                date: newEntry.date
            });

            setEntries([res.data, ...entries]);
            setNewEntry({ description: '', processId: '', duration: '', date: new Date().toISOString().split('T')[0] });
            setShowForm(false);
            addToast('Tempo registrado manualmente!', 'success');
        } catch (error) {
            console.error('Erro ao salvar manual:', error);
            addToast('Erro ao salvar registro.', 'error');
        }
    };

    const handleResume = (entry: TimeEntry) => {
        if (timer.isRunning) {
            addToast('Pare o cronômetro atual primeiro', 'warning');
            return;
        }
        setTimerDescription(entry.description);
        setTimerProcessId(entry.processId || '');
        startTimer(entry.description, entry.processId || '', entry.processTitle || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/timesheet/${id}`);
            setEntries(entries.filter(e => e.id !== id));
            addToast('Registro excluído com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            addToast('Erro ao excluir registro', 'error');
        } finally {
            setDeleteConfirmId(null);
        }
    };



    const getTodayHours = () => {
        const today = new Date().toISOString().split('T')[0];
        const totalMins = entries.filter(e => e.date === today).reduce((sum, e) => sum + e.duration, 0);
        return formatDuration(totalMins);
    };

    if (loading) {
        return (
            <div className="space-y-6 pb-20 md:pb-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="h-8 w-40 bg-app-stroke/50 rounded-lg animate-pulse" />
                        <div className="h-4 w-60 bg-app-stroke/30 rounded mt-2 animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-app-card border border-app-stroke rounded-xl p-6 min-h-[140px] animate-pulse" />
                    <div className="bg-app-card border border-app-stroke rounded-xl p-6 animate-pulse" />
                </div>
                <div className="bg-app-card border border-app-stroke rounded-xl p-6">
                    <div className="h-6 w-32 bg-app-stroke/50 rounded animate-pulse mb-4" />
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-app-stroke/20 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-20 md:pb-0"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-app-text-main flex items-center gap-3">
                        <Clock className="text-primary" size={28} />
                        Timesheet
                    </h1>
                    <p className="text-app-text-muted text-sm mt-1">
                        Registre o tempo dedicado a cada processo
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <Plus size={18} />
                    Adicionar Manual
                </button>
            </div>

            {/* Stats Cards & Visual Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-app-card border border-app-stroke rounded-xl p-6 relative overflow-hidden flex flex-col justify-center min-h-[140px]">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                        <Clock size={120} />
                    </div>
                    <p className="text-app-text-muted text-xs font-bold uppercase tracking-wider mb-4">Distribuição do Tempo (Hoje)</p>
                    {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const todayEntries = entries.filter(e => e.date.startsWith(today));
                        if (todayEntries.length === 0) return <p className="text-app-text-muted text-sm italic">Nenhum tempo registrado hoje.</p>;
                        
                        // Group by process
                        const processMap: Record<string, { duration: number, title: string, color: string }> = {};
                        const colors = ['bg-primary', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
                        
                        todayEntries.forEach((e) => {
                            const pId = e.processId || 'outros';
                            const title = e.processTitle || 'Outros / Administrativo';
                            if (!processMap[pId]) processMap[pId] = { duration: 0, title, color: '' };
                            processMap[pId].duration += e.duration;
                        });
                        
                        const processList = Object.values(processMap).sort((a,b) => b.duration - a.duration);
                        const totalTodayMins = processList.reduce((sum, p) => sum + p.duration, 0);
                        
                        processList.forEach((p, idx) => p.color = colors[idx % colors.length]);

                        return (
                            <div className="space-y-4 z-10 relative">
                                {/* Flex Bar */}
                                <div className="h-4 w-full bg-app-stroke rounded-full overflow-hidden flex shadow-inner">
                                    {processList.map((p, idx) => (
                                        <div key={idx} className={clsx("h-full transition-all duration-1000 ease-out", p.color)} style={{ width: `${(p.duration / totalTodayMins) * 100}%` }} title={`${p.title} - ${formatDuration(p.duration)}`} />
                                    ))}
                                </div>
                                {/* Legends */}
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    {processList.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                            <span className={clsx("w-2.5 h-2.5 rounded-full", p.color)} />
                                            <span className="text-app-text-main font-medium truncate max-w-[150px]" title={p.title}>{p.title}</span>
                                            <span className="text-app-text-muted font-mono">{formatDuration(p.duration)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
                <div className="flex flex-col gap-4">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col justify-center items-center h-full group hover:border-primary/40 transition-colors">
                        <p className="text-primary/80 font-bold text-xs uppercase tracking-widest text-center mb-1">Horas de Hoje</p>
                        <p className="text-4xl md:text-5xl font-black text-primary tracking-tighter drop-shadow-sm group-hover:scale-105 transition-transform">{getTodayHours()}</p>
                    </div>
                </div>
            </div>

            {/* Timer Section */}
            <div className={clsx("rounded-xl p-6 transition-all duration-500", timer.isRunning ? "bg-app-card border-2 border-primary shadow-[0_0_30px_rgba(59,130,246,0.15)]" : "bg-app-card border border-app-stroke")}>
                <h2 className="text-lg font-bold text-app-text-main mb-4 flex items-center gap-2">
                    <Timer size={20} className={clsx("transition-colors", timer.isRunning ? "text-primary animate-pulse" : "text-app-text-muted")} />
                    {timer.isRunning ? "Trabalho em Andamento..." : "Cronômetro"}
                </h2>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className={clsx(
                        "text-5xl font-mono font-black tracking-tighter transition-all duration-300 w-full md:w-auto text-center shrink-0",
                        timer.isRunning ? "text-primary drop-shadow-[0_0_12px_rgba(59,130,246,0.5)] animate-pulse" : "text-app-text-main"
                    )}>
                        {formatTime(timer.seconds)}
                    </div>
                    <div className="flex-1 w-full flex flex-col gap-2 relative">
                        <input
                            type="text"
                            value={timer.isRunning ? timer.description : timerDescription}
                            onChange={(e) => setTimerDescription(e.target.value)}
                            placeholder="Descreva a atividade..."
                            className={clsx("w-full px-4 py-3 border rounded-xl text-app-text-main outline-none transition-all placeholder:text-app-text-muted/50", timer.isRunning ? "bg-app-bg border-primary/30" : "bg-app-bg border-app-stroke focus:border-primary")}
                            disabled={timer.isRunning}
                        />
                    </div>
                    <select
                        value={timer.isRunning ? timer.processId : timerProcessId}
                        onChange={(e) => setTimerProcessId(e.target.value)}
                        className={clsx("w-full md:w-64 px-4 py-3 border rounded-xl text-app-text-main outline-none transition-all", timer.isRunning ? "bg-app-bg border-primary/30" : "bg-app-bg border-app-stroke focus:border-primary")}
                        disabled={timer.isRunning}
                    >
                        <option value="">(Sem vínculo ao processo)</option>
                        {processes.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleStartStop}
                        className={clsx(
                            "w-full md:w-auto px-8 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 shrink-0",
                            timer.isRunning
                                ? "bg-red-500 text-white hover:bg-red-600 hover:shadow-red-500/25 shadow-md"
                                : "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-emerald-500/25 shadow-md"
                        )}
                    >
                        {timer.isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                        {timer.isRunning ? 'Parar & Salvar' : 'Iniciar'}
                    </button>
                </div>
            </div>

            {/* Manual Entry Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="overflow-hidden relative z-10"
                    >
                        <div className="bg-app-card border border-primary/30 rounded-xl p-6">
                            <h2 className="text-lg font-bold text-app-text-main mb-4 flex items-center gap-2"><PenTool size={18} className="text-emerald-500" /> Entrada Manual</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    value={newEntry.description}
                                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                                    placeholder="Descrição da Tarefa"
                                    className="px-4 py-3 bg-app-bg border border-app-stroke rounded-xl text-app-text-main focus:border-primary outline-none transition-all"
                                />
                                <select
                                    value={newEntry.processId}
                                    onChange={(e) => setNewEntry({ ...newEntry, processId: e.target.value })}
                                    className="px-4 py-3 bg-app-bg border border-app-stroke rounded-xl text-app-text-main focus:border-primary outline-none transition-all"
                                >
                                    <option value="">(Sem Vínculo)</option>
                                    {processes.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={newEntry.duration}
                                    onChange={(e) => setNewEntry({ ...newEntry, duration: e.target.value })}
                                    placeholder="Duração (minutos)"
                                    className="px-4 py-3 bg-app-bg border border-app-stroke rounded-xl text-app-text-main focus:border-primary outline-none transition-all"
                                />
                                <input
                                    type="date"
                                    value={newEntry.date}
                                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                                    className="px-4 py-3 bg-app-bg border border-app-stroke rounded-xl text-app-text-main focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={handleManualAdd}
                                    className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Save size={18} />
                                    Gravar Ponto
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Entries List (Timeline) */}
            <div className="bg-app-card border border-app-stroke rounded-xl p-6">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-lg font-bold text-app-text-main flex items-center gap-2">Histórico Cronológico</h2>
                </div>
                
                {entries.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 mb-6 rounded-full bg-app-bg border-4 border-app-stroke border-dashed flex items-center justify-center relative">
                            <Clock size={40} className="text-app-text-muted absolute" />
                            <div className="absolute inset-0 border-4 border-primary/50 rounded-full animate-ping opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-app-text-main mb-2">Sem registros de tempo</h3>
                        <p className="text-app-text-muted text-sm max-w-sm mb-6">Você ainda não registrou nenhum minuto de trabalho. Que tal iniciar o cronômetro agora ou adicionar entradas retroativas?</p>
                        <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); document.querySelector('input')?.focus(); }} className="px-6 py-2.5 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-all shadow-sm flex items-center gap-2">
                            <Play size={16} /> Começar
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupEntriesByDate(entries)).map(([dateStr, dayEntries]) => (
                            <div key={dateStr} className="relative">
                                {/* Date Header */}
                                <div className="flex items-center gap-4 mb-5">
                                    <div className="px-4 py-1.5 rounded-full bg-app-stroke shadow-sm border border-app-stroke/50 text-xs font-bold text-app-text-main flex items-center gap-2 uppercase tracking-wide">
                                        <Calendar size={14} className="text-primary" />
                                        {dateStr === new Date().toLocaleDateString('pt-BR', { timeZone: 'UTC'}) ? 'Hoje' : dateStr}
                                    </div>
                                    <div className="flex-1 border-t-2 border-app-stroke/50 border-dashed" />
                                </div>
                                
                                {/* Timeline Items */}
                                <div className="space-y-4 pl-3 md:pl-6 border-l-4 border-app-stroke/40 ml-2 md:ml-3">
                                    {dayEntries.map((entry) => (
                                        <div key={entry.id} className="relative group bg-app-bg hover:bg-app-stroke/20 border border-app-stroke rounded-xl p-4 transition-all hover:shadow-md">
                                            {/* Node point */}
                                            <div className="absolute -left-[23px] md:-left-[35px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-app-bg border-[3px] border-primary group-hover:scale-125 transition-transform" />
                                            
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-app-text-main font-semibold text-sm md:text-base break-words">{entry.description}</p>
                                                    {entry.processTitle ? (
                                                        <div className="flex items-center gap-1.5 mt-2 mx-1 text-xs text-primary font-bold bg-primary/10 w-fit px-2.5 py-1 rounded-md border border-primary/10 truncate max-w-full">
                                                            <Folder size={12} className="shrink-0" /> {entry.processTitle}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-app-text-muted mt-1.5 ml-1 inline-flex items-center gap-1">Trabalho Administrativo</span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                                                    <div className="text-right">
                                                        <span className="text-lg md:text-2xl font-black font-mono text-primary flex items-center gap-1.5 drop-shadow-sm">
                                                            {formatDuration(entry.duration)}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Hover Actions */}
                                                    <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={async () => { await handleResume(entry); }}
                                                            className="p-2.5 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all tooltip relative inline-flex shadow-sm"
                                                            title="Retomar a mesma atividade"
                                                        >
                                                            <PlayCircle size={18} />
                                                        </button>
                                                        {deleteConfirmId === entry.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(entry.id)}
                                                                    className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all"
                                                                >
                                                                    Excluir
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirmId(null)}
                                                                    className="px-3 py-1.5 text-xs font-bold text-app-text-muted bg-app-stroke/30 hover:bg-app-stroke/50 rounded-lg transition-all"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteConfirmId(entry.id)}
                                                                className="p-2.5 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all tooltip relative inline-flex shadow-sm"
                                                                title="Apagar registro"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </motion.div>
    );
}
