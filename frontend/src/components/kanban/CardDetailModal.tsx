import { useState, useEffect } from 'react';
import {
    X, Calendar, CheckSquare, MessageSquare, User,
    Plus, Trash2, Clock, FileText, AlertTriangle,
    Save, Copy, Printer, ExternalLink
} from 'lucide-react';
import api from '../../services/api';

// ─── Types ─────────────────────────────────────────────────

interface Label {
    id: string;
    name: string;
    color: string;
}

interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
    order: number;
}

interface Checklist {
    id: string;
    title: string;
    items: ChecklistItem[];
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string; avatar?: string | null };
}

interface ProcessUpdate {
    id: string;
    date: string;
    description: string;
    type: string;
    isImportant: boolean;
    createdBy?: string;
}

interface ProcessFull {
    id: string;
    number: string;
    title: string;
    description?: string;
    area?: string;
    status: string;
    value?: number;
    court?: string;
    deadline?: string;
    assignedTo?: string;
    kanbanColumn: string;
    client?: { id: string; name: string; email?: string };
    labels: Label[];
    checklists: Checklist[];
    comments: Comment[];
    updates: ProcessUpdate[];
    createdAt: string;
    updatedAt: string;
}

interface CardDetailModalProps {
    processId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    allLabels: Label[];
    onCreateLabel: (name: string, color: string) => Promise<Label | void>;
}

// ─── Constants ──────────────────────────────

const LABEL_COLORS = [
    '#000000', '#18181b', '#27272a', '#3f3f46', '#52525b',
    '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7', '#f4f4f5',
];

const UPDATE_TYPE_ICONS: Record<string, { icon: any; color: string }> = {
    'MOVIMENTO': { icon: FileText, color: 'text-neutral-500' },
    'DECISAO': { icon: FileText, color: 'text-black dark:text-white' },
    'SENTENCA': { icon: FileText, color: 'text-neutral-800 dark:text-neutral-200' },
    'DESPACHO': { icon: FileText, color: 'text-neutral-600 dark:text-neutral-400' },
    'AUDIENCIA': { icon: Calendar, color: 'text-neutral-900 dark:text-neutral-100' },
    'PRAZO': { icon: AlertTriangle, color: 'text-neutral-400' },
    'OUTRO': { icon: Clock, color: 'text-neutral-500' },
};

// ─── Main Component ────────────────────────────────────────

