import { useState, useEffect, useCallback, memo } from 'react';
import { Save, User, Bell, Lock, Globe, Camera, Shield, Smartphone, LayoutGrid, Sun, Moon, Download, FileText, ChevronRight, Settings2, Trash2, ExternalLink, RefreshCw, Smartphone as MobileIcon, Hash, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useTheme } from '../../context/ThemeContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import TwoFactorModal from '../../components/settings/TwoFactorModal';
import TeamPermissionsModal from '../../components/settings/TeamPermissionsModal';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import BillingPage from './BillingPage';
import { haptics } from '../../utils/haptics';

// Settings storage key
const SETTINGS_KEY = 'app_settings';

interface Settings {
    officeName: string;
    cnpj: string;
    email: string;
    phone: string;
    website: string;
    language: string;
    timezone: string;
    dateFormat: string;
    twoFactor: boolean;
    loginAlerts: boolean;
    emailNotifications: boolean;
    processUpdates: boolean;
    deadlineReminders: boolean;
    logoUrl?: string;
    asaasApiKey?: string;
}

const defaultSettings: Settings = {
    officeName: 'Santos & Associados Advocacia',
    cnpj: '12.345.678/0001-90',
    email: 'contato@santosadv.com.br',
    phone: '(11) 99999-9999',
    website: 'santosadv.com.br',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    twoFactor: false,
    loginAlerts: true,
    emailNotifications: true,
    processUpdates: true,
    deadlineReminders: true,
};

const PremiumToggle = memo(({ checked, onChange }: { checked: boolean, onChange: (e: React.MouseEvent) => void }) => (
    <button
        onClick={(e) => { haptics.light(); onChange(e); }}
        className={clsx(
            "w-14 h-7 rounded-full transition-all duration-300 relative border",
            checked ? "bg-primary border-primary/50 shadow-lg shadow-primary/20" : "bg-app-stroke border-white/5 shadow-inner"
        )}
    >
        <motion.div 
            animate={{ x: checked ? 28 : 4 }}
            className={clsx(
                "w-5 h-5 rounded-full absolute top-1 transition-all duration-300",
                checked ? "bg-white" : "bg-app-text-muted"
            )} 
        />
    </button>
));

const SettingSection = memo(({ title, description, children, icon: Icon }: any) => (
    <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 mb-12"
    >
        <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                {Icon && <Icon size={24} />}
            </div>
            <div>
                <h2 className="text-xl font-black text-app-text-main tracking-tight uppercase">{title}</h2>
                <p className="text-sm text-app-text-muted font-medium">{description}</p>
            </div>
        </div>
        <div className="bg-app-card rounded-[2.5rem] border border-app-stroke p-8 shadow-xl shadow-black/5">
            {children}
        </div>
    </motion.section>
));

