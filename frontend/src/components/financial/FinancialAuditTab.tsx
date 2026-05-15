import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Activity, AlertCircle, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface AuditEntry {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    userName: string;
    details: string;
    createdAt: string;
}

export const FinancialAuditTab: React.FC = () => {
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const response = await api.get('/financial/report/audit');
                setLogs(response.data);
            } catch (err) {
                console.error('Erro ao buscar auditoria:', err);
                setError('Não foi possível carregar os logs de auditoria.');
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, []);

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREATE': return <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">Criado</span>;
            case 'UPDATE': return <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">Editado</span>;
            case 'DELETE': return <span className="bg-red-500/10 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">Excluído</span>;
            default: return <span className="bg-slate-500/10 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">{action}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-app-card border border-app-stroke rounded-2xl p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-app-text-main flex items-center gap-2">
                        <Shield size={20} className="text-slate-500" />
                        Trilha de Auditoria Financeira
                    </h3>
                    <p className="text-sm text-app-text-muted mt-1">Histórico completo de todas as alterações realizadas em registros financeiros.</p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <Activity size={24} className="text-slate-500" />
                </div>
            </div>

            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-app-card border border-app-stroke rounded-xl" />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                    <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
                    <p className="text-red-500 font-medium">{error}</p>
                </div>
            ) : (
                <div className="bg-app-card border border-app-stroke rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-app-bg/50 border-b border-app-stroke">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest">DATA/HORA</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest">USUÁRIO</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest">AÇÃO</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest">DETALHES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-app-stroke/30">
                                {logs.map((log) => (
                                    <motion.tr 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }}
                                        key={log.id} 
                                        className="hover:bg-app-bg/20 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-xs text-app-text-main font-medium">
                                                <Clock size={12} className="text-app-text-muted" />
                                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {log.userName?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-xs text-app-text-main font-semibold">{log.userName || 'Sistema'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-app-text-muted truncate max-w-md" title={log.details}>
                                                {log.details || 'Sem detalhes adicionais'}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-app-text-muted italic">
                                            Nenhum log de auditoria encontrado para o módulo financeiro.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                    <AlertCircle size={20} className="text-amber-500" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-app-text-main">Compliance & Segurança</h4>
                    <p className="text-xs text-app-text-muted mt-1 leading-relaxed">
                        Estes logs são imutáveis e servem como prova de integridade dos dados financeiros do escritório. 
                        Em caso de auditoria externa, estes registros garantem que todas as movimentações foram rastreadas 
                        pelo usuário responsável.
                    </p>
                </div>
            </div>
        </div>
    );
};
