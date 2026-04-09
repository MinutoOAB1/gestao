import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, X } from 'lucide-react';
import { clsx } from 'clsx';

interface PomodoroTimerProps {
    onTimeUpdate?: (time: number) => void;
}

export default function PomodoroTimer({ onTimeUpdate }: PomodoroTimerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
    const [mode, setMode] = useState<'work' | 'break'>('work');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Work: 25 min, Break: 5 min
    const WORK_TIME = 25 * 60;
    const BREAK_TIME = 5 * 60;
    const targetTime = mode === 'work' ? WORK_TIME : BREAK_TIME;

    useEffect(() => {
        // Create audio element for notification
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1cXmp5gom4r7OxmZVrd2yAjqG2uLi3ppSBb2RobHl/k6GtrquhlIJ3a2JjZ3N/iJWfpqSfmJOKfXFpZGRnbXJ7g4qPkpOQjIeDfXZua2hjYWJkZ2tvdHl9f4CAfnx4dHFuamhmZGFfXlxbW1tcXV1fYGFjZGVmZ2hpamtsbW5vcHBxcXJyc3NzdHR0dHR0dHR0c3N');
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeElapsed(prev => {
                    const newTime = prev + 1;
                    onTimeUpdate?.(newTime);

                    // Check if time is up
                    if (newTime >= targetTime) {
                        playNotification();
                        setIsRunning(false);
                        // Switch mode
                        setMode(mode === 'work' ? 'break' : 'work');
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, mode, targetTime, onTimeUpdate]);

    const playNotification = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(() => { });
        }
        // Also show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(mode === 'work' ? '⏰ Hora da Pausa!' : '💪 Volte ao Trabalho!', {
                body: mode === 'work' ? 'Você trabalhou 25 minutos. Descanse um pouco!' : 'Pausa terminada. Vamos continuar!',
                icon: '/favicon.ico'
            });
        }
    };

    const formatTime = (seconds: number) => {
        const remaining = targetTime - seconds;
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeElapsed(0);
    };

    const progress = (timeElapsed / targetTime) * 100;

    return (
        <div className="relative">
            {/* Timer Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "p-2.5 rounded-xl transition-colors relative",
                    isRunning
                        ? "text-green-500 bg-green-100 dark:bg-green-900/30"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                title="Pomodoro Timer"
            >
                <Timer size={20} />
                {isRunning && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
            </button>

            {/* Timer Popup */}
            {isOpen && (
                <div className="absolute top-12 right-0 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Timer size={18} className="text-primary" />
                            Pomodoro Timer
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => { setMode('work'); setTimeElapsed(0); setIsRunning(false); }}
                            className={clsx(
                                "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                                mode === 'work'
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            )}
                        >
                            Trabalho
                        </button>
                        <button
                            onClick={() => { setMode('break'); setTimeElapsed(0); setIsRunning(false); }}
                            className={clsx(
                                "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                                mode === 'break'
                                    ? "bg-green-500 text-white"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            )}
                        >
                            Pausa
                        </button>
                    </div>

                    {/* Timer Display */}
                    <div className="relative mb-4">
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={clsx(
                                    "h-full transition-all duration-1000",
                                    mode === 'work' ? "bg-primary" : "bg-green-500"
                                )}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="text-center mt-4">
                            <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                                {formatTime(timeElapsed)}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                                {mode === 'work' ? 'Tempo de Trabalho' : 'Tempo de Descanso'}
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={handleReset}
                            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            <RotateCcw size={20} />
                        </button>
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={clsx(
                                "px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2 transition-colors",
                                isRunning ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-blue-700"
                            )}
                        >
                            {isRunning ? <Pause size={20} /> : <Play size={20} />}
                            {isRunning ? 'Pausar' : 'Iniciar'}
                        </button>
                    </div>

                    {/* Session Counter */}
                    <p className="text-center text-xs text-slate-400 mt-4">
                        Clique em Iniciar para começar a contagem
                    </p>
                </div>
            )}
        </div>
    );
}
