import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter, Bell, X, Check, Circle, CheckCircle2, Users, MapPin, Trash2, Edit3, List, AlertTriangle, Gavel, FileText, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../context/ToastContext';
import { ClientDetailPageContent } from '../clients/ClientDetailPage';
import { ProcessDetailPageContent } from '../processes/ProcessDetailPage';

interface EventAssignee {
    id: string;
    userId: string;
    userName: string;
    userEmail?: string;
    status: string;
}

interface EventChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    order: number;
    eventId: string;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
}

interface Event {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    type: string;
    color?: string;
    status: string;
    completed: boolean;
    priority?: string;
    location?: string;
    reminderMinutes?: number;
    createdByName?: string;
    clientId?: string;
    clientName?: string;
    processId?: string;
    processNumber?: string;
    assignees?: EventAssignee[];
    checklistItems?: EventChecklistItem[];
    day?: number;
    time?: string;
    date?: Date;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const EVENT_TYPES = [
    { key: 'all', label: 'Todos', color: 'gray' },
    { key: 'hearing', label: 'Audiências', color: 'blue' },
    { key: 'deadline', label: 'Prazos Fatais', color: 'red' },
    { key: 'meeting', label: 'Reuniões', color: 'emerald' },
    { key: 'personal', label: 'Pessoal', color: 'purple' },
];

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    'URGENT': { bg: 'bg-red-500/15', text: 'text-red-500', label: 'Urgente' },
    'HIGH': { bg: 'bg-orange-500/15', text: 'text-orange-500', label: 'Alta' },
    'MEDIUM': { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Média' },
    'LOW': { bg: 'bg-gray-500/15', text: 'text-gray-400', label: 'Baixa' },
};

// Notification Toast Component - positioned at bottom with better visibility
const NotificationToast = ({ event, onDismiss }: { event: Event; onDismiss: () => void }) => (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-8 z-[9999] animate-in slide-in-from-bottom bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-2xl shadow-2xl shadow-black/30 p-4 w-[90vw] max-w-[380px]">
        <div className="flex items-center gap-3">
            {/* Avatar/Icon */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 ring-2 ring-white/20">
                <Bell size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1">
                        Lembrete de Compromisso
                        <span className="text-primary">✨</span>
                    </h4>
                    <button onClick={onDismiss} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                        <X size={16} />
                    </button>
                </div>
                <p className="text-white font-medium truncate">{event.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(event.start).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
            </div>
            {/* Red dot indicator */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-slate-800 animate-bounce">
                1
            </div>
        </div>
    </div>
);

export default function AgendaPage() {
    const { addToast } = useToast();
    const [view, setView] = useState<'day' | 'week' | 'month' | 'list'>('month');
    const [selectedDate, setSelectedDate] = useState(new Date().getDate());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'DIA' | 'PRAZOS'>('DIA');
    const [asideFilter, setAsideFilter] = useState<'ATIVO' | 'SUSPENSO' | 'FINALIZADO'>('ATIVO');
    const filterRef = useRef<HTMLDivElement>(null);
    const weekScrollRef = useRef<HTMLDivElement | null>(null);

    // Scroll to 08:00 when week view is activated (handling framer-motion delay)
    useEffect(() => {
        if (view === 'week') {
            const timeout = setTimeout(() => {
                if (weekScrollRef.current) {
                    weekScrollRef.current.scrollTo({ top: 8 * 60, behavior: 'auto' });
                }
            }, 300); // Wait for AnimatePresence transition (0.2s) to fully finish
            return () => clearTimeout(timeout);
        }
    }, [view, currentMonth, currentYear]);

    // Contextual Navigation
    const [drawerEntity, setDrawerEntity] = useState<{ type: 'client' | 'process', clientId?: string, processNumber?: string, processId?: string, title: string } | null>(null);

    // Team members for assignment
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    // Clients for linking
    const [clients, setClients] = useState<Array<{ id: string, name: string }>>([]);
    const [isQuickAddClient, setIsQuickAddClient] = useState(false);
    const [quickAddClientName, setQuickAddClientName] = useState('');
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    // User filter - show events for specific user or 'all'
    const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

    // Notification state
    const [notification, setNotification] = useState<Event | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Modal State
    const [isNewEventOpen, setIsNewEventOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
    const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: '',
        end: '',
        type: 'meeting',
        description: '',
        priority: 'MEDIUM',
        location: '',
        reminderMinutes: 30,
        clientId: '',
        clientName: '',
        processNumber: '',
        assigneeIds: [] as string[],
        status: 'ATIVO',
        color: ''
    });

    const fetchEvents = async (showLoading = false) => {
        try {
            if (showLoading) setIsLoading(true);
            const res = await api.get('/agenda');
            const formattedEvents = res.data.map((e: any) => ({
                ...e,
                day: new Date(e.start).getDate(),
                time: new Date(e.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                date: new Date(e.start)
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Erro ao buscar eventos:', error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const res = await api.get('/chat/team');
            setTeamMembers(res.data);
        } catch (error) {
            console.error('Erro ao buscar membros da equipe:', error);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    };

    const handleQuickAddClient = async () => {
        if (!quickAddClientName.trim()) return;
        setIsCreatingClient(true);
        try {
            const res = await api.post('/clients', { name: quickAddClientName });
            setClients(prev => [...prev, res.data]);
            setNewEvent(prev => ({ ...prev, clientId: res.data.id, clientName: res.data.name }));
            setIsQuickAddClient(false);
            setQuickAddClientName('');
            addToast('Cliente criado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao quick-add:', error);
            addToast('Erro ao criar cliente.', 'error');
        } finally {
            setIsCreatingClient(false);
        }
    };

    const handleEventDrop = async (e: React.DragEvent<HTMLDivElement>, targetDate: Date) => {
        e.preventDefault();
        const eventId = e.dataTransfer.getData('text/plain');
        if (!eventId) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // Snap to 30 min intervals based on Y (60px = 1 hour)
        const minutes = Math.floor(y / 30) * 30; 
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        const droppedEvent = events.find(ev => ev.id === eventId);
        if (!droppedEvent) return;

        const oldStart = new Date(droppedEvent.start);
        const oldEnd = droppedEvent.end ? new Date(droppedEvent.end) : new Date(oldStart.getTime() + 60*60*1000);
        const durationMs = oldEnd.getTime() - oldStart.getTime();

        const newStart = new Date(targetDate);
        newStart.setHours(hours, mins, 0, 0);
        const newEnd = new Date(newStart.getTime() + durationMs);

        // Optimistic update
        setEvents(prev => prev.map(ev => 
            ev.id === eventId 
            ? { 
                ...ev, 
                start: newStart.toISOString(), 
                end: newEnd.toISOString(),
                day: newStart.getDate(),
                time: newStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                date: newStart
            } 
            : ev
        ));

        try {
            await api.patch(`/agenda/${eventId}`, {
                start: newStart.toISOString(),
                end: newEnd.toISOString()
            });
            addToast('Evento reagendado com sucesso', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erro ao reagendar evento', 'error');
            fetchEvents(); // revert optimistic
        }
    };

    useEffect(() => {
        fetchEvents(true);
        fetchTeamMembers();
        fetchClients();
        // Setup notification audio
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleB4EPZbjwXxIITaC8ut0RAo5juz6fEN8PTiZ+OplUE8yqP/jY1hALq7/3l1SSy+w/9daT0Uvr//XXE9GL6//1lxPRi+v/9ZdT0Uvr//WXU9FL6//1l1PRS+v/9ZdT0Uvr//WXU9FL6//1l1ORS+v/9ZdTkUvr//WXU5FL6//1l1ORS+v/9ZdTkUvr//WXU5FL6//1l1ORS+v/9ZdTkUvsP/VXU5FLq//1V5NRi6w/9VfTUYurf/VYE1GLa7/1WBNRi2u/9VgTUYtrv/VYE1GLa7/1WBNRi2u/9VgTEYtrv/VYEtGLa7/1WBLRi2u/9VgS0Ytrv/VYEtGLa7/1WBLRi2u/9VgS0Ytrv/VYEtGLa7/1WBLRi2u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/VYEpGLa7/1WBKRi2u/9VgSkYtrv/UYEpGLa7/1WBKRi6u/9VgSkYtrv/UYEpGLa7/1WBKRi2u/9VgSkYtrv/UYEpGLa7/1WBKRi2u/9VgSkYtrv/UYEpGLa7/1GBKRi2u/9RgSkYtrv/UYEpGLa7/1GBKRi2u/9RgSkYtrv/UYEpGLa7/1GBKRi2v/9RgSkYtr//UYEpGLa//1GBKRi2v/9RgSkYtr//UYEpGLa//1GBKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLa//1GFKRi2v/9RhSkYtr//UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsP/UYUpGLbD/1GFKRi2w/9RhSkYtsf/UYUpGLbH/1GFKRi2x/9RhSkYtsf/UYUpGLbH/1GFKRi2x/9RhSkYtsf/UYUpGLbH/1GFKRi2x/9RhSkYtsf/TYUpGLbH/02FKRi2x/9NhSkYtsf/TYUpGLbH/02FKRi2x/9NhSkYtsf/TYUpGLbH/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLL/02FKRiyy/9NhSkYssv/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/TYUpGLLH/02FKRiyx/9NhSkYssf/SAAA=');
    }, []);

    // Check for upcoming events and show notifications
    useEffect(() => {
        const notifiedIds = new Set<string>();
        const checkUpcomingEvents = () => {
            const now = new Date();
            events.forEach(event => {
                if (notifiedIds.has(event.id)) return;
                if (event.completed) return; // Don't notify for completed events

                const eventTime = new Date(event.start);
                const timeDiff = eventTime.getTime() - now.getTime();
                const minutesDiff = Math.floor(timeDiff / 60000);

                // Use event's reminder setting (default to 30 minutes)
                const reminderTime = event.reminderMinutes ?? 30;

                // Trigger notification when within the reminder window
                if (minutesDiff > 0 && minutesDiff <= reminderTime) {
                    setNotification(event); // Sound is triggered by useEffect watching notification
                    notifiedIds.add(event.id);
                }
            });
        };

        const interval = setInterval(checkUpcomingEvents, 30000);
        return () => clearInterval(interval);
    }, [events]);

    // Close filter menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setShowFilterMenu(false);
            }
        };
        if (showFilterMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFilterMenu]);

    // Play notification sound from MP3 file
    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio('/Type.mp3');
            audio.volume = 0.7;
            audio.play().catch(err => {
                console.log('Could not play notification sound:', err);
            });
        } catch (error) {
            console.log('Sound notification not available:', error);
        }
    }, []);

    // Effect to repeat sound while notification is active
    useEffect(() => {
        if (notification) {
            // Play immediately when notification appears
            playNotificationSound();

            // Then repeat every 10 seconds while notification is showing
            soundIntervalRef.current = setInterval(() => {
                playNotificationSound();
            }, 10000);
        } else {
            // Clear interval when notification is dismissed
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

    const [newChecklistItemText, setNewChecklistItemText] = useState('');

    const handleAddChecklistItem = async (eventId: string) => {
        if (!newChecklistItemText.trim()) return;
        try {
            await api.post(`/agenda/${eventId}/checklist`, { text: newChecklistItemText });
            setNewChecklistItemText('');
            // Optional: refresh just the editing event or all events
            fetchEvents();
            // Upate local editing event to prevent modal jump
            if (editingEvent) {
                const res = await api.get(`/agenda/${eventId}`);
                setEditingEvent(res.data);
            }
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            addToast('Erro ao adicionar item ao checklist', 'error');
        }
    };

    const handleToggleChecklistItem = async (itemId: string) => {
        try {
            // Optimistic update
            if (editingEvent && editingEvent.checklistItems) {
                setEditingEvent({
                    ...editingEvent,
                    checklistItems: editingEvent.checklistItems.map(item =>
                        item.id === itemId ? { ...item, completed: !item.completed } : item
                    )
                });
            }
            await api.patch(`/agenda/checklist/${itemId}/toggle`);
            fetchEvents();
        } catch (error) {
            console.error('Erro ao marcar item:', error);
            fetchEvents(); // Revert optimistic update
        }
    };

    const handleDeleteChecklistItem = async (itemId: string) => {
        try {
            // Optimistic update
            if (editingEvent && editingEvent.checklistItems) {
                setEditingEvent({
                    ...editingEvent,
                    checklistItems: editingEvent.checklistItems.filter(item => item.id !== itemId)
                });
            }
            await api.delete(`/agenda/checklist/${itemId}`);
            fetchEvents();
        } catch (error) {
            console.error('Erro ao remover item:', error);
            fetchEvents(); // Revert optimistic update
        }
    };

    const handleCreateEvent = async () => {
        try {
            if (!newEvent.title || !newEvent.start) {
                addToast('Preencha o título e a data de início.', 'warning');
                return;
            }
            setIsLoading(true);
            let startDate: Date;
            let endDate: Date;

            try {
                startDate = new Date(newEvent.start);
                if (isNaN(startDate.getTime())) throw new Error("Invalid start date");
                endDate = newEvent.end ? new Date(newEvent.end) : startDate;
            } catch (err) {
                console.error("Date parsing error:", err, newEvent);
                addToast('Formato de data inválido.', 'error');
                setIsLoading(false);
                return;
            }

            const payload = {
                title: newEvent.title,
                description: newEvent.description || '',
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                type: newEvent.type,
                color: newEvent.color || (newEvent.type === 'hearing' ? 'blue' : newEvent.type === 'deadline' ? 'red' : newEvent.type === 'meeting' ? 'green' : 'amber'),
                status: newEvent.status,
                priority: newEvent.priority,
                location: newEvent.location,
                reminderMinutes: newEvent.reminderMinutes,
                clientId: newEvent.clientId || null,
                clientName: newEvent.clientName || null,
                processNumber: newEvent.processNumber || null,
                assigneeIds: newEvent.assigneeIds
            };

            // Close modal immediately for snappy UX
            setIsNewEventOpen(false);
            const wasEditing = !!editingEvent;
            const editId = editingEvent?.id;
            setEditingEvent(null);
            setNewEvent({ title: '', start: '', end: '', type: 'meeting', description: '', priority: 'MEDIUM', location: '', reminderMinutes: 30, clientId: '', clientName: '', processNumber: '', assigneeIds: [], status: 'ATIVO', color: '' });

            let res;
            if (wasEditing && editId) {
                res = await api.patch(`/agenda/${editId}`, payload);
                // Optimistic: update inline
                const updated = res.data;
                setEvents(prev => prev.map(ev => ev.id === editId ? { ...updated, day: new Date(updated.start).getDate(), time: new Date(updated.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), date: new Date(updated.start) } : ev));
            } else {
                res = await api.post('/agenda', { ...payload, completed: false });
                // Optimistic: add to list
                const created = res.data;
                setEvents(prev => [...prev, { ...created, day: new Date(created.start).getDate(), time: new Date(created.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), date: new Date(created.start) }]);
            }

            addToast(wasEditing ? 'Evento atualizado com sucesso' : 'Evento criado com sucesso', 'success');
            // Background sync to ensure consistency
            fetchEvents();
        } catch (error: any) {
            console.error('Erro ao salvar evento:', error);
            addToast('Erro ao salvar: ' + (error.response?.data?.message || 'Tente novamente.'), 'error');
            fetchEvents();
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewClick = (event: Event, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setViewingEvent(event);
    };

    const handleEditClick = (event: Event, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setViewingEvent(null);
        if (e) e.stopPropagation();
        setEditingEvent(event);
        setNewEvent({
            title: event.title,
            start: new Date(event.start).toISOString().slice(0, 16),
            end: event.end ? new Date(event.end).toISOString().slice(0, 16) : new Date(event.start).toISOString().slice(0, 16),
            type: event.type,
            description: event.description || '',
            priority: event.priority || 'MEDIUM',
            location: event.location || '',
            reminderMinutes: event.reminderMinutes || 30,
            clientId: event.clientId || '',
            clientName: event.clientName || '',
            processNumber: event.processNumber || '',
            assigneeIds: event.assignees?.map(a => a.userId) || [],
            status: event.status || (event.completed ? 'FINALIZADO' : 'ATIVO'),
            color: event.color || ''
        });
        setIsNewEventOpen(true);
    };

    const handleDeleteEvent = async (eventId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            // Optimistic: remove from state immediately
            setEvents(prev => prev.filter(ev => ev.id !== eventId));
            addToast('Evento excluído com sucesso', 'success');
            await api.delete(`/agenda/${eventId}`);
            // Background sync
            fetchEvents();
        } catch (error) {
            console.error('Erro ao excluir evento:', error);
            addToast('Erro ao excluir: Tente novamente.', 'error');
            fetchEvents();
        }
    };

    const toggleEventCompleted = async (event: Event, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await api.patch(`/agenda/${event.id}`, { completed: !event.completed });
            setEvents(prev => prev.map(e => e.id === event.id ? { ...e, completed: !e.completed } : e));
        } catch (error) {
            console.error('Erro ao atualizar evento:', error);
        }
    };

    const getMonthName = (month: number) => new Date(2000, month, 1).toLocaleString('pt-BR', { month: 'long' });

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToToday = () => {
        const now = new Date();
        setCurrentMonth(now.getMonth());
        setCurrentYear(now.getFullYear());
        setSelectedDate(now.getDate());
    };

    // Calendar calculations
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = [];
        const daysInMon = getDaysInMonth(currentYear, currentMonth);
        const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth);

        for (let i = 0; i < firstDayOffset; i++) days.push(null);
        for (let day = 1; day <= daysInMon; day++) days.push(day);
        return days;
    }, [currentYear, currentMonth]);

    // Filter events by type AND user
    const filteredEvents = useMemo(() => events.filter(e => {
        // Type filter
        if (typeFilter !== 'all' && e.type !== typeFilter) return false;

        // User filter - check if event is created by or assigned to selected user
        if (selectedUserFilter !== 'all') {
            const isCreator = e.createdByName && teamMembers.find(m => m.id === selectedUserFilter)?.name === e.createdByName;
            const isAssignee = e.assignees?.some(a => a.userId === selectedUserFilter);
            if (!isCreator && !isAssignee) return false;
        }

        return true;
    }), [events, typeFilter, selectedUserFilter, teamMembers]);

    const eventsByDay = useMemo(() => {
        const map = new Map<number, typeof filteredEvents>();
        filteredEvents.forEach(e => {
            if (new Date(e.start).getMonth() === currentMonth && new Date(e.start).getFullYear() === currentYear) {
                if (!map.has(e.day!)) map.set(e.day!, []);
                map.get(e.day!)!.push(e);
            }
        });
        return map;
    }, [filteredEvents, currentMonth, currentYear]);

    // Events for selected date or view
    const todaysEvents = useMemo(() => {
        return eventsByDay.get(selectedDate) || [];
    }, [eventsByDay, selectedDate]);

    // Upcoming Prazos and Hearings for sidebar
    const upcomingEventsSidebar = useMemo(() => {
        return filteredEvents
            .filter(e => ['deadline', 'hearing'].includes(e.type))
            .filter(e => (e.status || (e.completed ? 'FINALIZADO' : 'ATIVO')) === asideFilter)
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [filteredEvents, asideFilter]);

    // Urgent upcoming deadlines for the red banner (next 15 days, not completed)
    const urgentDeadlines = useMemo(() => {
        const now = new Date();
        const cutoff = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
        return events
            .filter(e => e.type === 'deadline' && !e.completed && (e.status || 'ATIVO') !== 'FINALIZADO')
            .filter(e => {
                const d = new Date(e.start);
                return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && d <= cutoff;
            })
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [events]);

    // Week calculation
    const weekDates = useMemo(() => {
        const today = new Date(currentYear, currentMonth, selectedDate);
        const dayOfWeek = today.getDay();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - dayOfWeek);

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sunday);
            d.setDate(sunday.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [currentYear, currentMonth, selectedDate]);

    const getEventColor = (type: string, color?: string) => {
        // Map specific colors or types to our theme
        if (type === 'deadline' || color === 'red') {
            return { 
                dot: 'bg-red-500', 
                pill: 'bg-red-500 text-white', 
                pillLight: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
                badge: 'bg-red-500/10 text-red-500 border-l-2 border-red-500', 
                label: 'Prazo Fatal' 
            };
        }
        if (type === 'hearing' || color === 'blue') {
            return { 
                dot: 'bg-blue-500', 
                pill: 'bg-blue-500 text-white', 
                pillLight: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
                badge: 'bg-blue-500/10 text-blue-500 border-l-2 border-blue-500', 
                label: 'Audiência' 
            };
        }
        if (type === 'meeting' || color === 'emerald' || color === 'green') {
            return { 
                dot: 'bg-emerald-500', 
                pill: 'bg-emerald-500 text-white', 
                pillLight: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
                badge: 'bg-emerald-500/10 text-emerald-500 border-l-2 border-emerald-500', 
                label: 'Reunião' 
            };
        }
        if (type === 'personal' || color === 'purple') {
            return { 
                dot: 'bg-purple-500', 
                pill: 'bg-purple-500 text-white', 
                pillLight: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
                badge: 'bg-purple-500/10 text-purple-500 border-l-2 border-purple-500', 
                label: 'Pessoal' 
            };
        }
        if (color === 'amber' || color === 'orange') {
            return { 
                dot: 'bg-amber-500', 
                pill: 'bg-amber-500 text-white', 
                pillLight: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
                badge: 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500', 
                label: 'Importante' 
            };
        }

        return { 
            dot: 'bg-slate-500', 
            pill: 'bg-slate-500 text-white', 
            pillLight: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800',
            badge: 'bg-slate-500/10 text-slate-500 border-l-2 border-slate-500', 
            label: 'Evento' 
        };
    };

    // Monthly statistics
    const monthlyStats = useMemo(() => {
        const monthEvents = events.filter(e => {
            const d = new Date(e.start);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        return {
            hearings: monthEvents.filter(e => e.type === 'hearing').length,
            deadlines: monthEvents.filter(e => e.type === 'deadline').length,
            meetings: monthEvents.filter(e => e.type === 'meeting').length,
            total: monthEvents.length
        };
    }, [events, currentMonth, currentYear]);

    // Conflict detection: events that overlap in time for the same day
    const conflictIds = useMemo(() => {
        const ids = new Set<string>();
        for (let i = 0; i < filteredEvents.length; i++) {
            for (let j = i + 1; j < filteredEvents.length; j++) {
                const a = filteredEvents[i];
                const b = filteredEvents[j];
                const aStart = new Date(a.start).getTime();
                const aEnd = new Date(a.end || a.start).getTime();
                const bStart = new Date(b.start).getTime();
                const bEnd = new Date(b.end || b.start).getTime();
                if (aStart < bEnd && bStart < aEnd) {
                    ids.add(a.id);
                    ids.add(b.id);
                }
            }
        }
        return ids;
    }, [filteredEvents]);

    // List view: sorted upcoming events for the month
    const listViewEvents = useMemo(() => {
        return filteredEvents
            .filter(e => {
                const d = new Date(e.start);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    }, [filteredEvents, currentMonth, currentYear]);

    return (
        <div className="flex flex-col md:flex-row h-full w-full p-2 sm:p-4 gap-4 bg-app-bg overflow-hidden">
            {notification && <NotificationToast event={notification} onDismiss={() => setNotification(null)} />}

            {/* Main Calendar Area */}
            <main className="flex-1 bg-app-card border border-app-stroke rounded-xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-3 border-b border-app-stroke flex flex-col md:flex-row justify-between items-center gap-3">
                    <div className="flex-1 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-app-text-main capitalize">
                            {getMonthName(currentMonth)} {currentYear}
                        </h2>
                        <div className="flex items-center gap-3">
                            <button onClick={goToToday} className="text-xs font-semibold text-app-text-muted hover:text-primary transition-colors">Hoje</button>
                            <div className="flex items-center gap-1">
                                <button onClick={goToPrevMonth} className="p-1.5 rounded-full hover:bg-app-stroke/30 text-app-text-muted transition-colors"><ChevronLeft size={20} /></button>
                                <button onClick={goToNextMonth} className="p-1.5 rounded-full hover:bg-app-stroke/30 text-app-text-muted transition-colors"><ChevronRight size={20} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-app-bg p-1 rounded-lg border border-app-stroke shadow-sm">
                        {(['day', 'week', 'month', 'list'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5", 
                                    view === v ? "bg-primary text-white shadow-sm" : "text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/20"
                                )}
                            >
                                {v === 'list' && <List size={13} />}
                                {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : v === 'month' ? 'Mês' : 'Pauta'}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setShowFilterMenu(!showFilterMenu)}
                                className={clsx("p-2 border border-app-stroke rounded-lg transition-colors", typeFilter !== 'all' ? "text-primary bg-primary/10 border-primary/50" : "text-app-text-muted hover:text-app-text-main")}
                            >
                                <Filter size={16} />
                            </button>
                            {showFilterMenu && (
                                <div className="absolute right-0 top-10 z-50 w-40 bg-app-card border border-app-stroke rounded-lg shadow-xl py-1 animate-in fade-in slide-in-from-top-1">
                                    {EVENT_TYPES.map(t => (
                                        <button
                                            key={t.key}
                                            onClick={() => { setTypeFilter(t.key); setShowFilterMenu(false); }}
                                            className={clsx("w-full text-left px-3 py-2 text-xs transition-colors", typeFilter === t.key ? "bg-primary/10 text-primary" : "text-app-text-main hover:bg-app-stroke/30")}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsNewEventOpen(true)} className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
                            <Plus size={16} /> Novo Evento
                        </button>
                    </div>
                </div>

                {/* ⚠ FULL-WIDTH RED BANNER: Prazos Fatais */}
                {urgentDeadlines.length > 0 && (
                    <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white px-4 py-1.5 flex items-center gap-3 overflow-hidden shadow-md">
                        <div className="flex items-center gap-2 shrink-0">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider shrink-0">Prazos Fatais</span>
                        </div>
                        <div className="h-3 w-px bg-white/30 shrink-0" />
                        <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar no-scrollbar scrollbar-hide pb-0">
                            {urgentDeadlines.map(event => {
                                const eventDate = new Date(event.start);
                                const today = new Date();
                                const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                const dateLabel = diffDays === 0 ? 'HOJE' : diffDays === 1 ? 'AMANHÃ' : `${eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
                                return (
                                    <button
                                        key={event.id}
                                        onClick={() => {
                                            setSelectedDate(eventDate.getDate());
                                            setCurrentMonth(eventDate.getMonth());
                                            setCurrentYear(eventDate.getFullYear());
                                            setIsSidebarOpenMobile(true);
                                        }}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-[10px] font-semibold whitespace-nowrap hover:bg-white/20 transition-all"
                                    >
                                        <span className="font-extrabold">{dateLabel}</span>
                                        <span className="opacity-80">·</span>
                                        <span className="truncate max-w-[150px]">{event.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* User Avatar Filter Bar */}
                {teamMembers.length > 0 && (
                    <div className="px-4 py-2 border-b border-app-stroke bg-app-bg/50">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-app-text-muted font-medium shrink-0 uppercase tracking-wider">
                                <Users size={12} className="inline mr-1" /> Filtrar:
                            </span>
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setSelectedUserFilter('all')}
                                    className={clsx(
                                        "flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0",
                                        selectedUserFilter === 'all' ? "bg-primary text-white shadow-sm" : "bg-app-stroke/30 text-app-text-muted hover:bg-app-stroke/50"
                                    )}
                                >
                                    Todos
                                </button>
                                {teamMembers.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => setSelectedUserFilter(member.id)}
                                        className={clsx(
                                            "flex items-center gap-1.5 px-1.5 py-0.5 rounded-full transition-all shrink-0 border",
                                            selectedUserFilter === member.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-app-stroke/20"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0",
                                            member.role === 'ADMIN' ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-primary to-purple-600"
                                        )}>
                                            {member.avatar ? <img src={member.avatar} className="w-full h-full rounded-full object-cover" /> : member.name.charAt(0)}
                                        </div>
                                        <span className={clsx("text-[10px] font-medium hidden md:block", selectedUserFilter === member.id ? "text-primary" : "text-app-text-main")}>
                                            {member.name.split(' ')[0]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Monthly Stats Dashboard */}
                <div className="px-4 py-1.5 border-b border-app-stroke bg-app-bg/30 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-1.5 bg-blue-500/5 border border-blue-500/10 rounded-md px-2 py-1 shrink-0">
                        <Gavel size={12} className="text-blue-400" />
                        <span className="text-[11px] font-bold text-blue-400">{monthlyStats.hearings}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-red-500/5 border border-red-500/10 rounded-md px-2 py-1 shrink-0">
                        <AlertTriangle size={12} className="text-red-400" />
                        <span className="text-[11px] font-bold text-red-400">{monthlyStats.deadlines}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-md px-2 py-1 shrink-0">
                        <Users size={12} className="text-emerald-400" />
                        <span className="text-[11px] font-bold text-emerald-400">{monthlyStats.meetings}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-app-stroke/20 border border-app-stroke rounded-md px-2 py-1 shrink-0 ml-auto">
                        <CalendarIcon size={12} className="text-app-text-muted" />
                        <span className="text-[11px] font-bold text-app-text-main">{monthlyStats.total}</span>
                    </div>
                </div>

                {/* Calendar Content */}
                <div className="flex-1 flex flex-col min-h-0">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={view + currentMonth + currentYear}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="flex-1 flex flex-col min-h-0"
                        >
                            {view === 'month' && (
                                <div className="border border-app-stroke rounded-xl bg-app-bg overflow-hidden flex flex-col h-full">
                                    <div className="grid grid-cols-7 bg-app-card border-b border-app-stroke">
                                        {DAYS_SHORT.map(day => (
                                            <div key={day} className="text-center text-[10px] font-bold text-app-text-muted uppercase tracking-widest py-3 border-r border-app-stroke last:border-r-0">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                                        {calendarDays.map((day, idx) => {
                                            const dayEvents = day ? (eventsByDay.get(day) || []) : [];
                                            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
                                            const isSelected = day === selectedDate;
                                            
                                            // Sort events for the cell: uncompleted first, then by priority/time
                                            const sortedDayEvents = [...dayEvents].sort((a, b) => {
                                                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                                                return 0;
                                            });

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        if (day) {
                                                            setSelectedDate(day);
                                                            setIsSidebarOpenMobile(true);
                                                        }
                                                    }}
                                                    className={clsx(
                                                        "relative min-h-[100px] sm:min-h-[120px] p-1 border-r border-b border-app-stroke cursor-pointer transition-all hover:bg-app-stroke/5 group",
                                                        (idx + 1) % 7 === 0 && "border-r-0",
                                                        !day && "bg-app-stroke/5 pointer-events-none"
                                                    )}
                                                >
                                                    {day && (
                                                        <>
                                                            <div className="flex justify-end mb-1">
                                                                <span className={clsx(
                                                                    "w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full transition-all",
                                                                    isToday ? "bg-primary text-white shadow-sm ring-4 ring-primary/10" : 
                                                                    isSelected ? "bg-slate-200 dark:bg-slate-700 text-app-text-main" : 
                                                                    "text-app-text-muted group-hover:text-app-text-main"
                                                                )}>
                                                                    {day}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1 overflow-hidden">
                                                                {sortedDayEvents.slice(0, 4).map((event) => (
                                                                    <div 
                                                                        key={event.id}
                                                                        className={clsx(
                                                                            "text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border truncate transition-all",
                                                                            event.completed ? "opacity-40 grayscale italic line-through bg-slate-100 border-slate-200 text-slate-500" : 
                                                                            getEventColor(event.type, event.color).pillLight
                                                                        )}
                                                                    >
                                                                        {event.time && <span className="font-bold mr-1">{event.time}</span>}
                                                                        {event.title}
                                                                    </div>
                                                                ))}
                                                                {dayEvents.length > 4 && (
                                                                    <div className="text-[8px] font-bold text-app-text-muted text-center py-0.5 bg-app-stroke/20 rounded">
                                                                        + {dayEvents.length - 4} mais
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {view === 'week' && (
                                <div className="flex-1 flex flex-col border border-app-stroke rounded-xl bg-app-bg overflow-hidden relative min-h-0">
                                    {/* Header: Days */}
                                    <div className="grid grid-cols-[60px_1fr] border-b border-app-stroke bg-app-card sticky top-0 z-20 shrink-0">
                                        <div className="border-r border-app-stroke flex flex-col items-center justify-end pb-2">
                                            <span className="text-[10px] text-app-text-muted">GMT-3</span>
                                        </div>
                                        <div className="grid grid-cols-7">
                                            {weekDates.map((date, idx) => {
                                                const isToday = date.toDateString() === new Date().toDateString();
                                                const isSelected = date.getDate() === selectedDate && date.getMonth() === currentMonth;
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => {
                                                            setSelectedDate(date.getDate());
                                                            setIsSidebarOpenMobile(true);
                                                        }}
                                                        className={clsx(
                                                            "text-center py-2 border-r border-app-stroke border-b-4 cursor-pointer transition-colors", 
                                                            isToday ? "border-b-primary bg-primary/5" : isSelected ? "border-b-app-text-muted bg-app-stroke/10" : "border-b-transparent hover:bg-app-stroke/5"
                                                        )}
                                                    >
                                                        <p className={clsx("text-[10px] uppercase font-bold tracking-wider mb-0.5", isToday ? "text-primary" : "text-app-text-muted")}>{DAYS_SHORT[idx]}</p>
                                                        <p className={clsx("text-xl font-bold", isToday ? "text-primary" : "text-app-text-main")}>{date.getDate()}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* All Day Row */}
                                    <div className="grid grid-cols-[60px_1fr] border-b border-app-stroke bg-app-bg shrink-0">
                                        <div className="border-r border-app-stroke flex items-center justify-center p-1">
                                            <span className="text-[9px] text-app-text-muted text-center leading-tight">Dia<br/>todo</span>
                                        </div>
                                        <div className="grid grid-cols-7">
                                            {weekDates.map((_, idx) => (
                                                <div key={idx} className="border-r border-app-stroke min-h-[30px] p-1">
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time Grid (Scrollable) */}
                                    <div 
                                        ref={(el) => {
                                            if (el && !weekScrollRef.current) {
                                                el.scrollTop = 480;
                                            }
                                            weekScrollRef.current = el;
                                        }} 
                                        className="flex-1 overflow-y-auto custom-scrollbar relative"
                                    >
                                        <div className="grid grid-cols-[60px_1fr] min-h-[1440px]">
                                            {/* Time Axis */}
                                            <div className="border-r border-app-stroke bg-app-card relative z-10">
                                                {Array.from({ length: 24 }).map((_, hour) => (
                                                    <div key={hour} className="h-[60px] relative pointer-events-none">
                                                        <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-app-text-muted bg-app-card px-1 shadow-sm">
                                                            {hour.toString().padStart(2, '0')}:00
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Grid Content */}
                                            <div className="grid grid-cols-7 relative">
                                                {/* Lines */}
                                                {Array.from({ length: 24 }).map((_, hour) => (
                                                    <div key={`line-${hour}`} className="absolute w-full h-[1px] bg-app-stroke pointer-events-none z-0" style={{ top: `${hour * 60}px` }} />
                                                ))}
                                                
                                                {/* Vertical Columns */}
                                                {weekDates.map((date, dayIdx) => {
                                                    const dayEvents = filteredEvents.filter(e => {
                                                        const eDate = new Date(e.start);
                                                        return eDate.getDate() === date.getDate() && eDate.getMonth() === date.getMonth() && eDate.getFullYear() === date.getFullYear();
                                                    });

                                                    return (
                                                        <div key={dayIdx} className="relative border-r border-app-stroke h-full">
                                                            {dayEvents.map(event => {
                                                                const start = new Date(event.start);
                                                                const end = new Date(event.end || event.start);
                                                                const startHour = start.getHours() + start.getMinutes() / 60;
                                                                const endHour = end.getHours() + end.getMinutes() / 60;
                                                                const duration = Math.max(0.5, endHour - startHour);
                                                                const topOffset = startHour * 60;
                                                                const heightPixels = duration * 60;

                                                                const eventStyles = getEventColor(event.type, event.color);
                                                                return (
                                                                    <div 
                                                                        key={event.id}
                                                                        onClick={(e) => handleViewClick(event, e)}
                                                                        className={clsx(
                                                                            "absolute left-1 right-1 rounded-lg p-2 overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-white/50 shadow-md group border-l-4",
                                                                            event.completed ? "bg-app-stroke/40 border-l-slate-400 grayscale" : 
                                                                            eventStyles.pillLight.replace('text-', 'text-opacity-90 text-').replace('border-', 'border-l-') // Ensure border-l is prominent
                                                                        )}
                                                                        style={{ 
                                                                            top: `${topOffset}px`, 
                                                                            height: `${heightPixels}px`, 
                                                                            minHeight: '28px',
                                                                            borderLeftColor: !event.completed ? (eventStyles.dot.split('-')[1] === 'blue' ? '#3b82f6' : eventStyles.dot.split('-')[1] === 'red' ? '#ef4444' : eventStyles.dot.split('-')[1] === 'emerald' ? '#10b981' : eventStyles.dot.split('-')[1] === 'purple' ? '#a855f7' : '#64748b') : undefined
                                                                        }}
                                                                    >
                                                                        <div className="flex justify-between items-start gap-1">
                                                                            <span className={clsx("font-bold text-[9px] leading-tight truncate", event.completed ? "line-through text-app-text-muted" : "text-app-text-main")}>
                                                                                {event.time} 
                                                                            </span>
                                                                        </div>
                                                                        <div className={clsx("text-[10px] font-semibold leading-tight line-clamp-2 truncate", event.completed ? "text-app-text-muted" : "text-app-text-main")}>
                                                                            {event.title}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {view === 'day' && (
                                <div className="space-y-2">
                                    <div className="text-center py-4 border-b border-app-stroke mb-4">
                                        <p className="text-sm text-app-text-muted">{DAYS[(new Date(currentYear, currentMonth, selectedDate).getDay() + 6) % 7]}</p>
                                        <p className="text-3xl font-bold text-app-text-main">{selectedDate}</p>
                                        <p className="text-sm text-app-text-muted capitalize">{getMonthName(currentMonth)} {currentYear}</p>
                                    </div>
                                    {todaysEvents.length === 0 ? (
                                        <div className="text-center py-12 text-app-text-muted">
                                            <CalendarIcon size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>Nenhum evento para este dia.</p>
                                        </div>
                                    ) : (
                                        todaysEvents.map(event => (
                                            <div key={event.id} className={clsx("group flex items-start gap-3 p-4 rounded-xl border transition-all", event.completed ? "bg-app-stroke/10 border-app-stroke" : "bg-app-bg border-app-stroke hover:border-primary/50")}>
                                                <button onClick={() => toggleEventCompleted(event)} className={clsx("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors mt-1", event.completed ? "bg-green-500 border-green-500 text-white" : "border-app-text-muted hover:border-primary")}>
                                                    {event.completed && <Check size={14} />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", getEventColor(event.type, event.color).badge)}>{getEventColor(event.type, event.color).label}</span>
                                                        <span className="text-xs text-app-text-muted shrink-0">{event.time}</span>
                                                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto hidden sm:inline-block shrink-0", PRIORITY_STYLES[event.priority || 'MEDIUM'].bg, PRIORITY_STYLES[event.priority || 'MEDIUM'].text)}>
                                                            {PRIORITY_STYLES[event.priority || 'MEDIUM'].label}
                                                        </span>
                                                    </div>
                                                    <h4 className={clsx("font-medium truncate", event.completed ? "text-app-text-muted line-through" : "text-app-text-main")}>{event.title}</h4>
                                                    {event.description && <p className="text-xs text-app-text-muted mt-1 max-w-2xl line-clamp-2">{event.description}</p>}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button onClick={(e) => handleEditClick(event, e)} className="p-2 text-app-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={(e) => handleDeleteEvent(event.id, e)} className="p-2 text-app-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {view === 'list' && (
                                <div className="space-y-4">
                                    {/* Astrea-style Full Continuous Pauta Layout */}
                                    {listViewEvents.length === 0 ? (
                                        <div className="text-center py-12 text-app-text-muted bg-app-card border border-app-stroke rounded-2xl">
                                            <List size={48} className="mx-auto mb-3 opacity-20" />
                                            <p className="font-semibold text-lg">Sua pauta está livre!</p>
                                            <p className="text-sm">Nenhum compromisso marcado para este mês.</p>
                                        </div>
                                    ) : (
                                        Object.entries(
                                            listViewEvents.reduce((acc, event) => {
                                                const dateKey = new Date(event.start).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
                                                if (!acc[dateKey]) acc[dateKey] = [];
                                                acc[dateKey].push(event);
                                                return acc;
                                            }, {} as Record<string, Event[]>)
                                        ).map(([dateStr, dayEvents]) => (
                                            <div key={dateStr} className="mb-6">
                                                <h3 className="text-sm font-extrabold text-app-text-muted uppercase tracking-wider mb-3 px-1 border-b border-app-stroke pb-1 sticky top-0 bg-app-card/90 backdrop-blur z-10">{dateStr}</h3>
                                                <div className="space-y-2">
                                                    {dayEvents.map(event => {
                                                        const isConflict = conflictIds.has(event.id);
                                                        const isPast = new Date(event.start).getTime() < Date.now();
                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className={clsx(
                                                                    "group flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center p-3 sm:p-4 rounded-xl border-l-[6px] border border-app-stroke transition-all cursor-pointer shadow-sm hover:shadow-md relative overflow-hidden",
                                                                    event.completed ? "bg-app-stroke/20 opacity-60 grayscale border-l-slate-400" :
                                                                        "bg-white dark:bg-slate-800",
                                                                    !event.completed && event.color === 'red' ? "border-l-red-500 bg-red-50/50 dark:bg-red-500/10" :
                                                                    !event.completed && event.color === 'blue' ? "border-l-blue-500 bg-blue-50/50 dark:bg-blue-500/10" :
                                                                    !event.completed && event.color === 'green' ? "border-l-green-500 bg-green-50/50 dark:bg-green-500/10" :
                                                                    !event.completed && event.color === 'amber' ? "border-l-amber-500 bg-amber-50/50 dark:bg-amber-500/10" :
                                                                    !event.completed && event.color === 'purple' ? "border-l-purple-500 bg-purple-50/50 dark:bg-purple-500/10" :
                                                                    !event.completed && event.type === 'hearing' ? "border-l-blue-500" :
                                                                        !event.completed && event.type === 'deadline' ? "border-l-red-500" :
                                                                            !event.completed && event.type === 'meeting' ? "border-l-emerald-500" : "border-l-purple-500",
                                                                    isConflict && !event.completed && "ring-2 ring-red-500 animate-[pulse_2s_ease-in-out_infinite] bg-amber-50/50 dark:bg-amber-900/10",
                                                                    isPast && !event.completed && "opacity-80",
                                                                    ['deadline', 'hearing'].includes(event.type) && !event.completed && "pt-7 sm:pt-6"
                                                                )}
                                                                onClick={(e) => handleViewClick(event, e)}
                                                            >
                                                                {/* Red Highlight Banner */}
                                                                {['deadline', 'hearing'].includes(event.type) && !event.completed && (
                                                                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[9px] sm:text-[10px] font-bold uppercase text-center py-0.5 shadow-sm z-10 tracking-widest bg-gradient-to-r from-red-600 to-red-500">
                                                                        Atenção: {event.type === 'deadline' ? 'Prazo Fatal' : 'Audiência'}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                                                                    <button onClick={(e) => { e.stopPropagation(); toggleEventCompleted(event); }} className={clsx("w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors", event.completed ? "bg-green-500 border-green-500 text-white" : "border-app-text-muted hover:border-primary bg-app-bg")}>
                                                                        {event.completed && <Check size={14} strokeWidth={3} />}
                                                                    </button>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-black text-lg text-app-text-main leading-none">{event.time}</span>
                                                                        <span className={clsx(
                                                                            "text-[10px] font-bold tracking-wider uppercase mt-1",
                                                                            getEventColor(event.type, event.color).badge.split(' ')[1] // Get the text color class from badge
                                                                        )}>
                                                                            {getEventColor(event.type, event.color).label}
                                                                        </span>
                                                                    </div>
                                                                    {isConflict && !event.completed && (
                                                                        <div title="Conflito de horários" className="ml-auto sm:ml-2 text-amber-500 bg-amber-500/10 p-1.5 rounded-lg">
                                                                            <AlertTriangle size={16} />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1 min-w-0 flex flex-col sm:border-l sm:border-app-stroke sm:pl-4">
                                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                        <h4 className={clsx("text-base font-bold truncate", event.completed ? "line-through text-app-text-muted" : "text-app-text-main")}>{event.title}</h4>
                                                                        {event.priority === 'URGENT' && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md animate-pulse">URGENTE</span>}
                                                                    </div>
                                                                    
                                                                    {(event.clientName || event.processNumber) && (
                                                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                                                                            {event.clientName && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setDrawerEntity({ type: 'client', clientId: event.clientId, title: `Cliente: ${event.clientName}` }); }}
                                                                                    className="flex items-center gap-1.5 text-xs text-app-text-main font-medium bg-app-stroke/30 hover:bg-app-stroke/50 px-2 py-1 rounded-md transition-colors"
                                                                                >
                                                                                    <Users size={12} className="text-app-text-muted" /> {event.clientName}
                                                                                </button>
                                                                            )}
                                                                            {event.processNumber && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setDrawerEntity({ type: 'process', processId: event.processId, processNumber: event.processNumber, title: `Processo: ${event.processNumber}` }); }}
                                                                                    className="flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors"
                                                                                >
                                                                                    <FileText size={12} /> {event.processNumber}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {event.location && <p className="text-xs text-app-text-muted flex items-center gap-1 mt-1.5"><MapPin size={12} className="shrink-0" />{event.location}</p>}
                                                                </div>
                                                                
                                                                <div className="flex flex-row sm:flex-col gap-1 items-end ml-auto shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                                                                    {event.assignees && event.assignees.length > 0 && (
                                                                        <div className="flex -space-x-2 mr-3 sm:mr-0 sm:mb-2" title={event.assignees.map(a => a.userName).join(', ')}>
                                                                            {event.assignees.slice(0, 3).map((assignee, i) => (
                                                                                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                                                                    {assignee.userName.charAt(0).toUpperCase()}
                                                                                </div>
                                                                            ))}
                                                                            {event.assignees.length > 3 && (
                                                                                <div className="w-6 h-6 rounded-full bg-app-stroke border-2 border-white dark:border-slate-800 flex items-center justify-center text-[9px] font-bold text-app-text-main shrink-0">
                                                                                    +{event.assignees.length - 3}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                        <button onClick={(e) => handleEditClick(event, e)} className="p-2 text-app-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Editar"><Edit3 size={16} /></button>
                                                                        <button onClick={(e) => handleDeleteEvent(event.id, e)} className="p-2 text-app-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>


                </div>
            </main>

            {/* Sidebar Desktop e Mobile Actions */}
            <aside className={clsx(
                "fixed inset-y-0 right-0 z-[60] w-[85vw] max-w-sm sm:relative sm:w-full md:w-72 bg-app-card border-l sm:border sm:rounded-2xl flex flex-col shrink-0 shadow-2xl sm:shadow-none transition-transform duration-300 ease-in-out border-app-stroke",
                isSidebarOpenMobile ? "translate-x-0" : "translate-x-full sm:translate-x-0"
            )}>
                <div className="p-4 border-b border-app-stroke">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex space-x-1 bg-app-bg p-1 rounded-lg border border-app-stroke w-full">
                            <button
                                onClick={() => setSidebarTab('DIA')}
                                className={clsx("flex-1 px-2 py-1.5 rounded text-[11px] font-semibold transition-colors truncate", sidebarTab === 'DIA' ? "bg-primary text-white shadow-sm" : "text-app-text-muted hover:text-app-text-main")}
                            >
                                Agenda do Dia
                            </button>
                            <button
                                onClick={() => setSidebarTab('PRAZOS')}
                                className={clsx("flex-1 px-2 py-1.5 rounded text-[11px] font-semibold transition-colors truncate", sidebarTab === 'PRAZOS' ? "bg-primary text-white shadow-sm" : "text-app-text-muted hover:text-app-text-main")}
                            >
                                Próximos Prazos
                            </button>
                        </div>
                        <button
                            className="sm:hidden ml-2 p-1 bg-app-bg rounded-lg shrink-0"
                            onClick={() => setIsSidebarOpenMobile(false)}
                        >
                            <X size={18} className="text-app-text-muted" />
                        </button>
                    </div>

                    {sidebarTab === 'DIA' && (
                        <div className="flex items-center gap-2 text-app-text-main">
                            <CalendarIcon size={18} className="text-primary shrink-0" />
                            <span className="font-bold text-sm truncate">{selectedDate} de {getMonthName(currentMonth)}</span>
                        </div>
                    )}
                    {sidebarTab === 'PRAZOS' && (
                        <div className="flex items-center justify-between gap-1 mt-1 bg-app-bg p-1 rounded-lg border border-app-stroke">
                            {(['ATIVO', 'SUSPENSO', 'FINALIZADO'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setAsideFilter(status)}
                                    className={clsx("flex-1 px-1 py-1 rounded text-[10px] font-bold transition-colors", asideFilter === status ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-app-text-muted hover:text-app-text-main")}
                                >
                                    {status === 'ATIVO' ? 'Ativos' : status === 'SUSPENSO' ? 'Suspensos' : 'Finalizados'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {sidebarTab === 'DIA' ? (
                        todaysEvents.length > 0 ? todaysEvents.map(event => (
                        <div key={event.id} className={clsx("group rounded-xl p-3 transition-all", event.completed ? "bg-app-stroke/10 border border-app-stroke opacity-75" : "bg-app-bg border border-app-stroke hover:border-primary/30 hover:shadow-md")}>
                            {/* Colored top accent */}
                            <div className={clsx("h-0.5 -mx-3 -mt-3 mb-3 rounded-t-xl", event.type === 'PRAZO_FATAL' ? 'bg-red-500' : event.type === 'AUDIENCIA' ? 'bg-amber-500' : event.type === 'PRAZO' ? 'bg-orange-400' : 'bg-primary')} />
                            <div className="flex items-center gap-2 mb-2">
                                <button onClick={() => toggleEventCompleted(event)} className="shrink-0">
                                    <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors hover:border-primary", event.completed ? "bg-green-500 border-green-500 text-white" : "border-app-text-muted")}>
                                        {event.completed && <Check size={12} />}
                                    </div>
                                </button>
                                <span className="text-xs text-app-text-muted truncate">{event.time}</span>
                                <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium truncate ml-auto", getEventColor(event.type).badge)}>{getEventColor(event.type).label}</span>
                            </div>
                            <h4 className={clsx("text-sm font-medium mb-1 line-clamp-2", event.completed ? "text-app-text-muted line-through" : "text-app-text-main")}>{event.title}</h4>

                            {event.description && <p className="text-xs text-app-text-muted line-clamp-2 mb-1.5">{event.description}</p>}
                            {event.location && <p className="text-[10px] text-app-text-muted flex items-center gap-1 mb-1.5"><MapPin size={10} />{event.location}</p>}

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-app-stroke/50">
                                <div className="flex items-center gap-2">
                                    <span className={clsx("text-[9px] px-1.5 py-0.5 rounded-full font-medium", PRIORITY_STYLES[event.priority || 'MEDIUM'].bg, PRIORITY_STYLES[event.priority || 'MEDIUM'].text)}>
                                        {PRIORITY_STYLES[event.priority || 'MEDIUM'].label}
                                    </span>
                                    {conflictIds.has(event.id) && (
                                        <div title="Conflito de horário" className="text-amber-500 bg-amber-500/10 p-0.5 rounded">
                                            <AlertTriangle size={12} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => handleEditClick(event, e)} className="p-1 text-app-text-muted hover:text-primary rounded-md transition-colors" title="Editar">
                                        <Edit3 size={14} />
                                    </button>
                                    <button onClick={(e) => handleDeleteEvent(event.id, e)} className="p-1 text-app-text-muted hover:text-red-500 rounded-md transition-colors" title="Excluir">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-app-text-muted">
                            <CalendarIcon size={32} className="mx-auto mb-2 opacity-20" />
                            <p>Sem eventos para este dia.</p>
                        </div>
                    )) : (
                        upcomingEventsSidebar.length > 0 ? upcomingEventsSidebar.map(event => {
                            const eventDate = new Date(event.start);
                            const now = new Date();
                            const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            const urgencyColor = diffDays <= 2 ? 'text-red-500 bg-red-500/10' : diffDays <= 5 ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';
                            const urgencyBorder = diffDays <= 2 ? 'bg-red-500' : diffDays <= 5 ? 'bg-amber-500' : 'bg-emerald-500';
                            return (
                            <div key={'pz_'+event.id} className={clsx("group rounded-xl p-3 transition-all", event.completed ? "bg-app-stroke/10 border border-app-stroke opacity-75" : "bg-app-bg border border-app-stroke hover:border-primary/30 hover:shadow-md")}>
                                {/* Urgency top accent */}
                                <div className={clsx("h-0.5 -mx-3 -mt-3 mb-3 rounded-t-xl", urgencyBorder)} />
                                <div className="flex items-center gap-2 mb-2">
                                    <button onClick={() => toggleEventCompleted(event)} className="shrink-0">
                                        <div className={clsx("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors hover:border-primary", event.completed ? "bg-green-500 border-green-500 text-white" : "border-app-text-muted")}>
                                            {event.completed && <Check size={12} />}
                                        </div>
                                    </button>
                                    <span className="text-xs text-app-text-muted font-medium truncate">{new Date(event.start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                    {/* Time remaining badge */}
                                    <span className={clsx("text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-auto shrink-0", urgencyColor)}>
                                        {diffDays <= 0 ? 'Hoje' : diffDays === 1 ? 'Amanhã' : `${diffDays}d restantes`}
                                    </span>
                                </div>
                                <h4 className={clsx("text-sm font-medium mb-1 line-clamp-2", event.completed ? "text-app-text-muted line-through" : "text-app-text-main")}>{event.title}</h4>
                                <div className="flex items-center gap-2">
                                    <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-medium", getEventColor(event.type).badge)}>{getEventColor(event.type).label}</span>
                                    {event.processNumber && <span className="text-[10px] font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5">{event.processNumber}</span>}
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-app-stroke/50">
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                        <button onClick={(e) => handleEditClick(event, e)} className="p-1 text-app-text-muted hover:text-primary rounded-md transition-colors" title="Editar">
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            );
                        }) : (
                            <div className="text-center py-8 text-app-text-muted">
                                <AlertTriangle size={32} className="mx-auto mb-2 opacity-20" />
                                <p>Sem prazos pendentes encontrados.</p>
                            </div>
                        )
                    )}
                </div>

                <div className="p-4 border-t border-app-stroke">
                    <button onClick={() => setIsNewEventOpen(true)} className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] flex items-center justify-center gap-2">
                        <Plus size={16} />
                        Adicionar Evento
                    </button>
                </div>
            </aside>

            {/* Quick View Modal */}
            <Modal
                isOpen={!!viewingEvent}
                onClose={() => setViewingEvent(null)}
                title="Detalhes do Evento"
                footer={
                    <>
                        <button onClick={() => setViewingEvent(null)} className="px-5 py-2 border border-app-stroke rounded-lg text-sm font-medium text-app-text-muted hover:bg-app-stroke/30 transition-colors">Fechar</button>
                        <button onClick={() => viewingEvent && handleEditClick(viewingEvent)} className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-white flex items-center gap-2 hover:bg-primary/90 transition-colors">
                            <Edit3 size={16} /> Editar
                        </button>
                    </>
                }
            >
                {viewingEvent && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-app-stroke">
                            <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", getEventColor(viewingEvent.type, viewingEvent.color).badge)}>
                                {viewingEvent.type === 'deadline' ? <AlertTriangle size={24} /> : viewingEvent.type === 'hearing' ? <MessageSquare size={24} /> : <CalendarIcon size={24} />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-app-text-main leading-tight">{viewingEvent.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", getEventColor(viewingEvent.type, viewingEvent.color).badge)}>{getEventColor(viewingEvent.type, viewingEvent.color).label}</span>
                                    {viewingEvent.completed && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">Concluído</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-app-text-muted uppercase font-bold tracking-wider mb-1">Início</p>
                                <p className="text-sm font-medium text-app-text-main">{new Date(viewingEvent.start).toLocaleString('pt-BR')}</p>
                            </div>
                            {viewingEvent.end && (
                                <div>
                                    <p className="text-xs text-app-text-muted uppercase font-bold tracking-wider mb-1">Fim</p>
                                    <p className="text-sm font-medium text-app-text-main">{new Date(viewingEvent.end).toLocaleString('pt-BR')}</p>
                                </div>
                            )}
                        </div>

                        {viewingEvent.description && (
                            <div>
                                <p className="text-xs text-app-text-muted uppercase font-bold tracking-wider mb-1">Descrição</p>
                                <div className="p-3 bg-app-bg rounded-lg border border-app-stroke text-sm text-app-text-main whitespace-pre-wrap">
                                    {viewingEvent.description}
                                </div>
                            </div>
                        )}

                        {(viewingEvent.clientName || viewingEvent.processNumber) && (
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-app-stroke">
                                {viewingEvent.clientName && (
                                    <div>
                                        <p className="text-xs text-app-text-muted uppercase font-bold tracking-wider mb-1">Cliente</p>
                                        <p className="text-sm font-medium text-app-text-main">{viewingEvent.clientName}</p>
                                    </div>
                                )}
                                {viewingEvent.processNumber && (
                                    <div>
                                        <p className="text-xs text-app-text-muted uppercase font-bold tracking-wider mb-1">Processo</p>
                                        <p className="text-sm font-medium text-app-text-main">{viewingEvent.processNumber}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {viewingEvent.location && (
                            <div className="pt-4 border-t border-app-stroke">
                                <p className="text-xs text-app-text-muted uppercase font-bold tracking-wider mb-1">Localização</p>
                                <p className="text-sm font-medium text-app-text-main">{viewingEvent.location}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal 
                isOpen={isNewEventOpen} 
                onClose={() => setIsNewEventOpen(false)} 
                title={editingEvent ? "Editar Evento" : "Novo Evento"}
                footer={<>
                    <button onClick={() => setIsNewEventOpen(false)} className="px-5 py-2 border border-app-stroke rounded-lg text-sm font-medium text-app-text-muted hover:bg-app-stroke/30 transition-colors">Cancelar</button>
                    <button onClick={handleCreateEvent} disabled={isLoading} className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {isLoading ? 'Salvando...' : 'Salvar Evento'}
                    </button>
                </>}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Título *</label>
                        <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Ex: Reunião com cliente" className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Início *</label>
                            <input type="datetime-local" value={newEvent.start} onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })} className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Fim</label>
                            <input type="datetime-local" value={newEvent.end} onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })} className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Tipo</label>
                            <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })} className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors">
                                <option value="hearing">Audiência</option>
                                <option value="deadline">Prazo Fatal</option>
                                <option value="meeting">Reunião</option>
                                <option value="personal">Pessoal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Prioridade</label>
                            <select value={newEvent.priority} onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })} className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors">
                                <option value="LOW">Baixa</option>
                                <option value="MEDIUM">Média</option>
                                <option value="HIGH">Alta</option>
                                <option value="URGENT">Urgente</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Status</label>
                            <select value={newEvent.status} onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })} className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors">
                                <option value="ATIVO">Ativo</option>
                                <option value="SUSPENSO">Suspenso</option>
                                <option value="FINALIZADO">Finalizado</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Cor de Destaque</label>
                            <div className="flex items-center gap-2 mt-2">
                                {['red', 'blue', 'green', 'amber', 'purple', 'gray'].map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewEvent({ ...newEvent, color })}
                                        className={clsx(
                                            "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                                            color === 'red' ? 'bg-red-500' : color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : color === 'amber' ? 'bg-amber-500' : color === 'purple' ? 'bg-purple-500' : 'bg-gray-500',
                                            newEvent.color === color ? "border-primary dark:border-white scale-110" : "border-transparent"
                                        )}
                                        title={`Cor ${color}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">
                            <MapPin size={14} className="inline mr-1" /> Local
                        </label>
                        <input type="text" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Ex: Sala de Reuniões, Fórum Central" className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors" />
                    </div>

                        <div className="pt-2 border-t border-app-stroke grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2 text-primary">
                                <Users size={14} className="inline mr-1" /> Cliente Vinculado
                            </label>
                            {isQuickAddClient ? (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        autoFocus
                                        placeholder="Nome do novo cliente..." 
                                        value={quickAddClientName} 
                                        onChange={e => setQuickAddClientName(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleQuickAddClient())}
                                        className="flex-1 bg-app-bg border border-app-stroke rounded-lg px-4 py-2 text-app-text-main focus:border-primary outline-none transition-colors"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleQuickAddClient} 
                                        disabled={isCreatingClient || !quickAddClientName.trim()} 
                                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        {isCreatingClient ? '...' : 'Salvar'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsQuickAddClient(false)} 
                                        className="px-3 py-2 bg-app-stroke/30 text-app-text-main rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select
                                        value={newEvent.clientId || ''}
                                        onChange={(e) => {
                                            const cId = e.target.value;
                                            const cName = clients.find(c => c.id === cId)?.name || '';
                                            setNewEvent({ ...newEvent, clientId: cId, clientName: cName });
                                        }}
                                        className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2 text-app-text-main focus:border-primary outline-none transition-colors"
                                    >
                                        <option value="">Nenhum cliente</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsQuickAddClient(true)} 
                                        className="px-4 py-2 bg-app-stroke/30 text-app-text-main rounded-lg hover:bg-app-stroke/50 text-sm font-medium flex items-center gap-1 transition-colors"
                                        title="Cadastrar cliente rápido"
                                    >
                                        <Plus size={16} /> <span className="hidden xl:inline">Novo</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2 text-primary">
                                <FileText size={14} className="inline mr-1" /> N° Processo Vinculado
                            </label>
                            <input
                                type="text"
                                value={newEvent.processNumber || ''}
                                onChange={(e) => setNewEvent({ ...newEvent, processNumber: e.target.value })}
                                placeholder="Ex: 1234567-89.2023.8.26.0000"
                                className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2 text-app-text-main focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">
                            <Bell size={14} className="inline mr-1" /> Lembrar em
                        </label>
                        <select value={newEvent.reminderMinutes} onChange={(e) => setNewEvent({ ...newEvent, reminderMinutes: parseInt(e.target.value) })} className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors">
                            <option value={30}>30 minutos antes</option>
                            <option value={60}>1 hora antes</option>
                            <option value={120}>2 horas antes</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">
                            <Users size={14} className="inline mr-1" /> Participantes
                        </label>
                        <div className="border border-app-stroke rounded-lg max-h-[150px] overflow-y-auto p-2 bg-app-bg">
                            {teamMembers.length === 0 ? (
                                <p className="text-xs text-app-text-muted text-center py-2">Carregando membros da equipe...</p>
                            ) : (
                                teamMembers.map(member => (
                                    <label key={member.id} className="flex items-center gap-2 p-2 hover:bg-app-stroke/30 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newEvent.assigneeIds.includes(member.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setNewEvent({ ...newEvent, assigneeIds: [...newEvent.assigneeIds, member.id] });
                                                } else {
                                                    setNewEvent({ ...newEvent, assigneeIds: newEvent.assigneeIds.filter(id => id !== member.id) });
                                                }
                                            }}
                                            className="accent-primary w-4 h-4"
                                        />
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm text-app-text-main block truncate">{member.name}</span>
                                            <span className="text-[10px] text-app-text-muted">{member.role}</span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        {newEvent.assigneeIds.length > 0 && (
                            <p className="text-xs text-primary mt-1">{newEvent.assigneeIds.length} participante(s) selecionado(s)</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Descrição</label>
                        <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Detalhes do evento..." className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors h-20 resize-none" />
                    </div>

                    {/* Preparation Checklist */}
                    {editingEvent && (
                        <div className="pt-2 border-t border-app-stroke">
                            <label className="block text-sm font-medium text-app-text-main mb-2 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-primary" />
                                Checklist de Preparação
                            </label>

                            <div className="mb-3 space-y-2">
                                {editingEvent.checklistItems?.map(item => (
                                    <div key={item.id} className="flex items-start gap-2 group">
                                        <button
                                            onClick={() => handleToggleChecklistItem(item.id)}
                                            className={clsx("mt-0.5 shrink-0 transition-colors", item.completed ? "text-green-500" : "text-app-text-muted hover:text-primary")}
                                        >
                                            {item.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                        </button>
                                        <span className={clsx("flex-1 text-sm pt-0.5", item.completed ? "text-app-text-muted line-through" : "text-app-text-main")}>
                                            {item.text}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteChecklistItem(item.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-app-text-muted hover:text-red-500 transition-all rounded"
                                            title="Excluir item"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(!editingEvent.checklistItems || editingEvent.checklistItems.length === 0) && (
                                    <p className="text-xs text-app-text-muted italic">Nenhum item na checklist.</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={newChecklistItemText}
                                    onChange={(e) => setNewChecklistItemText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddChecklistItem(editingEvent.id);
                                        }
                                    }}
                                    placeholder="Adicionar novo item de preparação..."
                                    className="flex-1 bg-app-bg border border-app-stroke rounded-lg px-3 py-1.5 text-sm text-app-text-main focus:border-primary outline-none transition-colors"
                                />
                                <button
                                    onClick={() => handleAddChecklistItem(editingEvent.id)}
                                    disabled={!newChecklistItemText.trim()}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Contextual Context Drawer */}
            <Drawer 
                isOpen={!!drawerEntity} 
                onClose={() => setDrawerEntity(null)} 
                title={drawerEntity?.title || 'Detalhes'}
                position="right"
                size="xl"
            >
                {drawerEntity && (
                    <div className="h-full bg-slate-50 dark:bg-slate-950 -m-6 h-[calc(100%+3rem)] overflow-y-auto">
                        {drawerEntity.type === 'client' && drawerEntity.clientId ? (
                            <ClientDetailPageContent clientIdProp={drawerEntity.clientId} isDrawer={true} />
                        ) : drawerEntity.type === 'process' && (drawerEntity.processId || drawerEntity.processNumber) ? (
                            <ProcessDetailPageContent processIdProp={drawerEntity.processId} isDrawer={true} />
                        ) : (
                            <div className="text-app-text-main text-sm">
                                <div className="flex flex-col items-center justify-center p-10 opacity-70">
                                    {drawerEntity.type === 'client' ? <Users size={56} className="mb-4 text-primary" /> : <FileText size={56} className="mb-4 text-primary" />}
                                    <p className="text-center font-bold text-lg">
                                        Referência Não Encontrada
                                    </p>
                                    <p className="text-sm mt-3 text-center max-w-xs text-app-text-muted">
                                        Não foi possível carregar os detalhes. Faltam parâmetros de identificação.<br/><br/>
                                        <span className="text-xs bg-app-stroke/30 px-2 py-1 rounded-md text-app-text-main">
                                            ID: {drawerEntity.type === 'client' ? drawerEntity.clientId || 'N/A' : drawerEntity.processId || drawerEntity.processNumber || 'N/A'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
}
