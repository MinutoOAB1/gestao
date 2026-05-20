import { useState, useRef, useEffect } from 'react';
import { Rocket, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChangelogItem {
    id: string;
    title: string;
    description: string;
    version?: string;
    date: string;
}

const formatChangelogDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    // Custom formatted date: "15 de maio de 2026"
    const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} de ${month} de ${year}`;
};

export default function ChangelogPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
    const [hasNewUpdates, setHasNewUpdates] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const LAST_SEEN_KEY = 'app_changelog_last_seen';

    // Fetch changelogs
    useEffect(() => {
        const fetchChangelogs = async () => {
            try {
                const api = (await import('../../services/api')).default;
                const response = await api.get('/changelog');
                const data = response.data || [];
                setChangelogs(data);

                // Check for new updates since last seen
                const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
                if (data.length > 0) {
                    const latestDate = new Date(data[0].date).getTime();
                    if (!lastSeen || latestDate > parseInt(lastSeen, 10)) {
                        setHasNewUpdates(true);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch changelogs:', error);
            }
        };

        fetchChangelogs();
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggleOpen = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        
        if (nextState) {
            // Mark as read/seen
            setHasNewUpdates(false);
            localStorage.setItem(LAST_SEEN_KEY, Date.now().toString());
        }
    };

    // Simple markdown-to-html helper for the description
    const renderDescription = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            let processed = line;
            
            // Check for list bullet
            const isBullet = line.trim().startsWith('- ');
            if (isBullet) {
                processed = line.trim().substring(2);
            }

            // Simple bold parse: **text**
            const boldRegex = /\*\*([^*]+)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;

            while ((match = boldRegex.exec(processed)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(processed.substring(lastIndex, match.index));
                }
                parts.push(<strong key={match.index} className="font-bold text-app-text-main">{match[1]}</strong>);
                lastIndex = boldRegex.lastIndex;
            }
            
            if (lastIndex < processed.length) {
                parts.push(processed.substring(lastIndex));
            }

            return (
                <div key={idx} className={clsx("text-xs text-app-text-muted leading-relaxed flex items-start gap-1.5", isBullet ? "mt-1.5 pl-2" : "mt-1")}>
                    {isBullet && <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />}
                    <span>{parts.length > 0 ? parts : processed}</span>
                </div>
            );
        });
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Rocket Button */}
            <button
                onClick={handleToggleOpen}
                className={clsx(
                    "relative p-2.5 rounded-full border transition-all duration-300",
                    isOpen 
                        ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                        : "text-app-text-muted hover:text-primary hover:bg-primary/5 border-app-stroke/30 hover:border-primary/25 bg-app-card/40"
                )}
                title="Melhorias do Sistema"
            >
                <Rocket size={19} className={clsx("transition-transform duration-500", isOpen && "rotate-45 -translate-y-0.5")} />
                {hasNewUpdates && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-13 w-80 md:w-96 bg-app-card/95 backdrop-blur-md border border-app-stroke rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-app-stroke flex items-center justify-between bg-app-card/50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/25">
                                    <Rocket size={16} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-app-text-main">Atualizações do Sistema</h3>
                                    <p className="text-[10px] text-app-text-muted">Melhorias e novas funcionalidades</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-app-text-muted hover:text-app-text-main rounded-lg hover:bg-app-stroke/50 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-app-bg/30">
                            {changelogs.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Rocket size={32} className="mx-auto mb-2 text-app-text-muted opacity-30 animate-pulse" />
                                    <p className="text-app-text-muted text-xs">Nenhuma atualização disponível</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {changelogs.map((item, idx) => {
                                        const dateLabel = formatChangelogDate(item.date);
                                        return (
                                            <div key={item.id} className="border-b border-app-stroke/40 last:border-0 p-4 hover:bg-app-stroke/10 transition-colors">
                                                {/* Date and Version header */}
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="text-[10px] font-bold text-primary tracking-wide uppercase">
                                                        {dateLabel}
                                                    </span>
                                                    {item.version && (
                                                        <span className="bg-app-stroke/60 text-app-text-main text-[9px] font-mono px-1.5 py-0.5 rounded border border-app-stroke">
                                                            {item.version}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Title */}
                                                <h4 className="text-xs font-bold text-app-text-main mb-1.5 leading-snug">
                                                    {item.title}
                                                </h4>
                                                
                                                {/* Description */}
                                                <div className="space-y-1">
                                                    {renderDescription(item.description)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
