import { useState, useEffect } from 'react';
import { Save, User, Bell, Lock, Globe, Camera, Shield, Smartphone, LayoutGrid, Sun, Moon, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import TwoFactorModal from '../../components/settings/TwoFactorModal';
import TeamPermissionsModal from '../../components/settings/TeamPermissionsModal';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

// Settings storage key
const SETTINGS_KEY = 'app_settings';

interface Settings {
    // Identity
    officeName: string;
    cnpj: string;
    email: string;
    phone: string;
    website: string;
    // Regional
    language: string;
    timezone: string;
    dateFormat: string;
    // Security
    twoFactor: boolean;
    loginAlerts: boolean;
    // Notifications
    emailNotifications: boolean;
    processUpdates: boolean;
    deadlineReminders: boolean;
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

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (e: React.MouseEvent) => void }) => (
    <button
        onClick={onChange}
        className={clsx(
            "w-11 h-6 rounded-full transition-colors relative",
            checked ? "bg-primary" : "bg-app-stroke"
        )}
    >
        <div className={clsx(
            "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
            checked ? "left-6" : "left-1"
        )} />
    </button>
);

const IntegrationCard = ({ icon: Icon, name, description, connected, onConfigure }: any) => (
    <div className="bg-app-bg border border-app-stroke rounded-xl p-4 flex items-start gap-4 hover:border-app-text-label transition-colors">
        <div className="w-10 h-10 rounded-lg bg-white dark:bg-app-card flex items-center justify-center shrink-0">
            <Icon size={20} className="text-primary" />
        </div>
        <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-app-text-main text-sm">{name}</h4>
                <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border", connected ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-app-stroke text-app-text-muted border-app-text-label/20")}>
                    {connected ? 'Conectado' : 'Desconectado'}
                </span>
            </div>
            <p className="text-xs text-app-text-muted mb-3">{description}</p>
            <button
                onClick={onConfigure}
                className="text-xs font-medium text-app-text-main bg-app-card border border-app-stroke px-3 py-1.5 rounded-lg hover:bg-app-stroke transition-colors w-full"
            >
                Configurar
            </button>
        </div>
    </div>
);

