import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter, Bell, X, Check, Circle, CheckCircle2, Users, MapPin, Trash2, Edit3, List, AlertTriangle, Gavel, FileText, MessageSquare, Eye, SidebarOpen, SidebarClose } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../../components/ui/Avatar';
import { ClientDetailPageContent } from '../clients/ClientDetailPage';
import { ProcessDetailPageContent } from '../processes/ProcessDetailPage';
import { EventDetailModal } from '../../components/agenda/EventDetailModal';
import { haptics } from '../../utils/haptics';

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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

    const handleAddChecklistItem = async (eventId: string) => {
        if (!newChecklistItemText.trim()) return;
        try {
            const res = await api.post(`/agenda/${eventId}/checklist`, { text: newChecklistItemText });
            if (editingEvent && editingEvent.id === eventId) {
                setEditingEvent({
                    ...editingEvent,
                    checklistItems: [...(editingEvent.checklistItems || []), res.data]
                });
            }
            setNewChecklistItemText('');
            fetchEvents();
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            addToast('Erro ao adicionar item ao checklist', 'error');
        }
    };

    const handleToggleChecklistItem = async (itemId: string) => {
        try {
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
            console.error('Erro ao alternar item:', error);
            fetchEvents();
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
        <div className={clsx(
            "flex flex-col md:flex-row h-[calc(100dvh-140px)] min-h-[650px] md:min-h-0 md:h-full w-full p-2 sm:p-4 bg-app-bg overflow-hidden transition-all duration-500",
            isSidebarCollapsed ? "gap-4 sm:gap-0" : "gap-4"
        )}>
            {notification && <NotificationToast event={notification} onDismiss={() => setNotification(null)} />}

            {/* Main Calendar Area */}
            <main className="flex-1 bg-app-card border border-app-stroke rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm transition-all duration-500">

                {/* Premium Header */}
                <div className="p-5 border-b border-app-stroke/50 bg-app-card/30 backdrop-blur-md flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex-1 flex items-center justify-between w-full">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-black text-app-text-main capitalize tracking-tight flex items-center gap-2">
                                <CalendarIcon className="text-primary" size={24} />
                                {getMonthName(currentMonth)} <span className="text-app-text-muted font-light">{currentYear}</span>
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Sincronizado</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={goToToday} className="px-4 py-1.5 rounded-xl border border-app-stroke text-[10px] font-black text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 transition-all uppercase tracking-widest">Hoje</button>
                            <div className="flex items-center bg-app-stroke/20 p-1 rounded-2xl border border-app-stroke/50">
                                <button onClick={goToPrevMonth} className="p-2 rounded-xl hover:bg-app-card text-app-text-muted hover:text-app-text-main transition-all"><ChevronLeft size={20} /></button>
                                <button onClick={goToNextMonth} className="p-2 rounded-xl hover:bg-app-card text-app-text-muted hover:text-app-text-main transition-all"><ChevronRight size={20} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="flex items-center gap-1 bg-app-stroke/30 p-1.5 rounded-2xl border border-app-stroke/50 shadow-inner w-full sm:w-auto">
                            {(['day', 'week', 'month', 'list'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => { setView(v); }}
                                    className={clsx(
                                        "flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-tighter", 
                                        view === v ? "bg-black dark:bg-white text-white dark:text-black shadow-xl" : "text-app-text-muted hover:text-app-text-main"
                                    )}
                                >
                                    {v === 'list' ? 'Pauta' : v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none" ref={filterRef}>
                                <button
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                    className={clsx("w-full sm:w-auto p-3 border border-app-stroke rounded-2xl transition-all shadow-sm hover:shadow-md", typeFilter !== 'all' ? "text-primary bg-primary/10 border-primary/50" : "bg-app-card text-app-text-muted hover:text-app-text-main")}
                                >
                                    <Filter size={18} />
                                </button>
                                <AnimatePresence>
                                    {showFilterMenu && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-14 z-50 w-48 bg-app-card/80 backdrop-blur-xl border border-app-stroke rounded-2xl shadow-2xl p-2"
                                        >
                                            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-app-text-label border-b border-app-stroke/50 mb-1 text-center">Filtrar Categoria</p>
                                            {EVENT_TYPES.map(t => (
                                                <button
                                                    key={t.key}
                                                    onClick={() => { setTypeFilter(t.key); setShowFilterMenu(false); }}
                                                    className={clsx("w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-all", typeFilter === t.key ? "bg-black dark:bg-white text-white dark:text-black" : "text-app-text-main hover:bg-app-stroke/30")}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            <button
                                onClick={() => { setIsSidebarCollapsed(!isSidebarCollapsed); haptics.light(); }}
                                className="hidden sm:flex p-3 border border-app-stroke rounded-2xl transition-all bg-app-card text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 shadow-sm hover:shadow-md items-center justify-center"
                                title={isSidebarCollapsed ? "Mostrar Painel Lateral" : "Ocultar Painel Lateral"}
                            >
                                {isSidebarCollapsed ? <SidebarOpen size={18} /> : <SidebarClose size={18} />}
                            </button>

                            <button onClick={() => setIsNewEventOpen(true)} className="flex-1 sm:flex-none bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 transition-all shadow-2xl shadow-black/20 dark:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-tighter">
                                <Plus size={20} strokeWidth={3} /> Novo Evento
                            </button>
                        </div>
                    </div>
                </div>


                {/* ⚠ PREMIUM RED BANNER: Prazos Fatais */}
                {urgentDeadlines.length > 0 && (
                    <div className="bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white px-6 py-2.5 flex items-center gap-4 overflow-hidden shadow-2xl relative">
                        <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                        <div className="flex items-center gap-2 shrink-0 relative z-10">
                            <AlertTriangle size={18} className="shrink-0 text-white animate-bounce" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] shrink-0">Prazos Fatais</span>
                        </div>
                        <div className="h-4 w-px bg-white/30 shrink-0 relative z-10" />
                        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar relative z-10">
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
                                        className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/20 text-[10px] font-black whitespace-nowrap hover:bg-white/30 transition-all border border-white/20 backdrop-blur-sm"
                                    >
                                        <span className="text-white uppercase">{dateLabel}</span>
                                        <span className="opacity-50">|</span>
                                        <span className="truncate max-w-[200px] text-white/90">{event.title}</span>
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
                                        <Avatar
                                            src={member.avatar}
                                            name={member.name}
                                            size="sm"
                                        />
                                        <span className={clsx("text-[10px] font-medium hidden md:block", selectedUserFilter === member.id ? "text-primary" : "text-app-text-main")}>
                                            {member.name.split(' ')[0]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Premium Monthly Stats Dashboard */}
                <div className="px-5 py-3 border-b border-app-stroke/30 bg-app-bg/10 flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="flex items-center gap-3 bg-app-card border border-app-stroke/50 rounded-2xl px-4 py-2 shrink-0 shadow-sm hover:shadow-md transition-all">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Gavel size={16} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest leading-none mb-1">Audiências</p>
                            <p className="text-sm font-black text-app-text-main leading-none">{monthlyStats.hearings}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-app-card border border-app-stroke/50 rounded-2xl px-4 py-2 shrink-0 shadow-sm hover:shadow-md transition-all">
                        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle size={16} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest leading-none mb-1">Prazos</p>
                            <p className="text-sm font-black text-app-text-main leading-none">{monthlyStats.deadlines}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-app-card border border-app-stroke/50 rounded-2xl px-4 py-2 shrink-0 shadow-sm hover:shadow-md transition-all">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Users size={16} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest leading-none mb-1">Reuniões</p>
                            <p className="text-sm font-black text-app-text-main leading-none">{monthlyStats.meetings}</p>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-3 bg-app-card border border-app-stroke/50 rounded-2xl px-4 py-2 shrink-0 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-app-stroke/30 flex items-center justify-center">
                            <CalendarIcon size={16} className="text-app-text-muted" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest leading-none mb-1">Total</p>
                            <p className="text-sm font-black text-app-text-main leading-none">{monthlyStats.total}</p>
                        </div>
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
                                <div className="border border-app-stroke/50 rounded-[2rem] bg-app-bg/50 overflow-hidden flex flex-col h-full shadow-inner">
                                    <div className="grid grid-cols-7 bg-app-card/50 backdrop-blur-sm border-b border-app-stroke/50">
                                        {DAYS_SHORT.map(day => (
                                            <div key={day} className="text-center text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] py-5 border-r border-app-stroke last:border-r-0">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto no-scrollbar">
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
                                                        "relative min-h-[100px] p-2 border-r border-b border-app-stroke cursor-pointer transition-all hover:bg-app-card/40 group",
                                                        (idx + 1) % 7 === 0 && "border-r-0",
                                                        !day && "bg-app-stroke/5 pointer-events-none"
                                                    )}
                                                >
                                                    {day && (
                                                        <>
                                                            <div className="flex justify-end mb-2">
                                                                <span className={clsx(
                                                                    "w-7 h-7 flex items-center justify-center text-[11px] font-black rounded-xl transition-all",
                                                                    isToday ? "bg-black dark:bg-white text-white dark:text-black shadow-lg scale-110 ring-4 ring-primary/10" : 
                                                                    isSelected ? "bg-app-stroke text-app-text-main" : 
                                                                    "text-app-text-muted group-hover:text-app-text-main"
                                                                )}>
                                                                    {day}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-1.5 overflow-hidden">
                                                                {sortedDayEvents.slice(0, 3).map((event) => (
                                                                    <div 
                                                                        key={event.id}
                                                                        onClick={(e) => { e.stopPropagation(); handleViewClick(event, e); }}
                                                                        className={clsx(
                                                                            "text-[9px] px-2 py-1 rounded-lg border truncate cursor-pointer font-bold",
                                                                            "transition-all duration-300 hover:scale-[1.05] hover:shadow-lg hover:z-50",
                                                                            event.completed ? "opacity-30 grayscale italic line-through bg-app-stroke/50 border-app-stroke text-app-text-muted" : 
                                                                            getEventColor(event.type, event.color).pillLight
                                                                        )}
                                                                    >
                                                                        {event.title}
                                                                    </div>
                                                                ))}
                                                                {dayEvents.length > 3 && (
                                                                    <div className="text-[8px] font-black text-app-text-muted text-center py-1 bg-app-stroke/20 rounded-lg uppercase tracking-widest">
                                                                        + {dayEvents.length - 3} mais
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
                                                                            "absolute left-1 right-1 rounded-lg p-2 overflow-hidden cursor-pointer shadow-md group border-l-4",
                                                                            "transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:z-30 hover:ring-2 hover:ring-primary/30",
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
                                <div className="max-w-4xl mx-auto w-full py-8">
                                    <div className="text-center mb-12">
                                        <p className="text-[11px] font-black text-app-text-muted uppercase tracking-[0.3em] mb-3">{DAYS[(new Date(currentYear, currentMonth, selectedDate).getDay() + 6) % 7]}</p>
                                        <h1 className="text-7xl font-black text-app-text-main tracking-tighter mb-2">{selectedDate}</h1>
                                        <p className="text-sm font-black text-primary uppercase tracking-widest">{getMonthName(currentMonth)} {currentYear}</p>
                                    </div>
                                    {todaysEvents.length === 0 ? (
                                        <div className="text-center py-20 bg-app-card/30 rounded-[3rem] border border-app-stroke/50 border-dashed">
                                            <CalendarIcon size={64} className="mx-auto mb-4 text-app-text-muted opacity-20" />
                                            <p className="text-lg font-black text-app-text-muted uppercase tracking-widest">Agenda Vazia</p>
                                            <p className="text-xs text-app-text-muted/60 mt-2">Aproveite seu tempo livre!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 px-4">
                                            {todaysEvents.map(event => (
                                                <div 
                                                    key={event.id} 
                                                    className={clsx(
                                                        "group flex items-start gap-6 p-6 rounded-[2.5rem] border transition-all duration-500", 
                                                        event.completed ? "bg-app-stroke/10 border-app-stroke/50 opacity-60" : "bg-app-card border-app-stroke hover:shadow-2xl hover:scale-[1.01] hover:border-primary/30"
                                                    )}
                                                >
                                                    <button onClick={() => { toggleEventCompleted(event); haptics.medium(); }} className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all mt-1 active:scale-90">
                                                        <div className={clsx("w-full h-full rounded-2xl flex items-center justify-center transition-all", event.completed ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" : "border-app-text-muted hover:border-primary")}>
                                                            {event.completed && <Check size={20} strokeWidth={3} />}
                                                        </div>
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                            <span className={clsx("text-[10px] px-3 py-1 rounded-xl font-black uppercase tracking-widest shrink-0", getEventColor(event.type, event.color).badge)}>{getEventColor(event.type, event.color).label}</span>
                                                            <span className="text-xs font-black text-app-text-main shrink-0">{event.time}</span>
                                                            <span className={clsx("text-[9px] px-2 py-1 rounded-lg font-black ml-auto uppercase tracking-tighter shrink-0", PRIORITY_STYLES[event.priority || 'MEDIUM'].bg, PRIORITY_STYLES[event.priority || 'MEDIUM'].text)}>
                                                                {PRIORITY_STYLES[event.priority || 'MEDIUM'].label}
                                                            </span>
                                                        </div>
                                                        <h4 className={clsx("text-xl font-black tracking-tight mb-2 truncate", event.completed ? "text-app-text-muted line-through" : "text-app-text-main")}>{event.title}</h4>
                                                        {event.description && <p className="text-sm text-app-text-muted mt-2 max-w-2xl leading-relaxed line-clamp-3">{event.description}</p>}
                                                        
                                                        {event.location && (
                                                            <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-app-text-muted">
                                                                <MapPin size={14} className="text-primary" />
                                                                {event.location}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                        <button onClick={(e) => { handleEditClick(event, e); haptics.light(); }} className="p-3 text-app-text-muted hover:text-primary hover:bg-primary/10 rounded-2xl transition-all shadow-sm"><Edit3 size={18} /></button>
                                                        <button onClick={(e) => { handleDeleteEvent(event.id, e); haptics.medium(); }} className="p-3 text-app-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all shadow-sm"><Trash2 size={18} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {view === 'list' && (
                                <div className="space-y-8 max-w-5xl mx-auto w-full py-6 px-4">
                                    {listViewEvents.length === 0 ? (
                                        <div className="text-center py-24 bg-app-card/30 border border-app-stroke/50 border-dashed rounded-[3rem]">
                                            <div className="w-20 h-20 bg-app-stroke/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                                                <List size={32} className="text-app-text-muted opacity-30" />
                                            </div>
                                            <p className="text-2xl font-black text-app-text-main tracking-tighter uppercase">Pauta Livre</p>
                                            <p className="text-sm text-app-text-muted mt-2 font-medium">Nenhum compromisso marcado para este mês.</p>
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
                                            <div key={dateStr} className="space-y-4">
                                                <div className="flex items-center gap-4 sticky top-0 bg-app-bg/80 backdrop-blur-md z-10 py-3 px-2 rounded-2xl">
                                                    <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] whitespace-nowrap">{dateStr}</h3>
                                                    <div className="h-px bg-app-stroke/50 flex-1" />
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {dayEvents.map(event => {
                                                        const isConflict = conflictIds.has(event.id);
                                                        return (
                                                            <div
                                                                key={event.id}
                                                                className={clsx(
                                                                    "group flex flex-col lg:flex-row gap-6 p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer relative overflow-hidden",
                                                                    event.completed ? "bg-app-stroke/10 border-app-stroke/50 opacity-60 grayscale" : "bg-app-card border-app-stroke hover:shadow-2xl hover:scale-[1.01] hover:border-primary/30 shadow-sm",
                                                                    isConflict && !event.completed && "ring-2 ring-amber-500 animate-pulse"
                                                                )}
                                                                onClick={(e) => { handleViewClick(event, e); haptics.light(); }}
                                                            >
                                                                {/* Colored accent indicator */}
                                                                <div className={clsx("absolute top-0 left-0 bottom-0 w-2", 
                                                                    event.completed ? "bg-slate-400" : 
                                                                    event.type === 'deadline' ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : 
                                                                    event.type === 'hearing' ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : 
                                                                    event.type === 'meeting' ? "bg-emerald-500" : "bg-purple-500"
                                                                )} />

                                                                <div className="flex items-center gap-6 shrink-0 lg:border-r lg:border-app-stroke lg:pr-8">
                                                                    <button onClick={(e) => { e.stopPropagation(); toggleEventCompleted(event); haptics.medium(); }} className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 shrink-0">
                                                                        <div className={clsx("w-full h-full rounded-2xl flex items-center justify-center transition-all", event.completed ? "bg-emerald-500 border-emerald-500 text-white shadow-lg" : "border-app-text-muted hover:border-primary")}>
                                                                            {event.completed && <Check size={20} strokeWidth={3} />}
                                                                        </div>
                                                                    </button>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-3xl font-black text-app-text-main leading-none tracking-tighter">{event.time}</span>
                                                                        <span className={clsx("text-[9px] font-black uppercase tracking-widest mt-2", getEventColor(event.type, event.color).badge)}>
                                                                            {getEventColor(event.type, event.color).label}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                                        <h4 className={clsx("text-lg font-black tracking-tight truncate", event.completed ? "text-app-text-muted line-through" : "text-app-text-main")}>{event.title}</h4>
                                                                        {event.priority === 'URGENT' && !event.completed && <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg animate-pulse uppercase tracking-widest shadow-lg shadow-red-500/20">Urgente</span>}
                                                                        {isConflict && !event.completed && <AlertTriangle size={16} className="text-amber-500 animate-bounce" />}
                                                                    </div>
                                                                    
                                                                    {(event.clientName || event.processNumber) && (
                                                                        <div className="flex flex-wrap items-center gap-3 mt-1">
                                                                            {event.clientName && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setDrawerEntity({ type: 'client', clientId: event.clientId, title: `Cliente: ${event.clientName}` }); haptics.light(); }}
                                                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-text-muted bg-app-stroke/20 hover:bg-app-stroke/40 px-3 py-1.5 rounded-xl transition-all border border-app-stroke/50"
                                                                                >
                                                                                    <Users size={12} className="text-primary" /> {event.clientName}
                                                                                </button>
                                                                            )}
                                                                            {event.processNumber && (
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setDrawerEntity({ type: 'process', processId: event.processId, processNumber: event.processNumber, title: `Processo: ${event.processNumber}` }); haptics.light(); }}
                                                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-all border border-primary/20"
                                                                                >
                                                                                    <FileText size={12} /> {event.processNumber}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {event.location && <p className="text-[11px] font-bold text-app-text-muted flex items-center gap-2 mt-3"><MapPin size={12} className="text-primary/50" />{event.location}</p>}
                                                                </div>
                                                                
                                                                <div className="flex items-center justify-between lg:flex-col lg:items-end lg:justify-center lg:pl-8 lg:border-l lg:border-app-stroke shrink-0 gap-4">
                                                                    {event.assignees && event.assignees.length > 0 && (
                                                                        <div className="flex -space-x-3" title={event.assignees.map(a => a.userName).join(', ')}>
                                                                            {event.assignees.slice(0, 3).map((assignee, i) => (
                                                                                <Avatar
                                                                                    key={i}
                                                                                    name={assignee.userName}
                                                                                    size="sm"
                                                                                    className="w-8 h-8 ring-4 ring-app-card rounded-2xl shadow-lg transition-transform hover:scale-110 hover:z-20 cursor-pointer"
                                                                                />
                                                                            ))}
                                                                            {event.assignees.length > 3 && (
                                                                                <div className="w-8 h-8 rounded-2xl bg-app-stroke border-2 border-app-card flex items-center justify-center text-[10px] font-black text-app-text-main shrink-0 shadow-lg">
                                                                                    +{event.assignees.length - 3}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all transform lg:translate-x-4 lg:group-hover:translate-x-0">
                                                                        <button onClick={(e) => { handleEditClick(event, e); haptics.light(); }} className="p-3 text-app-text-muted hover:text-primary rounded-2xl hover:bg-primary/10 transition-all"><Edit3 size={20} /></button>
                                                                        <button onClick={(e) => { handleDeleteEvent(event.id, e); haptics.medium(); }} className="p-3 text-app-text-muted hover:text-red-500 rounded-2xl hover:bg-red-500/10 transition-all"><Trash2 size={20} /></button>
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

            {/* Premium Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 right-0 z-[60] w-[85vw] max-w-sm sm:relative flex flex-col shrink-0 shadow-2xl sm:shadow-sm transition-all duration-500 ease-in-out overflow-hidden bg-app-card/50 backdrop-blur-2xl border-l sm:border sm:rounded-[2.5rem] border-app-stroke/50",
                isSidebarCollapsed ? "sm:w-0 sm:max-w-0 sm:opacity-0 sm:pointer-events-none sm:border-l-0 sm:border-transparent" : "sm:w-full md:w-80 opacity-100",
                isSidebarOpenMobile ? "translate-x-0" : "translate-x-full sm:translate-x-0"
            )}>
                <div className="p-6 border-b border-app-stroke/50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex bg-app-stroke/30 p-1.5 rounded-2xl border border-app-stroke/50 w-full shadow-inner">
                            <button
                                onClick={() => { setSidebarTab('DIA'); haptics.light(); }}
                                className={clsx(
                                    "flex-1 px-3 py-2.5 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-tighter truncate", 
                                    sidebarTab === 'DIA' ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "text-app-text-muted hover:text-app-text-main"
                                )}
                            >
                                Agenda do Dia
                            </button>
                            <button
                                onClick={() => { setSidebarTab('PRAZOS'); haptics.light(); }}
                                className={clsx(
                                    "flex-1 px-3 py-2.5 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-tighter truncate", 
                                    sidebarTab === 'PRAZOS' ? "bg-black dark:bg-white text-white dark:text-black shadow-lg" : "text-app-text-muted hover:text-app-text-main"
                                )}
                            >
                                Prazos
                            </button>
                        </div>
                        <button
                            className="sm:hidden ml-4 p-2 bg-app-stroke/50 rounded-2xl shrink-0 text-app-text-muted hover:text-app-text-main transition-all"
                            onClick={() => setIsSidebarOpenMobile(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {sidebarTab === 'DIA' && (
                        <div className="flex items-center gap-3 text-app-text-main group cursor-pointer">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20 group-hover:scale-110 transition-transform">
                                <CalendarIcon size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest leading-none mb-1">Visualizando</p>
                                <p className="font-black text-sm text-app-text-main">{selectedDate} de {getMonthName(currentMonth)}</p>
                            </div>
                        </div>
                    )}
                    {sidebarTab === 'PRAZOS' && (
                        <div className="flex items-center justify-between gap-1 mt-1 bg-app-stroke/30 p-1.5 rounded-2xl border border-app-stroke/50 shadow-inner">
                            {(['ATIVO', 'SUSPENSO', 'FINALIZADO'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => { setAsideFilter(status); haptics.light(); }}
                                    className={clsx(
                                        "flex-1 px-2 py-2 rounded-xl text-[9px] font-black transition-all uppercase tracking-tighter", 
                                        asideFilter === status ? "bg-black dark:bg-white text-white dark:text-black shadow-md" : "text-app-text-muted hover:text-app-text-main"
                                    )}
                                >
                                    {status === 'ATIVO' ? 'Ativos' : status === 'SUSPENSO' ? 'Susp.' : 'Fin.'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar scroll-smooth">
                    {sidebarTab === 'DIA' ? (
                        todaysEvents.length > 0 ? (
                            <div className="space-y-4">
                                {todaysEvents.map(event => (
                                    <div key={event.id} className={clsx(
                                        "group relative rounded-3xl p-5 border transition-all duration-300 overflow-hidden",
                                        event.completed ? "bg-app-stroke/10 border-app-stroke/50 opacity-60" : "bg-app-card border-app-stroke shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-primary/30"
                                    )}>
                                        <div className={clsx("absolute top-0 left-0 bottom-0 w-1.5", 
                                            event.type === 'deadline' ? 'bg-red-500' : event.type === 'hearing' ? 'bg-blue-500' : event.type === 'meeting' ? 'bg-emerald-500' : 'bg-purple-500'
                                        )} />
                                        
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { toggleEventCompleted(event); haptics.medium(); }} className="shrink-0 transition-transform active:scale-90">
                                                    <div className={clsx("w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all", 
                                                        event.completed ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "border-app-text-muted hover:border-primary")}>
                                                        {event.completed && <Check size={14} strokeWidth={3} />}
                                                    </div>
                                                </button>
                                                <span className="text-[11px] font-black text-app-text-main">{event.time}</span>
                                            </div>
                                            <span className={clsx("text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest", getEventColor(event.type).badge)}>
                                                {getEventColor(event.type).label}
                                            </span>
                                        </div>

                                        <h4 className={clsx("text-sm font-bold mb-2 leading-snug line-clamp-2", event.completed ? "text-app-text-muted line-through" : "text-app-text-main")}>{event.title}</h4>

                                        <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-app-stroke/30">
                                            {event.location && (
                                                <p className="text-[10px] text-app-text-muted flex items-center gap-2 font-medium">
                                                    <MapPin size={12} className="text-primary/50" />
                                                    <span className="truncate">{event.location}</span>
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className={clsx("text-[9px] font-black px-2 py-1 rounded-lg", PRIORITY_STYLES[event.priority || 'MEDIUM'].bg, PRIORITY_STYLES[event.priority || 'MEDIUM'].text)}>
                                                    {PRIORITY_STYLES[event.priority || 'MEDIUM'].label}
                                                </span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button onClick={(e) => handleEditClick(event, e)} className="p-2 text-app-text-muted hover:text-primary transition-colors"><Edit3 size={16} /></button>
                                                    <button onClick={(e) => handleDeleteEvent(event.id, e)} className="p-2 text-app-text-muted hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-app-stroke/30 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-app-stroke/50">
                                    <CalendarIcon size={24} className="text-app-text-muted opacity-30" />
                                </div>
                                <p className="text-sm font-black text-app-text-muted uppercase tracking-widest">Pauta Livre</p>
                                <p className="text-[10px] text-app-text-muted/60 mt-1 uppercase tracking-tighter">Nenhum evento marcado</p>
                            </div>
                        )
                    ) : (
                        upcomingEventsSidebar.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingEventsSidebar.map(event => {
                                    const eventDate = new Date(event.start);
                                    const now = new Date();
                                    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                    const urgencyStyles = diffDays <= 2 ? 'bg-red-500/10 text-red-500 border-red-500/20' : diffDays <= 5 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                                    const urgencyBadge = diffDays <= 2 ? 'bg-red-500' : diffDays <= 5 ? 'bg-amber-500' : 'bg-emerald-500';
                                    
                                    return (
                                        <div key={'pz_'+event.id} className="group relative rounded-3xl p-5 bg-app-card border border-app-stroke transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/30 overflow-hidden">
                                            <div className={clsx("absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-[0.03] -mr-8 -mt-8 rounded-full", urgencyBadge)} />
                                            
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx("w-2 h-2 rounded-full", urgencyBadge, "animate-pulse")} />
                                                    <span className="text-[11px] font-black text-app-text-main">{eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                                </div>
                                                <span className={clsx("text-[9px] font-black px-2 py-1 rounded-lg border", urgencyStyles)}>
                                                    {diffDays <= 0 ? 'Hoje' : diffDays === 1 ? 'Amanhã' : `${diffDays}d`}
                                                </span>
                                            </div>

                                            <h4 className="text-sm font-bold text-app-text-main mb-3 leading-snug line-clamp-2">{event.title}</h4>
                                            
                                            <div className="flex items-center gap-2 pt-4 border-t border-app-stroke/30">
                                                <span className={clsx("text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest", getEventColor(event.type).badge)}>
                                                    {getEventColor(event.type).label}
                                                </span>
                                                {event.processNumber && (
                                                    <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
                                                        {event.processNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-app-stroke/30 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-app-stroke/50">
                                    <AlertTriangle size={24} className="text-app-text-muted opacity-30" />
                                </div>
                                <p className="text-sm font-black text-app-text-muted uppercase tracking-widest">Sem Prazos</p>
                                <p className="text-[10px] text-app-text-muted/60 mt-1 uppercase tracking-tighter">Tudo em dia por aqui</p>
                            </div>
                        )
                    )}
                </div>

                <div className="p-6 border-t border-app-stroke/50 bg-app-card/30 backdrop-blur-md">
                    <button onClick={() => { setIsNewEventOpen(true); haptics.medium(); }} className="w-full bg-black dark:bg-white text-white dark:text-black rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3">
                        <Plus size={18} strokeWidth={3} />
                        Adicionar Evento
                    </button>
                </div>
            </aside>


            {/* Quick View Modal */}
            <EventDetailModal
                isOpen={!!viewingEvent}
                event={viewingEvent as any}
                onClose={() => setViewingEvent(null)}
                onRefresh={fetchEvents}
                onEdit={(ev) => {
                    setViewingEvent(null);
                    setEditingEvent(ev as any);
                    setNewEvent({
                        title: ev.title,
                        description: ev.description || '',
                        start: new Date(ev.start).toISOString().slice(0, 16),
                        end: ev.end ? new Date(ev.end).toISOString().slice(0, 16) : '',
                        type: ev.type,
                        priority: ev.priority || 'MEDIUM',
                        location: ev.location || '',
                        reminderMinutes: ev.reminderMinutes || 30,
                        clientId: ev.clientId || '',
                        clientName: ev.clientName || '',
                        processNumber: ev.processNumber || '',
                        assigneeIds: ev.assignees?.map((a: any) => a.userId) || [],
                        status: ev.status || 'ATIVO',
                        color: ev.color || ''
                    });
                    setIsNewEventOpen(true);
                }}
            />


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
