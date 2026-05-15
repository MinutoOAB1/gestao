import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, TrendingUp, TrendingDown, Percent, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { formatBRL } from '../../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

interface DREData {
    period: { start: string, end: string };
    grossRevenue: {
        total: number;
        categories: Array<{ name: string, amount: number, code?: string }>;
    };
    taxes: {
        total: number;
        iss: number;
        irrf: number;
        pis: number;
        cofins: number;
    };
    netRevenue: number;
    operatingExpenses: {
        total: number;
        categories: Array<{ name: string, amount: number, code?: string }>;
    };
    netProfit: number;
    profitMargin: number;
}

export const DREReportTab: React.FC = () => {
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<DREData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/financial/report/dre', {
                params: { startDate, endDate }
            });
            setData(response.data);
        } catch (err) {
            console.error('Erro ao buscar DRE:', err);
            setError('Falha ao carregar relatório DRE. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExportPDF = () => {
        window.open(`${api.defaults.baseURL}/financial/report/pdf?startDate=${startDate}&endDate=${endDate}`, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-app-card border border-app-stroke rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-app-text-label uppercase tracking-wider">Início:</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-app-bg border border-app-stroke rounded-lg px-3 py-1.5 text-sm text-app-text-main focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-app-text-label uppercase tracking-wider">Fim:</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-app-bg border border-app-stroke rounded-lg px-3 py-1.5 text-sm text-app-text-main focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <button 
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                        title="Atualizar Dados"
                    >
                        <RefreshCw size={18} className={clsx(loading && "animate-spin")} />
                    </button>
                </div>

                <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                >
                    <Download size={16} />
                    Exportar PDF Completo
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {loading && !data ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-app-card border border-app-stroke rounded-2xl" />
                    ))}
                </div>
            ) : data && (
                <div className="space-y-6">
                    {/* Summary Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard 
                            title="Receita Bruta" 
                            value={data.grossRevenue.total} 
                            icon={<TrendingUp className="text-emerald-500" size={20} />}
                            subtitle={`${data.grossRevenue.categories.length} categorias`}
                        />
                        <SummaryCard 
                            title="Impostos Retidos" 
                            value={data.taxes.total} 
                            icon={<TrendingDown className="text-amber-500" size={20} />}
                            subtitle={`ISS, IRRF, PIS, COFINS`}
                            negative
                        />
                        <SummaryCard 
                            title="Despesas Operacionais" 
                            value={data.operatingExpenses.total} 
                            icon={<TrendingDown className="text-rose-500" size={20} />}
                            subtitle={`${data.operatingExpenses.categories.length} categorias`}
                            negative
                        />
                        <SummaryCard 
                            title="Lucro Líquido" 
                            value={data.netProfit} 
                            icon={<Percent className="text-primary" size={20} />}
                            subtitle={`Margem: ${data.profitMargin.toFixed(1)}%`}
                            highlight
                        />
                    </div>

                    {/* Detailed DRE Table */}
                    <div className="bg-app-card border border-app-stroke rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-app-stroke bg-app-bg/30">
                            <h3 className="text-lg font-bold text-app-text-main flex items-center gap-2">
                                <FileText size={20} className="text-primary" />
                                Demonstrativo de Resultados (DRE)
                            </h3>
                            <p className="text-xs text-app-text-muted mt-1 uppercase tracking-widest font-medium">
                                Período de {new Date(startDate).toLocaleDateString('pt-BR')} a {new Date(endDate).toLocaleDateString('pt-BR')} (Regime de Competência)
                            </p>
                        </div>

                        <div className="divide-y divide-app-stroke">
                            {/* RECEITA BRUTA */}
                            <DRESectionHeader title="1. RECEITA OPERACIONAL BRUTA" value={data.grossRevenue.total} />
                            {data.grossRevenue.categories.map((cat, i) => (
                                <DRERow key={i} label={cat.name} value={cat.amount} code={cat.code} indent />
                            ))}

                            {/* DEDUCOES / IMPOSTOS */}
                            <DRESectionHeader title="2. DEDUÇÕES E IMPOSTOS" value={data.taxes.total} isNegative />
                            <DRERow label="ISS (Imposto Sobre Serviços)" value={data.taxes.iss} indent isNegative />
                            <DRERow label="IRRF (Imposto de Renda Retido)" value={data.taxes.irrf} indent isNegative />
                            <DRERow label="PIS / COFINS" value={data.taxes.pis + data.taxes.cofins} indent isNegative />

                            {/* RECEITA LIQUIDA */}
                            <DRESectionHeader title="3. RECEITA OPERACIONAL LÍQUIDA" value={data.netRevenue} isSubtotal />

                            {/* DESPESAS */}
                            <DRESectionHeader title="4. DESPESAS OPERACIONAIS" value={data.operatingExpenses.total} isNegative />
                            {data.operatingExpenses.categories.map((cat, i) => (
                                <DRERow key={i} label={cat.name} value={cat.amount} code={cat.code} indent isNegative />
                            ))}

                            {/* RESULTADO LIQUIDO */}
                            <div className="p-6 bg-primary/5 flex justify-between items-center">
                                <div>
                                    <h4 className="text-xl font-black text-app-text-main uppercase tracking-tighter">Resultado Líquido do Exercício</h4>
                                    <p className="text-xs text-app-text-muted">Lucro ou Prejuízo após todas as deduções</p>
                                </div>
                                <div className={clsx(
                                    "text-2xl font-black tracking-tighter",
                                    data.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {formatBRL(data.netProfit)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tax Breakdown Charts or Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-app-card border border-app-stroke rounded-2xl p-5">
                            <h4 className="text-sm font-bold text-app-text-main mb-4 flex items-center gap-2">
                                <Info size={16} className="text-primary" />
                                Nota Explicativa - Impostos
                            </h4>
                            <p className="text-xs text-app-text-muted leading-relaxed">
                                Os impostos exibidos referem-se às retenções na fonte informadas nos lançamentos de receita. 
                                O sistema utiliza o <b>Regime de Competência</b>, baseando-se na data em que o serviço foi prestado 
                                (Data de Competência), independentemente da data do efetivo recebimento em conta.
                            </p>
                        </div>
                        <div className="bg-app-card border border-app-stroke rounded-2xl p-5 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-app-text-main">Margem de Lucro</h4>
                                <p className="text-xs text-app-text-muted mt-1">Eficiência operacional do período</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-3xl font-black text-primary">
                                    {data.profitMargin.toFixed(1)}%
                                </div>
                                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
                                    <Percent size={14} className="text-primary" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SummaryCard: React.FC<{ 
    title: string, 
    value: number, 
    icon: React.ReactNode, 
    subtitle: string, 
    negative?: boolean,
    highlight?: boolean 
}> = ({ title, value, icon, subtitle, negative, highlight }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
            "bg-app-card border border-app-stroke rounded-2xl p-5 shadow-sm",
            highlight && "ring-2 ring-primary/20 border-primary/30"
        )}
    >
        <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black uppercase text-app-text-label tracking-widest">{title}</span>
            <div className="p-2 bg-app-bg rounded-xl border border-app-stroke">
                {icon}
            </div>
        </div>
        <div className={clsx(
            "text-2xl font-black tracking-tighter",
            negative ? "text-app-text-main" : (value >= 0 ? "text-app-text-main" : "text-rose-500")
        )}>
            {negative && value > 0 ? '-' : ''}{formatBRL(value)}
        </div>
        <p className="text-[10px] text-app-text-muted mt-2 font-bold uppercase tracking-tight">{subtitle}</p>
    </motion.div>
);

const DRESectionHeader: React.FC<{ title: string, value: number, isNegative?: boolean, isSubtotal?: boolean }> = ({ title, value, isNegative, isSubtotal }) => (
    <div className={clsx(
        "px-6 py-4 flex justify-between items-center",
        isSubtotal ? "bg-app-bg font-bold" : "bg-app-bg/10"
    )}>
        <span className={clsx(
            "text-xs font-black uppercase tracking-wider",
            isSubtotal ? "text-primary" : "text-app-text-main"
        )}>{title}</span>
        <span className={clsx(
            "text-sm font-black",
            isNegative && value > 0 ? "text-rose-500" : (isSubtotal ? "text-primary" : "text-app-text-main")
        )}>
            {isNegative && value > 0 ? '-' : ''}{formatBRL(value)}
        </span>
    </div>
);

const DRERow: React.FC<{ label: string, value: number, code?: string, indent?: boolean, isNegative?: boolean }> = ({ label, value, code, indent, isNegative }) => (
    <div className={clsx(
        "px-6 py-3 flex justify-between items-center hover:bg-app-bg/20 transition-colors",
        indent && "pl-12"
    )}>
        <div className="flex items-center gap-2">
            {code && <span className="text-[10px] font-mono text-app-text-muted bg-app-stroke/30 px-1.5 py-0.5 rounded">{code}</span>}
            <span className="text-sm text-app-text-muted font-medium">{label}</span>
        </div>
        <span className={clsx(
            "text-sm font-medium",
            isNegative && value > 0 ? "text-rose-500/80" : "text-app-text-main"
        )}>
            {isNegative && value > 0 ? '-' : ''}{formatBRL(value)}
        </span>
    </div>
);
