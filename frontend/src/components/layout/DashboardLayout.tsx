import { Suspense } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { PrefetchLink } from '../ui/PrefetchLink';
import { BrandLogo } from '../ui/BrandLogo';
import { Users, FileText, Calendar, DollarSign, Settings, LogOut, ChevronRight, Search, Menu, Home, Plus, Folder, Sun, Moon, ClipboardList, Shield, History, ChevronDown, User, MessageSquare, X, MoreHorizontal, Clock, Pause } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, memo, useRef } from 'react';
import NotificationPanel from '../ui/NotificationPanel';
import ChatDrawer from '../chat/ChatDrawer';
import GlobalSearch from '../shared/GlobalSearch';
import { useTimer } from '../../context/TimerContext';
import api from '../../services/api';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const SidebarItem = memo(({ icon: Icon, label, path, collapsed }: { icon: any, label: string, path: string, collapsed: boolean }) => {
    const location = useLocation();
    const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    return (
        <PrefetchLink to={path}>
            <div 
                title={collapsed ? label : undefined}
                className={cn(
                "group flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden touch-manipulation no-tap-highlight",
                active
                    ? "bg-white/15 text-white shadow-lg shadow-white/5"
                    : "text-white/60 hover:bg-white/8 hover:text-white active:bg-white/15"
            )}>
                {/* Active indicator bar */}
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full shadow-md shadow-primary/50" />}
                <div className={cn("p-1 rounded-lg transition-all duration-200", active ? "bg-white/10" : "group-hover:bg-white/5")}>
                    <Icon size={18} className={cn("transition-all duration-200", active && "text-primary")} />
                </div>
                {!collapsed && (
                    <span className={cn("font-medium text-[13px] tracking-wide", active && "font-semibold")}>
                        {label}
                    </span>
                )}
                {!collapsed && active && <ChevronRight size={14} className="ml-auto opacity-40" />}
            </div>
        </PrefetchLink>
    );
});

