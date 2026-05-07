import { Suspense } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { PrefetchLink } from '../ui/PrefetchLink';
import { BrandLogo } from '../ui/BrandLogo';
import { Users, FileText, Calendar, DollarSign, Settings, LogOut, ChevronRight, Search, Menu, Home, Plus, Folder, Sun, Moon, ClipboardList, Shield, History, ChevronDown, User, X, MoreHorizontal, Clock, Pause } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import NotificationPanel from '../ui/NotificationPanel';
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
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80 active:bg-white/10"
            )}>
                {/* Active indicator bar */}
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full" />}
                <div className={cn("p-1 rounded-lg transition-all duration-200", active ? "bg-white/10" : "group-hover:bg-white/5")}>
                    <Icon size={18} className={cn("transition-all duration-200", active ? "text-white" : "text-white/50")} />
                </div>
                {!collapsed && (
                    <span className={cn("font-medium text-[13px] tracking-wide", active ? "text-white" : "text-white/60")}>
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
    const active = location.pathname === '/app/analise-ia' || location.pathname.startsWith('/app/analise-ia');
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
        navigate('/app/analise-ia');
    };

    if (collapsed) {
        return (
            <Link to="/app/analise-ia">
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
                    active ? "bg-white/15 text-white border border-white/10" : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
            >
                {/* Click on icon + text navigates to page */}
                <div
                    className="flex items-center gap-3 flex-1"
                    onClick={() => navigate('/app/analise-ia')}
                >
                    <Shield size={20} className={cn("transition-fast", active ? "text-white scale-110" : "text-white/60")} />
                    <span className="font-medium text-[13px] tracking-wide">IA Análise</span>
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
                        <Link to="/app/analise-ia">
                            <div className="flex items-center gap-2 px-4 py-2 ml-6 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
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
                                                idx === 0 ? "text-primary font-bold" : "text-white/60"
                                            )}
                                            style={{ opacity: 1 - (idx * 0.15) }}
                                        >
                                            <History size={10} />
                                            <div className="flex-1 truncate">
                                                <p className="truncate font-medium">{doc.label}</p>
                                                <p className="text-[9px] opacity-70">
                                                    {doc.timestamp.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} • {doc.score}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Fade effect at bottom - matches dark blue sidebar */}
                                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0F172A] to-transparent pointer-events-none" />
                            </div>
                        ) : (
                            <div className="px-4 py-2 ml-6 text-[10px] text-white/30 italic">
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
            <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] touch-manipulation no-tap-highlight active:scale-95 transition-fast">
                <Icon size={20} className={active ? "text-[#0066FF]" : "text-slate-400"} />
                <span className={active ? "text-[#0066FF]" : "text-slate-400"}>{label}</span>
            </button>
        )
    }

    return (
        <PrefetchLink to={path} className={cn(
            "flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] touch-manipulation no-tap-highlight active:scale-95 transition-fast"
        )}>
            <Icon size={20} className={cn("transition-fast", active ? "text-[#0066FF]" : "text-slate-400")} />
            <span className={cn("transition-fast", active ? "text-[#0066FF]" : "text-slate-400")}>{label}</span>
        </PrefetchLink>
    )
});

