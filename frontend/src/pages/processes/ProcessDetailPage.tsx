import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, FileText, Users, Calendar, DollarSign, MapPin, Tag, Trash2, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { clsx } from 'clsx';
import { useToast } from '../../context/ToastContext';
import ProcessTimeline from '../../components/process/ProcessTimeline';
import StickyNotes from '../../components/process/StickyNotes';

interface Process {
    id: string;
    number: string;
    title: string;
    description?: string;
    status: string;
    area: string;
    value: number;
    court?: string;
    forum?: string;
    clientId?: string;
    client?: {
        id: string;
        name: string;
        email?: string;
    };
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

const statusColors: Record<string, string> = {
    'Em Andamento': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Aguardando': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'Concluído': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Arquivado': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    'Urgente': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function ProcessDetailPageContent({ processIdProp, isDrawer = false }: { processIdProp?: string, isDrawer?: boolean }) {
    const { id: paramId } = useParams();
    const id = processIdProp || paramId;
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [process, setProcess] = useState<Process | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchProcess();
    }, [id]);

    const fetchProcess = async () => {
        try {
            const response = await api.get(`/processes/${id}`);
            setProcess(response.data);
        } catch (error) {
            console.error('Erro ao buscar processo:', error);
            navigate('/app/processos');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProcess = async () => {
        if (!process) return;
        const confirmDelete = window.confirm('Tem certeza que deseja apagar este caso jurídico? Esta ação não pode ser desfeita.');
        if (!confirmDelete) return;

        try {
            await api.delete(`/processes/${process.id}`);
            addToast('Processo apagado com sucesso!', 'success');
            navigate('/app/processos');
        } catch (error) {
            console.error('Erro ao apagar processo:', error);
            addToast('Erro ao apagar processo. Verifique as permissões.', 'error');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!process) {
        return (
            <div className="text-center py-12 text-app-text-muted">
                Processo não encontrado.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pb-20 md:pb-0"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {!isDrawer && (
                        <button
                            onClick={() => navigate('/app/processos')}
                            className="p-2 rounded-lg bg-app-card border border-app-stroke hover:bg-app-stroke/50 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-app-text-main" />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded bg-app-bg border border-app-stroke text-[10px] text-app-text-muted uppercase tracking-wider font-mono">
                                #{process.number?.slice(-6)}
                            </span>
                            <span className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                statusColors[process.status] || statusColors['Em Andamento']
                            )}>
                                {process.status || 'Em Andamento'}
                            </span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-app-text-main">{process.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/processos/${id}/editar`)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        <Edit size={18} />
                        <span className="hidden md:inline">Editar Processo</span>
                    </button>
                    {!isDrawer && (
                        <button
                            onClick={handleDeleteProcess}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                            title="Apagar Processo"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description Card */}
                    <div className="bg-app-card border border-app-stroke rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-app-text-main mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-primary" />
                            Descrição do Processo
                        </h2>
                        <p className="text-app-text-muted text-sm leading-relaxed">
                            {process.description || 'Nenhuma descrição fornecida.'}
                        </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-app-card border border-app-stroke rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Tag size={14} className="text-blue-500" />
                                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Área</span>
                            </div>
                            <p className="text-app-text-main font-medium">{process.area || 'Não especificada'}</p>
                        </div>
                        <div className="bg-app-card border border-app-stroke rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign size={14} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Valor da Causa</span>
                            </div>
                            <p className="text-app-text-main font-medium">{formatCurrency(process.value || 0)}</p>
                        </div>
                        <div className="bg-app-card border border-app-stroke rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin size={14} className="text-purple-500" />
                                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Foro</span>
                            </div>
                            <p className="text-app-text-main font-medium">{process.forum || 'Não especificado'}</p>
                        </div>
                        <div className="bg-app-card border border-app-stroke rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={14} className="text-amber-500" />
                                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Criado em</span>
                            </div>
                            <p className="text-app-text-main font-medium">
                                {new Date(process.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        {process.completedAt && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Concluído em</span>
                                </div>
                                <p className="text-emerald-700 dark:text-emerald-300 font-bold">
                                    {new Date(process.completedAt).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Client Info */}
                <div className="space-y-6">
                    {/* Client Card */}
                    <div className="bg-app-card border border-app-stroke rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-app-text-main mb-4 flex items-center gap-2">
                            <Users size={16} className="text-primary" />
                            Cliente
                        </h2>
                        {process.client ? (
                            <div
                                className="flex items-center gap-3 cursor-pointer hover:bg-app-stroke/20 -mx-2 px-2 py-2 rounded-lg transition-colors"
                                onClick={() => navigate(`/clientes/${process.client?.id}`)}
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-primary font-bold text-lg">
                                        {process.client.name?.charAt(0)?.toUpperCase() || 'C'}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-app-text-main">{process.client.name}</p>
                                    <p className="text-xs text-app-text-muted">{process.client.email || 'Sem email'}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-app-text-muted text-sm">Nenhum cliente vinculado.</p>
                        )}
                    </div>

                    {/* Process Timeline */}
                    <ProcessTimeline processId={process.id} />

                    {/* Sticky Notes */}
                    <StickyNotes processId={process.id} />
                </div>
            </div>
        </motion.div>
    );
}

export default function ProcessDetailPage() {
    return <ProcessDetailPageContent />;
}
