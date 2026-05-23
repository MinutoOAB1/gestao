import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDroppable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    CheckSquare, MessageSquare, FileText, Trash2,
    Plus, Search, Filter, MoreVertical, Calendar, AlertTriangle, CheckCircle, X, Save, LayoutGrid, List, Users
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Sparkles, Clock, Phone } from 'lucide-react';
import api from '../../services/api';
import { Protect } from '../../components/auth/Protect';
import CardDetailModal from '../../components/kanban/CardDetailModal';

import { Process, Column, Label, Checklist, ChecklistItem } from '../../types/kanban';
import { COLUMN_STYLES, COLUMN_COLORS, DEFAULT_COLUMNS, AREA_COLORS, formatDeadline, formatRelativeDate } from '../../utils/kanban';
import { AddCardModal } from '../../components/kanban/AddCardModal';
import { FilterModal } from '../../components/kanban/FilterModal';
import { DroppableColumn } from '../../components/kanban/DroppableColumn';

// ─── Main Kanban Page ──────────────────────────────────────

export default function KanbanPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useToast();
    const [processes, setProcesses] = useState<Process[]>([]);

    // CRM stats and Llama AI Strategy states
    const [crmLeads, setCrmLeads] = useState<any[]>([]);
    const [selectedLeadForStrategy, setSelectedLeadForStrategy] = useState<any | null>(null);
    const [isStrategyLoading, setIsStrategyLoading] = useState(false);
    const [crmStrategyHtml, setCrmStrategyHtml] = useState<string | null>(null);
    const [columns, setColumns] = useState<Column[]>(() => {
        const saved = localStorage.getItem('kanban-columns');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((col: Column, index: number) => ({
                    ...col,
                    color: COLUMN_COLORS[index % COLUMN_COLORS.length]
                }));
            } catch {
                return DEFAULT_COLUMNS;
            }
        }
        return DEFAULT_COLUMNS;
    });
    const [activeProcess, setActiveProcess] = useState<Process | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ area: '', hasDeadline: false, assignedTo: '', assignedToMe: false });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showDeadlineFilter, setShowDeadlineFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [initialClientId, setInitialClientId] = useState<string | undefined>();
    const [activeColumnId, setActiveColumnId] = useState<string>('novo');
    const [teamMembers, setTeamMembers] = useState<Array<{ id: string, name: string, avatar?: string | null, role: string }>>([]);
    const [clients, setClients] = useState<Array<{ id: string, name: string, email?: string }>>([]);

    // Card Detail Modal
    const [cardModalId, setCardModalId] = useState<string | null>(null);
    const [allLabels, setAllLabels] = useState<Label[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
    );

    // Debounced search
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(value), 250);
    }, []);

    useEffect(() => {
        fetchProcesses();
        fetchTeamMembers();
        fetchLabels();
        fetchClients();
        fetchCrmLeads();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            const res = await api.get('/auth/users');
            setTeamMembers(res.data || []);
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    const fetchLabels = async () => {
        try {
            const res = await api.get('/processes/labels/all');
            setAllLabels(res.data || []);
        } catch (error) {
            console.error('Error fetching labels:', error);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data || []);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchCrmLeads = async () => {
        try {
            const res = await api.get('/clients');
            const clientsData = res.data || [];
            const storedStages = localStorage.getItem('bpmn-crm-stages');
            const stageMap = storedStages ? JSON.parse(storedStages) : {};
            const mapped = clientsData.map((c: any) => ({
                id: c.id,
                name: c.name,
                phone: c.phone || 'Sem Telefone',
                email: c.email || 'Sem E-mail',
                document: c.document || 'Sem Documento',
                createdAt: c.createdAt || new Date().toISOString(),
                urgency: c.urgencyLevel || 'NORMAL',
                area: c.demandType || 'Geral',
                stage: stageMap[c.id] || 'novo',
                details: c.notes?.map((n: any) => n.content).join('; ') || ''
            }));
            setCrmLeads(mapped);
        } catch (err) {
            console.error('Error fetching CRM clients in Kanban:', err);
        }
    };

    const handleGenerateLeadStrategy = async (lead: any) => {
        setSelectedLeadForStrategy(lead);
        setIsStrategyLoading(true);
        setCrmStrategyHtml(null);
        try {
            const response = await api.post('/ai/gestao/crm/estrategia', {
                name: lead.name,
                area: lead.area || 'Geral',
                details: lead.details || 'Caso comum de ' + (lead.area || 'Geral')
            });
            setCrmStrategyHtml(response.data.strategy);
        } catch (err) {
            console.error(err);
            setCrmStrategyHtml('<p class="text-xs text-red-500 font-bold p-4">Erro ao processar estratégia de atendimento via IA. Tente novamente.</p>');
        } finally {
            setIsStrategyLoading(false);
        }
    };

    const handleGenerateCardStrategy = (process: Process) => {
        const lead = {
            name: process.client?.name || process.title,
            phone: 'WhatsApp',
            email: process.client?.email || 'Sem E-mail',
            area: process.area || 'Geral',
            urgency: process.deadline ? 'ALTA' : 'NORMAL',
            details: process.description || process.title
        };
        handleGenerateLeadStrategy(lead);
    };

    useEffect(() => {
        if (searchParams.get('newProcess') === 'true') {
            const preClient = searchParams.get('clientId');
            setInitialClientId(preClient || undefined);
            setModalOpen(true);
            
            // Clear URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('newProcess');
            newParams.delete('clientId');
            setSearchParams(newParams);
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        localStorage.setItem('kanban-columns', JSON.stringify(columns));
    }, [columns]);

    const fetchProcesses = async () => {
        try {
            const res = await api.get('/processes');
            setProcesses(res.data || []);
        } catch (error) {
            console.error('Error fetching processes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProcesses = useMemo(() => {
        return processes.filter(p => {
            const q = debouncedSearch.toLowerCase();
            const matchesSearch = !q ||
                p.title.toLowerCase().includes(q) ||
                p.number.toLowerCase().includes(q) ||
                p.client?.name?.toLowerCase().includes(q);
            const matchesArea = !filters.area || p.area === filters.area;
            const matchesAssigned = !filters.assignedTo || p.assignedTo?.toLowerCase().includes(filters.assignedTo.toLowerCase());
            const matchesAssignedToMe = !filters.assignedToMe || p.assignedTo === 'Me' || p.assignedTo === teamMembers.find(m => m.id === localStorage.getItem('user_id'))?.name; // Simple heuristic
            const matchesHasDeadline = !filters.hasDeadline || !!p.deadline;
            let matchesDeadlineFilter = true;
            if (showDeadlineFilter !== 'all' && p.deadline) {
                const deadlineDate = new Date(p.deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (showDeadlineFilter === 'today') matchesDeadlineFilter = diffDays === 0;
                else if (showDeadlineFilter === 'week') matchesDeadlineFilter = diffDays >= 0 && diffDays <= 7;
                else if (showDeadlineFilter === 'overdue') matchesDeadlineFilter = diffDays < 0;
            } else if (showDeadlineFilter !== 'all' && !p.deadline) {
                matchesDeadlineFilter = false;
            }
            return matchesSearch && matchesArea && matchesAssigned && matchesHasDeadline && matchesDeadlineFilter;
        });
    }, [processes, debouncedSearch, filters, showDeadlineFilter]);

    const columnProcessMap = useMemo(() => {
        const map: Record<string, Process[]> = {};
        columns.forEach(col => { map[col.id] = []; });
        filteredProcesses.forEach(p => {
            if (map[p.kanbanColumn]) map[p.kanbanColumn].push(p);
            else if (map['novo']) map['novo'].push(p);
        });
        Object.values(map).forEach(procs => procs.sort((a, b) => a.kanbanOrder - b.kanbanOrder));
        return map;
    }, [filteredProcesses, columns]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const process = processes.find(p => p.id === event.active.id);
        setActiveProcess(process || null);
    }, [processes]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveProcess(null);
        if (!over) return;

        const activeProcessData = processes.find(p => p.id === active.id);
        if (!activeProcessData) return;

        let targetColumn = activeProcessData.kanbanColumn;
        if (columns.some(c => c.id === over.id)) {
            targetColumn = over.id as string;
        } else {
            const overProcess = processes.find(p => p.id === over.id);
            if (overProcess) targetColumn = overProcess.kanbanColumn;
        }

        const newProcesses = processes.map(p => {
            if (p.id === active.id) return { ...p, kanbanColumn: targetColumn };
            return p;
        });
        setProcesses(newProcesses);

        try {
            await api.patch(`/processes/${active.id}`, { kanbanColumn: targetColumn });
        } catch (error) {
            console.error('Error updating process:', error);
            fetchProcesses();
        }
    }, [processes, columns, fetchProcesses]);

    const handleEditColumn = useCallback((id: string, title: string) => {
        setColumns(prev => prev.map(col => col.id === id ? { ...col, title } : col));
    }, []);

    const handleDeleteColumn = useCallback((id: string) => {
        setProcesses(prev => prev.map(p => p.kanbanColumn === id ? { ...p, kanbanColumn: 'novo' } : p));
        setColumns(prev => prev.filter(col => col.id !== id));
    }, []);

    const handleAddColumn = useCallback(() => {
        const newId = `col-${Date.now()}`;
        setColumns(prev => [...prev.slice(0, -1), { id: newId, title: 'NOVA COLUNA' }, prev[prev.length - 1]]);
    }, []);

    const handleAddCard = useCallback((columnId: string) => {
        setActiveColumnId(columnId);
        setModalOpen(true);
    }, []);

    const handleSaveCard = useCallback(async (data: Partial<Process>) => {
        try {
            const res = await api.post('/processes', data);
            setProcesses(prev => [...prev, res.data]);
        } catch (error) {
            console.error('Error creating process:', error);
            addToast('Erro ao criar processo. Verifique os dados.', 'error');
        }
    }, []);

    const handleOpenModal = useCallback((processId: string) => {
        setCardModalId(processId);
    }, []);

    const handleCreateLabel = useCallback(async (name: string, color: string) => {
        const res = await api.post('/processes/labels', { name, color });
        fetchLabels();
        return res.data;
    }, []);

    const totalProcesses = processes.length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-140px)] min-h-[600px] md:min-h-0 md:h-[calc(100vh-4rem)] bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 sm:px-8 py-4 sm:py-5 flex-shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full">
                    {/* Title and Badge */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 sm:p-2.5 bg-blue-500 rounded-xl sm:rounded-2xl text-white shadow-lg shadow-blue-500/30">
                            <FileText size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-none">Casos</h1>
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {totalProcesses}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden xl:block h-8 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>

                    {/* CRM Overview stats replacing View Toggles */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 xl:max-w-4xl">
                        <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="min-w-0">
                                <p className="text-[9px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Total em Atendimento</p>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white mt-0.5 truncate">{crmLeads.length} Leads</h4>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0 ml-2">
                                <Users size={14} className="text-blue-500" />
                            </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="min-w-0">
                                <p className="text-[9px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Aguardando Coleta</p>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white mt-0.5 truncate">
                                    {crmLeads.filter(c => c.stage === 'coleta').length} Clientes
                                </h4>
                            </div>
                            <div className="p-2 bg-amber-500/10 rounded-lg shrink-0 ml-2">
                                <Clock size={14} className="text-amber-500" />
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="min-w-0">
                                <p className="text-[9px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Fechamentos Concluídos</p>
                                <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                                    {crmLeads.filter(c => c.stage === 'concluido').length} Fechados
                                </h4>
                            </div>
                            <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0 ml-2">
                                <CheckCircle size={14} className="text-emerald-500" />
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="min-w-0">
                                <p className="text-[9px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Taxa de Conversão</p>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white mt-0.5 truncate">
                                    {crmLeads.length > 0 ? Math.round((crmLeads.filter(c => c.stage === 'concluido').length / crmLeads.length) * 100) : 0}%
                                </h4>
                            </div>
                            <div className="p-2 bg-purple-500/10 rounded-lg shrink-0 ml-2">
                                <TrendingUp size={14} className="text-purple-500" />
                            </div>
                        </div>
                    </div>
                    <div className="hidden flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 shrink-0 overflow-x-auto max-w-full">
                        <button
                            onClick={() => navigate('/app/processos')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                            <List size={15} />
                            Lista
                        </button>
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg shadow-sm whitespace-nowrap"
                        >
                            <LayoutGrid size={15} />
                            Visão geral
                        </button>
                        <button
                            onClick={handleAddColumn}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                            <Plus size={15} />
                            Ad. Coluna
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] xl:max-w-md w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none min-h-[40px] transition-all"
                            placeholder="Procure por título, cliente ou coluna"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>

                    {/* Filters & Actions row on mobile */}
                    <div className="flex flex-wrap items-center gap-2 xl:pb-0 shrink-0 w-full xl:w-auto">
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, assignedToMe: !prev.assignedToMe }))}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors touch-manipulation min-h-[36px] sm:min-h-[40px] whitespace-nowrap flex-1 sm:flex-none justify-center ${filters.assignedToMe
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700'
                                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                                }`}
                        >
                            <Users size={15} />
                            <span className="truncate">Meus Processos</span>
                        </button>

                        <button
                            onClick={() => setShowFilterModal(true)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors touch-manipulation min-h-[40px] whitespace-nowrap ${filters.area || filters.assignedTo || filters.hasDeadline
                                ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'
                                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600'
                                }`}
                        >
                            <Filter size={15} />
                            <span className="hidden sm:inline">Filtros</span>
                        </button>

                        <select
                            value={showDeadlineFilter}
                            onChange={(e) => setShowDeadlineFilter(e.target.value as any)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors outline-none touch-manipulation min-h-[40px] whitespace-nowrap ${showDeadlineFilter !== 'all'
                                ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'
                                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            <option value="all">📅 Prazo</option>
                            <option value="today">Hoje</option>
                            <option value="week">Esta semana</option>
                            <option value="overdue">Atrasados</option>
                        </select>

                        {/* Create Button */}
                        <button
                            onClick={() => navigate('/app/processos/novo')}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow-sm transition-all active:scale-95 font-semibold text-sm min-h-[40px] touch-manipulation shrink-0 ml-auto sm:ml-0"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline whitespace-nowrap">Criar novo caso</span>
                            <span className="sm:hidden">Novo</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div 
                    className="flex-1 overflow-x-auto overflow-y-hidden pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 scroll-smooth flex flex-col kanban-scrollbar" 
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="flex items-stretch gap-4 sm:gap-5 flex-1 h-full min-w-max pb-2">
                        {columns.map((column, index) => (
                            <DroppableColumn
                                key={column.id}
                                column={column}
                                processes={columnProcessMap[column.id] || []}
                                columnIndex={index}
                                onEditColumn={handleEditColumn}
                                onDeleteColumn={handleDeleteColumn}
                                onAddCard={handleAddCard}
                                onOpenModal={handleOpenModal}
                                onGenerateStrategy={handleGenerateCardStrategy}
                            />
                        ))}

                        {/* Add Column (compact) */}
                        <div
                            onClick={handleAddColumn}
                            className="flex flex-col w-[85vw] sm:w-[320px] shrink-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer group touch-manipulation"
                        >
                            <div className="mb-0 px-4 py-3.5 rounded-t-2xl bg-gray-100/50 dark:bg-slate-800/50">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-600">
                                    + Coluna
                                </h3>
                            </div>
                            <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-b-2xl flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 transition-all">
                                <Plus size={28} className="text-gray-300 group-hover:text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeProcess && (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-blue-500 shadow-2xl w-72 opacity-90">
                            <h4 className="font-bold text-sm text-gray-800 dark:text-white">{activeProcess.title.toUpperCase()}</h4>
                            {activeProcess.client && (
                                <p className="text-[13px] text-gray-500 mt-1">{activeProcess.client.name.toUpperCase()}</p>
                            )}
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Modals */}
            <AddCardModal
                isOpen={modalOpen}
                columnId={activeColumnId}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveCard}
                teamMembers={teamMembers}
                clients={clients}
                initialClientId={initialClientId}
            />
            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={filters}
                onApply={setFilters}
                teamMembers={teamMembers}
            />

            {/* DRAWER: IA STRATEGY FOR KANBAN PROCESS (Llama AI) */}
            <AnimatePresence>
                {selectedLeadForStrategy && (
                    <div className="fixed inset-0 z-[130] flex justify-end">
                        {/* Backdrop */}
                        <div 
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setSelectedLeadForStrategy(null)}
                        />

                        {/* Slide over */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#0D1424] border-l border-slate-200 dark:border-white/10 h-full flex flex-col shadow-2xl p-6 overflow-hidden text-left"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#7C3AED]/10 text-[#7C3AED] rounded-lg">
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">Roteiro Llama 3.1 AI</h3>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold tracking-wider">
                                            Estratégia: {selectedLeadForStrategy.area || 'Geral'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedLeadForStrategy(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto py-4 pr-1 scrollbar-hide">
                                {/* Lead Details Summary card */}
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-2xl mb-5">
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">{selectedLeadForStrategy.name}</h4>
                                    <div className="flex flex-wrap gap-2.5 mt-2">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                            <Phone size={10} />
                                            {selectedLeadForStrategy.phone}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                            <FileText size={10} />
                                            {selectedLeadForStrategy.email}
                                        </span>
                                    </div>
                                    {selectedLeadForStrategy.details && (
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 bg-white dark:bg-[#0D1424] p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                                            {selectedLeadForStrategy.details}
                                        </p>
                                    )}
                                </div>

                                {/* Loading state */}
                                {isStrategyLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent flex items-center justify-center rounded-full animate-spin">
                                            <div className="w-4 h-4 bg-[#7C3AED] rounded-full animate-pulse" />
                                        </div>
                                        <p className="text-xs text-[#7C3AED] font-bold animate-pulse uppercase tracking-wider text-center">Llama IA gerando estratégia...</p>
                                    </div>
                                ) : crmStrategyHtml ? (
                                    <div 
                                        className="prose dark:prose-invert prose-xs text-xs max-w-none text-slate-600 dark:text-slate-300 space-y-4"
                                        dangerouslySetInnerHTML={{ __html: crmStrategyHtml }}
                                    />
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Estratégia não carregada.</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Card Detail Modal */}
            {cardModalId && (
                <CardDetailModal
                    processId={cardModalId}
                    isOpen={!!cardModalId}
                    onClose={() => setCardModalId(null)}
                    onUpdate={() => fetchProcesses()}
                    allLabels={allLabels}
                    onCreateLabel={handleCreateLabel}
                />
            )}
        </div>
    );
}