const PremiumInput = memo(({ label, error, ...props }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">{label}</label>
        <input
            {...props}
            className={clsx(
                "w-full bg-app-bg border rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner",
                error ? "border-rose-500/50 focus:border-rose-500 ring-2 ring-rose-500/10" : "border-app-stroke focus:ring-4 focus:ring-primary/10"
            )}
        />
        {error && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest ml-1">{error}</p>}
    </div>
));

export default function SettingsPage() {
    const { addToast } = useToast();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [user2FAEnabled, setUser2FAEnabled] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [pendingTab, setPendingTab] = useState<string | null>(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [cnpjError, setCnpjError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [googleConnected, setGoogleConnected] = useState(false);
    const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    
    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get('/auth/profile');
            setUser2FAEnabled(response.data.twoFactorEnabled || false);
            setGoogleConnected(response.data.googleCalendarConnected || false);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        if (searchParams.get('google') === 'success') {
            fetchProfile();
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('google');
            setSearchParams(newParams);
        }
    }, [searchParams, fetchProfile, setSearchParams]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                addToast('Arquivo muito grande. Máximo 5MB.', 'warning');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                updateSetting('logoUrl', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await api.get('/settings');
                if (response.data) {
                    setSettings({ ...defaultSettings, ...response.data });
                }
            } catch (error) {
                const saved = localStorage.getItem(SETTINGS_KEY);
                if (saved) {
                    setSettings({ ...defaultSettings, ...JSON.parse(saved) });
                }
            }
        };
        loadSettings();
    }, []);

    const maskCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .slice(0, 18);
    };

    const validateCNPJ = (cnpj: string) => {
        const clean = cnpj.replace(/\D/g, '');
        if (clean.length > 0 && clean.length !== 14) {
            return 'CNPJ incompleto';
        }
        return '';
    };

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d)(\d{4})$/, '$1-$2')
            .slice(0, 15);
    };

    const validatePhone = (phone: string) => {
        const clean = phone.replace(/\D/g, '');
        if (clean.length > 0 && clean.length < 10) {
            return 'Telefone incompleto';
        }
        return '';
    };

    const handleSave = async () => {
        const cnpjErr = validateCNPJ(settings.cnpj);
        const phoneErr = validatePhone(settings.phone);
        
        if (cnpjErr || phoneErr) {
            setCnpjError(cnpjErr);
            setPhoneError(phoneErr);
            addToast('Corrija os erros antes de salvar.', 'error');
            return;
        }

        setIsSaving(true);
        haptics.medium();
        try {
            await api.post('/settings', settings);
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            addToast('Configurações salvas!', 'success');
            setIsDirty(false);
        } catch (error) {
            addToast('Erro ao salvar.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        } else {
            setSettings(defaultSettings);
        }
        setIsDirty(false);
        setCnpjError('');
        setPhoneError('');
        haptics.light();
    };

    const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        let finalValue = value;
        if (key === 'cnpj' && typeof value === 'string') {
            finalValue = maskCNPJ(value) as Settings[K];
            setCnpjError(validateCNPJ(finalValue as string));
        } else if (key === 'phone' && typeof value === 'string') {
            finalValue = maskPhone(value) as Settings[K];
            setPhoneError(validatePhone(finalValue as string));
        }
        setSettings(prev => ({ ...prev, [key]: finalValue }));
        setIsDirty(true);
    };

    const tabs = [
        { id: 'general', label: 'Escritório', icon: Globe, desc: 'Identidade e localização' },
        { id: 'notifications', label: 'Notificações', icon: Bell, desc: 'Alertas e mensagens' },
        { id: 'security', label: 'Segurança', icon: Shield, desc: 'Login e proteção' },
        { id: 'integrations', label: 'Integrações', icon: LayoutGrid, desc: 'Ferramentas externas' },
        { id: 'billing', label: 'Assinatura', icon: FileText, desc: 'Planos e faturamento' },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full pb-20 lg:pb-0">

            <aside className="w-full lg:w-80 shrink-0 space-y-10">
                <div className="px-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text-muted mb-1">Configurações</p>
                    <h1 className="text-4xl font-black text-app-text-main tracking-tighter">Preferências</h1>
                </div>

                <nav className="space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                haptics.light();
                                if (isDirty && activeTab !== tab.id && activeTab === 'general') {
                                    setPendingTab(tab.id);
                                    setShowUnsavedModal(true);
                                } else {
                                    setActiveTab(tab.id);
                                }
                            }}
                            className={clsx(
                                "w-full flex items-center gap-5 p-5 rounded-[1.5rem] transition-all duration-300 group",
                                activeTab === tab.id
                                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                                    : "text-app-text-muted hover:bg-app-card hover:text-app-text-main border border-transparent hover:border-app-stroke"
                            )}
                        >
                            <div className={clsx(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                activeTab === tab.id ? "bg-white/20" : "bg-app-stroke/50 group-hover:bg-primary/10 group-hover:text-primary"
                            )}>
                                <tab.icon size={20} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black uppercase tracking-widest leading-none mb-1">{tab.label}</p>
                                <p className={clsx("text-[10px] font-medium opacity-60", activeTab === tab.id ? "text-white" : "text-app-text-muted")}>{tab.desc}</p>
                            </div>
                            {activeTab === tab.id && <ChevronRight size={16} className="ml-auto opacity-50" />}
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-app-stroke space-y-6 px-2">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Administração</p>
                        <button
                            onClick={() => { haptics.medium(); setShowTeamModal(true); }}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-app-card border border-app-stroke text-app-text-main font-bold text-sm hover:border-primary/30 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <User size={18} className="text-primary" />
                                Equipe & Permissões
                            </div>
                            <ChevronRight size={16} className="text-app-text-muted group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Aparência</p>
                        <div className="bg-app-card border border-app-stroke rounded-2xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-app-bg border border-app-stroke flex items-center justify-center">
                                    {theme === 'dark' ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-amber-500" />}
                                </div>
                                <span className="text-sm font-bold text-app-text-main">
                                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </span>
                            </div>
                            <PremiumToggle checked={theme === 'light'} onChange={(e) => toggleTheme(e)} />
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
                <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-app-text-main tracking-tighter leading-none">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <p className="text-sm text-app-text-muted font-medium">{tabs.find(t => t.id === activeTab)?.desc}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {isDirty && (
                            <button
                                onClick={handleCancel}
                                className="px-6 py-3 rounded-2xl border border-app-stroke text-app-text-muted text-[10px] font-black uppercase tracking-widest hover:text-app-text-main hover:bg-app-card transition-all"
                            >
                                Descartar
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {isSaving ? 'Gravando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence mode="wait">
                        {activeTab === 'general' && (
                            <motion.div key="general" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <SettingSection title="Identidade Visual" description="Como seu escritório é visto pelos clientes e no sistema" icon={Camera}>
                                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative group">
                                                <label className="w-32 h-32 rounded-[2rem] bg-app-bg border-2 border-dashed border-app-stroke flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden shadow-inner group">
                                                    {settings.logoUrl ? (
                                                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    ) : (
                                                        <Camera size={32} className="text-app-text-muted group-hover:text-primary transition-colors" />
                                                    )}
                                                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <RefreshCw size={24} className="text-white animate-spin-slow" />
                                                    </div>
                                                </label>
                                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white border-4 border-app-card shadow-lg">
                                                    <Camera size={16} />
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Logo (5MB máx)</p>
                                        </div>
                                        
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <PremiumInput 
                                                label="Nome Oficial" 
                                                value={settings.officeName} 
                                                onChange={(e: any) => updateSetting('officeName', e.target.value)} 
                                            />
                                            <PremiumInput 
                                                label="CNPJ / Registro" 
                                                value={settings.cnpj} 
                                                error={cnpjError}
                                                onChange={(e: any) => updateSetting('cnpj', e.target.value)} 
                                                placeholder="00.000.000/0001-00"
                                            />
                                            <PremiumInput 
                                                label="Telefone Comercial" 
                                                value={settings.phone} 
                                                error={phoneError}
                                                onChange={(e: any) => updateSetting('phone', e.target.value)} 
                                                placeholder="(11) 90000-0000"
                                            />
                                            <PremiumInput 
                                                label="Email Principal" 
                                                type="email"
                                                value={settings.email} 
                                                onChange={(e: any) => updateSetting('email', e.target.value)} 
                                            />
                                            <div className="md:col-span-2">
                                                <PremiumInput 
                                                    label="Website (Opcional)" 
                                                    value={settings.website} 
                                                    onChange={(e: any) => updateSetting('website', e.target.value)} 
                                                    placeholder="www.escritorio.com.br"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </SettingSection>

                                <SettingSection title="Regional & Formatação" description="Ajuste como datas e horários são exibidos" icon={Globe}>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest ml-1">Idioma</label>
                                            <select
                                                value={settings.language}
                                                onChange={(e) => updateSetting('language', e.target.value)}
                                                className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer shadow-inner"
                                            >
                                                <option value="pt-BR">Português (Brasil)</option>
                                                <option value="en-US">English (US)</option>
                                                <option value="es">Español</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest ml-1">Fuso Horário</label>
                                            <select
                                                value={settings.timezone}
                                                onChange={(e) => updateSetting('timezone', e.target.value)}
                                                className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer shadow-inner"
                                            >
                                                <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                                                <option value="America/Manaus">Manaus (GMT-4)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest ml-1">Formato de Data</label>
                                            <select
                                                value={settings.dateFormat}
                                                onChange={(e) => updateSetting('dateFormat', e.target.value)}
                                                className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer shadow-inner"
                                            >
                                                <option value="DD/MM/YYYY">31/12/2023</option>
                                                <option value="MM/DD/YYYY">12/31/2023</option>
                                                <option value="YYYY-MM-DD">2023-12-31</option>
                                            </select>
                                        </div>
                                    </div>
                                </SettingSection>

                                <SettingSection title="Exportação & Backup" description="Tenha controle total sobre seus dados" icon={Download}>
                                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="space-y-2 text-center md:text-left">
                                            <h4 className="text-lg font-black text-app-text-main tracking-tight uppercase">Base de Dados Completa</h4>
                                            <p className="text-xs text-app-text-muted font-medium max-w-md">Baixe todos os clientes, processos e registros financeiros em um arquivo estruturado.</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                            <button
                                                onClick={async () => {
                                                    haptics.medium();
                                                    try {
                                                        const response = await api.get('/backup/export/excel', { responseType: 'blob' });
                                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        link.setAttribute('download', `backup_excel_${new Date().toISOString().split('T')[0]}.xlsx`);
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        link.parentNode?.removeChild(link);
                                                        addToast('Planilha gerada!', 'success');
                                                    } catch (err) {
                                                        addToast('Erro ao exportar.', 'error');
                                                    }
                                                }}
                                                className="px-6 py-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                <Download size={18} /> Excel (XLSX)
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    haptics.medium();
                                                    try {
                                                        const response = await api.get('/backup/export/json', { responseType: 'blob' });
                                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        link.setAttribute('download', `backup_dados_${new Date().toISOString().split('T')[0]}.json`);
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        link.parentNode?.removeChild(link);
                                                        addToast('Arquivo JSON gerado!', 'success');
                                                    } catch (err) {
                                                        addToast('Erro ao exportar.', 'error');
                                                    }
                                                }}
                                                className="px-6 py-4 bg-[#0F172A] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all"
                                            >
                                                <Hash size={18} /> Dados (JSON)
                                            </button>
                                        </div>
                                    </div>
                                </SettingSection>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <SettingSection title="Canais de Comunicação" description="Escolha onde e como quer ser avisado" icon={Bell}>
                                    <div className="space-y-0 divide-y divide-app-stroke/50">
                                        {[
                                            { key: 'emailNotifications', label: 'Notificações por Email', desc: 'Relatórios diários e resumos semanais no seu inbox.' },
                                            { key: 'processUpdates', label: 'Alertas de Processos', desc: 'Avisar imediatamente sobre movimentações no tribunal.' },
                                            { key: 'deadlineReminders', label: 'Lembretes de Prazos', desc: 'Alertas críticos 24h antes de cada vencimento.' }
                                        ].map((n) => (
                                            <div key={n.key} className="py-8 flex items-center justify-between gap-10 first:pt-0 last:pb-0">
                                                <div className="space-y-1">
                                                    <h3 className="text-base font-black text-app-text-main uppercase tracking-tight">{n.label}</h3>
                                                    <p className="text-sm text-app-text-muted font-medium">{n.desc}</p>
                                                </div>
                                                <PremiumToggle 
                                                    checked={(settings as any)[n.key]} 
                                                    onChange={() => updateSetting(n.key as any, !(settings as any)[n.key])} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </SettingSection>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <SettingSection title="Proteção de Conta" description="Gerencie chaves de acesso e camadas extras" icon={Shield}>
                                    <div className="space-y-10">
                                        <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[1.25rem] bg-white dark:bg-app-card flex items-center justify-center text-primary shadow-lg border border-app-stroke">
                                                    <MobileIcon size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black text-app-text-main tracking-tight uppercase">Autenticação (2FA)</h3>
                                                    <p className="text-sm text-app-text-muted font-medium">Use apps como Google Authenticator ou Authy.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { haptics.medium(); setShow2FAModal(true); }}
                                                className={clsx(
                                                    "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                                                    user2FAEnabled
                                                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                                                        : "bg-primary text-white hover:opacity-90 shadow-primary/20"
                                                )}
                                            >
                                                {user2FAEnabled ? 'Proteção Ativa' : 'Ativar Agora'}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between px-2">
                                            <div className="space-y-1">
                                                <h3 className="text-base font-black text-app-text-main uppercase tracking-tight">Alertas de Novo Login</h3>
                                                <p className="text-sm text-app-text-muted font-medium">Avisar sempre que acessarem de um IP desconhecido.</p>
                                            </div>
                                            <PremiumToggle 
                                                checked={settings.loginAlerts} 
                                                onChange={() => updateSetting('loginAlerts', !settings.loginAlerts)} 
                                            />
                                        </div>
                                    </div>
                                </SettingSection>
                            </motion.div>
                        )}

                        {activeTab === 'integrations' && (
                            <motion.div key="integrations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <SettingSection title="Ecossistema Conectado" description="Sincronize com ferramentas de produtividade" icon={LayoutGrid}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-app-bg border border-app-stroke rounded-[2rem] p-8 flex flex-col hover:border-primary/50 transition-all group relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-app-card border border-app-stroke flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                                    <Globe size={32} className="text-[#4285F4]" />
                                                </div>
                                                <div className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    googleConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-app-stroke text-app-text-muted"
                                                )}>
                                                    {googleConnected ? 'Conectado' : 'Offline'}
                                                </div>
                                            </div>
                                            <div className="relative z-10 flex-1 flex flex-col">
                                                <h3 className="text-xl font-black text-app-text-main tracking-tight uppercase mb-2">Google Calendar</h3>
                                                <p className="text-sm text-app-text-muted font-medium mb-10 leading-relaxed">
                                                    Sincronize audiências e prazos automaticamente com sua agenda mobile e desktop.
                                                </p>
                                                
                                                <div className="mt-auto">
                                                    {googleConnected ? (
                                                        <button 
                                                            onClick={async () => {
                                                                haptics.medium();
                                                                if(confirm('Desconectar agenda do Google?')) {
                                                                    try {
                                                                        await api.delete('/google-calendar/disconnect');
                                                                        setGoogleConnected(false);
                                                                        addToast('Desconectado!', 'success');
                                                                    } catch (err) {
                                                                        addToast('Erro ao desconectar.', 'error');
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full py-4 rounded-2xl border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/5 transition-all"
                                                        >
                                                            Interromper Conexão
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            disabled={isConnectingGoogle}
                                                            onClick={async () => {
                                                                haptics.medium();
                                                                setIsConnectingGoogle(true);
                                                                try {
                                                                    const response = await api.get('/google-calendar/auth-url');
                                                                    window.location.href = response.data.url;
                                                                } catch (err) {
                                                                    addToast('Erro ao iniciar.', 'error');
                                                                    setIsConnectingGoogle(false);
                                                                }
                                                            }}
                                                            className="w-full py-4 rounded-2xl bg-[#4285F4] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#4285F4]/20 hover:opacity-90 transition-all"
                                                        >
                                                            {isConnectingGoogle ? 'Autenticando...' : 'Vincular Conta Google'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-app-bg border border-app-stroke rounded-[2rem] p-8 flex flex-col border-dashed opacity-80 group">
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-app-card border border-app-stroke flex items-center justify-center shadow-xl grayscale group-hover:grayscale-0 transition-all duration-500">
                                                    <FileText size={32} className="text-primary" />
                                                </div>
                                                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500">
                                                    Sistema
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-black text-app-text-main tracking-tight uppercase mb-2">Autentique</h3>
                                            <p className="text-sm text-app-text-muted font-medium mb-10 leading-relaxed">
                                                Assinaturas digitais integradas nativamente. 10 documentos mensais cortesia da Advus.
                                            </p>
                                            <div className="mt-auto">
                                                <div className="w-full py-4 rounded-2xl bg-app-stroke/30 text-app-text-muted text-center text-[10px] font-black uppercase tracking-widest">
                                                    Pré-configurado
                                                </div>
                                            </div>
                                        </div>

                                        {/* ASAAS Integration Card */}
                                        <div className="bg-app-bg border border-app-stroke rounded-[2rem] p-8 flex flex-col hover:border-primary/50 transition-all group relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-app-card border border-app-stroke flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                                    <CreditCard size={32} className="text-primary" />
                                                </div>
                                                <div className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    settings.asaasApiKey ? "bg-emerald-500/10 text-emerald-500" : "bg-app-stroke text-app-text-muted"
                                                )}>
                                                    {settings.asaasApiKey ? 'Configurado' : 'Não Configurado'}
                                                </div>
                                            </div>
                                            <div className="relative z-10 flex-1 flex flex-col">
                                                <h3 className="text-xl font-black text-app-text-main tracking-tight uppercase mb-2">ASAAS Cobranças</h3>
                                                <p className="text-sm text-app-text-muted font-medium mb-10 leading-relaxed">
                                                    Emita cobranças via Boleto e PIX para seus clientes de forma automatizada e integrada ao financeiro.
                                                </p>
                                                
                                                <div className="mt-auto">
                                                    <button 
                                                        onClick={() => {
                                                            haptics.light();
                                                            navigate('/app/configuracoes/asaas');
                                                        }}
                                                        className="w-full py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all text-center"
                                                    >
                                                        {settings.asaasApiKey ? 'Gerenciar Integração' : 'Configurar Integração'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </SettingSection>
                            </motion.div>
                        )}

                        {activeTab === 'billing' && (
                            <motion.div key="billing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <BillingPage />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <Modal
                isOpen={showUnsavedModal}
                onClose={() => setShowUnsavedModal(false)}
                title="Dados Pendentes"
                size="sm"
            >
                <div className="space-y-6 text-center p-4">
                    <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-rose-500 mb-6">
                        <Save size={32} />
                    </div>
                    <p className="text-base text-app-text-muted font-medium leading-relaxed">
                        Você tem alterações não salvas. Deseja realmente descartar e mudar de aba?
                    </p>
                    <div className="flex flex-col gap-3 pt-6">
                        <button
                            onClick={() => {
                                handleCancel();
                                setShowUnsavedModal(false);
                                if (pendingTab) setActiveTab(pendingTab);
                                setPendingTab(null);
                            }}
                            className="w-full py-4 rounded-2xl bg-rose-500 text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-rose-500/20"
                        >
                            Descartar & Sair
                        </button>
                        <button
                            onClick={() => setShowUnsavedModal(false)}
                            className="w-full py-4 rounded-2xl bg-app-stroke/30 text-app-text-main text-xs font-black uppercase tracking-widest hover:bg-app-stroke/50 transition-all"
                        >
                            Continuar Editando
                        </button>
                    </div>
                </div>
            </Modal>

            <TwoFactorModal
                isOpen={show2FAModal}
                onClose={() => setShow2FAModal(false)}
                isEnabled={user2FAEnabled}
                onStatusChange={(enabled) => setUser2FAEnabled(enabled)}
            />
            <TeamPermissionsModal
                isOpen={showTeamModal}
                onClose={() => setShowTeamModal(false)}
            />
        </div>
    );
}