export default function CardDetailModal({
    processId, isOpen, onClose, onUpdate, allLabels, onCreateLabel
}: CardDetailModalProps) {
    const [process, setProcess] = useState<ProcessFull | null>(null);
    const [loading, setLoading] = useState(true);

    // Inline edit states
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const [editingDesc, setEditingDesc] = useState(false);
    const [descDraft, setDescDraft] = useState('');

    // Comment state
    const [commentText, setCommentText] = useState('');

    // Checklist add states
    const [addingChecklistItem, setAddingChecklistItem] = useState<string | null>(null);
    const [newItemText, setNewItemText] = useState('');

    // Label picker
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

    // Timeline expand
    const [showAllUpdates, setShowAllUpdates] = useState(false);

    // Delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen && processId) {
            fetchProcess();
            setShowDeleteConfirm(false);
        }
    }, [isOpen, processId]);

    const fetchProcess = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/processes/${processId}`);
            setProcess(res.data);
            setTitleDraft(res.data.title);
            setDescDraft(res.data.description || '');
        } catch (err) {
            console.error('Error fetching process:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // ─── Handlers ──────────────────────────────────────────

    const saveTitle = async () => {
        if (!process || !titleDraft.trim()) return;
        await api.patch(`/processes/${process.id}`, { title: titleDraft });
        setProcess({ ...process, title: titleDraft });
        setEditingTitle(false);
        onUpdate();
    };

    const saveDesc = async () => {
        if (!process) return;
        await api.patch(`/processes/${process.id}`, { description: descDraft });
        setProcess({ ...process, description: descDraft });
        setEditingDesc(false);
        onUpdate();
    };

    const toggleChecklistItem = async (itemId: string, completed: boolean) => {
        await api.patch(`/processes/checklist-items/${itemId}`, { completed: !completed });
        fetchProcess();
    };

    const handleAddChecklistItem = async (checklistId: string) => {
        if (!newItemText.trim()) return;
        await api.post(`/processes/checklists/${checklistId}/items`, { text: newItemText });
        setNewItemText('');
        setAddingChecklistItem(null);
        fetchProcess();
    };

    const handleDeleteChecklistItem = async (itemId: string) => {
        await api.delete(`/processes/checklist-items/${itemId}`);
        fetchProcess();
    };

    const handleCreateChecklist = async () => {
        if (!process) return;
        await api.post(`/processes/${process.id}/checklists`, { title: 'Checklist' });
        fetchProcess();
    };

    const handleDeleteChecklist = async (checklistId: string) => {
        await api.delete(`/processes/checklists/${checklistId}`);
        fetchProcess();
    };

    const handleAddComment = async () => {
        if (!process || !commentText.trim()) return;
        await api.post(`/processes/${process.id}/comments`, { content: commentText });
        setCommentText('');
        fetchProcess();
    };

    const handleDeleteComment = async (commentId: string) => {
        await api.delete(`/processes/comments/${commentId}`);
        fetchProcess();
    };

    const handleToggleLabel = async (labelId: string) => {
        if (!process) return;
        const hasLabel = process.labels.some(l => l.id === labelId);
        if (hasLabel) {
            await api.delete(`/processes/${process.id}/labels/${labelId}`);
        } else {
            await api.post(`/processes/${process.id}/labels/${labelId}`);
        }
        fetchProcess();
        onUpdate();
    };

    const handleCreateNewLabel = async () => {
        if (!newLabelName.trim()) return;
        const newLabel = await onCreateLabel(newLabelName, newLabelColor);
        if (newLabel && newLabel.id) {
            await handleToggleLabel(newLabel.id);
        }
        setNewLabelName('');
        setShowLabelPicker(false);
    };

    const handleDeleteProcess = async () => {
        if (!process) return;
        try {
            await api.delete(`/processes/${process.id}`);
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Erro ao excluir processo:', error);
        }
    };

    const copyProcessNumber = () => {
        if (!process) return;
        navigator.clipboard.writeText(process.number);
    };

    // ─── Computed ──────────────────────────────────────────

    const totalChecklistItems = process?.checklists.reduce((acc, cl) => acc + cl.items.length, 0) || 0;
    const completedChecklistItems = process?.checklists.reduce((acc, cl) => acc + cl.items.filter(i => i.completed).length, 0) || 0;
    const checklistProgress = totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 0;

    const areaColors: Record<string, string> = {
        'Cível': 'bg-black dark:bg-white text-white dark:text-black',
        'Civil': 'bg-black dark:bg-white text-white dark:text-black',
        'Trabalhista': 'bg-neutral-800 text-white',
        'Penal': 'bg-neutral-700 text-white',
        'Criminal': 'bg-neutral-600 text-white',
        'Previdenciário': 'bg-neutral-500 text-white',
        'Tributário': 'bg-neutral-400 text-black',
        'Família': 'bg-neutral-300 text-black',
        'Contratual': 'bg-neutral-200 text-black',
    };

    // ─── Render ────────────────────────────────────────────

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl border border-white/10 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {loading || !process ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Status Header */}
                        <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-900/50">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {process.labels.map(label => (
                                            <span key={label.id} className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm" style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#000', border: `1px solid rgba(0,0,0,0.1)` }}>
                                                {label.name}
                                            </span>
                                        ))}
                                        <button onClick={() => setShowLabelPicker(!showLabelPicker)} className="text-[10px] font-bold px-2 py-0.5 rounded border border-dashed border-gray-300 dark:border-slate-700 text-gray-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all">
                                            + ETIQUETA
                                        </button>
                                    </div>

                                    {editingTitle ? (
                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                value={titleDraft}
                                                onChange={e => setTitleDraft(e.target.value)}
                                                className="text-2xl font-black bg-white dark:bg-slate-800 p-2 rounded-xl border-2 border-neutral-900 dark:border-neutral-100 outline-none w-full text-gray-900 dark:text-white shadow-lg"
                                                autoFocus
                                                onKeyDown={e => e.key === 'Enter' && saveTitle()}
                                            />
                                            <button onClick={saveTitle} className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-lg hover:opacity-90 transition-all"><Save size={20} /></button>
                                            <button onClick={() => setEditingTitle(false)} className="p-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 rounded-xl hover:bg-neutral-300 transition-all"><X size={20} /></button>
                                        </div>
                                    ) : (
                                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight tracking-tight cursor-pointer hover:text-black dark:hover:text-white/80 transition-colors" onClick={() => setEditingTitle(true)}>
                                            {process.title}
                                        </h2>
                                    )}

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400">
                                            <FileText size={14} /> {process.number}
                                        </span>
                                        {process.area && (
                                            <span className={`px-2 py-1 rounded-lg text-white ${areaColors[process.area] || 'bg-slate-500'}`}>
                                                {process.area}
                                            </span>
                                        )}
                                        {process.client && (
                                            <span className="flex items-center gap-1.5">
                                                <User size={14} /> {process.client.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button onClick={() => setShowDeleteConfirm(true)} className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-800 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm">
                                        <Trash2 size={20} />
                                    </button>
                                    <button onClick={onClose} className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Split layout */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Main Scrollable Area */}
                            <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 space-y-10 custom-scrollbar">
                                {/* Quick Actions */}
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={copyProcessNumber} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 transition-all border border-gray-100 dark:border-slate-700 shadow-sm">
                                        <Copy size={14} /> COPIAR CNJ
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl text-xs font-bold text-black dark:text-white transition-all border border-black/10 dark:border-white/20 shadow-sm">
                                        <ExternalLink size={14} /> VER CLIENTE
                                    </button>
                                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 transition-all border border-gray-100 dark:border-slate-700 shadow-sm">
                                        <Printer size={14} /> IMPRIMIR CAPA
                                    </button>
                                </div>

                                {/* Metadata Cards */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Responsável</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{process.assignedTo || 'Não atribuído'}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prazo Final</p>
                                        <p className={`text-sm font-bold ${process.deadline && new Date(process.deadline) < new Date() ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {process.deadline ? new Date(process.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fase Atual</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{process.status}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tribunal</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{process.court || 'Não informado'}</p>
                                    </div>
                                </div>

                                {/* Memorial Selection */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <FileText size={18} className="text-black dark:text-white" /> Memorial do Caso
                                        </h3>
                                        <button onClick={() => setEditingDesc(!editingDesc)} className="text-[10px] font-bold text-black dark:text-white bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all">
                                            {editingDesc ? 'CANCELAR' : 'EDITAR CONTEÚDO'}
                                        </button>
                                    </div>
                                    {editingDesc ? (
                                        <div className="space-y-4">
                                            <textarea
                                                value={descDraft}
                                                onChange={e => setDescDraft(e.target.value)}
                                                className="w-full h-48 p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-500 text-gray-900 dark:text-white outline-none text-sm leading-relaxed"
                                                autoFocus
                                            />
                                            <div className="flex justify-end">
                                                <button onClick={saveDesc} className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg shadow-black/20 hover:opacity-90 transition-all flex items-center gap-2">
                                                    <Save size={16} /> SALVAR ALTERAÇÕES
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 min-h-[100px]" onClick={() => setEditingDesc(true)}>
                                            {process.description || 'Clique para adicionar um memorial detalhado deste caso...'}
                                        </div>
                                    )}
                                </section>

                                {/* Checklists Section */}
                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                            <CheckSquare size={18} className="text-black dark:text-white" /> Checklists de Execução
                                        </h3>
                                        <button onClick={handleCreateChecklist} className="text-[10px] font-bold text-black dark:text-white bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all">
                                            + NOVO CHECKLIST
                                        </button>
                                    </div>

                                    {totalChecklistItems > 0 && (
                                        <div className="mb-6 flex items-center gap-4">
                                            <div className="flex-1 h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner">
                                                <div className="h-full bg-gradient-to-r from-neutral-800 to-black dark:from-neutral-200 dark:to-white transition-all duration-700" style={{ width: `${checklistProgress}%` }} />
                                            </div>
                                            <span className="text-[11px] font-black text-black dark:text-white whitespace-nowrap">{checklistProgress}% CONCLUÍDO</span>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {process.checklists.map(checklist => (
                                            <div key={checklist.id} className="bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{checklist.title}</h4>
                                                    <button onClick={() => handleDeleteChecklist(checklist.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    {checklist.items.map(item => (
                                                        <div key={item.id} className="flex items-center gap-3 group">
                                                            <button 
                                                                onClick={() => toggleChecklistItem(item.id, item.completed)}
                                                                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-black dark:bg-white border-black dark:border-white shadow-sm shadow-black/30' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}
                                                            >
                                                                {item.completed && <span className="text-white dark:text-black text-[10px]">✓</span>}
                                                            </button>
                                                            <span className={`flex-1 text-sm ${item.completed ? 'text-gray-400 line-through decoration-2' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>{item.text}</span>
                                                            <button onClick={() => handleDeleteChecklistItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                                {addingChecklistItem === checklist.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            value={newItemText}
                                                            onChange={e => setNewItemText(e.target.value)}
                                                            className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/20"
                                                            placeholder="O que precisa ser feito?"
                                                            autoFocus
                                                            onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem(checklist.id)}
                                                        />
                                                        <button onClick={() => handleAddChecklistItem(checklist.id)} className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-md"><Plus size={16} /></button>
                                                        <button onClick={() => setAddingChecklistItem(null)} className="p-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 rounded-xl"><X size={16} /></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setAddingChecklistItem(checklist.id)} className="text-[11px] font-bold text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-2 transition-colors">
                                                        <Plus size={14} /> ADICIONAR ITEM
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* Activity Column (Side Panel) */}
                            <div className="w-full md:w-[360px] bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar p-8 border-l border-gray-100 dark:border-slate-800">
                                <div className="space-y-10">
                                    {/* Activity Header */}
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-black/5 dark:bg-white/10 rounded-xl text-black dark:text-white">
                                            <MessageSquare size={18} />
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Histórico de Atividades</h3>
                                    </div>

                                    {/* Comentários */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">COMENTÁRIOS E NOTAS</h4>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center text-white dark:text-black text-xs font-black shadow-sm shrink-0">V</div>
                                            <div className="flex-1 group">
                                                <textarea 
                                                    value={commentText}
                                                    onChange={e => setCommentText(e.target.value)}
                                                    className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl p-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                                                    placeholder="Escreva algo importante..."
                                                    rows={1}
                                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddComment())}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {process.comments.map(c => (
                                                <div key={c.id} className="flex gap-3 group">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-gray-500 shrink-0">
                                                        {c.user.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-[11px] font-black text-gray-900 dark:text-white">{c.user.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-bold text-gray-400">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                                                                <button onClick={() => handleDeleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={10} /></button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-slate-800/30 p-2.5 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-800/50">{c.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">LINHA DO TEMPO</h4>
                                        <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100 dark:before:bg-slate-800">
                                            {(showAllUpdates ? process.updates : process.updates.slice(0, 8)).map(upd => {
                                                const typeInfo = UPDATE_TYPE_ICONS[upd.type] || UPDATE_TYPE_ICONS['OUTRO'];
                                                return (
                                                    <div key={upd.id} className="relative group">
                                                        <div className={`absolute -left-[27px] top-0 w-[10px] h-[10px] rounded-full ring-4 ring-white dark:ring-slate-900 ${typeInfo.color.replace('text-', 'bg-')} z-10 transition-transform group-hover:scale-125`} />
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{upd.type}</p>
                                                            <span className="text-[9px] font-bold text-gray-400">{new Date(upd.date).toLocaleDateString('pt-BR')}</span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight p-2 bg-gray-50/30 dark:bg-slate-800/20 rounded-xl border border-gray-100 dark:border-slate-800/50 group-hover:border-blue-500/30 transition-all">{upd.description}</p>
                                                    </div>
                                                );
                                            })}
                                            {process.updates.length > 8 && (
                                                <button onClick={() => setShowAllUpdates(!showAllUpdates)} className="text-[10px] font-black text-black dark:text-white hover:underline">
                                                    {showAllUpdates ? 'OCULTAR HISTÓRICO' : `VER MAIS ${process.updates.length - 8} REGISTROS`}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer (Simplified) */}
                        <div className="px-8 py-4 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>Criado em {new Date(process.createdAt).toLocaleDateString()}</span>
                            <span>Sistema Antigravity • V1.8.0</span>
                        </div>
                    </>
                )}

                {/* Modal de confirmação de exclusão */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-2xl border border-gray-100 dark:border-slate-800 max-w-sm w-full text-center">
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-pulse">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">Tem certeza?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">Você está prestes a excluir permanentemente o caso <br/><span className="text-gray-900 dark:text-white font-bold">{process?.title}</span>.<br/>Esta ação não pode ser desfeita.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setShowDeleteConfirm(false)} className="py-3.5 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
                                <button onClick={handleDeleteProcess} className="py-3.5 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all">Confirmar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Label Picker Popover */}
                {showLabelPicker && (
                    <div className="absolute top-24 left-8 z-[60] bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 w-80 animate-slide-in">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Gerenciar Etiquetas</h4>
                            <button onClick={() => setShowLabelPicker(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {allLabels.map(l => (
                                <button 
                                    key={l.id} 
                                    onClick={() => handleToggleLabel(l.id)}
                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border-2 transition-all ${process?.labels.some(pl => pl.id === l.id) ? 'text-white shadow-md' : 'text-gray-500 border-gray-100 dark:border-slate-800 hover:border-gray-300'}`}
                                    style={process?.labels.some(pl => pl.id === l.id) ? { backgroundColor: l.color, borderColor: l.color } : {}}
                                >
                                    {l.name}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                            <input 
                                value={newLabelName}
                                onChange={e => setNewLabelName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20" 
                                placeholder="Nova etiqueta..."
                            />
                            <div className="flex gap-2 justify-center">
                                {LABEL_COLORS.map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => setNewLabelColor(c)} 
                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${newLabelColor === c ? 'border-gray-900 dark:border-white scale-125 shadow-md' : 'border-transparent hover:scale-110'}`} 
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                            <button onClick={handleCreateNewLabel} className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-black tracking-widest hover:opacity-90 shadow-lg shadow-black/20">CRIAR ETIQUETA</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