export default function SettingsPage() {
    const { addToast } = useToast();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
        return localStorage.getItem('profile_photo');
    });
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [user2FAEnabled, setUser2FAEnabled] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [pendingTab, setPendingTab] = useState<string | null>(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [cnpjError, setCnpjError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // Fetch user profile to check 2FA status
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/profile');
                setUser2FAEnabled(response.data.twoFactorEnabled || false);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchProfile();
    }, []);

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
                setProfilePhoto(base64);
                localStorage.setItem('profile_photo', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await api.get('/settings');
                if (response.data) {
                    // Merge with defaults to ensure all fields exist
                    setSettings({ ...defaultSettings, ...response.data });
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                // Fallback to local storage if API fails (or first load)
                const saved = localStorage.getItem(SETTINGS_KEY);
                if (saved) {
                    setSettings({ ...defaultSettings, ...JSON.parse(saved) });
                }
            }
        };
        loadSettings();
    }, []);

    // Helper for CNPJ Mask
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

    // Helper for Phone Mask
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

    // Save settings
    const handleSave = async () => {
        // Validate before save
        const cnpjErr = validateCNPJ(settings.cnpj);
        const phoneErr = validatePhone(settings.phone);
        
        if (cnpjErr || phoneErr) {
            setCnpjError(cnpjErr);
            setPhoneError(phoneErr);
            addToast('Corrija os erros antes de salvar.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await api.post('/settings', settings);

            // Keep local storage as backup/cache
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

            setSaveMessage('Configurações salvas com sucesso!');
            setIsDirty(false); // Reset dirty flag on successful save
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveMessage('Erro ao salvar configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    // Reset settings
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
        { id: 'general', label: 'Geral', icon: Globe },
        { id: 'notifications', label: 'Notificações', icon: Bell },
        { id: 'security', label: 'Segurança & Login', icon: Lock },
        { id: 'billing', label: 'Faturamento', icon: LayoutGrid },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full lg:h-[calc(100vh-theme(spacing.20))]">

            {/* Sidebar Navigation - horizontal scroll on mobile */}
            <aside className="w-full lg:w-64 shrink-0">
                <h2 className="hidden lg:block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-4 px-2">Configurações Gerais</h2>

                {/* Mobile: horizontal scrolling tabs */}
                <div className="flex lg:flex-col gap-1 lg:gap-1 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0 scrollbar-hide touch-pan-x">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (isDirty && activeTab !== tab.id && tab.id !== 'general' && activeTab === 'general') {
                                    setPendingTab(tab.id);
                                    setShowUnsavedModal(true);
                                } else {
                                    setActiveTab(tab.id);
                                }
                            }}
                            className={clsx(
                                "flex items-center gap-2 lg:gap-3 px-3 lg:px-3 py-2 lg:py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-fast whitespace-nowrap shrink-0 touch-manipulation",
                                activeTab === tab.id
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 active:bg-app-stroke/50"
                            )}
                        >
                            <tab.icon size={16} className="lg:w-[18px] lg:h-[18px]" />
                            <span className="hidden sm:inline lg:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="hidden lg:block mt-8 pt-8 border-t border-app-stroke space-y-1">
                    <h2 className="text-xs font-bold text-app-text-muted uppercase tracking-wider mb-4 px-2">Administração</h2>
                    <button
                        onClick={() => setShowTeamModal(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 transition-fast touch-manipulation"
                    >
                        <User size={18} /> Equipe & Permissões
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30 transition-fast touch-manipulation">
                        <LayoutGrid size={18} /> Integrações
                    </button>
                </div>

                {/* Theme Toggle */}
                <div className="hidden lg:block mt-8 pt-8 border-t border-app-stroke">
                    <h2 className="text-xs font-bold text-app-text-muted uppercase tracking-wider mb-4 px-2">Aparência</h2>
                    <div className="bg-app-card border border-app-stroke rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {theme === 'dark' ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-amber-500" />}
                                <span className="text-sm font-medium text-app-text-main">
                                    {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
                                </span>
                            </div>
                            <Toggle checked={theme === 'light'} onChange={(e) => toggleTheme(e)} />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-app-card border border-app-stroke rounded-2xl overflow-hidden flex flex-col lg:mr-6 mb-6 lg:mb-0">
                <div className="p-6 border-b border-app-stroke flex justify-between items-center bg-app-card sticky top-0 z-10">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-app-text-muted mb-1">
                            <span>Home</span>
                            <span>›</span>
                            <span>Configurações</span>
                        </div>
                        <h1 className="text-2xl font-bold text-app-text-main">Configurações do Sistema</h1>
                        <p className="text-sm text-app-text-muted">Gerencie as preferências da sua conta jurídica e personalize sua experiência.</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {saveMessage && (
                            <span className={clsx(
                                "text-sm font-medium px-3 py-1 rounded-lg",
                                saveMessage.includes('sucesso') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {saveMessage}
                            </span>
                        )}
                        {isDirty && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-lg border border-app-stroke text-app-text-main text-sm font-medium hover:bg-app-stroke/30 transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Identidade do Escritório */}
                            <section>
                                <h2 className="text-lg font-bold text-app-text-main mb-4">Identidade do Escritório</h2>
                                <div className="bg-app-bg border border-app-stroke rounded-xl p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex flex-col items-center gap-3">
                                            <label className="w-24 h-24 rounded-full bg-app-card border-2 border-dashed border-app-stroke flex items-center justify-center relative cursor-pointer hover:border-primary transition-colors group overflow-hidden">
                                                {profilePhoto ? (
                                                    <img src={profilePhoto} alt="Foto de perfil" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera size={24} className="text-app-text-muted group-hover:text-app-text-main" />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoUpload}
                                                    className="hidden"
                                                />
                                                <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-app-bg">
                                                    <Camera size={14} />
                                                </div>
                                            </label>
                                            <span className="text-xs text-app-text-muted">Logo do Escritório</span>
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-app-text-muted">Nome do Escritório</label>
                                                <input
                                                    type="text"
                                                    value={settings.officeName}
                                                    onChange={(e) => updateSetting('officeName', e.target.value)}
                                                    className="w-full bg-app-card border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main text-sm focus:border-primary outline-none transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-app-text-muted">CNPJ / NIF</label>
                                                <input
                                                    type="text"
                                                    value={settings.cnpj}
                                                    onChange={(e) => updateSetting('cnpj', e.target.value)}
                                                    className={clsx(
                                                        "w-full bg-app-card border rounded-lg px-4 py-2.5 text-app-text-main text-sm outline-none transition-colors",
                                                        cnpjError ? "border-red-500 focus:border-red-500" : "border-app-stroke focus:border-primary"
                                                    )}
                                                    placeholder="00.000.000/0001-00"
                                                    maxLength={18}
                                                />
                                                {cnpjError && <p className="text-[10px] text-red-500">{cnpjError}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-app-text-muted">Telefone</label>
                                                <input
                                                    type="text"
                                                    value={settings.phone}
                                                    onChange={(e) => updateSetting('phone', e.target.value)}
                                                    className={clsx(
                                                        "w-full bg-app-card border rounded-lg px-4 py-2.5 text-app-text-main text-sm outline-none transition-colors",
                                                        phoneError ? "border-red-500 focus:border-red-500" : "border-app-stroke focus:border-primary"
                                                    )}
                                                    placeholder="(11) 90000-0000"
                                                    maxLength={15}
                                                />
                                                {phoneError && <p className="text-[10px] text-red-500">{phoneError}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-app-text-muted">Email de Contato Principal</label>
                                                <input
                                                    type="email"
                                                    value={settings.email}
                                                    onChange={(e) => updateSetting('email', e.target.value)}
                                                    className="w-full bg-app-card border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main text-sm focus:border-primary outline-none transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-app-text-muted">Website</label>
                                                <div className="flex">
                                                    <span className="bg-app-card border border-r-0 border-app-stroke rounded-l-lg px-3 py-2.5 text-app-text-muted text-sm flex items-center">https://</span>
                                                    <input
                                                        type="text"
                                                        value={settings.website}
                                                        onChange={(e) => updateSetting('website', e.target.value)}
                                                        className="flex-1 bg-app-card border border-app-stroke rounded-r-lg px-4 py-2.5 text-app-text-main text-sm focus:border-primary outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Preferências Regionais */}
                            <section>
                                <h2 className="text-lg font-bold text-app-text-main mb-4">Preferências Regionais</h2>
                                <div className="bg-app-bg border border-app-stroke rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-app-text-muted">Idioma do Sistema</label>
                                        <select
                                            value={settings.language}
                                            onChange={(e) => updateSetting('language', e.target.value)}
                                            className="w-full bg-app-card border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main text-sm focus:border-primary outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="pt-BR">Português (Brasil)</option>
                                            <option value="en-US">English (US)</option>
                                            <option value="es">Español</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-app-text-muted">Fuso Horário</label>
                                        <select
                                            value={settings.timezone}
                                            onChange={(e) => updateSetting('timezone', e.target.value)}
                                            className="w-full bg-app-card border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main text-sm focus:border-primary outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="America/Sao_Paulo">(GMT-03:00) Brasília</option>
                                            <option value="America/Fortaleza">(GMT-03:00) Fortaleza</option>
                                            <option value="America/Manaus">(GMT-04:00) Manaus</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-app-text-muted">Formato de Data</label>
                                        <select
                                            value={settings.dateFormat}
                                            onChange={(e) => updateSetting('dateFormat', e.target.value)}
                                            className="w-full bg-app-card border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main text-sm focus:border-primary outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="DD/MM/YYYY">DD/MM/AAAA (31/12/2023)</option>
                                            <option value="MM/DD/YYYY">MM/DD/AAAA (12/31/2023)</option>
                                            <option value="YYYY-MM-DD">AAAA-MM-DD (2023-12-31)</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Integrações */}
                            <section>
                                <h2 className="text-lg font-bold text-app-text-main flex items-center gap-2 mb-4">
                                    <LayoutGrid size={20} className="text-primary" /> Integrações Ativas
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <IntegrationCard
                                        icon={Globe}
                                        name="Google Drive"
                                        description="Sincronização automática de documentos e anexos de processos."
                                        connected={true}
                                        onConfigure={() => addToast('Configurar Google Drive - Em breve!', 'info')}
                                    />
                                    <IntegrationCard
                                        icon={Smartphone}
                                        name="Zoom"
                                        description="Agendamento automático de videochamadas e links nas reuniões."
                                        connected={true}
                                        onConfigure={() => addToast('Configurar Zoom - Em breve!', 'info')}
                                    />
                                    <div className="border border-dashed border-app-stroke rounded-xl flex flex-col items-center justify-center p-6 hover:bg-app-stroke/20 transition-colors cursor-pointer group hover:border-primary/50">
                                        <div className="w-10 h-10 rounded-full bg-app-card flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <span className="text-app-text-main font-bold text-xl">+</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-app-text-main">Adicionar Nova</h4>
                                        <p className="text-xs text-app-text-muted">Explore mais apps</p>
                                    </div>
                                </div>
                            </section>

                            {/* Backup de Dados */}
                            <section className="pb-8">
                                <h2 className="text-lg font-bold text-app-text-main flex items-center gap-2 mb-4">
                                    <Download size={20} className="text-primary" /> Exportação e Backup de Dados
                                </h2>
                                <div className="bg-app-bg border border-app-stroke rounded-xl p-6">
                                    <p className="text-sm text-app-text-muted mb-4">
                                        Baixe um arquivo contendo todos os clientes, processos, histórico financeiro e eventos do seu escritório jurídico. Para manter seus dados sempre seguros com você.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={async () => {
                                                const btn = document.getElementById('btn-export-excel') as HTMLButtonElement;
                                                const originalText = btn.innerText;
                                                try {
                                                    btn.innerText = 'Gerando...';
                                                    btn.disabled = true;
                                                    const response = await api.get('/backup/export/excel', { responseType: 'blob' });
                                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `backup_excel_${new Date().toISOString().split('T')[0]}.xlsx`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.parentNode?.removeChild(link);
                                                    addToast('Backup em Excel gerado com sucesso!', 'success');
                                                } catch (err) {
                                                    addToast('Erro ao gerar backup em Excel', 'error');
                                                } finally {
                                                    btn.innerText = originalText;
                                                    btn.disabled = false;
                                                }
                                            }}
                                            id="btn-export-excel"
                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Download size={16} /> Exportar Planilha XLSX
                                        </button>

                                        <button
                                            onClick={async () => {
                                                const btn = document.getElementById('btn-export-json') as HTMLButtonElement;
                                                const originalText = btn.innerText;
                                                try {
                                                    btn.innerText = 'Gerando...';
                                                    btn.disabled = true;
                                                    const response = await api.get('/backup/export/json', { responseType: 'blob' });
                                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `backup_dados_${new Date().toISOString().split('T')[0]}.json`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.parentNode?.removeChild(link);
                                                    addToast('Backup JSON gerado com sucesso!', 'success');
                                                } catch (err) {
                                                    addToast('Erro ao gerar backup JSON', 'error');
                                                } finally {
                                                    btn.innerText = originalText;
                                                    btn.disabled = false;
                                                }
                                            }}
                                            id="btn-export-json"
                                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Download size={16} /> Exportar Arquivo Estruturado (JSON)
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <section>
                                <h2 className="text-lg font-bold text-app-text-main flex items-center gap-2 mb-4">
                                    <Bell size={20} className="text-primary" /> Notificações
                                </h2>
                                <div className="bg-app-bg border border-app-stroke rounded-xl p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-app-text-main">Notificações por Email</h3>
                                            <p className="text-xs text-app-text-muted mt-1">Receba atualizações importantes por email.</p>
                                        </div>
                                        <Toggle checked={settings.emailNotifications} onChange={() => updateSetting('emailNotifications', !settings.emailNotifications)} />
                                    </div>
                                    <div className="w-full h-px bg-app-stroke" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-app-text-main">Atualizações de Processos</h3>
                                            <p className="text-xs text-app-text-muted mt-1">Notificações quando houver movimentações processuais.</p>
                                        </div>
                                        <Toggle checked={settings.processUpdates} onChange={() => updateSetting('processUpdates', !settings.processUpdates)} />
                                    </div>
                                    <div className="w-full h-px bg-app-stroke" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-app-text-main">Lembretes de Prazos</h3>
                                            <p className="text-xs text-app-text-muted mt-1">Alertas para prazos processuais próximos.</p>
                                        </div>
                                        <Toggle checked={settings.deadlineReminders} onChange={() => updateSetting('deadlineReminders', !settings.deadlineReminders)} />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <section>
                                <h2 className="text-lg font-bold text-app-text-main flex items-center gap-2 mb-4">
                                    <Shield size={20} className="text-primary" /> Segurança
                                </h2>
                                <div className="bg-app-bg border border-app-stroke rounded-xl p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-app-text-main">Autenticação em Dois Fatores (2FA)</h3>
                                            <p className="text-xs text-app-text-muted mt-1">Adicione uma camada extra de segurança à sua conta exigindo um código do seu celular.</p>
                                        </div>
                                        <button
                                            onClick={() => setShow2FAModal(true)}
                                            className={clsx(
                                                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                                user2FAEnabled
                                                    ? "bg-green-500/10 text-green-500 border border-green-500/30"
                                                    : "bg-primary text-white hover:bg-primary-dark"
                                            )}
                                        >
                                            {user2FAEnabled ? 'Gerenciar' : 'Configurar'}
                                        </button>
                                    </div>
                                    <div className="w-full h-px bg-app-stroke" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-app-text-main">Notificar novos logins</h3>
                                            <p className="text-xs text-app-text-muted mt-1">Receba um alerta por email sempre que sua conta for acessada de um novo dispositivo ou IP.</p>
                                        </div>
                                        <Toggle checked={settings.loginAlerts} onChange={() => updateSetting('loginAlerts', !settings.loginAlerts)} />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Faturamento */}
                            <section>
                                <h2 className="text-lg font-bold text-app-text-main flex items-center gap-2 mb-4">
                                    <LayoutGrid size={20} className="text-primary" /> Seu Faturamento
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    
                                    {/* Current Plan */}
                                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
                                        <div className="absolute -top-4 -right-4 p-4 opacity-10 rotate-12">
                                            <LayoutGrid size={120} />
                                        </div>
                                        <div className="relative z-10">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary mb-4 border border-primary/30">
                                                Plano Ativo
                                            </span>
                                            <h3 className="text-2xl font-black text-app-text-main mb-1">PRO ANUAL</h3>
                                            <p className="text-sm text-app-text-muted mb-4">Acesso ilimitado à plataforma completa de gestão jurídica.</p>
                                            
                                            <div className="flex items-end gap-2 mb-6">
                                                <span className="text-4xl font-black text-app-text-main">R$ 149</span>
                                                <span className="text-sm font-medium text-app-text-muted mb-1.5">/mês*</span>
                                            </div>

                                            <button className="w-full bg-primary text-white font-bold rounded-lg py-3 shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
                                                Gerenciar Assinatura
                                            </button>
                                            <p className="text-[10px] text-app-text-muted mt-3 text-center">*Faturado anualmente no valor de R$ 1.788,00</p>
                                        </div>
                                    </div>

                                    {/* Next Invoice & Payment */}
                                    <div className="flex flex-col gap-4">
                                        <div className="bg-app-bg border border-app-stroke rounded-xl p-5 flex items-center justify-between shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <p className="text-xs font-bold text-app-text-muted uppercase tracking-wider">Próxima Fatura</p>
                                                </div>
                                                <h4 className="text-xl font-black text-app-text-main">R$ 1.788,00</h4>
                                                <p className="text-xs text-app-text-muted mt-0.5">Vence em 15/12/2026</p>
                                            </div>
                                            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <span className="text-emerald-500 font-bold text-sm">Ok</span>
                                            </div>
                                        </div>

                                        <div className="bg-app-bg border border-app-stroke rounded-xl p-5 flex-1 flex flex-col justify-center shadow-sm">
                                            <p className="text-xs font-bold text-app-text-muted uppercase tracking-wider mb-4">Forma de Pagamento Padrão</p>
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-9 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold italic tracking-wider shadow-sm border border-slate-700">
                                                    VISA
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-app-text-main tracking-wider">• • • •  4242</p>
                                                    <p className="text-xs text-app-text-muted font-medium mt-0.5">Expira em 10/28</p>
                                                </div>
                                                <button className="text-xs font-bold text-primary hover:text-primary-dark hover:underline transition-colors px-2 py-1 bg-primary/5 rounded">
                                                    Editar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-bold text-app-text-main">Histórico de Pagamentos</h2>
                                    <button className="text-sm font-medium text-primary hover:underline">Ver todos</button>
                                </div>
                                <div className="bg-app-bg border border-app-stroke rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-app-stroke bg-app-card/30">
                                                <th className="font-semibold text-app-text-muted p-4 text-xs uppercase tracking-wider">Data</th>
                                                <th className="font-semibold text-app-text-muted p-4 text-xs uppercase tracking-wider">Fatura</th>
                                                <th className="font-semibold text-app-text-muted p-4 text-xs uppercase tracking-wider">Valor</th>
                                                <th className="font-semibold text-app-text-muted p-4 text-xs uppercase tracking-wider">Status</th>
                                                <th className="font-semibold text-app-text-muted p-4 text-right text-xs uppercase tracking-wider">Documento</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-app-stroke">
                                            <tr className="hover:bg-app-card/30 transition-colors">
                                                <td className="p-4 text-app-text-main font-medium">15 Dez 2025</td>
                                                <td className="p-4 text-app-text-muted">Licença Anual - Pro</td>
                                                <td className="p-4 text-app-text-main font-bold flex items-center gap-2">
                                                    R$ 1.788,00
                                                    <span className="w-14 h-5 inline-flex items-center justify-center bg-slate-800 rounded text-[10px] text-white italic tracking-wider">VISA</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pago
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button className="text-primary hover:text-primary-dark font-medium px-3 py-1.5 bg-primary/5 rounded hover:bg-primary/10 transition-colors text-xs">
                                                        Baixar NFe
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr className="hover:bg-app-card/30 transition-colors">
                                                <td className="p-4 text-app-text-main font-medium">15 Dez 2024</td>
                                                <td className="p-4 text-app-text-muted">Licença Anual - Pro</td>
                                                <td className="p-4 text-app-text-main font-bold flex items-center gap-2">
                                                    R$ 1.788,00
                                                    <span className="w-14 h-5 inline-flex items-center justify-center bg-slate-800 rounded text-[10px] text-white italic tracking-wider">VISA</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pago
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button className="text-primary hover:text-primary-dark font-medium px-3 py-1.5 bg-primary/5 rounded hover:bg-primary/10 transition-colors text-xs">
                                                        Baixar NFe
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <Modal
                isOpen={showUnsavedModal}
                onClose={() => setShowUnsavedModal(false)}
                title="Alterações Não Salvas"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-app-text-muted">
                        Você tem alterações não salvas na aba atual. Deseja sair e perder essas alterações?
                    </p>
                    <div className="flex gap-3 pt-4 border-t border-app-stroke justify-end">
                        <button
                            onClick={() => setShowUnsavedModal(false)}
                            className="px-4 py-2 rounded-lg border border-app-stroke text-app-text-main text-sm font-medium hover:bg-app-stroke/30 transition-colors"
                        >
                            Ficar
                        </button>
                        <button
                            onClick={() => {
                                handleCancel();
                                setShowUnsavedModal(false);
                                if (pendingTab) setActiveTab(pendingTab);
                                setPendingTab(null);
                            }}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            Sair e Descartar
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