// Mobile drawer menu items (pages not in bottom nav)
const DRAWER_MENU_ITEMS = [
    { icon: Users, label: 'Clientes', path: '/app/clientes' },
    { icon: ClipboardList, label: 'Kanban', path: '/app/processos/kanban' },
    { icon: ClipboardList, label: 'Contratos', path: '/app/contratos' },
    { icon: Calendar, label: 'Agenda', path: '/app/agenda' },
    { icon: Folder, label: 'Meus Arquivos', path: '/app/documentos' },
    { icon: FileText, label: 'Modelos', path: '/app/modelos' },
    { icon: Users, label: 'Usuários', path: '/app/usuarios' },
    { icon: User, label: 'Meu Perfil', path: '/app/perfil' },
    { icon: Clock, label: 'Timesheet', path: '/app/timesheet' },
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

    const [teamMembers, setTeamMembers] = useState<Array<{ id: string, name: string, avatar: string | null, role: string }>>([]);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [processExpanded, setProcessExpanded] = useState(location.pathname.startsWith('/app/processos'));
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

    // Crisp User Identification
    useEffect(() => {
        if (user && (window as any).$crisp) {
            (window as any).$crisp.push(["set", "user:email", [user.email]]);
            (window as any).$crisp.push(["set", "user:nickname", [user.name]]);
            // Only send avatar if it's a valid external URL (starts with http)
            // Base64 avatars (starting with data:) cause Crisp to throw "Invalid avatar"
            if (user.avatar && user.avatar.startsWith('http')) {
                (window as any).$crisp.push(["set", "user:avatar", [user.avatar]]);
            }
        }
    }, [user]);

    // Format timer display
    const formatTimerDisplay = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };



    return (
        <div className="flex h-screen-stable bg-app-bg text-app-text-main font-body overflow-hidden">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col z-20 transition-all duration-300 flex-shrink-0",
                    "bg-[#0F172A] border-r border-white/5",
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
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <Menu size={18} />
                    </button>
                </div>

                {/* User Profile Card */}
                <div className={cn("mx-3 mb-4 p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]", collapsed && "mx-2 p-2")}>
                    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                        <div className="relative group cursor-pointer" onClick={() => navigate('/app/perfil')}>
                            <Avatar
                                src={user?.avatar || undefined}
                                name={user?.name}
                                size="md"
                                className="ring-2 ring-white/10 group-hover:ring-primary/50 transition-all duration-300"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0F172A] rounded-full shadow-lg" />
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
                    <p className={cn("px-4 text-[9px] font-black text-white/30 uppercase tracking-widest mb-2", collapsed && "hidden")}>Principal</p>
                    <SidebarItem icon={Home} label="Início" path="/app" collapsed={collapsed} />
                    {/* Processos - expandable with Lista and Kanban */}
                    <div>
                        <div
                            className={cn(
                                "group flex items-center gap-3 px-3 py-3 mx-2 rounded-xl cursor-pointer transition-fast relative overflow-hidden",
                                location.pathname.startsWith('/app/processos')
                                    ? "bg-white/15 text-white border border-white/10 shadow-sm"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3 flex-1" onClick={() => navigate('/app/processos')}>
                                <FileText size={20} className={cn("transition-fast", location.pathname.startsWith('/app/processos') && "scale-110")} />
                                {!collapsed && <span className="font-medium text-sm tracking-wide">Processos</span>}
                            </div>
                            {!collapsed && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setProcessExpanded(!processExpanded); }}
                                    className="p-1 hover:bg-white/10 rounded transition-colors text-white/40"
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
                                    <Link to="/app/processos">
                                        <div className={cn("flex items-center gap-2 px-4 py-2 ml-6 text-[10px] font-black uppercase tracking-widest transition-colors rounded-lg", location.pathname === '/app/processos' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/5')}>
                                            <FileText size={12} /> Lista
                                        </div>
                                    </Link>
                                    <Link to="/app/processos/kanban">
                                        <div className={cn("flex items-center gap-2 px-4 py-2 ml-6 text-[10px] font-black uppercase tracking-widest transition-colors rounded-lg", location.pathname === '/app/processos/kanban' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/5')}>
                                            <ClipboardList size={12} /> Kanban
                                        </div>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <SidebarItem icon={Users} label="Clientes" path="/app/clientes" collapsed={collapsed} />

                    <div className="my-2 border-t border-white/[0.06] mx-4"></div>

                    {/* Jurídico & Gestão */}
                    <p className={cn("px-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2 mt-1", collapsed && "hidden")}>Jurídico</p>
                    <SidebarItem icon={ClipboardList} label="Contratos" path="/app/contratos" collapsed={collapsed} />
                    <SidebarItem icon={Folder} label="Meus Arquivos" path="/app/documentos" collapsed={collapsed} />
                    <SidebarItem icon={FileText} label="Modelos" path="/app/modelos" collapsed={collapsed} />

                    <div className="my-2 border-t border-white/[0.06] mx-4"></div>

                    {/* Operacional */}
                    <p className={cn("px-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2 mt-1", collapsed && "hidden")}>Operacional</p>
                    <SidebarItem icon={DollarSign} label="Financeiro" path="/app/financeiro" collapsed={collapsed} />
                    <SidebarItem icon={Calendar} label="Agenda" path="/app/agenda" collapsed={collapsed} />
                    <SidebarItem icon={Clock} label="Timesheet" path="/app/timesheet" collapsed={collapsed} />

                    <div className="my-2 border-t border-white/[0.06] mx-4"></div>

                    {/* IA & Configurações */}
                    <p className={cn("px-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-2 mt-1", collapsed && "hidden")}>IA & Config</p>
                    <SidebarItemWithHistory collapsed={collapsed} />
                    <SidebarItem icon={Users} label="Usuários" path="/app/usuarios" collapsed={collapsed} />
                    <SidebarItem icon={User} label="Meu Perfil" path="/app/perfil" collapsed={collapsed} />
                    <SidebarItem icon={Settings} label="Ajustes" path="/app/configuracoes" collapsed={collapsed} />
                </div>

                {/* IA Jurídica Card - only show when not collapsed */}
                {!collapsed && (
                    <div className="px-4 py-3">
                        <Link to="/app/analise-ia">
                            <div className="relative bg-white/[0.06] rounded-2xl p-4 overflow-hidden group cursor-pointer hover:bg-white/[0.09] transition-all border border-white/[0.08]">
                                <h3 className="text-white font-bold text-sm mb-1 font-display tracking-tight flex items-center gap-2">
                                    IA Jurídica
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                </h3>
                                <p className="text-white/40 text-[11px] mb-4 leading-relaxed font-medium">Analise contratos com precisão absoluta.</p>
                                <button className="w-full py-2 bg-white/10 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                                    Acessar Agora
                                </button>
                            </div>
                        </Link>
                    </div>
                )}

                <div className="p-3 border-t border-white/[0.06]">
                    <div className={cn("flex items-center gap-1", collapsed ? "justify-center" : "justify-end px-2")}>
                        <button
                            onClick={toggleTheme}
                            className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
                            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button onClick={logout} className="text-white/40 hover:text-red-400 p-2 rounded-lg hover:bg-white/10 transition-all" title="Sair do Sistema">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Right Side - Header + Main Content */}
            <div className="flex-1 flex flex-col h-full bg-[#0F172A] relative overflow-hidden">
                {/* Desktop Header - Glass effect */}
                {!isFullScreenPage && (
                    <header className="hidden md:flex h-20 items-center justify-between px-8 z-20 flex-shrink-0 bg-[#0F172A] border-b border-white/5">
                        {/* Left Spacer to balance header */}
                        <div className="flex-1"></div>

                        {/* Search Bar - Replaced with Global Search Trigger to enforce ecosystem approach */}
                        <div className="flex-[2] max-w-2xl flex justify-center relative">
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
                                className="group w-full max-w-xl flex items-center justify-between px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.09] border border-white/10 rounded-xl text-white/50 hover:text-white/80 transition-all text-xs font-medium"
                            >
                                <div className="flex items-center gap-3">
                                    <Search size={18} className="text-white/40 group-hover:text-white/70 transition-colors" />
                                    <span>Buscar no sistema...</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-40">
                                    <kbd className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-mono border border-white/10 text-white/40">Ctrl</kbd>
                                    <span className="text-xs text-white/30">+</span>
                                    <kbd className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-mono border border-white/10 text-white/40">K</kbd>
                                </div>
                            </button>
                        </div>

                        {/* Right Actions */}
                        <div className="flex-1 flex items-center justify-end gap-6 ml-4">
                            {/* Team Avatars - Stacked with current user on top */}
                            <div className="flex items-center">
                                {/* Other team members behind */}
                                <div className="flex -space-x-3">
                                    {teamMembers.filter(m => m.id !== user?.id).slice(0, 3).map((member) => (
                                        <div
                                            key={member.id}
                                            className="transition-transform hover:scale-110 hover:z-10"
                                            title={`${member.name} - ${member.role}`}
                                        >
                                            <Avatar
                                                src={member.avatar || undefined}
                                                name={member.name}
                                                size="sm"
                                                className="border-2 border-[#0F172A]"
                                            />
                                        </div>
                                    ))}
                                    {teamMembers.filter(m => m.id !== user?.id).length > 3 && (
                                        <Avatar
                                            src={user?.avatar || undefined}
                                            name={user?.name}
                                            size="sm"
                                            className="border-2 border-[#0F172A]"
                                        />
                                    )}
                                </div>
                                {/* Current user avatar on top */}
                                <Avatar
                                    src={user?.avatar || undefined}
                                    name={user?.name}
                                    size="md"
                                    className="border-2 border-white/20 ring-2 ring-[#0F172A]"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Timer Button - Shows running state */}
                                {timer.isRunning ? (
                                        <button
                                        onClick={() => navigate('/app/timesheet')}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
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
                                        onClick={() => navigate('/app/timesheet')}
                                        className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                        title="Timesheet"
                                    >
                                        <Clock size={20} />
                                    </button>
                                )}
                                <NotificationPanel />
                            </div>

                        </div>
                    </header>
                )}

                {/* Mobile Header */}
                {!isFullScreenPage && (
                    <header className="h-16 flex md:hidden items-center justify-between px-5 z-10 sticky top-0 bg-[#0B1121]">
                        <div className="flex items-center cursor-pointer" onClick={() => navigate('/app')}>
                            <img src="/Logo-advus.png" alt="Advus" className="h-6 object-contain" />
                        </div>
                        <div className="flex items-center">
                            <NotificationPanel />
                        </div>
                    </header>
                )}

                {/* Main content - Removed rounded corners for mobile to match flat design */}
                <main className="flex-1 relative z-10 bg-[#0B1121] md:bg-app-bg rounded-none md:rounded-tl-[40px] overflow-hidden flex flex-col pb-20 md:pb-0">
                    <div className={cn(
                        "flex-1 custom-scrollbar scroll-smooth",
                        !isFullScreenPage ? "p-4 sm:p-6 lg:p-8 overflow-y-auto" : "flex flex-col h-full overflow-hidden"
                    )}>
                        <div className={cn(
                            !isFullScreenPage ? "max-w-7xl mx-auto" : "w-full h-full flex flex-col"
                        )}>
                            {!isFullScreenPage && pathSegments.length > 0 && (
                                <div className="flex items-center gap-2 mb-6 text-[11px] font-black uppercase tracking-[0.1em]">
                                    <Link to="/app" className="text-slate-400 hover:text-primary transition-colors">Dashboard</Link>
                                    {pathSegments.map((segment, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <ChevronRight size={10} className="text-slate-300 dark:text-white/20" />
                                            <span className={idx === pathSegments.length - 1 ? "text-slate-900 dark:text-white" : "text-slate-400"}>
                                                {segment === 'processos' ? 'Processos' : segment === 'clientes' ? 'Clientes' : segment === 'financeiro' ? 'Financeiro' : segment === 'configuracoes' ? 'Configurações' : segment.length > 15 ? 'Detalhes' : segment}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
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
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0B1121] border-t border-white/5 flex items-center justify-between px-2 z-50 pb-safe">
                <BottomNavItem icon={Home} label="Início" path="/app" />
                <BottomNavItem icon={FileText} label="Processos" path="/app/processos" />
                <BottomNavItem icon={Users} label="Clientes" path="/app/clientes" />
                <BottomNavItem icon={ClipboardList} label="Atividades" path="/app/agenda" />
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
                                        className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-primary/5 transition-colors touch-manipulation no-tap-highlight active:scale-95"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <item.icon size={20} className="text-primary" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center leading-tight">{item.label}</span>
                                    </Link>
                                ))}
                                {/* IA Análise in drawer */}
                                <Link
                                    to="/app/analise-ia"
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-primary/5 dark:hover:bg-white/10 transition-colors touch-manipulation no-tap-highlight active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-white/10 flex items-center justify-center">
                                        <Shield size={20} className="text-primary dark:text-white" />
                                    </div>
                                    <span className="text-[10px] font-medium text-app-text-main text-center leading-tight">IA Análise</span>
                                </Link>
                                {/* Settings in drawer too */}
                                <Link
                                    to="/app/configuracoes"
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-primary/5 transition-colors touch-manipulation no-tap-highlight active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Settings size={20} className="text-primary" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center leading-tight">Ajustes</span>
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


            {/* Global Search Modal (Ctrl+K) */}
            <GlobalSearch />
        </div >
    );
}
