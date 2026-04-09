import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import type { ReactNode } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';
import api from '../services/api';

interface Deadline {
    id: string;
    title: string;
    date: string;
    type: 'process' | 'agenda' | 'financial';
    reminderMinutes?: number; // minutes before the event to trigger the reminder
}

interface DeadlineContextType {
    upcomingDeadlines: Deadline[];
    dismissReminder: (id: string) => void;
}

const DeadlineContext = createContext<DeadlineContextType | null>(null);

export function useDeadlines() {
    const context = useContext(DeadlineContext);
    if (!context) {
        throw new Error('useDeadlines must be used within DeadlineProvider');
    }
    return context;
}


function ReminderPopup({ deadline, onDismiss }: { deadline: Deadline; onDismiss: () => void }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Play notification sound
        try {
            audioRef.current = new Audio('/notification.mp3');
            audioRef.current.volume = 0.5;
            audioRef.current.play().catch(() => {
                // Fallback: try web audio API beep
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.3;
                oscillator.start();
                setTimeout(() => {
                    oscillator.stop();
                    audioContext.close();
                }, 200);
            });
        } catch (e) {
            console.log('Sound notification not available');
        }

        // Request notification permission if not granted
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            const dateObj = new Date(deadline.date);
            const formattedDate = dateObj.toLocaleDateString('pt-BR');
            new Notification('⏰ Lembrete de Prazo!', {
                body: `${deadline.title} - ${formattedDate}`,
                icon: '/favicon.ico',
                tag: deadline.id
            });
        }
    }, [deadline]);

    const getDeadlineTime = () => {
        const date = new Date(deadline.date);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs < 0) return 'Atrasado!';
        if (diffMins < 60) return `${diffMins} minutos`;
        if (diffHours < 24) return `${diffHours} horas`;
        return `${diffDays} dias`;
    };

    const isOverdue = new Date(deadline.date) < new Date();

    return (
        <div className={`fixed bottom-4 right-4 max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 ${isOverdue ? 'border-red-500' : 'border-amber-400'} p-4 z-[9999] animate-slide-in`}>
            <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl ${isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'} flex items-center justify-center flex-shrink-0`}>
                    {isOverdue ? <AlertTriangle size={24} /> : <Clock size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            ⏰ Lembrete de Prazo
                        </h4>
                        <button
                            onClick={onDismiss}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 font-medium text-sm mt-1 truncate">
                        {deadline.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {getDeadlineTime()}
                        </span>
                        <span className="text-xs text-slate-500">
                            {new Date(deadline.date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                            })}, {new Date(deadline.date).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function DeadlineProvider({ children }: { children: ReactNode }) {
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
    const [activeReminder, setActiveReminder] = useState<Deadline | null>(null);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('dismissed-deadline-reminders');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Fetch deadlines from various sources
    useEffect(() => {
        const fetchDeadlines = async () => {
            try {
                const deadlines: Deadline[] = [];

                // Helper to normalize the dates properly from ISO strings and avoid TZ drift
                const normalizeDate = (isoString: string) => {
                    if (!isoString) return new Date().toISOString();

                    // Se for apenas uma data (YYYY-MM-DD) ou terminar em Z com hora zerada
                    if (isoString.includes('T00:00') || /^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
                        // Forçamos para o Meio-dia LOCAL para garantir que não mude o dia independente do fuso
                        const [year, month, day] = isoString.substring(0, 10).split('-');
                        const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
                        return d.toISOString();
                    }

                    return new Date(isoString).toISOString();
                };

                // Fetch processes with deadlines
                try {
                    const processRes = await api.get('/processes');
                    const processes = processRes.data || [];
                    processes.forEach((p: any) => {
                        if (p.deadline && p.status !== 'ARQUIVADO' && p.status !== 'ENCERRADO') {
                            deadlines.push({
                                id: `process-${p.id}`,
                                title: `Processo: ${p.title || p.number}`,
                                date: normalizeDate(p.deadline),
                                type: 'process'
                            });
                        }
                    });
                } catch (e) {
                    console.log('Could not fetch processes');
                }

                // Fetch agenda events
                try {
                    const agendaRes = await api.get('/agenda');
                    const events = agendaRes.data || [];
                    events.forEach((e: any) => {
                        if ((e.date || e.startDate || e.start) && !e.completed) {
                            const eventDate = e.date || e.startDate || e.start;
                            deadlines.push({
                                id: `agenda-${e.id}`,
                                title: `Evento: ${e.title}`,
                                date: normalizeDate(eventDate),
                                type: 'agenda',
                                reminderMinutes: e.reminderMinutes ?? 30
                            });
                        }
                    });
                } catch (e) {
                    console.log('Could not fetch agenda');
                }

                // Fetch financial transactions with due dates
                try {
                    const finRes = await api.get('/financial');
                    const transactions = finRes.data || [];
                    transactions.forEach((t: any) => {
                        if (t.date && t.status === 'PENDING') {
                            deadlines.push({
                                id: `financial-${t.id}`,
                                title: `Pagamento: ${t.description}`,
                                date: normalizeDate(t.date),
                                type: 'financial'
                            });
                        }
                    });
                } catch (e) {
                    console.log('Could not fetch financial');
                }

                setUpcomingDeadlines(deadlines);
            } catch (error) {
                console.error('Error fetching deadlines:', error);
            }
        };

        // Delay the first fetch to not block initial page render
        const initialTimeout = setTimeout(fetchDeadlines, 3000);
        const interval = setInterval(fetchDeadlines, 60000); // Refresh every minute
        return () => { clearTimeout(initialTimeout); clearInterval(interval); };
    }, []);

    // Check for upcoming deadlines and show reminders
    useEffect(() => {
        const checkDeadlines = () => {
            const now = new Date();

            for (const deadline of upcomingDeadlines) {
                if (dismissedIds.has(deadline.id)) continue;

                const deadlineDate = new Date(deadline.date);
                const timeDiffMs = deadlineDate.getTime() - now.getTime();
                const minutesUntilDeadline = timeDiffMs / 60000;

                // Use the deadline's own reminderMinutes (default 1440 = 24h for processes/financial)
                const reminderWindow = deadline.reminderMinutes ?? 1440;

                // Show reminder if deadline is in the future AND within the reminder window
                if (minutesUntilDeadline > 0 && minutesUntilDeadline <= reminderWindow) {
                    setActiveReminder(deadline);
                    break;
                }

                // Also show if deadline is past (overdue) but only for today
                if (minutesUntilDeadline < 0 && minutesUntilDeadline > -(60 * 12)) {
                    // Overdue by less than 12 hours — still show
                    setActiveReminder(deadline);
                    break;
                }
            }
        };

        checkDeadlines();
        const interval = setInterval(checkDeadlines, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [upcomingDeadlines, dismissedIds]);

    const dismissReminder = (id: string) => {
        setDismissedIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            localStorage.setItem('dismissed-deadline-reminders', JSON.stringify([...newSet]));
            return newSet;
        });
        setActiveReminder(null);
    };

    const contextValue = useMemo(() => ({
        upcomingDeadlines,
        dismissReminder,
    }), [upcomingDeadlines, dismissReminder]);

    return (
        <DeadlineContext.Provider value={contextValue}>
            {children}
            {activeReminder && (
                <ReminderPopup
                    deadline={activeReminder}
                    onDismiss={() => dismissReminder(activeReminder.id)}
                />
            )}
        </DeadlineContext.Provider>
    );
}