// Expandable sidebar item for IA Análise with history dropdown
// Expandable sidebar item for IA Análise with history dropdown
const SidebarItemWithHistory = ({ collapsed }: { collapsed: boolean }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const active = location.pathname === '/analise-ia' || location.pathname.startsWith('/analise-ia');
    const [expanded, setExpanded] = useState(false);
    const [documentAnalyses, setDocumentAnalyses] = useState<Array<{ id: string; label: string; timestamp: Date; score: number; contractText: string; analysis: any }>>([]);

    // Load document analyses from localStorage (only main analyses, not edit versions)
    useEffect(() => {
        const loadDocumentAnalyses = () => {
            const savedAnalyses = localStorage.getItem('ia-document-analyses');
            if (savedAnalyses) {
                try {
                    const parsed = JSON.parse(savedAnalyses);
                    const items = parsed.map((entry: any) => ({
                        ...entry,
                        timestamp: new Date(entry.timestamp)
                    }));
                    setDocumentAnalyses(items);
                } catch (e) {
                    console.error('Failed to load document analyses:', e);
                }
            }
        };
        loadDocumentAnalyses();
        const interval = setInterval(loadDocumentAnalyses, 5000);
        return () => clearInterval(interval);
    }, []);

    // Handle clicking on a document to load it
    const handleLoadDocument = (doc: typeof documentAnalyses[0]) => {
        // Store the selected document to load
        localStorage.setItem('ia-load-document', JSON.stringify(doc));
        navigate('/analise-ia');
    };

    if (collapsed) {
        return (
            <Link to="/analise-ia">
                <div 
                    title="IA Análise"
                    className={cn(
                    "group flex items-center justify-center px-3 py-3 mx-2 rounded-xl cursor-pointer transition-fast relative",
                    active ? "bg-white/20 text-white border border-white/20" : "text-white/70 hover:bg-white/10"
                )}>
                    <Shield size={20} className={cn("transition-fast", active && "scale-110")} />
                </div>
            </Link>
        );
    }

    return (
        <div className="mx-2">
            <div
                className={cn(
                    "group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-fast relative",
                    active ? "bg-white/20 text-white border border-white/20" : "text-white/70 hover:bg-white/10"
                )}
            >
                {/* Click on icon + text navigates to page */}
                <div
                    className="flex items-center gap-3 flex-1"
                    onClick={() => navigate('/analise-ia')}
                >
                    <Shield size={20} className={cn("transition-fast", active && "scale-110")} />
                    <span className="font-medium text-sm tracking-wide">IA Análise</span>
                </div>
                {/* Arrow only toggles dropdown */}
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <ChevronDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
                </button>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Quick access to main page */}
                        <Link to="/analise-ia">
                            <div className="flex items-center gap-2 px-4 py-2 ml-6 text-xs text-white/70 hover:text-white transition-colors">
                                <Plus size={12} />
                                Nova Análise
                            </div>
                        </Link>

                        {/* Document analyses with fade effect */}
                        {documentAnalyses.length > 0 ? (
                            <div className="relative">
                                <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                    {documentAnalyses.slice().reverse().slice(0, 5).map((doc, idx) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => handleLoadDocument(doc)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 ml-6 text-xs cursor-pointer transition-all hover:bg-white/10 rounded-lg",
                                                idx === 0 ? "text-white" : "text-white/70"
                                            )}
                                            style={{ opacity: 1 - (idx * 0.15) }}
                                        >
                                            <History size={10} />
                                            <div className="flex-1 truncate">
                                                <p className="truncate font-medium">{doc.label}</p>
                                                <p className="text-[9px] text-white/50">
                                                    {doc.timestamp.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} • {doc.score}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Fade effect at bottom - matches dark blue sidebar */}
                                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-800 to-transparent pointer-events-none" />
                            </div>
                        ) : (
                            <div className="px-4 py-2 ml-6 text-[10px] text-white/40 italic">
                                Nenhum documento analisado
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const BottomNavItem = memo(({ icon: Icon, label, path, isMain = false, onClick }: { icon: any, label: string, path: string, isMain?: boolean, onClick?: () => void }) => {
    const location = useLocation();
    const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    if (onClick) {
        return (
            <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium touch-manipulation no-tap-highlight active:scale-95 transition-fast">
                <Icon size={22} className="text-app-text-muted" />
                <span className="text-app-text-muted">{label}</span>
            </button>
        )
    }

    if (isMain) {
        return (
            <PrefetchLink to={path} className="relative -top-5 touch-manipulation no-tap-highlight">
                <div className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center text-white transform transition-fast active:scale-90 will-animate">
                    <Icon size={28} />
                </div>
            </PrefetchLink>
        )
    }

    return (
        <PrefetchLink to={path} className={cn(
            "flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] touch-manipulation no-tap-highlight active:scale-95 transition-fast",
            active && "bg-primary/10 rounded-xl"
        )}>
            <Icon size={22} fill={active ? "currentColor" : "none"} className={cn("transition-fast", active ? "text-primary" : "text-app-text-muted")} />
            <span className={cn("transition-fast", active ? "text-primary font-bold" : "text-app-text-muted font-medium")}>{label}</span>
        </PrefetchLink>
    )
});

// Mobile drawer menu items (pages not in bottom nav)
const DRAWER_MENU_ITEMS = [
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: ClipboardList, label: 'Kanban', path: '/processos/kanban' },
    { icon: ClipboardList, label: 'Contratos', path: '/contratos' },
    { icon: Calendar, label: 'Agenda', path: '/agenda' },
    { icon: Folder, label: 'Meus Arquivos', path: '/documentos' },
    { icon: FileText, label: 'Modelos', path: '/modelos' },
    { icon: Users, label: 'Usuários', path: '/usuarios' },
    { icon: User, label: 'Meu Perfil', path: '/perfil' },
    { icon: Clock, label: 'Timesheet', path: '/timesheet' },
];


export default function DashboardLayout() {
    useKeyboardShortcuts();

    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { timer } = useTimer();
    const isKanban = location.pathname.includes('/kanban');
    const isAgenda = location.pathname.includes('/agenda');
    const isDocumentos = location.pathname.includes('/documentos');
    const isDocumentEditor = location.pathname.includes('/modelos/');
    // Make Client Detail full screen, but not the client list (/clientes)
    const isClientDetail = location.pathname.startsWith('/clientes/') && location.pathname.split('/').length > 2 && location.pathname.split('/')[2] !== 'novo';
    const isFullScreenPage = isKanban || isAgenda || isDocumentos || isDocumentEditor || isClientDetail;
    const [collapsed, setCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ processes: any[], clients: any[] }>({ processes: [], clients: [] });
    const [showSearchResults, setShowSearchResults] = useState(false);

    const [teamMembers, setTeamMembers] = useState<Array<{ id: string, name: string, avatar: string | null, role: string }>>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [processExpanded, setProcessExpanded] = useState(location.pathname.startsWith('/processos'));
    const searchAbortRef = useRef<AbortController | null>(null);
    const pathSegments = location.pathname.split('/').filter(Boolean);

    // Fetch team members
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                const res = await api.get('/auth/users');
                setTeamMembers(res.data || []);
            } catch (error) {
                console.error('Error fetching team members:', error);
            }
        };
        fetchTeamMembers();
    }, []);

    // Format timer display
    const formatTimerDisplay = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Search function with abort controller
    useEffect(() => {
        const search = async () => {
            if (searchQuery.length < 2) {
                setSearchResults({ processes: [], clients: [] });
                setShowSearchResults(false);
                return;
            }
            if (searchAbortRef.current) searchAbortRef.current.abort();
            const controller = new AbortController();
            searchAbortRef.current = controller;
            try {
                const [processesRes, clientsRes] = await Promise.all([
                    api.get('/processes', { signal: controller.signal }),
                    api.get('/clients', { signal: controller.signal })
                ]);
                if (controller.signal.aborted) return;
                const query = searchQuery.toLowerCase();
                const filteredProcesses = (processesRes.data || []).filter((p: any) =>
                    p.title?.toLowerCase().includes(query) || p.number?.toLowerCase().includes(query)
                ).slice(0, 5);
                const filteredClients = (clientsRes.data || []).filter((c: any) =>
                    c.name?.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query)
                ).slice(0, 5);
                setSearchResults({ processes: filteredProcesses, clients: filteredClients });
                setShowSearchResults(filteredProcesses.length > 0 || filteredClients.length > 0);
            } catch (error: any) {
                if (error?.name !== 'CanceledError' && error?.name !== 'AbortError') {
                    console.error('Search error:', error);
                }
            }
        };
        const debounce = setTimeout(search, 300);
        return () => { clearTimeout(debounce); };
    }, [searchQuery]);

    return (
        <div className="flex h-screen-stable bg-app-bg text-app-text-main font-body overflow-hidden">
            {/* Desktop Sidebar - Dark blue gradient */}
            <aside
                className={cn(
                    "hidden md:flex flex-col z-20 transition-all duration-300 flex-shrink-0",
                    "bg-gradient-to-b from-slate-800 to-blue-900",
                    collapsed ? "w-20" : "w-72"
                )}
            >
                <div className="p-5 flex items-center justify-between">
                    {!collapsed && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <BrandLogo variant="light" />
                        </motion.div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <Menu size={18} />
                    </button>
                </div>

                {/* User Profile Card */}
                <div className={cn("mx-3 mb-4 p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]", collapsed && "mx-2 p-2")}>
                    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shrink-0 ring-2 ring-white/20 shadow-lg shadow-primary/20">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-white font-bold text-sm">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
                            )}
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-white truncate">{user?.name || 'Usuário'}</p>
                                <p className="text-[10px] text-white/50 truncate uppercase tracking-wider font-medium">
                                    {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'LAWYER' ? 'Advogado(a)' : user?.role === 'INTERN' ? 'Estagiário(a)' : 'Parceiro(a)'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
                    {/* Módulos Principais */}
                    <p className={cn("px-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2", collapsed && "hidden")}>Principal</p>
                    <SidebarItem icon={Home} label="Início" path="/" collapsed={collapsed} />
                    {/* Processos - expandable with Lista and Kanban */}
                    <div>
                        <div
                            className={cn(
                                "group flex items-center gap-3 px-3 py-3 mx-2 rounded-xl cursor-pointer transition-fast relative overflow-hidden",
                                location.pathname.startsWith('/processos')
                                    ? "bg-white/20 text-white border border-white/20"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3 flex-1" onClick={() => navigate('/processos')}>
                                <FileText size={20} className={cn("transition-fast", location.pathname.startsWith('/processos') && "scale-110")} />
                                {!collapsed && <span className="font-medium text-sm tracking-wide">Processos</span>}
                            </div>
                            {!collapsed && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setProcessExpanded(!processExpanded); }}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                    <ChevronDown size={14} className={cn("transition-transform", processExpanded && "rotate-180")} />
                                </button>
                            )}
                        </div>
                        <AnimatePresence>
                            {processExpanded && !collapsed && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <Link to="/processos">
                                        <div className={cn("flex items-center gap-2 px-4 py-2 ml-6 text-xs transition-colors rounded-lg", location.pathname === '/processos' ? 'text-white font-bold bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5')}>
                                            <FileText size={12} /> Lista
                                        </div>
                                    </Link>
                                    <Link to="/processos/kanban">
                                        <div className={cn("flex items-center gap-2 px-4 py-2 ml-6 text-xs transition-colors rounded-lg", location.pathname === '/processos/kanban' ? 'text-white font-bold bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5')}>
                                            <ClipboardList size={12} /> Kanban
                                        </div>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <SidebarItem icon={Users} label="Clientes" path="/clientes" collapsed={collapsed} />

                    <div className="my-2 border-t border-white/[0.06] mx-4"></div>

                    {/* Jurídico & Gestão */}
                    <p className={cn("px-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2 mt-1", collapsed && "hidden")}>Jurídico</p>
                    <SidebarItem icon={ClipboardList} label="Contratos" path="/contratos" collapsed={collapsed} />
                    <SidebarItem icon={Folder} label="Meus Arquivos" path="/documentos" collapsed={collapsed} />
                    <SidebarItem icon={FileText} label="Modelos" path="/modelos" collapsed={collapsed} />

                    <div className="my-2 border-t border-white/[0.06] mx-4"></div>

                    {/* Operacional */}
                    <p className={cn("px-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2 mt-1", collapsed && "hidden")}>Operacional</p>
                    <SidebarItem icon={DollarSign} label="Financeiro" path="/financeiro" collapsed={collapsed} />
                    <SidebarItem icon={Calendar} label="Agenda" path="/agenda" collapsed={collapsed} />
                    <SidebarItem icon={Clock} label="Timesheet" path="/timesheet" collapsed={collapsed} />

                    <div className="my-2 border-t border-white/[0.06] mx-4"></div>

                    {/* IA & Configurações */}
                    <p className={cn("px-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2 mt-1", collapsed && "hidden")}>IA & Config</p>
                    <SidebarItemWithHistory collapsed={collapsed} />
                    <SidebarItem icon={Users} label="Usuários" path="/usuarios" collapsed={collapsed} />
                    <SidebarItem icon={User} label="Meu Perfil" path="/perfil" collapsed={collapsed} />
                    <SidebarItem icon={Settings} label="Ajustes" path="/configuracoes" collapsed={collapsed} />
                </div>

                {/* IA Jurídica Card - only show when not collapsed */}
                {!collapsed && (
                    <div className="px-4 py-3">
                        <Link to="/analise-ia">
                            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 overflow-hidden group cursor-pointer hover:shadow-lg transition-all border border-slate-700/50">
                                {/* Robot Icon Background */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-30 transition-opacity">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-16 h-16 text-blue-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-white font-bold text-sm mb-1">IA Jurídica</h3>
                                <p className="text-slate-400 text-xs mb-3">Analise contratos em segundos.</p>
                                <button className="px-4 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors">
                                    Testar Agora
                                </button>
                            </div>
                        </Link>
                    </div>
                )}

                <div className="p-3 border-t border-white/[0.06]">
                    <div className={cn("flex items-center gap-1", collapsed ? "justify-center" : "justify-end px-2")}>
                        <button
                            onClick={toggleTheme}
                            className="text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button onClick={logout} className="text-white/50 hover:text-red-400 p-2 rounded-lg hover:bg-white/10 transition-all" title="Sair do Sistema">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Right Side - Header + Main Content - Blue gradient background so curved corner shows blue */}
            <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-800 to-blue-900 relative overflow-hidden">
                {/* Desktop Header - Dark blue gradient matching sidebar */}
                {!isFullScreenPage && (
                    <header className="hidden md:flex h-20 items-center justify-between px-8 z-20 flex-shrink-0">
                        {/* Search Bar - Replaced with Global Search Trigger to enforce ecosystem approach */}
                        <div className="flex-1 max-w-2xl relative">
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
                                className="group w-full flex items-center justify-between px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/5 rounded-xl text-white/50 hover:text-white/80 transition-all text-sm font-medium"
                            >
                                <div className="flex items-center gap-3">
                                    <Search size={18} className="text-white/50 group-hover:text-white/80 transition-colors" />
                                    <span>Buscar processos, clientes, financeiro...</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold tracking-widest uppercase border border-white/10 shadow-sm">Ctrl</kbd>
                                    <span className="text-xs">+</span>
                                    <kbd className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold tracking-widest uppercase border border-white/10 shadow-sm">K</kbd>
                                </div>
                            </button>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-6 ml-4">
                            {/* Team Avatars - Stacked with current user on top */}
                            <div className="flex items-center">
                                {/* Other team members behind */}
                                <div className="flex -space-x-3">
                                    {teamMembers.filter(m => m.id !== user?.id).slice(0, 3).map((member) => (
                                        <div
                                            key={member.id}
                                            className="w-9 h-9 rounded-full border-2 border-slate-700 flex items-center justify-center overflow-hidden bg-white/20 hover:z-10 transition-transform hover:scale-110"
                                            title={`${member.name} - ${member.role}`}
                                        >
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white text-xs font-bold">{member.name?.charAt(0) || 'U'}</span>
                                            )}
                                        </div>
                                    ))}
                                    {teamMembers.filter(m => m.id !== user?.id).length > 3 && (
                                        <div className="w-9 h-9 rounded-full border-2 border-slate-700 bg-blue-500/80 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">+{teamMembers.filter(m => m.id !== user?.id).length - 3}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Current user avatar on top */}
                                <div
                                    className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center overflow-hidden bg-white/20 -ml-3 z-10 ring-2 ring-slate-800"
                                    title={user?.name || 'Usuário'}
                                >
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-bold text-sm">{user?.name?.charAt(0) || 'A'}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Timer Button - Shows running state */}
                                {timer.isRunning ? (
                                    <button
                                        onClick={() => navigate('/timesheet')}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors animate-pulse"
                                        title={timer.processTitle || timer.description || 'Timer rodando'}
                                    >
                                        <Pause size={16} />
                                        <span className="font-mono font-bold text-sm">
                                            {formatTimerDisplay(timer.seconds)}
                                        </span>
                                        {timer.processTitle && (
                                            <span className="text-xs max-w-[80px] truncate">
                                                {timer.processTitle}
                                            </span>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate('/timesheet')}
                                        className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                        title="Timesheet"
                                    >
                                        <Clock size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsChatOpen(true)}
                                    className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors relative"
                                    title="Chat da Equipe"
                                >
                                    <MessageSquare size={20} />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                                </button>
                                <NotificationPanel />
                            </div>

                        </div>
                    </header>
                )}

                {/* Mobile Header */}
                {!isFullScreenPage && (
                    <header className="h-20 flex md:hidden items-center justify-between px-5 z-10 sticky top-0 border-b border-white/10 bg-slate-800/80 backdrop-blur-md">
                        <div className="flex items-center gap-3.5" onClick={() => navigate('/perfil')}>
                            <div className="w-11 h-11 rounded-full bg-white/20 overflow-hidden flex items-center justify-center ring-2 ring-white/10 shadow-lg transition-transform active:scale-95">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-base font-bold text-white uppercase">{user?.name?.charAt(0) || 'A'}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Meu Escritório</p>
                                <p className="text-base font-bold text-white leading-tight">{user?.name || 'Dr. Silva'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
                                className="p-2.5 text-white/70 hover:text-white rounded-full transition-colors active:bg-white/10"
                            >
                                <Search size={22} />
                            </button>
                            <NotificationPanel />
                        </div>
                    </header>
                )}

                {/* THE CURVE: Main content with rounded-tl-[40px] creates the organic curved corner */}
                <main className="flex-1 relative z-10 bg-slate-50 dark:bg-slate-950 rounded-tl-[40px] md:rounded-tl-[40px] shadow-[inset_2px_2px_8px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col pb-20 md:pb-0">
                    <div className={cn(
                        "flex-1 custom-scrollbar scroll-smooth",
                        !isFullScreenPage ? "p-4 sm:p-6 lg:p-8 overflow-y-auto" : "flex flex-col h-full overflow-hidden"
                    )}>
                        <div className={cn(
                            !isFullScreenPage ? "max-w-7xl mx-auto" : "w-full h-full flex flex-col"
                        )}>
                            {!isFullScreenPage && pathSegments.length > 0 && (
                                <div className="flex items-center gap-2 mb-6 text-sm">
                                    <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Dashboard</Link>
                                    {pathSegments.map((segment, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <ChevronRight size={14} className="text-slate-400" />
                                            <span className={idx === pathSegments.length - 1 ? "text-slate-700 dark:text-slate-200 font-medium capitalize" : "text-slate-400 capitalize"}>
                                                {segment === 'processos' ? 'Processos' : segment === 'clientes' ? 'Clientes' : segment === 'financeiro' ? 'Financeiro' : segment === 'configuracoes' ? 'Configurações' : segment.length > 15 ? 'Detalhes' : segment}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    <Suspense fallback={
                                        <div className="flex items-center justify-center h-full min-h-[200px]">
                                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    }>
                                        <Outlet context={{ collapsed }} />
                                    </Suspense>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-app-card border-t border-app-stroke flex items-center justify-between px-2 z-50 pb-safe">
                <BottomNavItem icon={Home} label="Início" path="/" />
                <BottomNavItem icon={FileText} label="Processos" path="/processos" />
                <BottomNavItem icon={Plus} label="" path="/processos/novo" isMain />
                <BottomNavItem icon={DollarSign} label="Finanças" path="/financeiro" />
                <BottomNavItem icon={MoreHorizontal} label="Mais" path="#" onClick={() => setIsMobileDrawerOpen(true)} />
            </div>

            {/* Mobile Drawer - Slide-up menu for additional pages */}
            <AnimatePresence>
                {isMobileDrawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                            onClick={() => setIsMobileDrawerOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="md:hidden fixed bottom-0 left-0 right-0 bg-app-card rounded-t-3xl z-[70] pb-safe max-h-[70vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-app-stroke">
                                <h3 className="font-bold text-app-text-main">Menu</h3>
                                <button onClick={() => setIsMobileDrawerOpen(false)} className="p-2 rounded-full hover:bg-app-input transition-colors">
                                    <X size={20} className="text-app-text-muted" />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 p-4">
                                {DRAWER_MENU_ITEMS.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileDrawerOpen(false)}
                                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-app-input transition-colors touch-manipulation no-tap-highlight active:scale-95"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <item.icon size={20} className="text-primary" />
                                        </div>
                                        <span className="text-[10px] font-medium text-app-text-main text-center leading-tight">{item.label}</span>
                                    </Link>
                                ))}
                                {/* IA Análise in drawer */}
                                <Link
                                    to="/analise-ia"
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-emerald-500/10 transition-colors touch-manipulation no-tap-highlight active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <Shield size={20} className="text-emerald-500" />
                                    </div>
                                    <span className="text-[10px] font-medium text-app-text-main text-center leading-tight">IA Análise</span>
                                </Link>
                                {/* Settings in drawer too */}
                                <Link
                                    to="/configuracoes"
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-app-input transition-colors touch-manipulation no-tap-highlight active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Settings size={20} className="text-primary" />
                                    </div>
                                    <span className="text-[10px] font-medium text-app-text-main text-center leading-tight">Ajustes</span>
                                </Link>
                                {/* Logout */}
                                <button
                                    onClick={() => { setIsMobileDrawerOpen(false); logout(); }}
                                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-red-500/10 transition-colors touch-manipulation no-tap-highlight active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <LogOut size={20} className="text-red-500" />
                                    </div>
                                    <span className="text-[10px] font-medium text-red-500 text-center leading-tight">Sair</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Chat Drawer */}
            <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

            {/* Global Search Modal (Ctrl+K) */}
            <GlobalSearch />
        </div >
    );
}
