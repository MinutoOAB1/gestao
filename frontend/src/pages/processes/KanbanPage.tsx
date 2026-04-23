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
import api from '../../services/api';
import { Protect } from '../../components/auth/Protect';
import CardDetailModal from '../../components/kanban/CardDetailModal';

// Types
interface Label {
    id: string;
    name: string;
    color: string;
}

interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

interface Checklist {
    id: string;
    title: string;
    items: ChecklistItem[];
}

interface Process {
    id: string;
    number: string;
    title: string;
    description?: string;
    area?: string;
    status: string;
    value?: number;
    court?: string;
    clientId?: string;
    deadline?: string;
    assignedTo?: string;
    kanbanColumn: string;
    kanbanOrder: number;
    createdAt: string;
    updatedAt?: string;
    client?: { id: string; name: string; email?: string };
    labels?: Label[];
    checklists?: Checklist[];
    _count?: { comments: number };
}

interface Column {
    id: string;
    title: string;
    color?: string;
    wipLimit?: number;
}

// Column visual styles – each column gets a distinct pastel background and accent
const COLUMN_STYLES = [
    { bg: 'bg-blue-50 dark:bg-blue-950/30', headerBg: 'bg-blue-100/80 dark:bg-blue-900/40', border: 'border-blue-200/60 dark:border-blue-800/40', accent: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    { bg: 'bg-amber-50 dark:bg-amber-950/30', headerBg: 'bg-amber-100/80 dark:bg-amber-900/40', border: 'border-amber-200/60 dark:border-amber-800/40', accent: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    { bg: 'bg-slate-50 dark:bg-slate-800/30', headerBg: 'bg-slate-100/80 dark:bg-slate-800/60', border: 'border-slate-200/60 dark:border-slate-700/40', accent: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
    { bg: 'bg-purple-50 dark:bg-purple-950/30', headerBg: 'bg-purple-100/80 dark:bg-purple-900/40', border: 'border-purple-200/60 dark:border-purple-800/40', accent: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
    { bg: 'bg-emerald-50 dark:bg-emerald-950/30', headerBg: 'bg-emerald-100/80 dark:bg-emerald-900/40', border: 'border-emerald-200/60 dark:border-emerald-800/40', accent: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    { bg: 'bg-rose-50 dark:bg-rose-950/30', headerBg: 'bg-rose-100/80 dark:bg-rose-900/40', border: 'border-rose-200/60 dark:border-rose-800/40', accent: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
    { bg: 'bg-teal-50 dark:bg-teal-950/30', headerBg: 'bg-teal-100/80 dark:bg-teal-900/40', border: 'border-teal-200/60 dark:border-teal-800/40', accent: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' },
    { bg: 'bg-orange-50 dark:bg-orange-950/30', headerBg: 'bg-orange-100/80 dark:bg-orange-900/40', border: 'border-orange-200/60 dark:border-orange-800/40', accent: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
];

// Keep old COLUMN_COLORS for backward compat with localStorage
const COLUMN_COLORS = COLUMN_STYLES.map(s => s.bg + ' ' + s.border);

const DEFAULT_COLUMNS: Column[] = [
    { id: 'novo', title: 'Prospecção', color: COLUMN_COLORS[0] },
    { id: 'analise', title: 'Em Atendimento', color: COLUMN_COLORS[1] },
    { id: 'peticao', title: 'Petição', color: COLUMN_COLORS[2] },
    { id: 'audiencia', title: 'Audiência', color: COLUMN_COLORS[3] },
    { id: 'concluido', title: 'Concluídos', color: COLUMN_COLORS[4] },
];

const AREA_COLORS: Record<string, { bg: string; text: string }> = {
    'Cível': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    'Civil': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    'Trabalhista': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    'Penal': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    'Criminal': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
    'Previdenciário': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400' },
    'Tributário': { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-700 dark:text-gray-300' },
    'Família': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
    'Contratual': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
};

function formatDeadline(deadline?: string): { text: string; isUrgent: boolean; isTomorrow: boolean } {
    if (!deadline) return { text: '', isUrgent: false, isTomorrow: false };
    const date = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(date);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Atrasado', isUrgent: true, isTomorrow: false };
    if (diffDays === 0) return { text: 'Hoje', isUrgent: true, isTomorrow: false };
    if (diffDays === 1) return { text: 'Amanhã', isUrgent: false, isTomorrow: true };
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return { text: `${date.getDate()} ${months[date.getMonth()]}`, isUrgent: false, isTomorrow: false };
}

function formatRelativeDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Modificado hoje';
    if (diffDays === 1) return 'Modificado ontem';
    return `Modificado em ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

// ─── Compact Kanban Card ────────────────────────────────

const DraggableCard = memo(function DraggableCard({ process, onOpenModal }: { process: Process; onOpenModal: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: process.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms ease',
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const isCompleted = process.kanbanColumn === 'concluido';
    const deadline = formatDeadline(process.deadline);
    const checklists = process.checklists || [];
    const totalItems = checklists.reduce((a, c) => a + c.items.length, 0);
    const completedItems = checklists.reduce((a, c) => a + c.items.filter(i => i.completed).length, 0);
    const commentCount = process._count?.comments || 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700/60 transition-all hover:shadow-lg ${isCompleted ? 'opacity-60' : ''} group`}
        >
            <div
                className="p-4"
                {...attributes}
                {...listeners}
                style={{ cursor: 'grab', touchAction: 'none' }}
            >
                {/* Title row with three-dot menu */}
                <div className="flex items-start justify-between gap-2">
                    <h4
                        className={`text-sm font-bold leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-1 ${isCompleted
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-gray-800 dark:text-gray-100'
                            }`}
                        onClick={(e) => { e.stopPropagation(); onOpenModal(process.id); }}
                    >
                        {process.title.toUpperCase()}
                    </h4>
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenModal(process.id); }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded transition-colors shrink-0 touch-manipulation"
                    >
                        <MoreVertical size={16} />
                    </button>
                </div>

                {/* Client name and Area */}
                <div className="flex items-center gap-2 mt-1.5">
                    {process.area && (() => {
                        const areaStyle = AREA_COLORS[process.area as keyof typeof AREA_COLORS];
                        return (
                            <span className={`shrink-0 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${areaStyle ? `${areaStyle.bg} ${areaStyle.text}` : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                {process.area}
                            </span>
                        );
                    })()}
                    {process.client && (
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                            {process.client.name.toUpperCase()}
                        </p>
                    )}
                </div>

                {/* Description snippet */}
                {process.description && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                        {process.description}
                    </p>
                )}

                {/* Tags (labels) */}
                {process.labels && process.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                        {process.labels.map(label => (
                            <span
                                key={label.id}
                                className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: label.color }}
                            >
                                {label.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Indicators row (compact) */}
                <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                    {/* Deadline badge */}
                    {deadline.text && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${deadline.isUrgent
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : deadline.isTomorrow
                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                            }`}>
                            {deadline.isUrgent ? <AlertTriangle size={11} /> : <Calendar size={11} />}
                            {deadline.text}
                        </span>
                    )}

                    {/* Checklist progress */}
                    {totalItems > 0 && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${completedItems === totalItems ? 'text-green-500' : 'text-gray-400'}`}>
                            <CheckSquare size={11} />
                            {completedItems}/{totalItems}
                        </span>
                    )}

                    {/* Comments count */}
                    {commentCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
                            <MessageSquare size={11} />
                            {commentCount}
                        </span>
                    )}

                    {isCompleted && <CheckCircle size={12} className="text-green-500 ml-auto" />}
                </div>

                {/* Progress Bar (checklist) */}
                {totalItems > 0 && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-400 font-medium">Progresso</span>
                            <span className={`text-[10px] font-bold ${completedItems === totalItems ? 'text-green-500' : 'text-gray-400'}`}>{Math.round((completedItems / totalItems) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${completedItems === totalItems ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${(completedItems / totalItems) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer: client avatar + modification date */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                        {process.client && (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                                <span className="text-white font-bold text-[8px]">{process.client.name?.charAt(0)?.toUpperCase()}</span>
                            </div>
                        )}
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {formatRelativeDate(process.updatedAt || process.createdAt)}
                        </p>
                    </div>
                    {isCompleted && <CheckCircle size={12} className="text-green-500" />}
                </div>
            </div>
        </div>
    );
});

// ─── Droppable Column Component ────────────────────────────

const DroppableColumn = memo(function DroppableColumn({
    column,
    processes,
    columnIndex,
    onEditColumn,
    onDeleteColumn,
    onAddCard,
    onOpenModal,
}: {
    column: Column;
    processes: Process[];
    columnIndex: number;
    onEditColumn: (id: string, title: string) => void;
    onDeleteColumn: (id: string) => void;
    onAddCard: (columnId: string) => void;
    onOpenModal: (id: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(column.title);

    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    const handleSave = () => {
        const trimmedTitle = editTitle.trim();
        if (!trimmedTitle) {
            setEditTitle(column.title || 'Nova Coluna');
            setIsEditing(false);
            return;
        }
        onEditColumn(column.id, trimmedTitle);
        setIsEditing(false);
    };

    const isOverWip = column.wipLimit && processes.length > column.wipLimit;
    const style = COLUMN_STYLES[columnIndex % COLUMN_STYLES.length];

    return (
        <div className="flex flex-col w-[85vw] sm:w-[320px] shrink-0 group/column">
            {/* Column Header */}
            <div className={`flex flex-col mb-0 rounded-t-2xl border-x border-t ${style.border} ${style.headerBg} relative overflow-hidden transition-all duration-300`}>
                {/* Top accent line */}
                <div className={`h-1 w-full ${style.dot} opacity-80`} />
                
                <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="text-sm font-black bg-white dark:bg-slate-800 px-2 py-1 rounded border-2 border-blue-500 outline-none w-32 text-gray-900 dark:text-white shadow-sm"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                />
                                <button onClick={handleSave} className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"><Save size={14} /></button>
                                <button onClick={() => setIsEditing(false)} className="p-1 bg-gray-200 dark:bg-slate-700 text-gray-500 rounded hover:bg-gray-300 transition-colors"><X size={14} /></button>
                            </div>
                        ) : (
                            <>
                                <h3
                                    className="text-[13px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                                    onClick={() => setIsEditing(true)}
                                    title="Duplo clique para editar"
                                >
                                    {column.title || 'Sem título'}
                                </h3>
                                <div className={`w-1.5 h-1.5 rounded-full ${style.dot} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm border ${style.badge} border-white/20 dark:border-black/10`}>
                            {processes.length}
                        </span>
                        
                        <div className="flex items-center">
                            {!['novo', 'concluido'].includes(column.id) && (
                                <Protect roles={['ADMIN', 'LAWYER']}>
                                    <button
                                        onClick={() => onDeleteColumn(column.id)}
                                        className="text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover/column:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Excluir coluna"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </Protect>
                            )}
                        </div>
                    </div>
                </div>
                
                {isOverWip && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 animate-pulse" />
                )}
            </div>

            {/* Cards container */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto flex flex-col gap-3 px-3 py-3 rounded-b-2xl border transition-all duration-200 ${isOver
                    ? 'border-blue-400 bg-blue-50/80 dark:bg-blue-900/20'
                    : isOverWip
                        ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                        : `${style.border} ${style.bg}`
                    }`}
                style={{ minHeight: 160 }}
            >
                <SortableContext items={processes.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {processes.map((process) => (
                        <DraggableCard key={process.id} process={process} onOpenModal={onOpenModal} />
                    ))}
                </SortableContext>

                {processes.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm py-10">
                        Arraste processos aqui
                    </div>
                )}
            </div>

            {/* Add card button */}
            <button
                onClick={() => onAddCard(column.id)}
                className="flex items-center justify-center gap-2 py-2 mt-2 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-all touch-manipulation min-h-[40px] mb-0"
            >
                <Plus size={16} />
                Adicionar
            </button>
        </div>
    );
});

// ─── Add Card Modal ────────────────────────────────────────

function AddCardModal({
    isOpen, columnId, onClose, onSave, teamMembers, clients, initialClientId
}: {
    isOpen: boolean;
    columnId: string;
    onClose: () => void;
    onSave: (data: Partial<Process>) => void;
    teamMembers: Array<{ id: string, name: string, avatar?: string | null, role: string }>;
    clients: Array<{ id: string, name: string, email?: string }>;
    initialClientId?: string;
}) {
    const [formData, setFormData] = useState({
        title: '', number: '', description: '', area: 'Cível', deadline: '', assignedTo: '', clientId: '',
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                clientId: initialClientId || prev.clientId
            }));
        }
    }, [isOpen, initialClientId]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            clientId: formData.clientId || undefined,
            deadline: formData.deadline || undefined,
            kanbanColumn: columnId,
            kanbanOrder: 0,
        });
        setFormData({ title: '', number: '', description: '', area: 'Cível', deadline: '', assignedTo: '', clientId: '' });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700 fixed bottom-0 sm:relative sm:bottom-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Criar novo caso</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número (CNJ)</label>
                            <input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Opcional (Ex: 0000000-00.0000.0.00.0000)" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente vinculado</label>
                            <select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Selecione um cliente</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>{client.name}{client.email ? ` (${client.email})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área</label>
                            <select value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="Cível">Cível</option>
                                <option value="Trabalhista">Trabalhista</option>
                                <option value="Criminal">Criminal</option>
                                <option value="Família">Família</option>
                                <option value="Tributário">Tributário</option>
                                <option value="Contratual">Contratual</option>
                                <option value="Previdenciário">Previdenciário</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prazo</label>
                            <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
                            <select value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Selecione um responsável</option>
                                {teamMembers.map((member) => (
                                    <option key={member.id} value={member.name}>{member.name} ({member.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={4} />
                    </div>
                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium shadow-sm">
                            <Plus size={16} /> Criar novo caso
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Filter Modal ──────────────────────────────────────────

function FilterModal({
    isOpen, onClose, filters, onApply, teamMembers,
}: {
    isOpen: boolean;
    onClose: () => void;
    filters: { area: string; hasDeadline: boolean; assignedTo: string; assignedToMe: boolean };
    onApply: (filters: { area: string; hasDeadline: boolean; assignedTo: string; assignedToMe: boolean }) => void;
    teamMembers: Array<{ id: string, name: string, avatar?: string | null, role: string }>;
}) {
    const [localFilters, setLocalFilters] = useState(filters);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtros</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área do Direito</label>
                        <select value={localFilters.area} onChange={(e) => setLocalFilters({ ...localFilters, area: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Todas</option>
                            <option value="Cível">Cível</option>
                            <option value="Trabalhista">Trabalhista</option>
                            <option value="Criminal">Criminal</option>
                            <option value="Família">Família</option>
                            <option value="Tributário">Tributário</option>
                            <option value="Contratual">Contratual</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável</label>
                        <select value={localFilters.assignedTo} onChange={(e) => setLocalFilters({ ...localFilters, assignedTo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">Todos</option>
                            {teamMembers.map((member) => (
                                <option key={member.id} value={member.name}>{member.name} ({member.role})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="hasDeadline" checked={localFilters.hasDeadline} onChange={(e) => setLocalFilters({ ...localFilters, hasDeadline: e.target.checked })} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        <label htmlFor="hasDeadline" className="text-sm text-gray-700 dark:text-gray-300">Apenas com prazo definido</label>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => { setLocalFilters({ area: '', hasDeadline: false, assignedTo: '', assignedToMe: false }); onApply({ area: '', hasDeadline: false, assignedTo: '', assignedToMe: false }); onClose(); }} className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">Limpar</button>
                    <button onClick={() => { onApply(localFilters); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Aplicar</button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Kanban Page ──────────────────────────────────────

export default function KanbanPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useToast();
    const [processes, setProcesses] = useState<Process[]>([]);
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
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] bg-gray-50 dark:bg-slate-900">
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

                    {/* View Toggles */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 shrink-0 overflow-x-auto max-w-full">
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
