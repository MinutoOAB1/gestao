import re
import os

path = r"c:\Users\victo\OneDrive\Documentos\Antigravi-platadv\frontend\src\pages\processes\ProcessListPage.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

filter_target = """                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={clsx(
                            "px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-fast border touch-manipulation shrink-0",
                            activeFilter === filter
                                ? "bg-primary text-white border-primary"
                                : "bg-transparent text-app-text-muted border-app-stroke hover:border-app-text-label active:bg-app-stroke/30"
                        )}
                    >
                        {filter}
                    </button>"""

filter_repl = """                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={clsx(
                            "px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-fast border touch-manipulation shrink-0 flex items-center gap-1.5",
                            activeFilter === filter
                                ? "bg-primary text-white border-primary"
                                : "bg-transparent text-app-text-muted border-app-stroke hover:border-app-text-label active:bg-app-stroke/30"
                        )}
                    >
                        {filter}
                        {filter === 'Urgentes' && (
                            <span className="relative flex h-2 w-2">
                                <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", activeFilter === filter ? "bg-white" : "bg-red-500")}></span>
                                <span className={clsx("relative inline-flex rounded-full h-2 w-2", activeFilter === filter ? "bg-white" : "bg-red-500")}></span>
                            </span>
                        )}
                    </button>"""

if filter_target in content:
    content = content.replace(filter_target, filter_repl)
    print("Filter replaced")
else:
    print("Filter target NOT found")

card_target = """const ProcessCard = memo(({ proc, onNavigate }: { proc: Process, onNavigate: () => void }) => (
    <motion.div
        variants={itemVariants}
        className="bg-app-card rounded-xl border border-app-stroke p-4 sm:p-5 hover:border-primary/50 transition-fast cursor-pointer shadow-sm relative overflow-hidden group touch-manipulation will-animate"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onNavigate}
    >
        {/* Priority Indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:bg-primary-light transition-fast"></div>

        <div className="flex justify-between items-start mb-2 pl-2">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-app-bg border border-app-stroke text-[10px] text-app-text-muted uppercase tracking-wider font-mono">
                    #{proc.number.slice(-4)}
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
                    Cível
                </span>
            </div>
            <button className="text-app-text-muted hover:text-app-text-main p-1" onClick={(e) => e.stopPropagation()}>
                <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
                <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
                <div className="w-1 h-1 rounded-full bg-current"></div>
            </button>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-app-text-main mb-1 pl-2 line-clamp-2">{proc.title}</h3>

        <div className="flex items-center gap-2 pl-2 mb-3 sm:mb-4">
            <Users size={14} className="text-app-text-muted shrink-0" />
            <span className="text-xs sm:text-sm text-app-text-muted truncate">Cliente: <span className="text-app-text-main">{proc.client?.name || 'N/A'}</span></span>
        </div>

        <div className="flex items-center justify-between border-t border-app-stroke pt-3 pl-2">
            <div className="flex items-center gap-2 text-xs text-app-text-muted">
                <div className="w-4 h-4 rounded bg-app-bg flex items-center justify-center border border-app-stroke">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                </div>
                <span className="hidden sm:inline">Aguardando audiência</span>
                <span className="sm:hidden">Aguardando</span>
            </div>
            <div className="text-xs font-medium text-app-text-main bg-app-bg px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-app-stroke">
                Ver detalhes
            </div>
        </div>
    </motion.div>
));"""

card_repl = """const ProcessCard = memo(({ proc, onNavigate }: { proc: Process, onNavigate: () => void }) => {
    // Determine Area Color
    const getAreaColor = (areaStr: string) => {
        const area = areaStr || 'Cível';
        if (area.toLowerCase().includes('cível')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        if (area.toLowerCase().includes('trabalho') || area.toLowerCase().includes('trabalh')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        if (area.toLowerCase().includes('família')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        if (area.toLowerCase().includes('criminal') || area.toLowerCase().includes('penal')) return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (area.toLowerCase().includes('tribut')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    };

    // Determine Urgency
    const isUrgent = proc.deadline && Math.ceil((new Date(proc.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3;

    // Determine Progress Width based on Kanban Column
    let progress = 20;
    const col = proc.kanbanColumn?.toLowerCase() || '';
    if (col === 'triagem') progress = 25;
    else if (col === 'analise' || col.includes('análise')) progress = 50;
    else if (col === 'andamento' || col.includes('andamento')) progress = 75;
    else if (col === 'concluido' || proc.status === 'ARQUIVADO') progress = 100;

    return (
        <motion.div
            variants={itemVariants}
            className="bg-app-card rounded-xl border border-app-stroke p-4 sm:p-5 hover:border-primary/50 transition-fast cursor-pointer shadow-sm relative overflow-hidden group touch-manipulation will-animate"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onNavigate}
        >
            {/* Priority Indicator */}
            <div className={clsx("absolute left-0 top-0 bottom-0 w-1 transition-fast", isUrgent ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-primary group-hover:bg-primary-light")}></div>

            <div className="flex justify-between items-start mb-2 pl-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-app-bg border border-app-stroke text-[10px] text-app-text-muted uppercase tracking-wider font-mono">
                        #{proc.number.slice(-4)}
                    </span>
                    <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getAreaColor(proc.area))}>
                        {proc.area || 'Cível'}
                    </span>
                    {isUrgent && (
                        <span className="px-2 py-0.5 rounded border bg-red-500/10 text-red-500 border-red-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Urgente
                        </span>
                    )}
                </div>
                <button className="text-app-text-muted hover:text-primary transition-colors p-1" onClick={(e) => e.stopPropagation()}>
                    <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
                    <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
                    <div className="w-1 h-1 rounded-full bg-current"></div>
                </button>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-app-text-main mb-1 pl-2 line-clamp-2">{proc.title}</h3>

            <div className="flex items-center gap-2 pl-2 mb-3 sm:mb-4">
                <Users size={14} className="text-app-text-muted shrink-0" />
                <span className="text-xs sm:text-sm text-app-text-muted truncate">Cliente: <span className="text-app-text-main font-semibold">{proc.client?.name || 'Não atribuído'}</span></span>
            </div>

            {/* Visual Progress Bar */}
            <div className="pl-2 mb-4 w-full">
                <div className="flex justify-between text-[10px] text-app-text-muted mb-1 font-medium px-0.5">
                    <span>Progresso</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-app-stroke/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-app-stroke pt-3 pl-2">
                <div className="flex items-center gap-2 text-xs text-app-text-muted">
                    <div className="w-4 h-4 rounded bg-app-bg flex items-center justify-center border border-app-stroke">
                        <div className={clsx("w-2 h-2 rounded-full", progress === 100 ? "bg-emerald-500" : isUrgent ? "bg-red-500 animate-pulse" : "bg-primary")}></div>
                    </div>
                    <span className="hidden sm:inline capitalize">{proc.kanbanColumn?.replace('_', ' ') || 'Processo Ativo'}</span>
                    <span className="sm:hidden capitalize truncate max-w-[100px]">{proc.kanbanColumn?.replace('_', ' ') || 'Ativo'}</span>
                </div>
                <div className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-colors">
                    Ver detalhes
                </div>
            </div>
        </motion.div>
    );
});"""

if card_target in content:
    content = content.replace(card_target, card_repl)
    print("Card replaced")
else:
    print("Card target NOT found")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
