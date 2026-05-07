import React, { useState } from 'react';
import { X } from 'lucide-react';

export function FilterModal({
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
                    <button onClick={() => { onApply(localFilters); onClose(); }} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 font-bold shadow-lg">Aplicar</button>
                </div>
            </div>
        </div>
    );
}
