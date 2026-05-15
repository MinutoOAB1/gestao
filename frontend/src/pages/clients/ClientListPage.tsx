import { useEffect, useState, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Trash2, Printer, Briefcase, FileUp, Loader2, MessageCircle, Users, Filter, ChevronDown, MoreVertical, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { clsx } from 'clsx';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { haptics } from '../../utils/haptics';

// Optimized animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 260, damping: 20 }
    }
};

interface ClientTag {
    id: string;
    name: string;
    color: string;
    order: number;
}

interface Client {
    id: string;
    name: string;
    type: string;
    document: string;
    email: string;
    phone: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    demandType?: string;
    urgencyLevel?: string;
    tags?: ClientTag[];
    notes?: { id: string; isUrgent: boolean }[];
    _count?: {
        processes: number;
    };
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    ATIVO: { 
        label: 'Ativo', 
        bg: 'bg-emerald-500/10', 
        text: 'text-emerald-600 dark:text-emerald-400', 
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
    },
    INATIVO: { 
        label: 'Inativo', 
        bg: 'bg-slate-500/10', 
        text: 'text-slate-500', 
        border: 'border-slate-500/20',
        dot: 'bg-slate-400 shadow-none'
    },
    SUSPENSO: { 
        label: 'Suspenso', 
        bg: 'bg-amber-500/10', 
        text: 'text-amber-600', 
        border: 'border-amber-500/20',
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
    },
};

const AVATAR_GRADIENTS = [
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-slate-500 to-slate-700'
];

const getAvatarGradient = (id: string = '') => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

