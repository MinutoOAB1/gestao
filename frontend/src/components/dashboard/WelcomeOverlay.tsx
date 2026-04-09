import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, ArrowRight, Zap, Check } from 'lucide-react';

interface WelcomeOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    stats: {
        deadlines: number;
        newProcesses: number;
        updates: number;
        comments: number;
        mentions: number;
        recentProcessComments: any[];
        recentClientNotes: any[];
        pendingActions: {
            oldProcesses: any[];
            incompleteClients: any[];
        };
    };
    onShowAgainChange?: (show: boolean) => void;
}

export default function WelcomeOverlay({ isOpen, onClose, userName, stats, onShowAgainChange }: WelcomeOverlayProps) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleToggle = () => {
        const newValue = !dontShowAgain;
        setDontShowAgain(newValue);
        if (onShowAgainChange) onShowAgainChange(newValue);
    };
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-24 md:pb-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Card container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10"
                    >
                        {/* Header with gradient - Fixed color to match platform Navy */}
                        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#172554] p-8 text-white relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                                    <Zap size={24} className="text-white ring-offset-2 animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight mb-1 uppercase">Bem-vindo de volta!</h2>
                                <p className="text-indigo-100 font-medium">Olá, <span className="text-white font-bold">{userName}</span>. Aqui está o que mudou desde seu último acesso.</p>
                            </motion.div>
                        </div>

                        {/* Main Content Area - Two Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                            {/* Left Column: Summary & Metrics (2/5 width) */}
                            <div className="lg:col-span-2 p-8 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Deadlines */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 group hover:shadow-md transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-tighter">Prazos Urgentes</p>
                                                <p className="text-xs text-red-700 dark:text-red-300 font-medium">{stats.deadlines} vencendo em breve</p>
                                            </div>
                                            <div className="text-xl font-black text-red-600">{stats.deadlines}</div>
                                        </motion.div>

                                        {/* New Processes */}
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 group hover:shadow-md transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                <Clock size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-blue-900 dark:text-blue-400 uppercase tracking-tighter">Novos Processos</p>
                                                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">{stats.newProcesses} recentemente</p>
                                            </div>
                                            <div className="text-xl font-black text-blue-600">{stats.newProcesses}</div>
                                        </motion.div>

                                        {/* New Comments/Mentions mini grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                                className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20"
                                            >
                                                <p className="text-[10px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">Comentários</p>
                                                <div className="text-2xl font-black text-amber-600 leading-none">{stats.comments}</div>
                                            </motion.div>

                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.6 }}
                                                className="flex flex-col gap-2 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20"
                                            >
                                                <p className="text-[10px] font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest">Menções</p>
                                                <div className="text-2xl font-black text-indigo-600 leading-none">{stats.mentions}</div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-4">
                                    {/* Opt-out Checkbox */}
                                    <div className="flex items-center gap-3 px-1">
                                        <button 
                                            onClick={handleToggle}
                                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                                dontShowAgain ? 'bg-primary border-primary text-white' : 'border-app-stroke bg-transparent'
                                            }`}
                                        >
                                            {dontShowAgain && <Check size={14} strokeWidth={3} />}
                                        </button>
                                        <span className="text-xs text-app-text-muted font-medium cursor-pointer select-none" onClick={handleToggle}>
                                            Não mostrar este resumo ao entrar
                                        </span>
                                    </div>

                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 }}
                                        onClick={onClose}
                                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        IR PARA O DASHBOARD <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Right Column: Activity Feed & Suggestions (3/5 width) */}
                            <div className="lg:col-span-3 bg-slate-50 dark:bg-slate-900/50 p-8 overflow-y-auto max-h-[600px]">
                                <div className="space-y-8">
                                    {/* Recent Activity Section */}
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Clock size={14} /> Atividade Recente (Suas Notas)
                                        </h3>
                                        <div className="space-y-4">
                                            {[...stats.recentProcessComments, ...stats.recentClientNotes]
                                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                .slice(0, 5)
                                                .map((item, idx) => (
                                                <motion.div 
                                                    key={idx}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + (idx * 0.1) }}
                                                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                                            {item.process ? 'Processo' : 'Cliente'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                                                        {item.process?.title || item.client?.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                                                        "{item.content}"
                                                    </p>
                                                </motion.div>
                                            ))}
                                            {(stats.recentProcessComments.length === 0 && stats.recentClientNotes.length === 0) && (
                                                <p className="text-xs text-slate-400 italic text-center py-4">Nenhuma nota recente encontrada.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sugestões de Ação Section */}
                                    <div>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Zap size={14} /> Sugestões de Ação (Para fazer)
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {stats.pendingActions.oldProcesses.map((proc, idx) => (
                                                <div key={`p-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Atualizar Processo: {proc.title}</p>
                                                        <p className="text-[10px] text-slate-500">Sem andamentos há mais de 30 dias</p>
                                                    </div>
                                                    <ArrowRight size={14} className="text-slate-400" />
                                                </div>
                                            ))}
                                            {stats.pendingActions.incompleteClients.map((client, idx) => (
                                                <div key={`c-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Completar Cadastro: {client.name}</p>
                                                        <p className="text-[10px] text-slate-500">Falta e-mail ou telefone de contato</p>
                                                    </div>
                                                    <ArrowRight size={14} className="text-slate-400" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
