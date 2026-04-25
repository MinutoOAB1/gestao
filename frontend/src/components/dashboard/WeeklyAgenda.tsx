import { useState, useMemo } from 'react';
import { ExternalLink, MoreHorizontal, Calendar as CalendarIcon, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface WeeklyAgendaProps {
    events: any[];
}

export default function WeeklyAgenda({ events }: WeeklyAgendaProps) {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [hideOverdue, setHideOverdue] = useState(false);

    // Get current week days (Sun-Sat)
    const weekDays = useMemo(() => {
        const current = new Date();
        const week = [];
        // Starting from Sunday
        const first = current.getDate() - current.getDay();
        for (let i = 0; i < 7; i++) {
            const day = new Date(current.getTime());
            day.setDate(first + i);
            week.push(day);
        }
        return week;
    }, []);

    const selectedEvents = useMemo(() => {
        return events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.getDate() === selectedDate.getDate() &&
                   eventDate.getMonth() === selectedDate.getMonth() &&
                   eventDate.getFullYear() === selectedDate.getFullYear();
        });
    }, [events, selectedDate]);

    // Format helpers
    const getDayName = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

    return (
        <div className="bg-app-card rounded-2xl border border-app-stroke p-5 sm:p-6 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 cursor-pointer group w-fit" onClick={() => navigate('/app/agenda')}>
                    <h2 className="text-lg font-bold text-app-text-main group-hover:text-primary transition-colors">Agenda da semana</h2>
                    <ExternalLink size={16} className="text-primary opacity-70 group-hover:opacity-100" />
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={hideOverdue} onChange={(e) => setHideOverdue(e.target.checked)} />
                            <div className={cn("block w-9 h-5 rounded-full transition-colors", hideOverdue ? "bg-primary" : "bg-app-stroke group-hover:bg-app-stroke/80")}></div>
                            <div className={cn("absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform shadow-sm", hideOverdue ? "translate-x-4" : "")}></div>
                        </div>
                        <span className="text-xs text-app-text-muted font-medium">Ocultar atividades atrasadas</span>
                    </label>
                    <button className="text-app-text-muted hover:text-app-text-main p-1 rounded-lg hover:bg-app-input transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            {/* Week Calendar */}
            <div className="flex justify-between gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                {weekDays.map((date, i) => {
                    const active = isSameDay(date, selectedDate);
                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[65px] h-[80px] rounded-[14px] border transition-all duration-200",
                                active 
                                    ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-lg shadow-black/20 scale-105" 
                                    : "bg-transparent border-app-stroke/60 text-app-text-muted hover:border-primary/40 hover:bg-app-input"
                            )}
                        >
                            <span className={cn("text-[11px] font-semibold capitalize mb-1", active ? "text-white/90" : "text-app-text-label")}>
                                {getDayName(date)}
                            </span>
                            <span className={cn("text-xl font-extrabold", active ? "text-white" : "text-app-text-main")}>
                                {date.getDate()}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Events List */}
            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[200px]">
                {selectedEvents.length > 0 ? (
                    selectedEvents.map((event: any, i: number) => {
                        const eventDate = new Date(event.start);
                        // Calculate days difference by zeroing out time
                        const todayStr = new Date().toDateString();
                        const eventStr = eventDate.toDateString();
                        const isOverdue = eventDate < new Date() && todayStr !== eventStr;
                        
                        if (hideOverdue && isOverdue) return null;

                        return (
                            <div key={event.id || i} className="border-b border-app-stroke/50 pb-5 last:border-0 last:pb-0 animate-in fade-in duration-300">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                        Pendente
                                    </span>
                                    <span className="px-2.5 py-1 bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 rounded-md text-[10px] font-bold flex items-center gap-1.5">
                                        <CalendarIcon size={12} />
                                        Tarefa
                                    </span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-app-text-main mb-3 leading-snug">{event.title}</h3>
                                
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <CalendarIcon size={14} />
                                        <span className="font-medium">Data de Compromisso: {eventDate.toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-black/50 dark:text-white/50 font-medium">
                                        <AlertTriangle size={14} />
                                        <span>Data fatal: {eventDate.toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    {isOverdue && (
                                        <div className="flex items-center gap-2 text-black dark:text-white font-bold">
                                            <Clock size={14} />
                                            <span>Vencida há {Math.floor((new Date().getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))} dias</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-app-text-muted">
                        <CalendarIcon size={32} className="mb-3 opacity-20" />
                        <p className="text-sm font-medium">Nenhum compromisso neste dia.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
