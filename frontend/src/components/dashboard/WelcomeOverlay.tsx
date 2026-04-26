import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ArrowRight, Zap, ChevronRight, FileText, MessageSquare, Bell } from 'lucide-react';

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
        recentProcessComments?: any[];
        recentClientNotes?: any[];
        pendingActions?: {
            oldProcesses: any[];
            incompleteClients: any[];
        };
    };
    onShowAgainChange?: (hide: boolean) => void;
}

const WelcomeOverlay = memo(({ isOpen, onClose, userName, stats, onShowAgainChange }: WelcomeOverlayProps) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                {/* Backdrop with high blur like landing page */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-[#020617]/80 backdrop-blur-xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-5xl bg-[#0F172A] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 flex flex-col lg:flex-row max-h-[90vh]"
                >
                    {/* Header/Left Section - Dark & Elite */}
                    <div className="lg:w-1/3 bg-black/40 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-between">
                        <div>
                            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8">
                                <Zap size={32} className="text-white fill-white/10" />
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-4 font-display tracking-tight">
                                Bem-vindo,<br />
                                <span className="text-white/60">{userName}</span>
                            </h2>
                            <p className="text-white/40 text-sm leading-relaxed mb-8">
                                Sua plataforma Advus está pronta. Aqui está o que aconteceu desde o seu último acesso.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                            >
                                Começar Agora
                                <ArrowRight size={16} />
                            </button>
                            
                            <label className="flex items-center gap-3 cursor-pointer group px-2">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-white checked:border-white transition-all cursor-pointer accent-white" 
                                    onChange={(e) => onShowAgainChange?.(e.target.checked)}
                                />
                                <span className="text-[11px] text-white/30 uppercase tracking-widest font-black group-hover:text-white/50 transition-colors">
                                    Não mostrar novamente
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Stats/Right Section */}
                    <div className="lg:w-2/3 p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-[#0F172A]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Urgent Block */}
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Clock size={20} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Prazos Próximos</span>
                                </div>
                                <p className="text-4xl font-black text-white mb-1 font-display">{stats.deadlines}</p>
                                <p className="text-xs text-white/40">Tarefas que expiram em breve</p>
                            </div>

                            {/* New Processes */}
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText size={20} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Processos</span>
                                </div>
                                <p className="text-4xl font-black text-white mb-1 font-display">{stats.newProcesses}</p>
                                <p className="text-xs text-white/40">Novas movimentações hoje</p>
                            </div>

                            {/* Comments/Engagement */}
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <MessageSquare size={20} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Interações</span>
                                </div>
                                <p className="text-4xl font-black text-white mb-1 font-display">{stats.comments + stats.mentions}</p>
                                <p className="text-xs text-white/40">Comentários e menções</p>
                            </div>

                            {/* Updates */}
                            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Bell size={20} className="text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Notificações</span>
                                </div>
                                <p className="text-4xl font-black text-white mb-1 font-display">{stats.updates}</p>
                                <p className="text-xs text-white/40">Atualizações do sistema</p>
                            </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 mb-4 px-2">Atividade Recente</h3>
                            
                            {(stats.recentProcessComments?.length || 0) > 0 ? (
                                stats.recentProcessComments?.slice(0, 3).map((comment: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                            <span className="text-white font-bold text-xs">{(comment.userName || 'U').charAt(0)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-white truncate">{comment.userName || 'Equipe'}</p>
                                            <p className="text-xs text-white/40 truncate">{comment.content || comment.text}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center rounded-3xl border border-dashed border-white/5 bg-white/[0.01]">
                                    <p className="text-white/20 text-xs italic tracking-wide">Nenhuma atividade recente para exibir</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Close button - Top Right */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all z-20"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
});

export default WelcomeOverlay;
