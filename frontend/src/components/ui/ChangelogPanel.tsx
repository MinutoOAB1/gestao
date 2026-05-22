import { useState, useRef, useEffect, useCallback } from 'react';
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

// Changelog real da plataforma Advus — embutido no frontend para renderização instantânea.
// Adicione novas entradas no TOPO deste array ao publicar novas funcionalidades.
const CHANGELOG_DATA: ChangelogItem[] = [
    {
        id: 'cl-v2.6.0',
        title: 'Exportador de Cadeia de Valor 100% Preciso (Canvas 2D)',
        description: 'Substituição completa do html2canvas por um motor de desenho nativo em Canvas 2D no Whiteboard da Cadeia de Valor.\n- Renderização offline pixel-perfect garantida em qualquer navegador\n- Resolução de todos os problemas visuais de sobreposição e clipping de textos em PDFs e PNGs\n- Ajustes de responsividade móvel com auto-colapso do menu lateral e cabeçalho flexível adaptativo.',
        version: 'v2.6.0',
        date: '2026-05-22T04:30:00.000Z',
    },
    {
        id: 'cl-v2.5.0',
        title: 'Changelog do Sistema e Melhorias Visuais',
        description: 'Novo botão de Changelog com ícone de foguete no cabeçalho, separando as atualizações da plataforma das notificações do escritório. O painel exibe todas as melhorias recentes com versões, datas e descrições detalhadas.\n- Disponível no cabeçalho, ao lado do ícone de notificações\nIndicador verde pulsante aparece automaticamente quando há atualizações que o usuário ainda não visualizou.\n- Disponível para todos os perfis de usuário',
        version: 'v2.5.0',
        date: '2026-05-20T04:00:00.000Z',
    },
    {
        id: 'cl-v2.4.0',
        title: 'Notificações Financeiras em Tempo Real',
        description: 'Faturas vencidas ou próximas do vencimento agora disparam alertas visuais instantâneos via WebSockets, sem necessidade de recarregar a página. O sistema verifica parcelas com atraso e notifica o responsável na hora.\n- Disponível automaticamente no painel de notificações\nIntegração direta com o módulo financeiro para monitorar status de pagamentos de clientes em tempo real.\n- Disponível na aba Financeiro e no Dashboard',
        version: 'v2.4.0',
        date: '2026-05-20T03:30:00.000Z',
    },
    {
        id: 'cl-v2.3.0',
        title: 'Controle de Acesso por Perfil e Matriz de Permissões',
        description: 'Implementação completa de restrição de rotas e visibilidade de menus com base nos perfis de Administrador, Advogado, Estagiário e Parceiro. Cada perfil possui acesso limitado conforme a matriz de permissões definida.\n- Configurável em Configurações > Usuários\nProteção reforçada nos endpoints do backend para bloquear acessos indevidos a módulos restritos como Financeiro, IA Jurídica, Modelos e Configurações.\n- Aplicado automaticamente em todas as rotas protegidas',
        version: 'v2.3.0',
        date: '2026-05-20T03:00:00.000Z',
    },
    {
        id: 'cl-v2.2.0',
        title: 'Correções na Página de Modelos: Layout, Editor e Exportação PDF',
        description: 'A listagem de modelos agora ocupa toda a largura da tela, sem margens de centralização. O editor de documentos exibe o conteúdo completo sem cortes, e a exportação para PDF gera o arquivo íntegro.\n- Disponível na aba Modelos\nA coluna de variáveis foi redesenhada com campos mais claros e intuitivos, facilitando a edição e orientação do usuário ao preencher os dados do modelo.\n- Disponível ao abrir qualquer modelo para edição',
        version: 'v2.2.0',
        date: '2026-05-20T02:45:00.000Z',
    },
    {
        id: 'cl-v2.1.0',
        title: 'IA Análise: Comparador de Versões com Zoom Independente',
        description: 'O painel de IA Análise agora conta com controle individualizado de zoom para o documento original e a sugestão de revisão da IA, permitindo comparação lado a lado com escala ajustável.\n- Disponível na aba IA Análise > Analisar Contrato\nNovo botão de tela cheia (Fullscreen) para maximizar a área de trabalho da análise, removendo margens e menus laterais.\n- Disponível no cabeçalho do comparador\nBusca em tempo real com destaque (highlight) nas cláusulas do contrato e drawer lateral retrátil com resumo executivo.\n- Disponível na barra de ferramentas do comparador',
        version: 'v2.1.0',
        date: '2026-05-19T23:00:00.000Z',
    },
    {
        id: 'cl-v2.0.0',
        title: 'Módulo Financeiro Avançado com DRE e Plano de Contas',
        description: 'O módulo financeiro foi completamente remodelado com plano de contas hierárquico, gestão tributária integrada, relatório DRE (Demonstração do Resultado do Exercício) e automação de lançamentos recorrentes.\n- Disponível na aba Financeiro\nAuditoria de conformidade fiscal com alertas automáticos para inconsistências e exportação de relatórios em PDF.\n- Disponível em Financeiro > Relatórios',
        version: 'v2.0.0',
        date: '2026-05-18T12:00:00.000Z',
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
    const [isMobile, setIsMobile] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const LAST_SEEN_KEY = 'app_changelog_last_seen';

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Prevent body scroll when open on mobile
    useEffect(() => {
        if (isMobile && isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobile, isOpen]);

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
            {/* Mobile backdrop */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>
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
                        initial={isMobile
                            ? { opacity: 0, y: 40 }
                            : { opacity: 0, y: 10, scale: 0.96 }}
                        animate={isMobile
                            ? { opacity: 1, y: 0 }
                            : { opacity: 1, y: 0, scale: 1 }}
                        exit={isMobile
                            ? { opacity: 0, y: 40 }
                            : { opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={clsx(
                            "bg-white dark:bg-[#0B1121] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden",
                            isMobile
                                // Mobile: fixed sheet sliding up from bottom, above bottom nav
                                ? "fixed inset-x-2 bottom-[72px] rounded-2xl z-[60] max-h-[75vh] flex flex-col"
                                // Desktop: absolute dropdown below button
                                : "absolute right-0 top-12 w-[480px] lg:w-[560px] rounded-2xl z-50"
                        )}
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
                        <div className={clsx("overflow-y-auto custom-scrollbar px-6 pb-6", isMobile ? "flex-1" : "max-h-[460px]")}>
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
