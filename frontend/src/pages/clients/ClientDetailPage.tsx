import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Briefcase, FileText, DollarSign, 
    Plus, X, MapPin, Mail, Phone, Search, Filter, MoreHorizontal,
    AlertCircle, ChevronRight, Edit2, Trash2, StickyNote, History, User,
    CheckCircle, Circle, CheckSquare, Clock, Calendar, TrendingUp, 
    CheckCircle2, FileBadge, Send, Check, Headset
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

class ErrorBoundary extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }
    componentDidCatch(error: any, errorInfo: any) {
        this.setState({ errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: '#b91c1c', backgroundColor: '#fee2e2', minHeight: '100vh', overflow: 'auto' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Algo deu errado na renderização desta página.</h1>
                    <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
                    <pre style={{ marginTop: '20px', whiteSpace: 'pre-wrap', fontSize: '12px', background: '#f87171', color: 'white', padding: '10px', borderRadius: '4px' }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export function ClientDetailPageContent({ clientIdProp, isDrawer = false }: { clientIdProp?: string, isDrawer?: boolean }) {
    const { id: paramId } = useParams();
    const id = clientIdProp || paramId;
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [newNote, setNewNote] = useState('');
    const [isUrgentNote, setIsUrgentNote] = useState(false);
    const [savingNote, setSavingNote] = useState(false);

    // Tags
    const [showAddTag, setShowAddTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#6366f1');
    const [savingTag, setSavingTag] = useState(false);

    // CRMs
    const [newItemText, setNewItemText] = useState('');
    const [addingItem, setAddingItem] = useState(false);
    const [showServiceLogModal, setShowServiceLogModal] = useState(false);
    const [newServiceLog, setNewServiceLog] = useState({ type: 'MEETING', durationMinutes: 30, summary: '' });

    // Tab navigation
    const [activeTab, setActiveTab] = useState('geral');
    const tabs = [
        { id: 'geral', label: 'Visão Geral', icon: User },
        { id: 'processos', label: 'Processos', icon: Briefcase },
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
        { id: 'notas', label: 'Anotações', icon: StickyNote },
        { id: 'timeline', label: 'Linha do Tempo', icon: History },
    ];

    useEffect(() => {
        if (id) {
            fetchClient();
        }
    }, [id]);

    const fetchClient = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/clients/${id}/complete`);
            if (!response.data) {
                addToast('Cliente não encontrado.', 'warning');
                navigate('/clientes');
                return;
            }
            setClient(response.data);
        } catch (error) {
            console.error('Error fetching client', error);
            addToast('Erro ao carregar cliente.', 'error');
            navigate('/clientes');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        try {
            setSavingNote(true);
            await api.post(`/clients/${id}/notes`, { content: newNote, isUrgent: isUrgentNote });
            addToast('Anotação salva com sucesso.', 'success');
            setNewNote('');
            setIsUrgentNote(false);
            fetchClient();
        } catch (error) {
            console.error('Error adding note:', error);
            addToast('Erro ao salvar anotação.', 'error');
        } finally {
            setSavingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta anotação?')) return;
        try {
            await api.delete(`/clients/notes/${noteId}`);
            addToast('Anotação excluída.', 'success');
            fetchClient();
        } catch (error) {
            console.error(error);
            addToast('Erro ao excluir anotação.', 'error');
        }
    };

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        try {
            setSavingTag(true);
            await api.post(`/clients/${id}/tags`, { name: newTagName, color: newTagColor, order: 0 });
            setNewTagName('');
            setShowAddTag(false);
            fetchClient();
        } catch (error) {
            console.error(error);
            addToast('Erro ao criar tag.', 'error');
        } finally {
            setSavingTag(false);
        }
    };

    const handleRemoveTag = async (tagId: string) => {
        try {
            await api.delete(`/clients/tags/${tagId}`);
            fetchClient();
        } catch (error) {
            console.error(error);
            addToast('Erro ao remover tag.', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/clients/${id}`);
            addToast('Cliente excluído com sucesso.', 'success');
            navigate('/clientes');
        } catch (error) {
            addToast('Erro ao excluir cliente.', 'error');
            console.error(error);
        }
    };

    const handleAddChecklistItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemText.trim() || !client) return;
        setAddingItem(true);
        try {
            await api.post(`/clients/${client.id}/checklists`, { text: newItemText });
            setNewItemText('');
            fetchClient();
        } catch (error) {
            console.error(error);
            addToast('Erro ao adicionar item.', 'error');
        } finally {
            setAddingItem(false);
        }
    };

    const handleToggleChecklist = async (itemId: string, completed: boolean) => {
        try {
            await api.patch(`/clients/checklists/${itemId}`, { completed });
            fetchClient();
        } catch (error) {
            console.error(error);
            addToast('Erro ao atualizar.', 'error');
        }
    };

    const handleDeleteChecklist = async (itemId: string) => {
        try {
            await api.delete(`/clients/checklists/${itemId}`);
            fetchClient();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddServiceLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newServiceLog.summary.trim()) return;
        try {
            await api.post(`/clients/${client.id}/service-logs`, newServiceLog);
            addToast('Atendimento registrado.', 'success');
            setNewServiceLog({ type: 'MEETING', durationMinutes: 30, summary: '' });
            setShowServiceLogModal(false);
            fetchClient();
        } catch (error) {
            console.error(error);
            addToast('Erro ao registrar atendimento.', 'error');
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Não informado';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const handleToggleStatus = async () => {
        if (!client) return;
        try {
            const newStatus = client.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
            await api.patch(`/clients/${id}/status`, { status: newStatus });
            addToast(`Status alterado para ${newStatus}.`, 'success');
            fetchClient();
        } catch (error) {
            console.error(error);
            addToast('Erro ao alterar status.', 'error');
        }
    };

    const processes = useMemo(() => client?.processes || [], [client?.processes]);
    const financials = useMemo(() => client?.financialRecords || [], [client?.financialRecords]);
    const notes = useMemo(() => client?.notes || [], [client?.notes]);

    const hasUrgentNotes = useMemo(() => notes.some((n: any) => n.isUrgent), [notes]);

    const totalPendencies = useMemo(() => financials.filter((f: any) => f.status === 'PENDING' && f.type === 'INCOME').reduce((acc: number, f: any) => acc + f.amount, 0), [financials]);
    const totalPaid = useMemo(() => financials.filter((f: any) => f.status === 'PAID' && f.type === 'INCOME').reduce((acc: number, f: any) => acc + f.amount, 0), [financials]);

    const serviceLogs = useMemo(() => client?.serviceLogs || [], [client?.serviceLogs]);
    const checklistItems = useMemo(() => client?.checklistItems || [], [client?.checklistItems]);

    // Linha do tempo estruturada (Timeline)
    const timeline = useMemo(() => {
        if (!client) return [];
        return [
            ...processes.map((p: any) => ({
                id: `proc_${p.id}`,
                date: p.createdAt,
                type: 'PROCESS',
                title: `Processo Criado`,
                description: `Processo ${p.number || p.title} foi aberto.`
            })),
            ...processes.flatMap((p: any) => (p.updates || []).map((u: any) => ({
                id: `update_${u.id}`,
                date: u.date,
                type: 'UPDATE',
                title: `Movimentação: ${p.title}`,
                description: u.description
            }))),
            ...notes.map((n: any) => ({
                id: `note_${n.id}`,
                date: n.createdAt,
                type: 'NOTE',
                title: 'Anotação Adicionada',
                description: n.content,
                noteId: n.id,
                author: n.createdBy
            })),
            ...financials.map((f: any) => ({
                id: `fin_${f.id}`,
                date: f.date,
                type: 'FINANCIAL',
                title: f.type === 'INCOME' ? 'Receita Lançada' : 'Despesa Lançada',
                description: `${f.description} - ${formatCurrency(f.amount)}`,
                status: f.status
            })),
            ...serviceLogs.map((s: any) => ({
                id: `log_${s.id}`,
                date: s.date,
                type: 'SERVICE_LOG',
                title: `Atendimento: ${s.type}`,
                description: s.summary + (s.durationMinutes ? ` (${s.durationMinutes} min)` : ''),
            })),
            {
                id: `client_created`,
                date: client.createdAt,
                type: 'CREATED',
                title: 'Cliente Cadastrado',
                description: 'Perfil do cliente foi criado no sistema.'
            }
        ].sort((a, b) => {
            const timeA = a.date ? new Date(a.date).getTime() : 0;
            const timeB = b.date ? new Date(b.date).getTime() : 0;
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });
    }, [processes, notes, financials, serviceLogs, client]);

    if (loading) {
        return (
            <div className="space-y-6 p-4 lg:p-8 animate-pulse">
                {/* Header skeleton */}
                <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-app-stroke/40" />
                        <div>
                            <div className="h-7 w-48 bg-app-stroke/40 rounded-lg mb-2" />
                            <div className="h-4 w-64 bg-app-stroke/30 rounded" />
                        </div>
                    </div>
                </div>
                {/* Contact bar skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-14 bg-app-card border border-app-stroke rounded-xl" />
                    ))}
                </div>
                {/* Tab skeleton */}
                <div className="flex gap-2 border-b border-app-stroke pb-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-9 w-24 bg-app-stroke/30 rounded-lg" />
                    ))}
                </div>
                {/* Content skeleton */}
                <div className="bg-app-card border border-app-stroke rounded-2xl p-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-app-stroke/30 rounded-lg" />
                            <div className="flex-1">
                                <div className="h-4 w-40 bg-app-stroke/40 rounded mb-1" />
                                <div className="h-3 w-60 bg-app-stroke/30 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] bg-slate-50 dark:bg-slate-950 p-8">
                <AlertCircle size={48} className="text-slate-400 mb-4" />
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Cliente não encontrado</h2>
                <p className="text-slate-500 mb-6 text-center max-w-md">O cliente procurado não existe ou você não possui acesso a ele.</p>
                <button
                    onClick={() => navigate('/clientes')}
                    className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
                >
                    Voltar para Clientes
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto w-full h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative">
            {/* Header Sticky */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 p-4 lg:px-8">
                <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {!isDrawer && (
                            <button
                                onClick={() => navigate('/clientes')}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} className="text-slate-500" />
                            </button>
                        )}
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    {client.name}
                                    {hasUrgentNotes && (
                                        <span className="relative flex h-3 w-3" title="Cliente possui anotações urgentes!">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    )}
                                </h1>
                                <button
                                    onClick={handleToggleStatus}
                                    className={clsx(
                                        "px-2.5 py-0.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80",
                                        client.status === 'ATIVO' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                        client.status === 'INATIVO' ? "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400" :
                                        "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                                    )}
                                    title="Clique para alterar status"
                                >
                                    {client.status || 'NOVO'}
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                <MapPin size={14} /> {client.city ? `${client.city} - ${client.state}` : 'Localização não informada'}
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                Cadastrado em {formatDate(client.createdAt)}
                            </p>

                            {/* Tags Section */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                {client.tags?.map((tag: any) => (
                                    <span 
                                        key={tag.id}
                                        className="group flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all"
                                        style={{ backgroundColor: tag.color + '15', color: tag.color, borderColor: tag.color + '30' }}
                                    >
                                        <Tag size={10} />
                                        {tag.name}
                                        <button 
                                            onClick={() => handleRemoveTag(tag.id)}
                                            className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/20 rounded-full p-0.5 transition-all"
                                            title="Remover tag"
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                
                                {showAddTag ? (
                                    <form onSubmit={handleAddTag} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 pl-2 pr-1 py-1 h-7 shadow-sm">
                                        <input 
                                            type="color" 
                                            value={newTagColor}
                                            onChange={e => setNewTagColor(e.target.value)}
                                            className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input 
                                            type="text"
                                            value={newTagName}
                                            onChange={e => setNewTagName(e.target.value)}
                                            placeholder="Nova tag"
                                            className="bg-transparent border-none text-[11px] font-medium w-20 focus:outline-none text-slate-700 dark:text-slate-300"
                                            autoFocus
                                        />
                                        <button type="submit" disabled={!newTagName.trim() || savingTag} className="p-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50">
                                            <Check size={12} />
                                        </button>
                                        <button type="button" onClick={() => setShowAddTag(false)} className="p-1 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </form>
                                ) : (
                                    <button 
                                        onClick={() => setShowAddTag(true)}
                                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-700 border-dashed transition-colors"
                                    >
                                        <Plus size={10} />
                                        Add Tag
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate(`/clientes/${id}/editar`)}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-sm font-medium transition-all hover:shadow-md"
                        >
                            <Edit2 size={16} />
                            <span className="hidden sm:inline">Editar</span>
                        </button>
                        <button 
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 rounded-xl text-sm font-medium transition-all hover:shadow-md"
                        >
                            <Trash2 size={16} />
                            Excluir
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Contact Bar */}
            <div className="max-w-[1600px] mx-auto w-full px-4 lg:px-8 pt-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <a href={client.phone ? `https://wa.me/55${String(client.phone).replace(/\D/g, '')}` : '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => !client.phone && e.preventDefault()} className={clsx("flex items-center gap-3 p-3 rounded-xl border transition-all", client.phone ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 cursor-not-allowed")}>
                        <MessageSquare size={18} /><span className="text-sm font-medium">WhatsApp</span>
                    </a>
                    <a href={client.phone ? `tel:${client.phone}` : '#'} onClick={(e) => !client.phone && e.preventDefault()} className={clsx("flex items-center gap-3 p-3 rounded-xl border transition-all", client.phone ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 cursor-not-allowed")}>
                        <Phone size={18} /><span className="text-sm font-medium">Ligar</span>
                    </a>
                    <a href={client.email ? `mailto:${client.email}` : '#'} onClick={(e) => !client.email && e.preventDefault()} className={clsx("flex items-center gap-3 p-3 rounded-xl border transition-all", client.email ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 cursor-not-allowed")}>
                        <Mail size={18} /><span className="text-sm font-medium truncate">{client.email || 'Email não informado'}</span>
                    </a>
                    <div className="flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r from-emerald-50 to-rose-50 border-slate-200 dark:from-emerald-500/10 dark:to-rose-500/10 dark:border-slate-700">
                        <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <div className="flex gap-3 text-xs font-bold">
                            <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <span className="text-rose-600 dark:text-rose-400">{formatCurrency(totalPendencies)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-[1600px] mx-auto w-full px-4 lg:px-8 pt-6">
                <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx("flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap", activeTab === tab.id ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50")}>
                                <Icon size={16} />{tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-[1600px] mx-auto w-full p-4 lg:p-8">
                <div>
                    
                    {activeTab === 'geral' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                        
                        {/* Coluna Principal (Dados e Narrativa) */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Dados Pessoais */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                                    <FileBadge size={20} className="text-indigo-500" />
                                    Dados Pessoais
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Documento (CPF/CNPJ)</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.document || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">RG</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.rg || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Data de Nascimento</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDate(client.birthDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Profissão</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.occupation || 'Não informado'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-1">Endereço Completo</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {client.address || 'Não informado'}
                                            {client.city && <span className="block mt-1 text-slate-500 dark:text-slate-400 font-normal">{client.city} - {client.state} {client.zipCode ? `| CEP: ${client.zipCode}` : ''}</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Fatos e Demanda */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm relative overflow-hidden">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <FileText size={20} className="text-amber-500" />
                                        Fatos e Demanda
                                    </h3>
                                    {client.urgencyLevel && (
                                        <span className={clsx(
                                            "px-3 py-1 text-[10px] font-bold uppercase rounded-full shadow-sm",
                                            client.urgencyLevel === 'URGENTE' ? "bg-rose-500 text-white" :
                                            client.urgencyLevel === 'ALTA' ? "bg-amber-500 text-white" :
                                            "bg-indigo-500 text-white"
                                        )}>
                                            {client.urgencyLevel}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-2">Tipo de Demanda</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 inline-block px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">{client.demandType || 'Não classificado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-2">Resumo da Demanda</p>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                                            {client.demandSummary || 'Nenhum resumo adicionado.'}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold mb-2">Descrição Detalhada</p>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 whitespace-pre-wrap min-h-[120px]">
                                            {client.factsDescription || 'Sem detalhes informados.'}
                                        </div>
                                    </div>
                                    
                                    {/* Campos Específicos Integrados */}
                                    {client.customFields && Object.keys(client.customFields).length > 0 && (
                                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 md:col-span-2">
                                            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-bold mb-4">Campos Específicos ({client.demandType})</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {Object.entries(client.customFields).map(([key, value]) => {
                                                    if (!value) return null;
                                                    const labelMap: Record<string, string> = {
                                                        nit: 'NIT / PIS',
                                                        dib: 'DIB / DER',
                                                        benefit: 'Benefício',
                                                        admissionDate: 'Admissão',
                                                        resignationDate: 'Demissão',
                                                        lastSalary: 'Salário',
                                                        role: 'Cargo',
                                                        bankName: 'Banco',
                                                        contractNumber: 'Contrato',
                                                        opponentName: 'Oponente',
                                                        civelValue: 'Valor da Causa',
                                                        executionTitle: 'Título',
                                                        debtValue: 'Dívida',
                                                    };
                                                    let displayVal = value as string;
                                                    if (key.toLowerCase().includes('date') || key === 'dib') displayVal = formatDate(value as string);
                                                    return (
                                                        <div key={key} className="p-3 bg-cyan-50/50 dark:bg-cyan-500/5 rounded-xl border border-cyan-100 dark:border-cyan-500/10">
                                                            <p className="text-[9px] font-bold text-cyan-600/70 dark:text-cyan-400/70 uppercase tracking-tighter mb-1">{labelMap[key] || key}</p>
                                                            <p className="text-xs font-bold text-cyan-800 dark:text-cyan-300">{displayVal}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Barra Lateral (Ações e Resumo) */}
                        <div className="space-y-8 lg:col-span-1">
                            {/* Resumo Financeiro na Sidebar */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-200 relative z-10 uppercase tracking-widest">
                                    <DollarSign size={18} className="text-emerald-500" />
                                    Painel Financeiro
                                </h3>
                                <div className="grid grid-cols-1 gap-4 relative z-10 mb-6">
                                    <div className="p-4 bg-emerald-50/70 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-500/20">
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mb-1">Recebido</p>
                                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(totalPaid)}</p>
                                    </div>
                                    <div className="p-4 bg-rose-50/70 dark:bg-rose-500/10 rounded-2xl border border-rose-100/50 dark:border-rose-500/20">
                                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest mb-1">Pendente</p>
                                        <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{formatCurrency(totalPendencies)}</p>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/financeiro', { state: { clientId: client.id } })} className="w-full py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 relative z-10 flex items-center justify-center gap-2">
                                    Acessar Fluxo Completo <ChevronRight size={14} />
                                </button>
                            </div>

                            {/* Checklist de Onboarding */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col min-h-[450px]">
                                <h3 className="text-sm font-bold flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                    <CheckSquare size={18} className="text-teal-500" />
                                    Checklist de Onboarding
                                </h3>
                                
                                <form onSubmit={handleAddChecklistItem} className="flex gap-2 mb-6 relative z-10">
                                    <input 
                                        type="text" 
                                        value={newItemText} 
                                        onChange={e => setNewItemText(e.target.value)} 
                                        placeholder="Nova tarefa..." 
                                        className="flex-1 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                    <button type="submit" disabled={addingItem || !newItemText.trim()} className="p-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50">
                                        <Plus size={18} />
                                    </button>
                                </form>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {checklistItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full opacity-40">
                                            <CheckSquare size={40} className="mb-2 text-slate-300" />
                                            <p className="text-xs text-slate-500 font-medium italic">Sem documentos pendentes</p>
                                        </div>
                                    ) : (
                                        checklistItems.map((item: any) => (
                                            <motion.div layout key={item.id} className="flex items-start gap-4 p-3 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl group transition-all hover:border-teal-500/30">
                                                <button 
                                                    onClick={() => handleToggleChecklist(item.id, !item.completed)} 
                                                    className={clsx("mt-1 shrink-0 transition-all transform hover:scale-110", item.completed ? "text-teal-500" : "text-slate-300 dark:text-slate-600 hover:text-teal-400")}
                                                >
                                                    {item.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                                                </button>
                                                <span className={clsx("text-sm flex-1 font-medium transition-all", item.completed ? "text-slate-400 line-through italic" : "text-slate-600 dark:text-slate-300")}>{item.text}</span>
                                                <button onClick={() => handleDeleteChecklist(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-colors rounded">
                                                    <X size={14} />
                                                </button>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* === TAB: PROCESSOS === */}
                    {activeTab === 'processos' && (
                    <div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Briefcase size={20} className="text-blue-500" />
                                    Processos ({processes.length})
                                </h3>
                                <button onClick={() => navigate('/processos/novo', { state: { clientId: client.id } })} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-md transition-colors" title="Novo Processo">
                                    <Plus size={18} />
                                </button>
                            </div>
                            <div className="p-4 space-y-3">
                                {processes.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <Briefcase size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum processo vinculado</p>
                                        <button onClick={() => navigate('/processos/novo', { state: { clientId: client.id } })} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">Adicionar Processo</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {processes.map((proc: any) => (
                                        <div key={proc.id} onClick={() => navigate(`/processos/${proc.id}`)} className="group p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:border-blue-500/50 cursor-pointer transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-blue-500 transition-colors">{proc.title}</h4>
                                                    <p className="text-xs font-mono text-slate-500 mt-0.5">{proc.number}</p>
                                                </div>
                                                <span className={clsx("px-2 py-0.5 text-[10px] font-bold rounded", proc.status === 'OPEN' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400")}>{proc.status === 'OPEN' ? 'Ativo' : 'Encerrado'}</span>
                                            </div>
                                            {(proc.court || proc.area) && (
                                                <div className="flex gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                                                    {proc.area && <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm">{proc.area}</span>}
                                                    {proc.court && <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm truncate">{proc.court}</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    )}

                    {/* === TAB: FINANCEIRO === */}
                    {activeTab === 'financeiro' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={80} /></div>
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 relative z-10"><DollarSign size={20} className="text-emerald-500" />Resumo Financeiro</h3>
                            <div className="grid grid-cols-2 gap-4 relative z-10 mb-6">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Recebido</p>
                                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalPaid)}</p>
                                </div>
                                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20">
                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">Pendente</p>
                                    <p className="text-xl font-bold text-rose-700 dark:text-rose-300">{formatCurrency(totalPendencies)}</p>
                                </div>
                            </div>
                            {financials.length > 0 && (
                                <div className="relative z-10 space-y-2 mb-4">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lançamentos</p>
                                    {financials.map((fin: any) => (
                                        <div key={fin.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0", fin.type === 'INCOME' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400")}>
                                                    {fin.type === 'INCOME' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{fin.description}</p>
                                                    <p className="text-xs text-slate-500">{formatDate(fin.date)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <p className={clsx("text-sm font-bold", fin.type === 'INCOME' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{fin.type === 'INCOME' ? '+' : '-'}{formatCurrency(fin.amount)}</p>
                                                <p className="text-[10px] font-semibold uppercase text-slate-400">{fin.status === 'PAID' ? 'Pago' : 'Pendente'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button onClick={() => navigate('/financeiro', { state: { clientId: client.id } })} className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 relative z-10 flex items-center justify-center gap-2">
                                Acessar Financeiro Completo <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    )}

                    {/* === TAB: ANOTAÇÕES === */}
                    {activeTab === 'notas' && (
                    <div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><StickyNote size={20} className="text-yellow-500" />Anotações</h3>
                            <form onSubmit={handleAddNote} className="mb-4 relative">
                                <textarea className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pb-8 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none pr-12" rows={3} placeholder="Adicionar nova anotação..." value={newNote} onChange={(e) => setNewNote(e.target.value)} disabled={savingNote} />
                                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <input type="checkbox" checked={isUrgentNote} onChange={(e) => setIsUrgentNote(e.target.checked)} className="sr-only" />
                                        <div className={clsx("w-4 h-4 rounded flex items-center justify-center border transition-colors", isUrgentNote ? "bg-red-500 border-red-500 text-white" : "bg-white border-slate-300 dark:bg-slate-700 dark:border-slate-600 group-hover:border-red-400")}>{isUrgentNote && <Check size={12} />}</div>
                                        <span className={clsx("text-xs font-medium transition-colors", isUrgentNote ? "text-red-500" : "text-slate-500 dark:text-slate-400")}>Urgente</span>
                                    </label>
                                </div>
                                <button type="submit" disabled={savingNote || !newNote.trim()} className="absolute bottom-3 right-3 p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors">
                                    {savingNote ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Send size={16} />}
                                </button>
                            </form>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {notes.length === 0 ? (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhuma anotação registrada.</p>
                                ) : (
                                    notes.map((note: any) => (
                                        <div key={note.id} className={clsx("p-3 rounded-xl relative group border", note.isUrgent ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" : "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20")}>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 pr-6 whitespace-pre-wrap">{note.content}</p>
                                            <div className={clsx("flex items-center gap-2 mt-2 pt-2 border-t text-[10px] font-medium", note.isUrgent ? "border-red-200/50 dark:border-red-500/10 text-red-600/70 dark:text-red-400/80" : "border-yellow-200/50 dark:border-yellow-500/10 text-slate-500")}>
                                                <span>{formatDate(note.createdAt)}</span>
                                                {note.createdBy && (<><span>•</span><span>{note.createdBy}</span></>)}
                                                {note.isUrgent && (<><span>•</span><span className="uppercase text-red-600 dark:text-red-400 font-bold tracking-wider">Urgente</span></>)}
                                            </div>
                                            <button onClick={() => handleDeleteNote(note.id)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"><X size={14} /></button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    )}

                    {/* === TAB: LINHA DO TEMPO === */}
                    {activeTab === 'timeline' && (
                    <div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2"><History size={20} className="text-indigo-500" />Linha do Tempo</h3>
                                <button onClick={() => setShowServiceLogModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:hover:bg-teal-500/20 rounded-md transition-colors text-sm font-medium">
                                    <Headset size={16} /> Registrar Atendimento
                                </button>
                            </div>
                            <div className="relative pl-8 space-y-0 max-h-[600px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                                {/* Vertical connecting line */}
                                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500/40 via-slate-200 dark:via-slate-700 to-transparent" />
                                
                                {timeline.length === 0 ? (
                                    <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
                                ) : (
                                    timeline.map((event: any) => {
                                        const iconMap: Record<string, { icon: any; color: string; bg: string }> = {
                                            'PROCESS':  { icon: Briefcase,    color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-500/20' },
                                            'UPDATE':   { icon: History,      color: 'text-purple-500',  bg: 'bg-purple-100 dark:bg-purple-500/20' },
                                            'NOTE':     { icon: StickyNote,   color: 'text-amber-500',   bg: 'bg-amber-100 dark:bg-amber-500/20' },
                                            'FINANCIAL':{ icon: DollarSign,   color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
                                            'CREATED':  { icon: User,         color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-500/20' },
                                            'SERVICE_LOG':{ icon: Headset,    color: 'text-teal-500',    bg: 'bg-teal-100 dark:bg-teal-500/20' },
                                        };
                                        const style = iconMap[event.type] || iconMap['CREATED'];
                                        const IconComp = style.icon;
                                        return (
                                            <div key={event.id} className="relative pb-6 last:pb-0 group">
                                                {/* Timeline dot with icon */}
                                                <div className={clsx("absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm transition-transform group-hover:scale-110", style.bg)}>
                                                    <IconComp size={14} className={style.color} />
                                                </div>
                                                <div className="ml-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={clsx("text-xs font-bold uppercase tracking-wider", style.color)}>{event.title}</span>
                                                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{formatDate(event.date)}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">{event.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                    )}

                </div>
            </div>

            {/* Modal de Exclusão */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                    <AlertCircle size={20} />
                                    Excluir Cliente
                                </h3>
                                <button onClick={() => setShowDeleteModal(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-700 dark:text-slate-300 mb-4">
                                    Tem certeza que deseja excluir o cliente <strong>{client.name}</strong>?
                                </p>
                                <p className="text-sm text-rose-600 dark:text-rose-400 font-medium p-3 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-100 dark:border-rose-500/20">
                                    ⚠️ ATENÇÃO: Esta ação também excluirá todos os processos, movimentações e documentos vinculados a este cliente de forma irreversível!
                                </p>
                                <div className="flex gap-3 mt-6">
                                    <button 
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleDelete}
                                        className="flex-1 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition shadow-lg shadow-rose-600/20"
                                    >
                                        Sim, Excluir
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Modal de Registro de Atendimento */}
                {showServiceLogModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Headset size={20} className="text-teal-500" />
                                    Registrar Atendimento
                                </h3>
                                <button onClick={() => setShowServiceLogModal(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddServiceLog} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Tipo de Atendimento</label>
                                        <select value={newServiceLog.type} onChange={e => setNewServiceLog({ ...newServiceLog, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500">
                                            <option value="MEETING">Reunião Presencial</option>
                                            <option value="VIDEO_CALL">Chamada de Vídeo</option>
                                            <option value="CALL">Ligação</option>
                                            <option value="WHATSAPP">WhatsApp</option>
                                            <option value="EMAIL">E-mail</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Duração (minutos)</label>
                                        <div className="relative">
                                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="number" value={newServiceLog.durationMinutes} onChange={e => setNewServiceLog({ ...newServiceLog, durationMinutes: parseInt(e.target.value) || 0 })} className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500" min="0" step="5" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Resumo do Atendimento</label>
                                        <textarea value={newServiceLog.summary} onChange={e => setNewServiceLog({ ...newServiceLog, summary: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-teal-500 min-h-[100px] resize-none" placeholder="O que foi discutido?" required />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowServiceLogModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition">Cancelar</button>
                                    <button type="submit" disabled={!newServiceLog.summary.trim()} className="px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition disabled:opacity-50">Salvar Registro</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ClientDetailPage() {
    return (
        <ErrorBoundary>
            <ClientDetailPageContent />
        </ErrorBoundary>
    );
}
