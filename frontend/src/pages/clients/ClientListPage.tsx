import { useEffect, useState, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Trash2, Printer, Briefcase, FileUp, Loader2 } from 'lucide-react';
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
        transition: { staggerChildren: 0.04, delayChildren: 0.02 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 25 }
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

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
    ATIVO: { label: 'Ativo', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
    INATIVO: { label: 'Inativo', bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' },
    SUSPENSO: { label: 'Suspenso', bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
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
                        // Normalize keys: lowercase and remove spaces/special chars
                        const normalizedRow: any = {};
                        Object.keys(row).forEach(key => {
                            const cleanKey = key.toLowerCase()
                                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                                .replace(/[^a-z0-9]/g, ''); // remove spaces and special chars
                            normalizedRow[cleanKey] = row[key];
                        });

                        // Flexible mapping for common headers
                        const name = normalizedRow.nome || normalizedRow.name || normalizedRow.cliente || normalizedRow.razaosocial || normalizedRow.nomecompleto;
                        const document = String(normalizedRow.cpf || normalizedRow.cnpj || normalizedRow.documento || normalizedRow.cpfcnpj || '').replace(/\D/g, '');
                        const email = normalizedRow.email || normalizedRow.correio || normalizedRow.correioeletronico || '';
                        const phone = String(normalizedRow.telefone || normalizedRow.celular || normalizedRow.phone || normalizedRow.contato || '');
                        const type = (normalizedRow.tipo === 'PJ' || String(document).length > 11) ? 'PJ' : 'PF';

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
                e.target.value = ''; // clear input
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

    // Check if any client has urgent notes (for section indicator)
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
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;">${c.name || '--'}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${formatDate(c.createdAt)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${formatDate(c.updatedAt)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${c.demandType || '--'}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
                    <span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;
                        ${c.urgencyLevel === 'URGENTE' ? 'background:#ef4444;color:#ffffff;' :
                c.urgencyLevel === 'ALTA' ? 'background:#f97316;color:#ffffff;' :
                    c.urgencyLevel === 'MEDIA' ? 'background:#f59e0b;color:#ffffff;' :
                        'background:#10b981;color:#ffffff;'}">
                        ${c.urgencyLevel || '--'}
                    </span>
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
                    <span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;
                        ${c.status === 'ATIVO' ? 'background:#10b981;color:#ffffff;' :
                c.status === 'SUSPENSO' ? 'background:#f59e0b;color:#ffffff;' :
                    'background:#6b7280;color:#ffffff;'}">
                        ${(c.status || 'ATIVO')}
                    </span>
                </td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório de Clientes</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; padding: 40px; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #000000; padding-bottom: 15px; }
                    .header h1 { font-size: 22px; color: #000000; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
                    .header .meta { font-size: 12px; color: #3f3f46; text-align: right; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    thead th { background: #000000; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
                    tbody tr:nth-child(even) { background: #f9fafb; }
                    tbody tr:hover { background: #f3f4f6; }
                    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }
                    @media print { body { padding: 20px; } .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>Relatório de Clientes</h1>
                        <p style="font-size:13px;color:#6b7280;margin-top:4px;">Escritório Silva & Associados</p>
                    </div>
                    <div class="meta">
                        <p>Data: ${now}</p>
                        <p>Total: ${filteredClients.length} clientes</p>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th style="text-align:center;">Cadastro</th>
                            <th style="text-align:center;">Última Atualização</th>
                            <th style="text-align:center;">Demanda</th>
                            <th style="text-align:center;">Urgência</th>
                            <th style="text-align:center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="footer">
                    <p>Relatório gerado automaticamente em ${now}</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    return (
        <div 
            className="space-y-4 pb-20 md:pb-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to refresh indicator */}
            <AnimatePresence>
                {(pullDistance > 0 || refreshing) && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: pullDistance > 60 || refreshing ? 60 : pullDistance, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex justify-center items-center overflow-hidden"
                    >
                        <div className={clsx(
                            "w-8 h-8 rounded-full border-2 border-app-stroke flex items-center justify-center transition-all",
                            pullDistance > 60 ? "border-black dark:border-white scale-110" : "scale-90"
                        )}>
                            <Loader2 size={16} className={clsx(refreshing && "animate-spin")} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-app-text-main flex items-center gap-2">
                            Gestão de Clientes
                            {hasAnyUrgent && (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black dark:bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-black dark:bg-white"></span>
                                </span>
                            )}
                        </h1>
                        <p className="text-app-text-muted text-sm capitalize">Escritório Silva & Associados</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        id="import-spreadsheet"
                        className="hidden"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleImportSpreadsheet}
                    />
                    <button
                        onClick={() => document.getElementById('import-spreadsheet')?.click()}
                        disabled={isImporting}
                        className="hidden md:flex items-center gap-2 px-4 py-2 border border-app-stroke rounded-lg text-app-text-main hover:bg-app-stroke/30 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                        {isImporting ? 'Importando...' : 'Importar Planilha'}
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        className="hidden md:flex items-center gap-2 px-4 py-2 border border-app-stroke rounded-lg text-app-text-main hover:bg-app-stroke/30 transition-colors text-sm font-medium"
                    >
                        <Printer size={16} />
                        Relatório PDF
                    </button>
                    <button
                        onClick={() => navigate('/app/clientes/novo')}
                        className="w-12 h-12 md:w-auto md:h-auto rounded-full md:rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center gap-2 hover:opacity-90 transition-fast shadow-lg shadow-black/20 fixed bottom-20 right-4 z-40 md:static md:px-4 md:py-2 touch-manipulation no-tap-highlight active:scale-95 font-bold"
                    >
                        <Plus size={24} className="md:w-5 md:h-5" />
                        <span className="hidden md:inline">Novo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome ou CPF..."
                        className="w-full bg-app-card border border-app-stroke text-white pl-11 pr-4 py-2.5 rounded-xl focus:ring-1 focus:ring-white focus:border-white outline-none transition-all placeholder:text-app-text-label text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-app-card border border-app-stroke text-app-text-main text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-white"
                    >
                        <option value="all">Todos os Tipos</option>
                        <option value="PF">Pessoa Física (PF)</option>
                        <option value="PJ">Pessoa Jurídica (PJ)</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-app-card border border-app-stroke text-app-text-main text-xs rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-white"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="ATIVO">Ativos</option>
                        <option value="INATIVO">Inativos</option>
                        <option value="SUSPENSO">Suspensos</option>
                    </select>
                </div>
            </div>

            {/* Alphabet Navigation - Enhanced horizontal scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                <div className="flex items-center gap-1.5 min-w-max px-1">
                    <button
                        onClick={() => setSelectedLetter('all')}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap border shadow-sm",
                            selectedLetter === 'all'
                                ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-black/20"
                                : "bg-app-card text-app-text-muted hover:text-white border-app-stroke"
                        )}
                    >
                        TODOS
                    </button>
                    {alphabet.map(letter => (
                        <button
                            key={letter}
                            onClick={() => {
                                setSelectedLetter(letter);
                                haptics.light();
                            }}
                            className={clsx(
                                "w-8 h-8 rounded-full text-[10px] font-bold transition-all shrink-0 flex items-center justify-center border shadow-sm",
                                selectedLetter === letter
                                    ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-black/20"
                                    : "bg-app-card text-app-text-muted hover:text-white border-app-stroke"
                            )}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Header */}
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-bold text-white">{filteredClients.length} <span className="text-sm font-normal text-app-text-muted">Clientes</span></h2>
            </div>

            {/* Clients List */}
            {loading ? (
                <ListSkeleton count={5} />
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                >
                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-app-card rounded-xl border border-app-stroke overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-app-bg/50 border-b border-app-stroke text-[11px] uppercase tracking-wider text-app-text-muted">
                                        <th className="px-4 py-3 font-semibold text-center w-12"></th>
                                        <th className="px-4 py-3 font-semibold">Cliente</th>
                                        <th className="px-4 py-3 font-semibold">Contato</th>
                                        <th className="px-4 py-3 font-semibold">Tags / Urgência</th>
                                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                                        <th className="px-4 py-3 font-semibold text-center w-20">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-app-stroke">
                                    {filteredClients.length > 0 ? (
                                        filteredClients.map((client) => {
                                            const st = STATUS_MAP[client.status] || STATUS_MAP.ATIVO;
                                            const urgent = hasUrgentNotes(client);
                                            return (
                                                <motion.tr
                                                    key={client.id}
                                                    variants={itemVariants}
                                                    onClick={() => navigate(`/app/clientes/${client.id}`)}
                                                    className="group hover:bg-app-stroke/10 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-4 py-2.5 text-center">
                                                        <div className="relative inline-block">
                                                            <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] shadow-sm bg-gradient-to-br", getAvatarGradient(client.id))}>
                                                                {(client.name || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            {urgent && (
                                                                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black dark:bg-white opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black dark:bg-white"></span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={clsx("w-2 h-2 rounded-full shrink-0", client.status === 'ATIVO' ? 'bg-black dark:bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]' : 'bg-neutral-500 opacity-50')} title={client.status}></div>
                                                            <div className="font-semibold text-app-text-main text-[13px] truncate max-w-[200px]">{client.name || 'Sem Nome'}</div>
                                                            {client._count && client._count.processes > 0 && (
                                                                <span className="text-[10px] bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full font-bold">
                                                                    {client._count.processes}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-app-text-muted mt-0.5 ml-4">{client.document || 'CPF não informado'}</div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        {client.phone ? (
                                                            <div className="flex items-center gap-1 text-[12px] text-app-text-muted">
                                                                <Phone size={12} className="text-app-text-label" />
                                                                {client.phone}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-app-text-label italic">Sem telefone</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {client.tags?.map(tag => (
                                                                <span key={tag.id} className="text-[9px] font-semibold px-1.5 py-0.5 rounded border"
                                                                    style={{ backgroundColor: tag.color + '10', color: tag.color, borderColor: tag.color + '30' }}>
                                                                    {tag.name}
                                                                </span>
                                                            ))}
                                                            {client.demandType && (
                                                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
                                                                    {client.demandType}
                                                                </span>
                                                            )}
                                                            {client.urgencyLevel && client.urgencyLevel !== 'BAIXA' && (
                                                                <span className={clsx(
                                                                    "text-[9px] font-medium px-1.5 py-0.5 rounded border",
                                                                    client.urgencyLevel === 'URGENTE' ? 'bg-black text-white border-black' :
                                                                        client.urgencyLevel === 'ALTA' ? 'bg-neutral-800 text-white border-neutral-800' :
                                                                            'bg-neutral-600 text-white border-neutral-600'
                                                                )}>
                                                                    {client.urgencyLevel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setStatusMenu(statusMenu === client.id ? null : client.id); }}
                                                                className={clsx(st.bg, st.text, st.border, "text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer hover:opacity-80 transition-opacity")}
                                                            >
                                                                {st.label}
                                                            </button>
                                                            {statusMenu === client.id && (
                                                                <div className="absolute right-0 top-full mt-1 bg-app-card border border-app-stroke rounded-lg shadow-xl z-50 py-1 min-w-[120px] text-left">
                                                                    {Object.entries(STATUS_MAP).map(([key, val]) => (
                                                                        <button key={key} onClick={(e) => handleStatusChange(e, client.id, key)}
                                                                            className={clsx("w-full px-3 py-1.5 text-left text-[11px] font-medium hover:bg-app-stroke/30 transition-colors flex items-center gap-2", client.status === key ? val.text : 'text-app-text-muted')}>
                                                                            <span className={clsx("w-2 h-2 rounded-full", val.bg, val.border, 'border')}></span>
                                                                            {val.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        {deleteConfirm === client.id ? (
                                                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                                <button onClick={(e) => handleDeleteClient(e, client.id)} className="px-2 py-0.5 bg-neutral-800 text-white text-[10px] font-medium rounded hover:bg-black transition-colors">Sim</button>
                                                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }} className="px-2 py-0.5 bg-app-stroke text-app-text-main text-[10px] font-medium rounded hover:bg-app-stroke/80 transition-colors">Não</button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/app/processos/kanban?newProcess=true&clientId=${client.id}`); }}
                                                                    className="p-1.5 rounded text-app-text-muted hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all tooltip relative"
                                                                    title="Criar Processo"
                                                                >
                                                                    <Briefcase size={14} />
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(client.id); }}
                                                                    className="p-1.5 rounded text-app-text-muted hover:text-neutral-900 hover:bg-neutral-900/10 transition-all tooltip relative"
                                                                    title="Apagar Cliente">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan={6} className="px-4 py-10 text-center text-app-text-muted text-[13px]">Nenhum cliente encontrado.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-3 lg:hidden">
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => {
                                const st = STATUS_MAP[client.status] || STATUS_MAP.ATIVO;
                                const urgent = hasUrgentNotes(client);
                                return (
                                    <motion.div
                                        key={client.id}
                                        variants={itemVariants}
                                        onClick={() => navigate(`/app/clientes/${client.id}`)}
                                        className="bg-app-card border border-app-stroke rounded-xl p-4 active:bg-app-stroke/10 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md bg-gradient-to-br", getAvatarGradient(client.id))}>
                                                        {(client.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    {urgent && (
                                                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black dark:bg-white opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-black dark:bg-white"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className={clsx("w-2 h-2 rounded-full shrink-0", client.status === 'ATIVO' ? 'bg-black dark:bg-white' : 'bg-neutral-500 opacity-50')}></div>
                                                        <h3 className="font-bold text-app-text-main text-[15px] truncate">{client.name || 'Sem Nome'}</h3>
                                                        {client._count && client._count.processes > 0 && (
                                                            <span className="text-[10px] bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded-full font-bold">
                                                                {client._count.processes}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-app-text-muted mt-0.5 ml-4">{client.document || 'CPF não informado'}</p>
                                                </div>
                                            </div>
                                            <div className="shrink-0">
                                                <div className={clsx(st.bg, st.text, st.border, "text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border")}>
                                                    {st.label}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {client.phone && (
                                                <div className="flex items-center gap-2 text-[13px] text-app-text-muted bg-app-bg px-2.5 py-1.5 rounded-lg border border-app-stroke/50">
                                                    <Phone size={14} className="text-black dark:text-white" />
                                                    {client.phone}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                                {client.demandType && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                        {client.demandType}
                                                    </span>
                                                )}
                                                {client.urgencyLevel && client.urgencyLevel !== 'BAIXA' && (
                                                    <span className={clsx("text-[10px] font-medium px-2 py-0.5 rounded border", client.urgencyLevel === 'URGENTE' ? 'bg-black text-white border-black' : client.urgencyLevel === 'ALTA' ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-neutral-600 text-white border-neutral-600')}>
                                                        {client.urgencyLevel}
                                                    </span>
                                                )}
                                                {client.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag.id} className="text-[10px] font-semibold px-2 py-0.5 rounded border" style={{ backgroundColor: tag.color + '10', color: tag.color, borderColor: tag.color + '30' }}>
                                                        {tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-app-stroke flex justify-between items-center">
                                            <div className="text-[10px] text-app-text-muted">ID: {client.id.slice(0, 8)}...</div>
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                {deleteConfirm === client.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={(e) => handleDeleteClient(e, client.id)} className="px-3 py-1 bg-red-500 text-white text-[11px] font-bold rounded-lg">Confirmar</button>
                                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }} className="px-3 py-1 bg-app-stroke text-app-text-main text-[11px] font-bold rounded-lg">X</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/app/processos?newProcess=true&clientId=${client.id}`); }}
                                                            className="p-2 bg-black/10 dark:bg-white/10 text-black dark:text-white rounded-xl"
                                                        >
                                                            <Briefcase size={18} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(client.id); }} className="p-2 bg-red-500/10 text-red-500 rounded-xl">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="bg-app-card p-10 rounded-xl border border-app-stroke text-center text-app-text-muted text-sm">Nenhum cliente encontrado.</div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
