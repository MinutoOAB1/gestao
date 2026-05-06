import React, { useMemo } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface Record {
    id: string;
    description: string;
    amount: number;
    date: string;
    status: string;
    client?: { id: string; name: string };
    type: 'INCOME' | 'EXPENSE';
}

interface InadimplenciaTabProps {
    records: Record[];
}

export const InadimplenciaTab: React.FC<InadimplenciaTabProps> = ({ records }) => {
    // Filter overdue income records
    const overdueRecords = useMemo(() => {
        return records.filter(r => {
            if (r.status === 'PAID' || r.type !== 'INCOME') return false;
            if (!r.date || r.date.length < 10) return false;
            
            const [year, month, day] = r.date.substring(0, 10).split('-').map(Number);
            const dueDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            return dueDate < today;
        }).map(r => {
            const [year, month, day] = r.date.substring(0, 10).split('-').map(Number);
            const dueDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffTime = Math.abs(today.getTime() - dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
                ...r,
                daysOverdue: diffDays,
                dueDateObj: dueDate
            };
        }).sort((a, b) => b.daysOverdue - a.daysOverdue);
    }, [records]);

    const totalOverdue = useMemo(() => {
        return overdueRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    }, [overdueRecords]);

    const formatBRL = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(value);
    };

    const handleSendReminder = (record: any) => {
        const clientName = record.client?.name || 'Cliente';
        const amount = formatBRL(record.amount);
        const date = format(record.dueDateObj, 'dd/MM/yyyy');
        
        const message = `Olá ${clientName}, tudo bem? Identificamos um valor em aberto no valor de ${amount} com vencimento em ${date}. Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.`;
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Resumo Box */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-red-900 font-bold text-lg">Total em Inadimplência: <span className="text-2xl ml-2">{formatBRL(totalOverdue)}</span></h3>
                    </div>
                </div>
                <div className="text-red-600 font-medium">
                    {overdueRecords.length} {overdueRecords.length === 1 ? 'honorário vencido' : 'honorários vencidos'}
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white border border-app-stroke rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-app-stroke/50 bg-gray-50/50 text-xs font-semibold text-gray-500 tracking-wider">
                                <th className="px-6 py-4 uppercase">Cliente</th>
                                <th className="px-6 py-4 uppercase">Valor em Atraso</th>
                                <th className="px-6 py-4 uppercase">Dias em Atraso</th>
                                <th className="px-6 py-4 uppercase">Vencimento</th>
                                <th className="px-6 py-4 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overdueRecords.length > 0 ? (
                                overdueRecords.map((record) => (
                                    <tr key={record.id} className="border-b border-app-stroke/50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{record.client?.name || record.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-red-600">{formatBRL(record.amount)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">
                                                {record.daysOverdue} dias
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">
                                            {format(record.dueDateObj, 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleSendReminder(record)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-black transition-all shadow-sm"
                                            >
                                                <Send size={14} className="text-gray-400" />
                                                Enviar Lembrete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum registro de inadimplência encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
