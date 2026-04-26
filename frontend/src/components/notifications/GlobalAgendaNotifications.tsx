import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io, Socket } from 'socket.io-client';

interface AgendaEvent {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    type: string;
    completed: boolean;
    reminderMinutes?: number;
}

// Notification Toast Component - global overlay
const NotificationToast = ({ event, onDismiss }: { event: AgendaEvent; onDismiss: () => void }) => (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-8 z-[9999] animate-in slide-in-from-bottom bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-5 w-[90vw] max-w-[400px]">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 shadow-lg shadow-primary/10">
                <Bell size={24} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-black text-white text-xs uppercase tracking-[0.2em] opacity-40">
                        Compromisso
                    </h4>
                    <button onClick={onDismiss} className="text-white/20 hover:text-white transition-all p-1 hover:bg-white/5 rounded-lg">
                        <X size={16} />
                    </button>
                </div>
                <p className="text-white font-black text-sm tracking-tight leading-tight mb-0.5 truncate">{event.title}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {new Date(event.start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
            </div>
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] font-black text-white border-4 border-[#0F172A] shadow-lg">
            !
        </div>
    </div>
);

export default function GlobalAgendaNotifications() {
    const { user } = useAuth();
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [notification, setNotification] = useState<AgendaEvent | null>(null);
    const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const notifiedIdsRef = useRef<Set<string>>(new Set());
    const socketRef = useRef<Socket | null>(null);

    // Socket.IO Connection for real-time notifications
    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('token');
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        const socketUrl = backendUrl.replace('/api', '') + '/notifications';

        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[GlobalAgendaNotifications] Connected to WebSocket securely');
        });

        socket.on('notification', (data: any) => {
            console.log('[GlobalAgendaNotifications] Received real-time notification via WS:', data);

            // Reconstruct the event format expected by the Toast
            const isEvent = data.entityType === 'EVENT';

            // Extract title and time from message format: "Title - HH:MM"
            const parts = data.message?.split(' - ') || [];
            const title = parts[0] || data.message;
            // Best effort to create a start time for the display, assuming it's today
            const start = new Date().toISOString();

            const eventPayload: AgendaEvent = {
                id: data.entityId || `ws-${Date.now()}`,
                title: title,
                start: start,
                end: start,
                type: 'SYSTEM',
                completed: false
            };

            setNotification(eventPayload);
            
            // Silence AI-related notifications specifically
            const isAi = data.title?.includes('[IA]') || data.title?.includes('Copiloto');
            if (isAi) {
                console.log('[GlobalAgendaNotifications] Quietly handling AI notification without popup');
                setNotification(null); // Abort toast
                return;
            }

            if (isEvent && data.entityId) {
                notifiedIdsRef.current.add(data.entityId);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user]);

    // Fetch events periodically (Fallback for robust tracking)
    const fetchEvents = useCallback(async () => {
        if (!user) return;

        try {
            const res = await api.get('/agenda');
            setEvents(res.data.map((e: any) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                start: e.start,
                end: e.end,
                type: e.type,
                completed: e.completed,
                reminderMinutes: e.reminderMinutes ?? 30,
            })));
        } catch (error) {
            console.error('Error fetching agenda events:', error);
        }
    }, [user]);

    // Initial fetch only (no polling — WebSocket handles real-time, DeadlineContext handles periodic refresh)
    useEffect(() => {
        if (!user) return;
        fetchEvents();
    }, [user, fetchEvents]);

    // Check for upcoming events locally (client-side fallback/insurance)
    useEffect(() => {
        if (events.length === 0) return;

        const checkUpcomingEvents = () => {
            const now = new Date();
            events.forEach(event => {
                if (notifiedIdsRef.current.has(event.id)) return;
                if (event.completed) return;

                const eventTime = new Date(event.start);
                const timeDiff = eventTime.getTime() - now.getTime();
                const minutesDiff = Math.floor(timeDiff / 60000);

                const reminderTime = event.reminderMinutes ?? 30;

                if (minutesDiff > 0 && minutesDiff <= reminderTime) {
                    setNotification(event);
                    notifiedIdsRef.current.add(event.id);
                }
            });
        };

        checkUpcomingEvents(); // Check immediately
        const checkInterval = setInterval(checkUpcomingEvents, 30000);

        return () => clearInterval(checkInterval);
    }, [events]);

    // Play notification sound using Web Audio API (reliable chime sound)
    const playNotificationSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Create a pleasant notification chime with 3 ascending tones
            const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, startTime);

                // Envelope: attack, sustain, release
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
                gainNode.gain.setValueAtTime(volume, startTime + duration - 0.05);
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };

            const now = audioContext.currentTime;

            // Pleasant ascending chime: C5 → E5 → G5 → C6
            playTone(523.25, now, 0.15, 0.25);         // C5
            playTone(659.25, now + 0.12, 0.15, 0.3);   // E5
            playTone(783.99, now + 0.24, 0.15, 0.35);  // G5
            playTone(1046.50, now + 0.36, 0.3, 0.3);   // C6 (longer)

            console.log('✅ Som de notificação tocando');
        } catch (error) {
            console.error('❌ Erro no som de notificação:', error);
        }
    }, [user]);

    // Effect to repeat sound while notification is active
    useEffect(() => {
        if (notification) {
            playNotificationSound();

            soundIntervalRef.current = setInterval(() => {
                playNotificationSound();
            }, 10000);
        } else {
            if (soundIntervalRef.current) {
                clearInterval(soundIntervalRef.current);
                soundIntervalRef.current = null;
            }
        }

        return () => {
            if (soundIntervalRef.current) {
                clearInterval(soundIntervalRef.current);
                soundIntervalRef.current = null;
            }
        };
    }, [notification, playNotificationSound]);

    // Don't render anything if not logged in or no notification
    if (!user) return null;

    return (
        <>
            {notification && (
                <NotificationToast
                    event={notification}
                    onDismiss={() => setNotification(null)}
                />
            )}
        </>
    );
}
