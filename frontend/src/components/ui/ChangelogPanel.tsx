import { useState, useRef, useEffect } from 'react';
import { Rocket, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export interface ChangelogItem {
    id: string;
    title: string;
    description: string;
    version: string;
    date: string;
}

// Platform changelog entries — bundled with the frontend for instant, zero-latency rendering.
// Add new entries at the TOP of this array when deploying new features.
const CHANGELOG_DATA: ChangelogItem[] = [
    {
        id: 'cl-v1.38.0',
        title: 'Grupo de trabalho para plano corporativo, pasta da equipe e revisão',
        description: 'Planos corporativos agora contam com Grupo de Trabalho integrado ao gerenciamento do time. Ao ativar o recurso, o proprietário do plano assume automaticamente como líder do grupo.\n- Disponível para proprietários e administradores de planos corporativos em Gerenciar time\nAo ativar o Grupo de Trabalho, o sistema cria automaticamente a pasta do time na biblioteca e inclui todos os membros do time no grupo. Somente proprietários e administradores podem editar os itens da pasta.\n- Disponível na aba Biblioteca\nCom o Grupo de Trabalho ativo, bibliotecários podem ser fixados para o time por líderes e administradores, facilitando a padronização dos materiais utilizados pela equipe.\n- Disponível na aba Bibliotecários\nFluxo de revisão habilitado no corporativo com seleção de revisores ao ativar o Grupo de Trabalho. Membros do time podem enviar minutas para os revisores definidos na gestão do time.\n- Disponível no editor de minutas através do botão "Enviar para revisão"',
        version: 'v1.38.0',
        date: '2026-05-15T12:00:00.000Z',
    },
    {
        id: 'cl-v1.37.0',
        title: 'Legislações: inserir manualmente, carregar arquivos e salvar na biblioteca',
        description: 'Agora é possível carregar legislações como contexto a serem utilizadas nas minutas geradas pelo botão "Inserir manualmente" e pelo botão "Arquivos" — no topo da aba Legislação.\n- Disponível na aba Legislação\nLegislações inseridas manualmente ou carregadas via arquivo podem ser salvas na biblioteca para serem reutilizadas em minutas futuras. Ficam identificadas com a etiqueta "Manual" para fácil distinção.\n- Disponível na aba Legislação e na Biblioteca',
        version: 'v1.37.0',
        date: '2026-05-06T12:00:00.000Z',
    },
    {
        id: 'cl-v1.36.0',
        title: 'Visual Law: a peça em texto vira PDF diagramado',
        description: 'O documento em texto vira PDF diagramado com sumário executivo, linhas de tempo, quadros de contraposição, cards de jurisprudência e gráficos. Suporte templates institucionais com brasão e rodapés customizados.\n- Disponível no editor de documentos e na exportação',
        version: 'v1.36.0',
        date: '2026-05-05T12:00:00.000Z',
    },
];

const formatChangelogDate = (dateStr: string) => {
    const date = new Date(dateStr);

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
    const [hasNewUpdates, setHasNewUpdates] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const LAST_SEEN_KEY = 'app_changelog_last_seen';

    // Check for new updates based on localStorage
    useEffect(() => {
        const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
        if (CHANGELOG_DATA.length > 0) {
            const latestDate = new Date(CHANGELOG_DATA[0].date).getTime();
            if (!lastSeen || latestDate > parseInt(lastSeen, 10)) {
                setHasNewUpdates(true);
            }
        }
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
            setHasNewUpdates(false);
            localStorage.setItem(LAST_SEEN_KEY, Date.now().toString());
        }
    };

    // Render description with paragraphs and curved-arrow bullet points
    const renderDescription = (text: string) => {
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('↳ ');
            const content = isBullet ? trimmed.substring(2) : trimmed;

            if (isBullet) {
                return (
                    <div key={idx} className="text-[12px] text-slate-500 dark:text-slate-400 pl-4 py-0.5 flex items-start gap-1 leading-relaxed">
                        <span className="font-semibold text-slate-400 select-none">↳</span>
                        <span>{content}</span>
                    </div>
                );
            }

            return (
                <p key={idx} className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2 mt-2">
                    {content}
                </p>
            );
        });
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Rocket Icon Button */}
            <button
                onClick={handleToggleOpen}
                className={clsx(
                    "relative p-2 rounded-xl transition-all duration-300 border flex items-center justify-center",
                    isOpen
                        ? "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                        : "bg-slate-50/50 hover:bg-slate-100 dark:bg-[#0B1121]/50 dark:hover:bg-slate-800/40 border-slate-100 dark:border-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                )}
                title="Changelog"
            >
                <Rocket size={19} className={clsx("transition-transform duration-500", isOpen && "rotate-45")} />
                {hasNewUpdates && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-[340px] sm:w-[480px] md:w-[560px] bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 pb-4 flex items-start justify-between">
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-white">
                                    <Rocket size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-[17px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                                        Changelog
                                    </h3>
                                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1.5 leading-none">
                                        Fique por dentro das últimas atualizações e melhorias.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="px-6">
                            <div className="h-[1px] bg-slate-100 dark:bg-white/5 w-full" />
                        </div>

                        {/* List */}
                        <div className="max-h-[460px] overflow-y-auto custom-scrollbar px-6 pb-6">
                            <div className="flex flex-col gap-6">
                                {CHANGELOG_DATA.map((item, idx) => {
                                    const dateLabel = formatChangelogDate(item.date);
                                    return (
                                        <div key={item.id} className="first:mt-2">
                                            {/* Version pill and date */}
                                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                                <span className="px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-full font-mono">
                                                    {item.version}
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                                    {dateLabel}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h4 className="text-[14px] font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                                                {item.title}
                                            </h4>

                                            {/* Description */}
                                            <div className="space-y-1">
                                                {renderDescription(item.description)}
                                            </div>

                                            {/* Separator */}
                                            {idx < CHANGELOG_DATA.length - 1 && (
                                                <hr className="border-slate-100 dark:border-white/5 mt-6 mb-2" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
