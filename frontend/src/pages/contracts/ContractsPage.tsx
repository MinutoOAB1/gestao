import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Search, FileText, MoreVertical, Filter, TrendingUp, XCircle, CheckCircle2, Upload, Clock, Paperclip, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';

// Optimized animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.02, delayChildren: 0.01 }
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

interface Contract {
    id: string;
    number: string;
    title: string;
    description?: string;
    status: string;
    value: number;
    clientId?: string;
    client?: { id: string; name: string; email?: string };
    createdAt: string;
    autentiqueId?: string;
    autentiqueStatus?: string;
}

interface Stats {
    initiated: number;
    made: number;
    signed: number;
    closed: number;
    cancelled: number;
    total: number;
    estimatedRevenue: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
    INITIATED: { label: 'Iniciado', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    MADE: { label: 'Feito', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    SIGNED: { label: 'Assinado', color: 'text-green-400', bgColor: 'bg-green-500/10' },
    CLOSED: { label: 'Fechado', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    CANCELLED: { label: 'Cancelado', color: 'text-red-400', bgColor: 'bg-red-500/10' },
};

const FunnelBar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-app-text-muted w-20 text-right">{label}</span>
            <div className="flex-1 flex items-center gap-3">
                <div className="flex-1 h-8 bg-app-stroke/30 rounded-lg overflow-hidden relative">
                    <div
                        className={clsx("h-full rounded-lg transition-all duration-500", color)}
                        style={{ width: `${percentage}%` }}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white">{value}</span>
                </div>
                <span className="text-xs text-app-text-muted w-12">{percentage}%</span>
            </div>
        </div>
    );
};

export default function ContractsPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [isLoading, setIsLoading] = useState(false);
    const [isNewContractOpen, setIsNewContractOpen] = useState(false);
    const [funnelPeriod, setFunnelPeriod] = useState('Mês');
    const [animatedStats, setAnimatedStats] = useState<Stats | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    
    useEffect(() => {
        if (!stats) return;
        const multiplier = funnelPeriod === 'Dia' ? 0.05 : funnelPeriod === 'Semana' ? 0.25 : 1;
        setAnimatedStats({
            initiated: Math.round(stats.initiated * multiplier),
            made: Math.round(stats.made * multiplier),
            signed: Math.round(stats.signed * multiplier),
            closed: Math.round(stats.closed * multiplier),
            cancelled: Math.round(stats.cancelled * multiplier),
            total: Math.max(1, Math.round(stats.total * multiplier)),
            estimatedRevenue: stats.estimatedRevenue * multiplier
        });
    }, [funnelPeriod, stats]);
    
    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const [newContract, setNewContract] = useState({
        title: '',
        description: '',
        status: 'INITIATED',
        value: '',
        clientId: '',
        area: 'Cível',
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [contractsRes, statsRes] = await Promise.all([
                api.get('/contracts'),
                api.get('/contracts/stats'),
            ]);
            setContracts(contractsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Erro ao buscar contratos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const generateContractNumber = () => {
        const year = new Date().getFullYear();
        const num = Math.floor(Math.random() * 900) + 100;
        return `CNT-${year}-${num}`;
    };

    const handleCreateContract = async () => {
        if (!newContract.title || !newContract.value) {
            addToast('Preencha o título e o valor do contrato.', 'warning');
            return;
        }
        try {
            await api.post('/contracts', {
                number: generateContractNumber(),
                title: newContract.title,
                description: newContract.description,
                status: newContract.status,
                value: parseFloat(newContract.value),
                clientId: newContract.clientId || undefined,
                area: newContract.area,
            });
            setIsNewContractOpen(false);
            setNewContract({ title: '', description: '', status: 'INITIATED', value: '', clientId: '', area: 'Cível' });
            fetchData();
            addToast('Contrato criado com sucesso', 'success');
        } catch (error: any) {
            console.error('Erro ao criar contrato:', error);
            addToast('Erro ao criar contrato: ' + (error.response?.data?.message || 'Tente novamente.'), 'error');
        }
    };
    
    const handleRequestSignature = async (contractId: string) => {
        try {
            await api.post(`/contracts/${contractId}/request-signature`);
            addToast('Solicitação de assinatura enviada com sucesso!', 'success');
            fetchData();
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Erro ao solicitar assinatura.', 'error');
        }
    };

    const handleSyncSignature = async (contractId: string) => {
        try {
            await api.get(`/contracts/${contractId}/sync-signature`);
            addToast('Status sincronizado!', 'success');
            fetchData();
        } catch (error: any) {
            addToast('Erro ao sincronizar status.', 'error');
        }
    };

    const filterTabs = ['Todos', 'Feitos', 'Assinados', 'Fechados', 'Cancelados'];

    const filteredContracts = contracts.filter(contract => {
        const matchesSearch = contract.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            contract.number.toLowerCase().includes(debouncedSearch.toLowerCase());

        if (activeFilter === 'Todos') return matchesSearch;
        if (activeFilter === 'Feitos') return matchesSearch && contract.status === 'MADE';
        if (activeFilter === 'Assinados') return matchesSearch && contract.status === 'SIGNED';
        if (activeFilter === 'Fechados') return matchesSearch && contract.status === 'CLOSED';
        if (activeFilter === 'Cancelados') return matchesSearch && contract.status === 'CANCELLED';
        return matchesSearch;
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 pb-24 md:pb-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-app-text-main">Visão Geral</h1>
                    <p className="text-sm text-app-text-muted">Acompanhe o ciclo de vida e status dos seus contratos jurídicos.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/app/contratos/assinatura')}
                        className="flex items-center gap-2 px-4 py-2 border border-app-stroke rounded-lg text-app-text-main text-sm font-medium hover:bg-app-stroke/30 transition-colors"
                    >
                        <PenTool size={16} />
                        Assinaturas
                    </button>
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 border border-app-stroke rounded-lg text-app-text-main text-sm font-medium hover:bg-app-stroke/30 transition-colors">
                        <Download size={16} />
                        Relatório
                    </button>
                    <button
                        onClick={() => setIsNewContractOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                    >
                        <Plus size={16} />
                        Novo Contrato
                    </button>
                </div>
            </div>

            {/* Stats Section - responsive grid */}
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Funnel Card */}
                <motion.div
                    className="lg:col-span-2 bg-app-card border border-app-stroke rounded-2xl p-4 sm:p-6 will-animate"
                    variants={itemVariants}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                        <div>
                            <h3 className="font-bold text-app-text-main">Funil de Conversão</h3>
                            <p className="text-xs text-app-text-muted">Eficiência de fechamento de contratos</p>
                        </div>
                        <div className="flex items-center gap-1 bg-app-bg border border-app-stroke rounded-lg p-1">
                            {['Dia', 'Semana', 'Mês'].map(period => (
                                <button 
                                    key={period}
                                    onClick={() => setFunnelPeriod(period)}
                                    className={clsx("px-3 py-1 text-xs rounded transition-colors", funnelPeriod === period ? "text-app-text-main bg-app-stroke font-medium" : "text-app-text-muted hover:text-white")}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-hidden">
                        <motion.div 
                            key={funnelPeriod}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            <FunnelBar label="Iniciados" value={animatedStats?.initiated || 0} total={animatedStats?.total || 1} color="bg-blue-500" />
                            <FunnelBar label="Feitos" value={animatedStats?.made || 0} total={animatedStats?.total || 1} color="bg-amber-500" />
                            <FunnelBar label="Assinados" value={animatedStats?.signed || 0} total={animatedStats?.total || 1} color="bg-green-500" />
                            <FunnelBar label="Fechados" value={animatedStats?.closed || 0} total={animatedStats?.total || 1} color="bg-purple-500" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Side Cards */}
                <motion.div className="space-y-3 sm:space-y-4" variants={itemVariants}>
                    {/* Revenue Card */}
                    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm opacity-80">Receita Estimada (Mês)</p>
                                <p className="text-3xl font-bold mt-1">
                                    R$ {((stats?.estimatedRevenue || 0) / 1000).toFixed(0)}k
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm">
                                    <TrendingUp size={14} />
                                    <span>+12% vs. anterior</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Cancelled Card */}
                    <div className="bg-app-card border border-app-stroke rounded-2xl p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <XCircle size={20} className="text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-app-text-muted">Contratos Cancelados</p>
                                    <p className="text-2xl font-bold text-app-text-main">{stats?.cancelled || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="h-1 bg-app-stroke rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: stats ? `${(stats.cancelled / stats.total) * 100}%` : '0%' }} />
                            </div>
                            <p className="text-xs text-app-text-muted mt-2 text-right">
                                {stats ? Math.round((stats.cancelled / stats.total) * 100) : 0}% do total
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Contracts Table */}
            <div className="bg-app-card border border-app-stroke rounded-2xl overflow-hidden">
                {/* Filter Tabs & Search */}
                <div className="p-4 border-b border-app-stroke flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
                        {filterTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={clsx(
                                    "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                                    activeFilter === tab
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-app-text-muted hover:text-app-text-main"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
                            <input
                                type="text"
                                placeholder="Buscar contratos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-app-bg border border-app-stroke rounded-lg text-sm text-app-text-main focus:border-primary outline-none transition-fast touch-manipulation"
                            />
                        </div>
                        <button className="hidden sm:flex items-center gap-2 px-3 py-2 border border-app-stroke rounded-lg text-app-text-muted text-sm hover:text-app-text-main transition-fast touch-manipulation">
                            <Filter size={16} />
                            <span className="hidden md:inline">Mais recentes</span>
                        </button>
                    </div>
                </div>

                {/* Table - Desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-app-stroke">
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Contrato</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Cliente</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Status</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Valor</th>
                                <th className="text-left text-xs font-bold text-app-text-muted uppercase tracking-wider px-6 py-4">Data</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-stroke">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-app-text-muted text-sm">Carregando contratos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-app-text-muted">
                                        <FileText size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Nenhum contrato encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map(contract => (
                                    <tr key={contract.id} className="hover:bg-app-stroke/10 transition-fast cursor-pointer" onClick={() => setSelectedContract(contract)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-app-stroke/30 flex items-center justify-center">
                                                    <FileText size={18} className="text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-app-text-main text-sm">{contract.title}</p>
                                                    <p className="text-xs text-app-text-muted">#{contract.number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar 
                                                    name={contract.client?.name || contract.title} 
                                                    size="sm" 
                                                    className="bg-app-stroke"
                                                />
                                                <span className="text-sm text-app-text-main">{contract.client?.name || 'Sem cliente'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-xs font-medium",
                                                STATUS_MAP[contract.status]?.color,
                                                STATUS_MAP[contract.status]?.bgColor
                                            )}>
                                                {STATUS_MAP[contract.status]?.label || contract.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-app-text-main font-medium">
                                            {formatCurrency(contract.value)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-app-text-muted">
                                            {formatDate(contract.createdAt)}
                                        </td>
                                        <td className="px-4 relative">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === contract.id ? null : contract.id); }}
                                                className="p-2 text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {activeMenuId === contract.id && (
                                                <div className="absolute right-0 top-full mt-1 w-32 bg-app-card border border-app-stroke rounded-lg shadow-xl z-50 overflow-hidden text-sm">
                                                    <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 transition-colors text-app-text-main" onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); setActiveMenuId(null); }}>Ver Detalhes</button>
                                                    <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 transition-colors text-blue-500" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}>Editar</button>
                                                    <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 transition-colors text-red-500" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}>Excluir</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table - Mobile Cards */}
                <div className="md:hidden flex flex-col divide-y divide-app-stroke">
                    {isLoading ? (
                         <div className="text-center py-8">
                             <div className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                             <span className="text-app-text-muted text-sm">Carregando contratos...</span>
                         </div>
                    ) : filteredContracts.length === 0 ? (
                        <div className="text-center py-8 text-app-text-muted">
                            <FileText size={32} className="mx-auto mb-2 opacity-30" />
                            <p>Nenhum contrato encontrado.</p>
                        </div>
                    ) : (
                        filteredContracts.map(contract => (
                            <div key={contract.id} className="p-4 hover:bg-app-stroke/10 transition-fast active:bg-app-stroke/20 cursor-pointer" onClick={() => setSelectedContract(contract)}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-app-stroke/30 flex items-center justify-center">
                                            <FileText size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-app-text-main text-sm">{contract.title}</p>
                                            <p className="text-xs text-app-text-muted">#{contract.number}</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === contract.id ? null : contract.id); }}
                                            className="p-1.5 text-app-text-muted hover:text-white rounded-lg transition-colors"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {activeMenuId === contract.id && (
                                            <div className="absolute right-0 top-full mt-1 w-32 bg-app-card border border-app-stroke rounded-lg shadow-xl z-50 overflow-hidden text-sm">
                                                <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 text-app-text-main" onClick={(e) => { e.stopPropagation(); setSelectedContract(contract); setActiveMenuId(null); }}>Ver Detalhes</button>
                                                <button className="w-full text-left px-4 py-2 hover:bg-app-stroke/30 text-red-500" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}>Excluir</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div>
                                        <p className="text-xs text-app-text-muted mb-1">Cliente</p>
                                        <p className="text-xs font-medium text-app-text-main truncate">{contract.client?.name || 'Sem cliente'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-app-text-muted mb-1">Data</p>
                                        <p className="text-xs font-medium text-app-text-main">{formatDate(contract.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-3 border-t border-app-stroke">
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-[10px] font-medium border",
                                        STATUS_MAP[contract.status]?.color,
                                        STATUS_MAP[contract.status]?.bgColor,
                                        STATUS_MAP[contract.status]?.color.replace('text-', 'border-').replace('400', '500/20')
                                    )}>
                                        {STATUS_MAP[contract.status]?.label || contract.status}
                                    </span>
                                    <span className="text-sm text-app-text-main font-bold">
                                        {formatCurrency(contract.value)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* New Contract Modal */}
            <Modal
                isOpen={isNewContractOpen}
                onClose={() => setIsNewContractOpen(false)}
                title="Novo Contrato"
                footer={
                    <>
                        <button onClick={() => setIsNewContractOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-app-text-main hover:bg-app-stroke/30 transition-colors">Cancelar</button>
                        <button onClick={handleCreateContract} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors">Criar Contrato</button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Título *</label>
                        <input
                            type="text"
                            value={newContract.title}
                            onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                            placeholder="Ex: Assessoria Trabalhista"
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Descrição</label>
                        <textarea
                            value={newContract.description}
                            onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                            placeholder="Detalhes do contrato..."
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors h-24 resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Valor *</label>
                            <input
                                type="number"
                                value={newContract.value}
                                onChange={(e) => setNewContract({ ...newContract, value: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Status</label>
                            <select
                                value={newContract.status}
                                onChange={(e) => setNewContract({ ...newContract, status: e.target.value })}
                                className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors"
                            >
                                <option value="INITIATED">Iniciado</option>
                                <option value="MADE">Feito</option>
                                <option value="SIGNED">Assinado</option>
                                <option value="CLOSED">Fechado</option>
                                <option value="CANCELLED">Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Área de Atuação</label>
                        <select
                            value={newContract.area}
                            onChange={(e) => setNewContract({ ...newContract, area: e.target.value })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors"
                        >
                            <option value="Cível">Cível</option>
                            <option value="Trabalhista">Trabalhista</option>
                            <option value="Empresarial">Empresarial</option>
                            <option value="Família">Família</option>
                            <option value="Tributário">Tributário</option>
                            <option value="Criminal">Criminal</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                </div>
            </Modal>
            {/* Contract Details Modal */}
            <Modal
                isOpen={!!selectedContract}
                onClose={() => setSelectedContract(null)}
                title="Detalhes do Contrato"
                footer={
                    <button onClick={() => setSelectedContract(null)} className="px-4 py-2 rounded-lg text-sm font-medium bg-app-stroke text-app-text-main hover:bg-app-stroke/80 transition-colors">Fechar</button>
                }
            >
                {selectedContract && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-app-text-main">{selectedContract.title}</h3>
                            <span className={clsx(
                                "px-3 py-1 rounded-full text-xs font-medium",
                                STATUS_MAP[selectedContract.status]?.color,
                                STATUS_MAP[selectedContract.status]?.bgColor
                            )}>
                                {STATUS_MAP[selectedContract.status]?.label || selectedContract.status}
                            </span>
                        </div>
                        <p className="text-sm text-app-text-muted break-words">
                            {selectedContract.description || 'Sem descrição.'}
                        </p>
                        <div className="bg-app-bg p-4 rounded-xl border border-app-stroke grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-app-text-muted mb-1">Valor do Contrato</p>
                                <p className="text-sm font-bold text-app-text-main">{formatCurrency(selectedContract.value)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-app-text-muted mb-1">Data de Criação</p>
                                <p className="text-sm font-bold text-app-text-main">{formatDate(selectedContract.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-app-text-muted mb-1">Cliente Vinculado</p>
                                <div className="flex items-center gap-2">
                                    <Avatar name={selectedContract.client?.name || selectedContract.title} size="sm" className="w-5 h-5" />
                                    <p className="text-sm font-bold text-app-text-main">{selectedContract.client?.name || 'Nenhum'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-app-text-muted mb-1">ID do Contrato</p>
                                <p className="text-sm font-mono text-app-text-main">#{selectedContract.number}</p>
                            </div>
                        </div>

                        {/* Signature Section */}
                        <div className="pt-4 border-t border-app-stroke space-y-4">
                            <h4 className="text-sm font-bold text-app-text-main flex items-center gap-2">
                                <FileText size={16} className="text-primary" /> Assinatura Digital (Autentique)
                            </h4>
                            
                            {selectedContract.autentiqueId ? (
                                <div className="bg-app-bg p-4 rounded-xl border border-app-stroke flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-app-text-muted uppercase font-bold">Status da Assinatura</span>
                                            <span className={clsx(
                                                "text-xs font-bold",
                                                selectedContract.autentiqueStatus === 'SIGNED' ? "text-emerald-500" : "text-amber-500"
                                            )}>
                                                {selectedContract.autentiqueStatus === 'SIGNED' ? 'CONCLUÍDO' : 'AGUARDANDO ASSINATURA'}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleSyncSignature(selectedContract.id)}
                                            className="px-3 py-1.5 text-xs font-medium bg-app-stroke hover:bg-app-stroke/80 text-app-text-main rounded-lg transition-colors"
                                        >
                                            Sincronizar
                                        </button>
                                    </div>
                                    {selectedContract.autentiqueStatus !== 'SIGNED' && (
                                        <p className="text-[10px] text-app-text-muted italic">
                                            Um link de assinatura foi enviado para: {selectedContract.client?.email || 'e-mail não informado'}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-app-text-muted">
                                        Este contrato ainda não foi enviado para assinatura digital.
                                    </p>
                                    <button 
                                        onClick={() => handleRequestSignature(selectedContract.id)}
                                        className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        <FileText size={16} /> Enviar para Assinatura (Autentique)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
