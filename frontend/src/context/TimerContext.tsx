import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';

interface TimerState {
    isRunning: boolean;
    seconds: number;
    description: string;
    processId: string;
    processTitle: string;
    startedAt: number | null;
}

interface TimerContextType {
    timer: TimerState;
    startTimer: (description: string, processId?: string, processTitle?: string) => void;
    stopTimer: () => { duration: number; description: string; processId?: string; processTitle?: string } | null;
    resetTimer: () => void;
}

const defaultTimer: TimerState = {
    isRunning: false,
    seconds: 0,
    description: '',
    processId: '',
    processTitle: '',
    startedAt: null,
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMER_STORAGE_KEY = 'blueadv_timer_state';

export function TimerProvider({ children }: { children: ReactNode }) {
    const [timer, setTimer] = useState<TimerState>(() => {
        try {
            const saved = localStorage.getItem(TIMER_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // If timer was running, calculate elapsed time since it was started
                if (parsed.isRunning && parsed.startedAt) {
                    const elapsedSeconds = Math.floor((Date.now() - parsed.startedAt) / 1000);
                    return { ...parsed, seconds: elapsedSeconds };
                }
                return parsed;
            }
        } catch (e) {
            console.error('Error loading timer state:', e);
        }
        return defaultTimer;
    });

    // Persist timer state to localStorage only on meaningful changes (not every tick)
    const prevRunningRef = useRef(timer.isRunning);
    useEffect(() => {
        // Save when running state changes (start/stop), or on description/process changes
        if (timer.isRunning !== prevRunningRef.current || !timer.isRunning) {
            localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
            prevRunningRef.current = timer.isRunning;
        }
    }, [timer.isRunning, timer.description, timer.processId]);

    // Timer tick effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timer.isRunning) {
            interval = setInterval(() => {
                setTimer(prev => ({ ...prev, seconds: prev.seconds + 1 }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer.isRunning]);

    const startTimer = useCallback((description: string, processId?: string, processTitle?: string) => {
        setTimer({
            isRunning: true,
            seconds: 0,
            description,
            processId: processId || '',
            processTitle: processTitle || '',
            startedAt: Date.now(),
        });
    }, []);

    const stopTimer = useCallback(() => {
        if (!timer.isRunning) return null;

        const result = {
            duration: timer.seconds,
            description: timer.description,
            processId: timer.processId || undefined,
            processTitle: timer.processTitle || undefined,
        };

        setTimer(defaultTimer);
        return result;
    }, [timer]);

    const resetTimer = useCallback(() => {
        setTimer(defaultTimer);
    }, []);

    const contextValue = useMemo(() => ({
        timer, startTimer, stopTimer, resetTimer,
    }), [timer, startTimer, stopTimer, resetTimer]);

    return (
        <TimerContext.Provider value={contextValue}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
}
