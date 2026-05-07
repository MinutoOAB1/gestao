import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Process } from '../../types/kanban';

export function AddCardModal({
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
                        <button type="submit" className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 flex items-center gap-2 font-bold shadow-lg shadow-black/20">
                            <Plus size={16} /> Criar novo caso
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
