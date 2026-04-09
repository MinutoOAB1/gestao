import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, DollarSign, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface SearchResult {
    id: string;
    type: 'process' | 'client' | 'financial' | 'event';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    path: string;
}

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Keyboard shortcut: Ctrl+K or Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const handleOpenEvent = () => setIsOpen(true);

        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('open-global-search', handleOpenEvent);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-global-search', handleOpenEvent);
        };
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search logic with debounce
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                const [processesRes, clientsRes, financialRes] = await Promise.all([
                    api.get('/processes', { params: { search: query } }).catch(() => ({ data: [] })),
                    api.get('/clients', { params: { search: query } }).catch(() => ({ data: [] })),
                    api.get('/financial', { params: { search: query } }).catch(() => ({ data: [] })),
                ]);

                const allResults: SearchResult[] = [];

                // Processes
                (processesRes.data || []).slice(0, 5).forEach((p: any) => {
                    allResults.push({
                        id: p.id,
                        type: 'process',
                        title: p.title || p.number,
                        subtitle: `Processo #${p.number?.slice(-6) || p.id.slice(-6)}`,
                        icon: <FileText size={16} className="text-blue-400" />,
                        path: `/processos/${p.id}`,
                    });
                });

                // Clients
                (clientsRes.data || []).slice(0, 5).forEach((c: any) => {
                    allResults.push({
                        id: c.id,
                        type: 'client',
                        title: c.name,
                        subtitle: c.email || c.phone || 'Cliente',
                        icon: <Users size={16} className="text-emerald-400" />,
                        path: `/clientes/${c.id}`,
                    });
                });

                // Financial
                (financialRes.data || []).slice(0, 3).forEach((f: any) => {
                    allResults.push({
                        id: f.id,
                        type: 'financial',
                        title: f.description,
                        subtitle: `R$ ${f.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        icon: <DollarSign size={16} className="text-amber-400" />,
                        path: '/financeiro',
                    });
                });

                setResults(allResults);
                setSelectedIndex(0);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && results[selectedIndex]) {
                e.preventDefault();
                navigate(results[selectedIndex].path);
                setIsOpen(false);
                setQuery('');
            }
        },
        [results, selectedIndex, navigate]
    );

    const handleSelect = (result: SearchResult) => {
        navigate(result.path);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <>
            {/* Modal - Opens with Ctrl+K */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Search Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.15 }}
                            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
                        >
                            <div className="bg-app-card border border-app-stroke rounded-2xl shadow-2xl overflow-hidden">
                                {/* Search Input */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-app-stroke">
                                    <Search size={20} className="text-app-text-muted" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Buscar processos, clientes, financeiro..."
                                        className="flex-1 bg-transparent text-app-text-main placeholder:text-app-text-muted outline-none text-base"
                                    />
                                    {query && (
                                        <button
                                            onClick={() => setQuery('')}
                                            className="p-1 hover:bg-app-stroke/30 rounded"
                                        >
                                            <X size={16} className="text-app-text-muted" />
                                        </button>
                                    )}
                                </div>

                                {/* Results */}
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : results.length > 0 ? (
                                        <div className="py-2">
                                            {results.map((result, index) => (
                                                <button
                                                    key={`${result.type}-${result.id}`}
                                                    onClick={() => handleSelect(result)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${index === selectedIndex
                                                        ? 'bg-primary/10 border-l-2 border-primary'
                                                        : 'hover:bg-app-stroke/20'
                                                        }`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-app-bg flex items-center justify-center">
                                                        {result.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-app-text-main truncate">
                                                            {result.title}
                                                        </p>
                                                        <p className="text-xs text-app-text-muted truncate">
                                                            {result.subtitle}
                                                        </p>
                                                    </div>
                                                    <ArrowRight size={14} className="text-app-text-muted" />
                                                </button>
                                            ))}
                                        </div>
                                    ) : query ? (
                                        <div className="py-8 text-center text-app-text-muted">
                                            Nenhum resultado encontrado
                                        </div>
                                    ) : (
                                        <div className="py-6 px-4 space-y-4">
                                            <p className="text-xs text-app-text-muted text-center">
                                                Comece a digitar para buscar...
                                            </p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                <span className="px-2 py-1 text-xs bg-app-stroke/30 rounded text-app-text-muted">
                                                    Processos
                                                </span>
                                                <span className="px-2 py-1 text-xs bg-app-stroke/30 rounded text-app-text-muted">
                                                    Clientes
                                                </span>
                                                <span className="px-2 py-1 text-xs bg-app-stroke/30 rounded text-app-text-muted">
                                                    Financeiro
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-4 py-2 border-t border-app-stroke bg-app-bg/50 text-[10px] text-app-text-muted">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1 py-0.5 bg-app-stroke/50 rounded">↑↓</kbd> navegar
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1 py-0.5 bg-app-stroke/50 rounded">Enter</kbd> selecionar
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <kbd className="px-1 py-0.5 bg-app-stroke/50 rounded">Esc</kbd> fechar
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
