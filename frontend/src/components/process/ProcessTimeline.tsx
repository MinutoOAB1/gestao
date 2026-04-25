import { useState, useEffect } from 'react';
import { Plus, Gavel, Scale, Calendar, AlertTriangle, FileText, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import Modal from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

interface ProcessUpdate {
    id: string;
    date: string;
    description: string;
    type: string;
    isImportant: boolean;
    createdBy?: string;
    createdAt: string;
}

const UPDATE_TYPES = [
    { key: 'MOVIMENTO', label: 'Movimento', icon: FileText, color: 'text-neutral-500' },
    { key: 'DECISAO', label: 'Decisão', icon: Gavel, color: 'text-black' },
    { key: 'SENTENCA', label: 'Sentença', icon: Scale, color: 'text-black font-black' },
    { key: 'DESPACHO', label: 'Despacho', icon: FileText, color: 'text-neutral-700' },
    { key: 'AUDIENCIA', label: 'Audiência', icon: Calendar, color: 'text-neutral-800' },
    { key: 'PRAZO', label: 'Prazo', icon: AlertTriangle, color: 'text-black' },
    { key: 'OUTRO', label: 'Outro', icon: Clock, color: 'text-neutral-400' },
];

interface ProcessTimelineProps {
    processId: string;
}

export default function ProcessTimeline({ processId }: ProcessTimelineProps) {
    const { addToast } = useToast();
    const [updates, setUpdates] = useState<ProcessUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newUpdate, setNewUpdate] = useState({
        description: '',
        type: 'MOVIMENTO',
        date: new Date().toISOString().slice(0, 16),
        isImportant: false,
    });

    useEffect(() => {
        fetchUpdates();
    }, [processId]);

    const fetchUpdates = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/process-updates/process/${processId}`);
            setUpdates(res.data || []);
        } catch (error) {
            console.error('Erro ao buscar andamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newUpdate.description.trim()) {
            addToast('Preencha a descrição do andamento', 'warning');
            return;
        }

        setSaving(true);
        try {
            await api.post(`/process-updates/${processId}`, {
                description: newUpdate.description,
                type: newUpdate.type,
                date: newUpdate.date,
                isImportant: newUpdate.isImportant,
            });
            setShowModal(false);
            setNewUpdate({
                description: '',
                type: 'MOVIMENTO',
                date: new Date().toISOString().slice(0, 16),
                isImportant: false,
            });
            fetchUpdates();
            addToast('Andamento criado com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao criar andamento:', error);
            addToast('Erro ao criar andamento', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getTypeInfo = (type: string) => {
        return UPDATE_TYPES.find(t => t.key === type) || UPDATE_TYPES[0];
    };

    return (
        <div className="bg-app-card border border-app-stroke rounded-2xl overflow-hidden">
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-app-stroke/10 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <h2 className="text-sm font-bold text-app-text-main flex items-center gap-2">
                    <Clock size={16} className="text-black" />
                    Cronologia do Processo
                    <span className="text-xs font-normal text-app-text-muted">
                        ({updates.length} {updates.length === 1 ? 'andamento' : 'andamentos'})
                    </span>
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                        className="p-1.5 bg-black/5 text-black rounded-lg hover:bg-black/10 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                    {expanded ? <ChevronUp size={16} className="text-app-text-muted" /> : <ChevronDown size={16} className="text-app-text-muted" />}
                </div>
            </div>

            {/* Timeline Content */}
            {expanded && (
                <div className="p-4 pt-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : updates.length === 0 ? (
                        <div className="text-center py-8 text-app-text-muted">
                            <Clock size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Nenhum andamento registrado.</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-3 text-black font-bold text-sm hover:underline"
                            >
                                + Adicionar primeiro andamento
                            </button>
                        </div>
                    ) : (
                        <div className="relative pl-6">
                            {/* Vertical Line */}
                            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-app-stroke" />

                            {/* Timeline Items */}
                            <div className="space-y-4">
                                {updates.map((update) => {
                                    const typeInfo = getTypeInfo(update.type);
                                    const IconComponent = typeInfo.icon;

                                    return (
                                        <div key={update.id} className="relative">
                                            {/* Circle on line */}
                                            <div className={clsx(
                                                "absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center z-10",
                                                update.isImportant
                                                    ? "bg-black shadow-lg shadow-black/30"
                                                    : "bg-app-card border-2 border-app-stroke"
                                            )}>
                                                <IconComponent size={10} className={update.isImportant ? "text-white" : typeInfo.color} />
                                            </div>

                                            {/* Content Card */}
                                            <div className={clsx(
                                                "ml-2 p-4 rounded-xl border transition-colors",
                                                update.isImportant
                                                    ? "bg-primary/5 border-primary/30"
                                                    : "bg-app-bg border-app-stroke hover:border-app-stroke/80"
                                            )}>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className={clsx(
                                                        "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                                        update.isImportant ? "bg-black text-white" : "bg-app-stroke/50 text-app-text-muted"
                                                    )}>
                                                        {typeInfo.label}
                                                    </span>
                                                    <span className="text-xs text-app-text-muted">
                                                        {new Date(update.date).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-app-text-main leading-relaxed">
                                                    {update.description}
                                                </p>
                                                {update.createdBy && (
                                                    <p className="text-xs text-app-text-muted mt-2">
                                                        Por: {update.createdBy}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Update Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Novo Andamento"
                footer={
                    <>
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-app-text-main hover:bg-app-stroke/30 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-black text-white hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Tipo *</label>
                        <select
                            value={newUpdate.type}
                            onChange={(e) => setNewUpdate({ ...newUpdate, type: e.target.value })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors"
                        >
                            {UPDATE_TYPES.map(t => (
                                <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Data *</label>
                        <input
                            type="datetime-local"
                            value={newUpdate.date}
                            onChange={(e) => setNewUpdate({ ...newUpdate, date: e.target.value })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Descrição *</label>
                        <textarea
                            value={newUpdate.description}
                            onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
                            placeholder="Descreva o andamento processual..."
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors h-28 resize-none"
                        />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={newUpdate.isImportant}
                            onChange={(e) => setNewUpdate({ ...newUpdate, isImportant: e.target.checked })}
                            className="w-4 h-4 rounded border-app-stroke text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-app-text-main">Marcar como importante</span>
                    </label>
                </div>
            </Modal>
        </div>
    );
}
