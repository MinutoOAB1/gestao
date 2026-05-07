import React from 'react';
import { TrendingUp, TrendingDown, Users, Paperclip, Download } from 'lucide-react';
import { clsx } from 'clsx';
import Modal from '../ui/Modal';
import { 
    NewTransaction, Partner, ProcessItem, ClientItem, 
    INCOME_CATEGORIES, EXPENSE_CATEGORY_LIST 
} from '../../types/financial';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    newTransaction: NewTransaction;
    setNewTransaction: (t: NewTransaction) => void;
    processes: ProcessItem[];
    clients: ClientItem[];
    partners: Partner[];
    isSubmitting: boolean;
    handleSaveTransaction: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
    isOpen, onClose, newTransaction, setNewTransaction,
    processes, clients, partners, isSubmitting, handleSaveTransaction
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            size="xl"
        >
            <div className="space-y-5">
                {/* Header */}
                <div className="mb-2">
                    <h2 className="text-xl font-bold text-app-text-main">Nova Movimentação Financeira</h2>
                    <p className="text-xs text-app-text-muted mt-1">Preencha os dados da transação para registro no fluxo de caixa.</p>
                </div>

                {/* Transaction Type Toggle */}
                <div>
                    <p className="text-xs font-medium text-app-text-muted mb-2">Tipo de Transação</p>
                    <div className="flex gap-3">
                        <button
                            className={clsx(
                                "flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                                newTransaction.type === 'INCOME'
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-app-bg/50 text-app-text-muted border border-app-stroke hover:border-primary/50"
                            )}
                            onClick={() => setNewTransaction({ ...newTransaction, type: 'INCOME' })}
                        >
                            <TrendingUp size={16} />
                            Receita (Entrada)
                        </button>
                        <button
                            className={clsx(
                                "flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                                newTransaction.type === 'EXPENSE'
                                    ? "bg-neutral-800 text-white border-2 border-black"
                                    : "bg-app-bg/50 text-app-text-muted border border-app-stroke hover:border-black/50"
                            )}
                            onClick={() => setNewTransaction({ ...newTransaction, type: 'EXPENSE' })}
                        >
                            <TrendingDown size={16} />
                            Despesa (Saída)
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-medium text-app-text-muted mb-1">
                        DESCRIÇÃO DA TRANSAÇÃO <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={newTransaction.description}
                        onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                        className="w-full bg-app-bg/50 border border-app-stroke rounded-lg px-4 py-3 text-sm text-app-text-main outline-none focus:border-primary transition-colors placeholder:text-app-text-muted/50"
                        placeholder="Ex: Pagamento de Honorários..."
                    />
                </div>

                {/* Value and Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-1">
                            VALOR (R$) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={newTransaction.amount}
                            onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                            className="w-full bg-app-bg/50 border border-app-stroke rounded-lg px-4 py-3 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                            placeholder="R$ 0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-1">
                            DATA DE VENCIMENTO <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="date"
                            value={newTransaction.date}
                            onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                            className="w-full bg-app-bg/50 border border-app-stroke rounded-lg px-4 py-3 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Classification & Links Section */}
                <div className="bg-app-bg/30 border border-app-stroke rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-app-text-main mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-black rounded-full" />
                        Classificação & Vínculos
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-medium text-app-text-muted mb-1 uppercase">Categoria</label>
                            <select
                                value={newTransaction.category}
                                onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
                                className="w-full bg-app-bg/50 border border-app-stroke rounded-lg px-4 py-2.5 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                            >
                                <option value="">Selecione uma categoria...</option>
                                {(newTransaction.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORY_LIST).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-medium text-app-text-muted mb-1 uppercase">Vincular a (Opcional)</label>
                            <select
                                value={newTransaction.linkTo}
                                onChange={e => setNewTransaction({ ...newTransaction, linkTo: e.target.value })}
                                className="w-full bg-app-bg/50 border border-app-stroke rounded-lg px-4 py-2.5 text-sm text-app-text-main outline-none focus:border-primary transition-colors"
                            >
                                <option value="">Selecione...</option>
                                {processes.length > 0 && (
                                    <optgroup label="📋 Processos Ativos">
                                        {processes.filter(p => p.status !== 'ARQUIVADO' && p.status !== 'ENCERRADO').map(process => (
                                            <option key={`process-${process.id}`} value={`process:${process.id}`}>
                                                {process.number} - {process.title}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {clients.length > 0 && (
                                    <optgroup label="👤 Clientes">
                                        {clients.map(client => (
                                            <option key={`client-${client.id}`} value={`client:${client.id}`}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Posição dinâmica: Repasse para Parceiros SÓ se for RECEITA */}
                    {newTransaction.type === 'INCOME' && (
                        <div className="mt-4 pt-4 border-t border-app-stroke border-dashed grid grid-cols-1 sm:grid-cols-12 gap-4">
                            <div className="sm:col-span-8">
                                <label className="block text-[10px] font-medium text-app-text-muted flex items-center gap-1 mb-1 uppercase">
                                    <Users size={12} className="text-primary" /> Advogado Parceiro / Indicador (Repasse)
                                </label>
                                <select
                                    value={newTransaction.partnerId || ''}
                                    onChange={e => {
                                        const partnerId = e.target.value;
                                        const partner = partners.find(p => p.id === partnerId);
                                        setNewTransaction({
                                            ...newTransaction,
                                            partnerId,
                                            partnerPercentage: partner ? (partner.percentage || 0) : 0
                                        });
                                    }}
                                    className="w-full bg-app-bg/50 border border-app-stroke rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-primary font-medium"
                                >
                                    <option value="">Nenhum repasse</option>
                                    {partners.map(partner => (
                                        <option key={`partner-${partner.id}`} value={partner.id}>
                                            {partner.name} ({partner.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {newTransaction.partnerId && (
                                <div className="sm:col-span-4">
                                    <label className="block text-[10px] whitespace-nowrap font-medium text-app-text-muted mb-1 uppercase">
                                        Porcentagem do Repasse
                                    </label>
                                    <div className="flex relative items-center">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={newTransaction.partnerPercentage || ''}
                                            onChange={e => setNewTransaction({ ...newTransaction, partnerPercentage: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-app-bg/50 border border-app-stroke rounded-lg pl-4 pr-10 py-2.5 text-sm text-app-text-main outline-none focus:border-primary transition-colors font-mono"
                                            placeholder="Ex: 30"
                                        />
                                        <span className="absolute right-4 text-app-text-muted select-none pointer-events-none">%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Status and Recurrence Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Payment Status */}
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-2 uppercase">Status do Pagamento</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNewTransaction({ ...newTransaction, status: 'PENDING' })}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    newTransaction.status === 'PENDING'
                                        ? "bg-app-bg border-2 border-app-text-main text-app-text-main"
                                        : "bg-app-bg/50 border border-app-stroke text-app-text-muted hover:border-app-text-main"
                                )}
                            >
                                <div className={clsx(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                    newTransaction.status === 'PENDING' ? "border-app-text-main" : "border-app-text-muted"
                                )}>
                                    {newTransaction.status === 'PENDING' && <div className="w-2 h-2 rounded-full bg-app-text-main" />}
                                </div>
                                Pendente
                            </button>
                            <button
                                onClick={() => setNewTransaction({ ...newTransaction, status: 'PAID' })}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    newTransaction.status === 'PAID'
                                        ? "bg-app-bg border-2 border-app-text-main text-app-text-main"
                                        : "bg-app-bg/50 border border-app-stroke text-app-text-muted hover:border-app-text-main"
                                )}
                            >
                                <div className={clsx(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                    newTransaction.status === 'PAID' ? "border-app-text-main" : "border-app-text-muted"
                                )}>
                                    {newTransaction.status === 'PAID' && <div className="w-2 h-2 rounded-full bg-app-text-main" />}
                                </div>
                                Pago
                            </button>
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div>
                        <label className="block text-xs font-medium text-app-text-muted mb-2 uppercase">Recorrência</label>
                        <div className="flex gap-1 flex-wrap">
                            {(['UNICA', 'MENSAL', 'ANUAL', 'PERSONALIZADO'] as const).map((rec) => (
                                <button
                                    key={rec}
                                    onClick={() => setNewTransaction({ ...newTransaction, recurrence: rec, installments: rec === 'UNICA' ? 1 : newTransaction.installments })}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        newTransaction.recurrence === rec
                                            ? "bg-app-bg border border-app-text-main text-app-text-main"
                                            : "bg-app-bg/50 border border-app-stroke text-app-text-muted hover:border-app-text-main"
                                    )}
                                >
                                    {rec === 'UNICA' ? 'Única' : rec === 'MENSAL' ? 'Mensal' : rec === 'ANUAL' ? 'Anual' : 'Personalizado'}
                                </button>
                            ))}
                        </div>

                        {/* Installments input - only show when recurrence is not UNICA */}
                        {newTransaction.recurrence !== 'UNICA' && (
                            <div className="mt-3 flex items-center gap-3">
                                <label className="text-xs text-app-text-muted">Quantidade de Parcelas:</label>
                                <input
                                    type="number"
                                    min="2"
                                    max="60"
                                    value={newTransaction.installments}
                                    onChange={e => setNewTransaction({ ...newTransaction, installments: parseInt(e.target.value) || 2 })}
                                    className="w-20 bg-app-bg/50 border border-app-stroke rounded-lg px-3 py-2 text-sm text-app-text-main outline-none focus:border-primary transition-colors text-center"
                                />
                                <span className="text-xs text-app-text-muted">
                                    (Serão criadas {newTransaction.installments} parcelas)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attach and Urgent Row */}
                <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 text-primary text-sm font-medium hover:underline">
                        <Paperclip size={14} />
                        Anexar Comprovante / Nota Fiscal
                    </button>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={newTransaction.urgent}
                            onChange={e => setNewTransaction({ ...newTransaction, urgent: e.target.checked })}
                            className="w-4 h-4 rounded border-app-stroke text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-app-text-muted">Marcar como Urgente</span>
                    </label>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-medium text-app-text-muted mb-1 uppercase">Notas Adicionais</label>
                    <textarea
                        value={newTransaction.notes}
                        onChange={e => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                        className="w-full bg-app-bg/50 border border-app-stroke rounded-lg px-4 py-3 text-sm text-app-text-main outline-none focus:border-primary transition-colors resize-none placeholder:text-app-text-muted/50"
                        rows={3}
                        placeholder="Observações internas sobre esta movimentação..."
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-app-stroke">
                    <button
                        onClick={onClose}
                        className="order-2 sm:order-1 px-5 py-2.5 bg-app-bg border border-app-stroke rounded-lg text-sm font-medium text-app-text-main hover:bg-app-stroke/50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-2">
                        <button
                            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                            <Download size={14} />
                            Gerar Boleto/Fatura
                        </button>
                        <button
                            onClick={handleSaveTransaction}
                            disabled={isSubmitting}
                            className={clsx(
                                "flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-lg text-sm font-bold transition-colors shadow-lg",
                                isSubmitting ? "bg-black/50 cursor-not-allowed" : "bg-black hover:opacity-90 shadow-black/20"
                            )}
                        >
                            {isSubmitting ? 'Salvando...' : '✓ Salvar Movimentação'}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