export default function ClientListPage() {
    const { addToast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLetter, setSelectedLetter] = useState('all');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [statusMenu, setStatusMenu] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isImporting, setIsImporting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [touchStart, setTouchStart] = useState(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            setTouchStart(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStart > 0) {
            const currentTouch = e.touches[0].clientY;
            const distance = currentTouch - touchStart;
            if (distance > 0 && distance < 150) {
                setPullDistance(distance);
            }
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance > 60) {
            setRefreshing(true);
            haptics.light();
            await fetchClients();
            setRefreshing(false);
        }
        setPullDistance(0);
        setTouchStart(0);
    };

    const handleWhatsAppClick = (e: React.MouseEvent, phone: string, name: string) => {
        e.stopPropagation();
        haptics.light();
        const cleanPhone = phone.replace(/\D/g, '');
        const message = encodeURIComponent(`Olá ${name.split(' ')[0]}, aqui é do escritório Advus. Gostaria de falar sobre o seu caso.`);
        window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
    };

    const handleImportSpreadsheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        
        reader.onload = async (evt) => {
            try {
                const dataBuffer = evt.target?.result;
                const wb = XLSX.read(dataBuffer, { type: 'array' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                let successCount = 0;
                let errorCount = 0;

                for (const row of data) {
                    try {
                        const normalizedRow: any = {};
                        Object.keys(row).forEach(key => {
                            const cleanKey = key.toLowerCase()
                                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                .replace(/[^a-z0-9]/g, '');
                            normalizedRow[cleanKey] = row[key];
                        });

                        const name = normalizedRow.nome || normalizedRow.name || normalizedRow.cliente || normalizedRow.razaosocial || normalizedRow.nomecompleto;
                        const document = String(normalizedRow.cpf || normalizedRow.cnpj || normalizedRow.documento || normalizedRow.cpfcnpj || '').replace(/\D/g, '');
                        const email = normalizedRow.email || normalizedRow.correio || normalizedRow.correioeletronico || '';
                        const phone = String(normalizedRow.telefone || normalizedRow.celular || normalizedRow.phone || normalizedRow.contato || '');

                        if (name) {
                            await api.post('/clients', {
                                name,
                                document,
                                email,
                                phone,
                                status: 'ATIVO'
                            });
                            successCount++;
                        }
                    } catch (err) {
                        console.error('Falha ao importar linha:', row, err);
                        errorCount++;
                    }
                }

                if (successCount > 0) {
                    addToast(`${successCount} clientes importados com sucesso!`, 'success');
                    if (errorCount > 0) {
                        addToast(`${errorCount} linhas falharam. Verifique o console para detalhes.`, 'error');
                    }
                } else {
                    addToast('Nenhum cliente foi importado. Verifique os cabeçalhos da planilha.', 'error');
                }
                fetchClients();
            } catch (error) {
                console.error('Erro ao processar planilha:', error);
                addToast('Erro ao ler a planilha. Tente salvar como .xlsx ou .csv padrão.', 'error');
            } finally {
                setIsImporting(false);
                e.target.value = '';
            }
        };

        reader.readAsArrayBuffer(file);
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async (e: React.MouseEvent, clientId: string) => {
        e.stopPropagation();
        try {
            await api.delete(`/clients/${clientId}`);
            setClients(prev => prev.filter(c => c.id !== clientId));
            setDeleteConfirm(null);
            addToast('Cliente apagado com sucesso', 'success');
        } catch (error: any) {
            console.error('Erro ao apagar cliente:', error);
            const msg = error.response?.data?.message || 'Não foi possível apagar o cliente. Verifique se não há processos ou registros financeiros vinculados.';
            addToast(msg, 'error');
            setDeleteConfirm(null);
        }
    };

    const handleStatusChange = async (e: React.MouseEvent, clientId: string, newStatus: string) => {
        e.stopPropagation();
        try {
            await api.patch(`/clients/${clientId}/status`, { status: newStatus });
            setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
            setStatusMenu(null);
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const alphabet = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];
    const hasAnyUrgent = useMemo(() => clients.some(c => c.notes && c.notes.some(n => n.isUrgent)), [clients]);
    const deferredSearchTerm = useDeferredValue(searchTerm);

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            if (!client) return false;
            const clientName = client.name || '';
            const clientDoc = client.document || '';
            const matchesSearch =
                clientName.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
                clientDoc.includes(deferredSearchTerm);
            const matchesLetter =
                selectedLetter === 'all' ? true :
                    selectedLetter === '#' ? !/^[a-zA-Z]/.test(clientName) :
                        clientName.toUpperCase().startsWith(selectedLetter);
            const matchesStatus = statusFilter === 'all' ? true : client.status === statusFilter;
            const matchesType = typeFilter === 'all' ? true : client.type === typeFilter;
            return matchesSearch && matchesLetter && matchesStatus && matchesType;
        });
    }, [clients, deferredSearchTerm, selectedLetter, statusFilter, typeFilter]);

    const hasUrgentNotes = (client: Client) => client.notes && client.notes.some(n => n.isUrgent);

    const handleGenerateReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '--';
        const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        const rows = filteredClients.map(c => `
            <tr>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${c.name || '--'}</td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${formatDate(c.createdAt)}</td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${c.demandType || '--'}</td>
                <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">
                    <span style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;
                        ${c.urgencyLevel === 'URGENTE' ? 'background:#000000;color:#ffffff;' :
                        c.urgencyLevel === 'ALTA' ? 'background:#1e293b;color:#ffffff;' :
                        'background:#64748b;color:#ffffff;'}">
                        ${c.urgencyLevel || '--'}
                    </span>
                </td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head><title>Clientes - Advus</title>
            <style>
                body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; }
                h1 { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; border-bottom: 4px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #000; color: #fff; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; font-weight: 700; }
                .meta { margin-bottom: 30px; font-size: 13px; color: #64748b; }
            </style>
            </head>
            <body>
                <h1>Relatório Premium de Clientes</h1>
                <div class="meta">Gerado em ${now} • Total: ${filteredClients.length} registros</div>
                <table><thead><tr><th>Cliente</th><th>Cadastro</th><th>Demanda</th><th>Urgência</th></tr></thead>
                <tbody>${rows}</tbody></table>
            </body></html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    return (
        <div className="space-y-6 pb-20 md:pb-8 animate-fade-in" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
            {/* Pull Refresh */}
            <AnimatePresence>
                {(pullDistance > 0 || refreshing) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 60, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex justify-center items-center overflow-hidden">
                        <div className={clsx("w-10 h-10 rounded-full bg-app-card border border-app-stroke flex items-center justify-center shadow-lg transition-transform", pullDistance > 60 && "scale-110")}>
                            <Loader2 size={20} className={clsx("text-app-text-main", refreshing && "animate-spin")} style={{ transform: refreshing ? 'none' : `rotate(${pullDistance * 3}deg)` }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-xl shadow-black/20 dark:shadow-white/10">
                            <Users size={24} className="text-white dark:text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-app-text-main flex items-center gap-3">
                                Clientes
                                {hasAnyUrgent && (
                                    <span className="flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </h1>
                            <p className="text-app-text-muted text-sm font-medium">Gestão de carteira e relacionamentos</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex bg-app-card/50 backdrop-blur-md border border-app-stroke rounded-2xl p-1 shadow-inner">
                        <button onClick={handleGenerateReport} className="p-2.5 text-app-text-muted hover:text-app-text-main transition-colors rounded-xl hover:bg-app-stroke/50" title="Relatório PDF">
                            <Printer size={18} />
                        </button>
                        <button onClick={() => document.getElementById('import-spreadsheet')?.click()} className="p-2.5 text-app-text-muted hover:text-app-text-main transition-colors rounded-xl hover:bg-app-stroke/50" title="Importar Planilha">
                            <FileUp size={18} />
                        </button>
                    </div>
                    
                    <button
                        onClick={() => navigate('/app/clientes/novo')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-2xl shadow-black/20 dark:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={20} strokeWidth={3} />
                        Novo Cliente
                    </button>
                </div>
            </div>

            {/* Glassmorphic Search & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6 relative group">
                    <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative bg-app-card/30 backdrop-blur-xl border border-app-stroke/50 rounded-2xl p-1 focus-within:border-primary/50 transition-all shadow-sm">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-app-text-label transition-colors group-focus-within:text-primary" size={20} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nome, CPF ou E-mail..."
                                className="w-full bg-transparent border-none focus:ring-0 text-app-text-main pl-12 pr-4 py-3 text-base placeholder:text-app-text-label"
                            />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex gap-3">
                    <div className="flex-1 relative">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full bg-app-card/50 backdrop-blur-md border border-app-stroke/50 rounded-2xl px-4 py-3.5 appearance-none text-sm font-semibold outline-none focus:border-primary/50 transition-all cursor-pointer"
                        >
                            <option value="all">Todos Tipos</option>
                            <option value="PF">Pessoa Física</option>
                            <option value="PJ">Pessoa Jurídica</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-label pointer-events-none" size={16} />
                    </div>
                    <div className="flex-1 relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full bg-app-card/50 backdrop-blur-md border border-app-stroke/50 rounded-2xl px-4 py-3.5 appearance-none text-sm font-semibold outline-none focus:border-primary/50 transition-all cursor-pointer"
                        >
                            <option value="all">Todos Status</option>
                            <option value="ATIVO">Ativos</option>
                            <option value="INATIVO">Inativos</option>
                            <option value="SUSPENSO">Suspensos</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-label pointer-events-none" size={16} />
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <button className="w-full h-full flex items-center justify-center gap-2 px-4 py-3 bg-app-card/50 border border-app-stroke/50 rounded-2xl text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 transition-all font-bold text-sm uppercase tracking-wider">
                        <Filter size={16} />
                        Mais Filtros
                    </button>
                </div>
            </div>

            {/* Letter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                <button
                    onClick={() => setSelectedLetter('all')}
                    className={clsx(
                        "px-5 py-2 rounded-xl text-xs font-black transition-all border shrink-0",
                        selectedLetter === 'all'
                            ? "bg-black dark:bg-white text-white dark:text-black border-transparent shadow-lg"
                            : "bg-app-card/30 text-app-text-muted border-app-stroke/30 hover:border-app-stroke"
                    )}
                >
                    #
                </button>
                {alphabet.slice(1).map(letter => (
                    <button
                        key={letter}
                        onClick={() => { setSelectedLetter(letter); haptics.light(); }}
                        className={clsx(
                            "w-10 h-10 rounded-xl text-xs font-black transition-all border shrink-0 flex items-center justify-center",
                            selectedLetter === letter
                                ? "bg-black dark:bg-white text-white dark:text-black border-transparent shadow-lg"
                                : "bg-app-card/30 text-app-text-muted border-app-stroke/30 hover:border-app-stroke"
                        )}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            {/* List Overview */}
            <div className="flex items-center justify-between px-2">
                <span className="text-sm font-bold text-app-text-muted uppercase tracking-widest">
                    <span className="text-app-text-main">{filteredClients.length}</span> Clientes Encontrados
                </span>
            </div>

            {loading ? (
                <ListSkeleton count={6} />
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                    {filteredClients.length > 0 ? (
                        filteredClients.map((client) => {
                            const st = STATUS_MAP[client.status] || STATUS_MAP.ATIVO;
                            const urgent = hasUrgentNotes(client);
                            
                            return (
                                <motion.div
                                    key={client.id}
                                    variants={itemVariants}
                                    onClick={() => navigate(`/app/clientes/${client.id}`)}
                                    className="group relative bg-app-card/40 hover:bg-app-card/80 border border-app-stroke/40 hover:border-primary/30 rounded-[2rem] p-5 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-black/5"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                        {/* Profile Info */}
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className={clsx("w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl bg-gradient-to-br", getAvatarGradient(client.id))}>
                                                    {(client.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className={clsx("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-app-card flex items-center justify-center", st.dot)} />
                                            </div>

                                            <div className="min-w-0 space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-app-text-main truncate group-hover:text-primary transition-colors">
                                                        {client.name || 'Sem Nome'}
                                                    </h3>
                                                    {urgent && (
                                                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg tracking-wider">Urgente</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-app-text-muted font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <Shield size={14} className="text-app-text-label" />
                                                        {client.document || '---'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Briefcase size={14} className="text-app-text-label" />
                                                        {client._count?.processes || 0} Processos
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact & Status */}
                                        <div className="flex flex-wrap items-center gap-4 lg:gap-8 lg:shrink-0">
                                            <div className="flex items-center gap-3">
                                                {client.phone && (
                                                    <button 
                                                        onClick={(e) => handleWhatsAppClick(e, client.phone, client.name)}
                                                        className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-2xl transition-all"
                                                        title="Chamar no WhatsApp"
                                                    >
                                                        <MessageCircle size={20} />
                                                    </button>
                                                )}
                                                <div className={clsx(st.bg, st.text, st.border, "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm")}>
                                                    {st.label}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 lg:opacity-10 transition-all duration-300">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/app/processos/kanban?newProcess=true&clientId=${client.id}`); }}
                                                    className="p-2.5 text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/50 rounded-xl"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setStatusMenu(statusMenu === client.id ? null : client.id); }}
                                                    className="p-2.5 text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/50 rounded-xl"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Menus */}
                                    <AnimatePresence>
                                        {statusMenu === client.id && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                                className="absolute right-8 top-16 bg-app-card border border-app-stroke rounded-2xl shadow-2xl z-50 p-2 min-w-[200px]"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-app-text-label border-b border-app-stroke/50 mb-1">Mudar Status</p>
                                                {Object.entries(STATUS_MAP).map(([key, val]) => (
                                                    <button key={key} onClick={(e) => handleStatusChange(e, client.id, key)}
                                                        className={clsx("w-full px-3 py-2.5 text-left text-sm font-bold rounded-xl hover:bg-app-stroke/30 transition-all flex items-center gap-3", client.status === key ? val.text : 'text-app-text-muted')}>
                                                        <div className={clsx("w-2 h-2 rounded-full", val.dot)} />
                                                        {val.label}
                                                    </button>
                                                ))}
                                                <div className="h-px bg-app-stroke/50 my-1" />
                                                <button 
                                                    onClick={() => setDeleteConfirm(client.id)}
                                                    className="w-full px-3 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-3"
                                                >
                                                    <Trash2 size={16} />
                                                    Excluir Registro
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Delete Confirmation Overlay */}
                                    <AnimatePresence>
                                        {deleteConfirm === client.id && (
                                            <motion.div 
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="absolute inset-0 bg-red-500/10 backdrop-blur-sm rounded-[2rem] flex items-center justify-center z-40 p-4"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="bg-app-card border border-red-500/30 p-6 rounded-3xl shadow-2xl text-center space-y-4 max-w-xs">
                                                    <p className="text-sm font-bold text-app-text-main">Deseja realmente excluir este cliente?</p>
                                                    <div className="flex gap-3">
                                                        <button onClick={(e) => handleDeleteClient(e, client.id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors">Sim, Excluir</button>
                                                        <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-app-stroke text-app-text-main rounded-xl font-bold text-xs hover:bg-app-stroke/80 transition-colors">Cancelar</button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="bg-app-card/30 border border-app-stroke/50 rounded-[2.5rem] p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-app-stroke/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users size={40} className="text-app-text-muted opacity-20" />
                            </div>
                            <h2 className="text-2xl font-black text-app-text-main">Nenhum cliente encontrado</h2>
                            <p className="text-app-text-muted max-w-sm mx-auto">Tente ajustar seus filtros ou faça uma nova busca para encontrar o que procura.</p>
                            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); setSelectedLetter('all'); }} className="px-6 py-2 bg-app-stroke/50 text-app-text-main rounded-xl font-bold hover:bg-app-stroke transition-all">Limpar Todos os Filtros</button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Mobile Fab */}
            <button
                onClick={() => navigate('/app/clientes/novo')}
                className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center shadow-2xl shadow-black/40 z-50 active:scale-90 transition-transform"
            >
                <Plus size={32} strokeWidth={3} />
            </button>

            <input type="file" id="import-spreadsheet" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportSpreadsheet} />
        </div>
    );
}
