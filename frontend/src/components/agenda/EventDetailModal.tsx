import React, { useState } from 'react';
import { 
    X, MapPin, Clock, Calendar as CalendarIcon, 
    User as UserIcon, Trash2, CheckCircle, 
    FileText, UserPlus, AlertCircle, Plus, Trash
} from 'lucide-react';
import Modal from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface Event {
    id: string;
    title: string;
    description?: string;
    start: string;
    end: string;
    type: string;
    location?: string;
    priority?: string;
    completed: boolean;
    clientName?: string;
    clientId?: string;
    processNumber?: string;
    createdByName?: string;
    assignees?: any[];
    checklistItems?: any[];
    status?: string;
    color?: string;
    reminderMinutes?: number;
}

interface EventDetailModalProps {
    event: Event | null;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    onEdit: (event: Event) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ 
    event, 
    isOpen, 
    onClose, 
    onRefresh,
    onEdit
}) => {
    const { addToast } = useToast();
    const [newChecklistItemText, setNewChecklistItemText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    if (!event) return null;

    const handleToggleComplete = async () => {
        try {
            await api.patch(`/agenda/${event.id}/complete`);
            onRefresh();
            addToast('Status do evento atualizado', 'success');
        } catch (error) {
            addToast('Erro ao atualizar evento', 'error');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
        setIsDeleting(true);
        try {
            await api.delete(`/agenda/${event.id}`);
            onRefresh();
            onClose();
            addToast('Evento excluído com sucesso', 'success');
        } catch (error) {
            addToast('Erro ao excluir evento', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddChecklistItem = async () => {
        if (!newChecklistItemText.trim()) return;
        try {
            await api.post(`/agenda/${event.id}/checklist`, { text: newChecklistItemText });
            setNewChecklistItemText('');
            onRefresh();
        } catch (error) {
            addToast('Erro ao adicionar item ao checklist', 'error');
        }
    };

    const handleToggleChecklistItem = async (itemId: string) => {
        try {
            await api.patch(`/agenda/checklist/${itemId}/toggle`);
            onRefresh();
        } catch (error) {
            addToast('Erro ao atualizar item', 'error');
        }
    };

    const handleDeleteChecklistItem = async (itemId: string) => {
        try {
            await api.delete(`/agenda/checklist/${itemId}`);
            onRefresh();
        } catch (error) {
            addToast('Erro ao excluir item', 'error');
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Detalhes do Compromisso"
            footer={
                <div className="flex justify-between w-full">
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Trash2 size={16} />
                        Excluir
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onEdit(event)}
                            className="px-5 py-2 border border-app-stroke rounded-lg text-sm font-medium text-app-text-main hover:bg-app-stroke/30 transition-colors"
                        >
                            Editar
                        </button>
                        <button 
                            onClick={handleToggleComplete}
                            className={`px-5 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
                                event.completed 
                                ? 'bg-app-stroke text-app-text-muted' 
                                : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                            }`}
                        >
                            {event.completed ? 'Reabrir' : 'Concluir'}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            event.type === 'hearing' ? 'bg-blue-500/20 text-blue-400' :
                            event.type === 'deadline' ? 'bg-red-500/20 text-red-400' :
                            'bg-emerald-500/20 text-emerald-400'
                        }`}>
                            {event.type === 'hearing' ? 'Audiência' : 
                             event.type === 'deadline' ? 'Prazo Fatal' : 'Reunião'}
                        </span>
                        {event.priority === 'HIGH' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                                <AlertCircle size={10} /> Alta Prioridade
                            </span>
                        )}
                    </div>
                    <h2 className={`text-2xl font-black text-app-text-main tracking-tight ${event.completed ? 'line-through opacity-50' : ''}`}>
                        {event.title}
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-app-bg/50 border border-app-stroke/50">
                        <CalendarIcon size={18} className="text-app-text-muted shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Data</p>
                            <p className="text-sm font-bold text-app-text-main">
                                {new Date(event.start).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-app-bg/50 border border-app-stroke/50">
                        <Clock size={18} className="text-app-text-muted shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Horário</p>
                            <p className="text-sm font-bold text-app-text-main">
                                {new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                {event.end && ` - ${new Date(event.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                        </div>
                    </div>
                </div>

                {event.location && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-app-bg/50 border border-app-stroke/50">
                        <MapPin size={18} className="text-app-text-muted shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Localização</p>
                            <p className="text-sm font-bold text-app-text-main">{event.location}</p>
                        </div>
                    </div>
                )}

                {(event.clientName || event.processNumber) && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-app-bg/50 border border-app-stroke/50">
                        <FileText size={18} className="text-app-text-muted shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Vínculo</p>
                            {event.clientName && (
                                <p className="text-sm font-bold text-app-text-main flex items-center gap-2">
                                    <span className="text-app-text-muted">Cliente:</span> {event.clientName}
                                </p>
                            )}
                            {event.processNumber && (
                                <p className="text-sm font-bold text-app-text-main flex items-center gap-2">
                                    <span className="text-app-text-muted">Processo:</span> {event.processNumber}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {event.description && (
                    <div className="p-4 rounded-xl bg-app-bg/30 border border-app-stroke/30">
                        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-2">Descrição</p>
                        <p className="text-sm text-app-text-main leading-relaxed whitespace-pre-wrap">{event.description}</p>
                    </div>
                )}

                {/* Checklist Section */}
                <div className="pt-4 border-t border-app-stroke">
                    <h4 className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <CheckCircle size={14} /> Checklist de Preparação
                    </h4>
                    
                    <div className="space-y-2 mb-4">
                        {event.checklistItems?.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-app-bg/30 border border-app-stroke/30 group">
                                <button 
                                    onClick={() => handleToggleChecklistItem(item.id)}
                                    className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                                        item.completed 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : 'border-app-stroke hover:border-emerald-500'
                                    }`}
                                >
                                    {item.completed && <Plus size={14} className="rotate-45" />}
                                </button>
                                <span className={`text-sm flex-1 ${item.completed ? 'line-through text-app-text-muted' : 'text-app-text-main'}`}>
                                    {item.text}
                                </span>
                                <button 
                                    onClick={() => handleDeleteChecklistItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/10 p-1 rounded-lg transition-all"
                                >
                                    <Trash size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newChecklistItemText}
                            onChange={(e) => setNewChecklistItemText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                            placeholder="Adicionar item ao checklist..."
                            className="flex-1 bg-app-bg/50 border border-app-stroke rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                        />
                        <button 
                            onClick={handleAddChecklistItem}
                            className="p-2.5 bg-app-stroke hover:bg-app-stroke/50 rounded-xl text-app-text-main transition-all"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Team Section */}
                <div className="pt-4 border-t border-app-stroke">
                    <h4 className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <UserIcon size={14} /> Equipe Designada
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {event.assignees?.map(assignee => (
                            <div key={assignee.id} className="flex items-center gap-2 bg-app-bg/50 border border-app-stroke rounded-full px-3 py-1.5">
                                <Avatar 
                                    name={assignee.userName} 
                                    size="sm" 
                                    className="ring-1 ring-app-stroke"
                                />
                                <span className="text-xs font-bold text-app-text-main">{assignee.userName}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    assignee.status === 'ACCEPTED' ? 'bg-emerald-500' :
                                    assignee.status === 'DECLINED' ? 'bg-red-500' : 'bg-amber-500'
                                }`} />
                            </div>
                        ))}
                        <button className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-full px-4 py-1.5 text-xs font-bold hover:bg-primary/20 transition-all">
                            <UserPlus size={14} /> Convidar
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
