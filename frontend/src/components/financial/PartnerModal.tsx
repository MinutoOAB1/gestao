import React from 'react';
import { clsx } from 'clsx';
import Modal from '../ui/Modal';
import { Protect } from '../auth/Protect';
import { NewPartner, Partner, PARTNER_TYPES, PARTNER_COLORS } from '../../types/financial';

interface PartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    newPartner: NewPartner;
    setNewPartner: (p: NewPartner) => void;
    editingPartner: Partner | null;
    isSubmitting: boolean;
    handleSavePartner: () => void;
    handleDeletePartner: (id: string) => void;
}

export const PartnerModal: React.FC<PartnerModalProps> = ({
    isOpen,
    onClose,
    newPartner,
    setNewPartner,
    editingPartner,
    isSubmitting,
    handleSavePartner,
    handleDeletePartner
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-1">Nome *</label>
                        <input
                            type="text"
                            value={newPartner.name}
                            onChange={e => setNewPartner({ ...newPartner, name: e.target.value })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-3 py-2 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                            placeholder="Ex: Adv. Ana Maria"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-1">Iniciais *</label>
                        <input
                            type="text"
                            value={newPartner.initials}
                            maxLength={2}
                            onChange={e => setNewPartner({ ...newPartner, initials: e.target.value.toUpperCase() })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-3 py-2 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                            placeholder="AM"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-1">Tipo *</label>
                        <select
                            value={newPartner.type}
                            onChange={e => setNewPartner({ ...newPartner, type: e.target.value })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-3 py-2 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                        >
                            {PARTNER_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-1">Cor</label>
                        <div className="flex gap-1 flex-wrap">
                            {PARTNER_COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setNewPartner({ ...newPartner, color })}
                                    className={clsx(
                                        "w-6 h-6 rounded-md transition-all",
                                        color,
                                        newPartner.color === color && "ring-2 ring-offset-2 ring-primary"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                        <label className="block text-xs font-medium text-app-text-muted mb-1 flex items-center justify-between">
                            Percentual (%)
                            <span className={clsx(
                                "px-1.5 py-0.5 rounded text-[10px] uppercase font-bold",
                                newPartner.percentage ? "bg-black/20 text-black" : "bg-app-stroke text-app-text-muted"
                            )}>
                                Repasse Automático
                            </span>
                        </label>
                        <input
                            type="number"
                            value={newPartner.percentage}
                            onChange={e => setNewPartner({ ...newPartner, percentage: e.target.value, fixedAmount: '' })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-3 py-2 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                            placeholder="Ex: 30"
                        />
                        {newPartner.percentage && (
                            <p className="text-[10px] text-primary mt-1 leading-tight">
                                Cálculo automático ativado. Este parceiro receberá exatamente {newPartner.percentage}% de repasse de todas as receitas.
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-1">Ou Valor Fixo (R$)</label>
                        <input
                            type="number"
                            value={newPartner.fixedAmount}
                            onChange={e => setNewPartner({ ...newPartner, fixedAmount: e.target.value, percentage: '' })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-3 py-2 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                            placeholder="Ex: 1500"
                        />
                        {newPartner.fixedAmount && (
                            <p className="text-[10px] text-app-text-muted mt-1 leading-tight">
                                Valores fixos não ativam cálculo automático no cadastro de receitas.
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-1">Email</label>
                        <input
                            type="email"
                            value={newPartner.email}
                            onChange={e => setNewPartner({ ...newPartner, email: e.target.value })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-3 py-2 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-1">Telefone</label>
                        <input
                            type="tel"
                            value={newPartner.phone}
                            onChange={e => setNewPartner({ ...newPartner, phone: e.target.value })}
                            className="w-full bg-app-bg border border-app-stroke rounded-lg px-3 py-2 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                            placeholder="(11) 99999-9999"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-app-text-muted mb-1">Observações</label>
                    <textarea
                        value={newPartner.notes}
                        onChange={e => setNewPartner({ ...newPartner, notes: e.target.value })}
                        className="w-full bg-app-bg border border-app-stroke rounded-lg px-3 py-2 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                        rows={2}
                        placeholder="Notas sobre a parceria..."
                    />
                </div>

                <div className="flex justify-between items-center mt-4">
                    {editingPartner && (
                        <Protect roles={['ADMIN', 'LAWYER']}>
                            <button
                                onClick={() => {
                                    handleDeletePartner(editingPartner.id);
                                    onClose();
                                }}
                                className="px-4 py-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                            >
                                Desativar Parceiro
                            </button>
                        </Protect>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-app-text-muted hover:text-app-text-main transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSavePartner}
                            disabled={isSubmitting}
                            className={clsx(
                                "px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors",
                                isSubmitting ? "bg-black/50 cursor-not-allowed" : "bg-black hover:opacity-90"
                            )}
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
