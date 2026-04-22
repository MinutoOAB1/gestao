import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Camera, Mail, Phone, MapPin, Shield, Save, X, BadgeCheck, Briefcase, ArrowLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { collapsed } = useOutletContext<{ collapsed: boolean }>() || { collapsed: false };
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatar: user?.avatar || '',
        cpf: '',
        birthDate: '',
        bio: '',
        phone: '',
        mobile: '',
        address: '',
        oabNumber: '',
        oabState: 'SP',
        specialties: [] as string[],
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState('personal');

    // Fetch profile data on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/auth/profile');
                const profile = res.data;
                setFormData({
                    name: profile.name || '',
                    email: profile.email || '',
                    avatar: profile.avatar || '',
                    cpf: profile.cpf || '',
                    birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : '',
                    bio: profile.bio || '',
                    phone: profile.phone || '',
                    mobile: profile.mobile || '',
                    address: profile.address || '',
                    oabNumber: profile.oabNumber || '',
                    oabState: profile.oabState || 'SP',
                    specialties: profile.specialties ? profile.specialties.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                });
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setFormData(prev => ({ ...prev, avatar: base64 }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await api.patch('/auth/profile', {
                name: formData.name,
                avatar: formData.avatar,
                cpf: formData.cpf,
                birthDate: formData.birthDate || null,
                bio: formData.bio,
                phone: formData.phone,
                mobile: formData.mobile,
                address: formData.address,
                oabNumber: formData.oabNumber,
                oabState: formData.oabState,
                specialties: formData.specialties.join(', '),
            });
            updateUser({ name: res.data.name, avatar: res.data.avatar });
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
        } finally {
            setSaving(false);
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'Administrador';
            case 'LAWYER': return 'Advogado';
            case 'INTERN': return 'Estagiário';
            case 'PARTNER': return 'Parceiro';
            default: return role;
        }
    };

    const tabs = [
        { id: 'personal', label: 'Dados Pessoais' },
        { id: 'professional', label: 'Profissional' },
        { id: 'contact', label: 'Contato' },
        { id: 'security', label: 'Segurança' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-app-input flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg" />
                    <p className="text-app-text-muted font-bold tracking-wide">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-input">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-app-text-muted hover:text-app-text-main mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Voltar</span>
                </button>

                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-app-text-main">
                        Perfil do {getRoleLabel(user?.role || 'LAWYER')}
                    </h1>
                    <p className="text-app-text-muted mt-1 text-sm sm:text-base">
                        Gerencie suas informações pessoais, credenciais jurídicas e configurações de segurança.
                    </p>
                </div>

                {/* Profile Header Card with Cover */}
                <div className="bg-app-card rounded-2xl shadow-sm border border-app-stroke mb-8 overflow-hidden">
                    <div className="h-32 sm:h-48 bg-gradient-to-r from-primary/90 to-blue-600/90 relative">
                        {/* Decorative pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    </div>
                    <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20 mb-4 sm:mb-0">
                            <div className="relative group cursor-pointer flex-shrink-0" onClick={handleAvatarClick}>
                                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-app-card shadow-xl overflow-hidden bg-slate-200 dark:bg-slate-700 relative z-10">
                                    {formData.avatar ? (
                                        <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl font-bold text-app-text-muted bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                            {formData.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 m-1">
                                    <Camera size={32} className="text-white drop-shadow-md" />
                                </div>
                                <button
                                    className="absolute bottom-2 right-2 bg-primary text-white p-2.5 rounded-full shadow-lg hover:bg-blue-600 transition-transform hover:scale-110 z-30 ring-4 ring-app-card"
                                    title="Editar foto"
                                >
                                    <Camera size={18} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex flex-col items-center sm:items-start flex-1 text-center sm:text-left mt-4 sm:mt-0 sm:pb-2">
                                <h2 className="text-2xl sm:text-3xl font-black text-app-text-main tracking-tight">{formData.name || 'Seu Nome'}</h2>
                                <p className="text-app-text-muted font-medium mt-1 text-sm sm:text-base">{getRoleLabel(user?.role || 'LAWYER')}</p>
                                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-4">
                                    {formData.oabNumber && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/30 shadow-sm">
                                            <BadgeCheck size={16} className="text-blue-600 dark:text-blue-400" /> OAB/{formData.oabState} {formData.oabNumber}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/30 shadow-sm">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Disponível
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Tabs */}
                <div className="mb-8 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 min-w-max p-1 bg-app-card/50 backdrop-blur-sm rounded-xl border border-app-stroke inline-flex shadow-sm">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-5 py-2.5 text-sm font-bold rounded-lg whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                                    ? 'text-primary bg-primary/10 shadow-sm'
                                    : 'text-app-text-muted hover:text-app-text-main hover:bg-app-card'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-w-4xl pb-24">
                    {/* Personal Info Card */}
                    {activeTab === 'personal' && (
                        <div className="bg-app-card rounded-2xl p-6 sm:p-8 shadow-sm border border-app-stroke animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between pb-5 border-b border-app-stroke/60 mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-app-text-main">Informações Pessoais</h3>
                                    <p className="text-sm text-app-text-muted mt-1">Atualize seus dados básicos e biografia.</p>
                                </div>
                                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                    <User size={24} className="text-primary" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-app-text-main mb-2">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-app-text-main mb-2">CPF</label>
                                        <input
                                            type="text"
                                            value={formData.cpf}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                                            placeholder="000.000.000-00"
                                            className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-app-text-main mb-2">Data de Nascimento</label>
                                        <input
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-app-text-main mb-2">Bio Profissional</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                        placeholder="Descreva sua experiência, currículo e especialidades..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm resize-y"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact Card */}
                    {activeTab === 'contact' && (
                        <div className="bg-app-card rounded-2xl p-6 sm:p-8 shadow-sm border border-app-stroke animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between pb-5 border-b border-app-stroke/60 mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-app-text-main">Contato & Endereço</h3>
                                    <p className="text-sm text-app-text-muted mt-1">Onde clientes e equipe podem te encontrar.</p>
                                </div>
                                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                    <Mail size={24} className="text-primary" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-app-text-main mb-2">Email Oficial</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-app-input/50 border border-app-stroke/50 text-app-text-muted text-sm font-medium cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-app-text-muted mt-2 ml-1">Para alterar o e-mail oficial procure o administrador.</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-app-text-main mb-2">Telefone Comercial</label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                placeholder="(00) 0000-0000"
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-app-text-main mb-2">Celular / WhatsApp</label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
                                            <input
                                                type="tel"
                                                value={formData.mobile}
                                                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                                placeholder="(00) 00000-0000"
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-app-text-main mb-2">Endereço de Atendimento</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Rua, número, bairro, cidade - UF"
                                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Professional Card */}
                    {activeTab === 'professional' && (
                        <div className="bg-app-card rounded-2xl p-6 sm:p-8 shadow-sm border border-app-stroke animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between pb-5 border-b border-app-stroke/60 mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-app-text-main">Dados Profissionais</h3>
                                    <p className="text-sm text-app-text-muted mt-1">Suas credenciais na OAB e áreas de expertise.</p>
                                </div>
                                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                    <Briefcase size={24} className="text-primary" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-app-text-main mb-2">Número da OAB</label>
                                        <input
                                            type="text"
                                            value={formData.oabNumber}
                                            onChange={(e) => setFormData(prev => ({ ...prev, oabNumber: e.target.value }))}
                                            placeholder="Ex: 123456"
                                            className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-app-text-main mb-2">Seccional (UF)</label>
                                        <select
                                            value={formData.oabState}
                                            onChange={(e) => setFormData(prev => ({ ...prev, oabState: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm cursor-pointer"
                                        >
                                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                <option key={uf} value={uf}>{uf}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-app-text-main mb-3">Áreas de Atuação</label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {formData.specialties.map((spec, i) => (
                                            <span key={i} className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3.5 py-1.5 rounded-full text-sm font-bold shadow-sm">
                                                {spec}
                                                <button
                                                    onClick={() => setFormData(prev => ({ ...prev, specialties: prev.specialties.filter((_, idx) => idx !== i) }))}
                                                    className="hover:text-red-500 hover:bg-red-50 p-0.5 rounded-full transition-colors ml-1"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                        <button className="inline-flex items-center gap-1.5 border-2 border-dashed border-app-stroke bg-app-input text-app-text-muted px-4 py-1.5 rounded-full text-sm font-bold hover:border-primary hover:text-primary transition-colors shadow-sm">
                                            + Adicionar Área
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Card */}
                    {activeTab === 'security' && (
                        <div className="bg-app-card rounded-2xl p-6 sm:p-8 shadow-sm border border-app-stroke animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between pb-5 border-b border-app-stroke/60 mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-app-text-main">Segurança da Conta</h3>
                                    <p className="text-sm text-app-text-muted mt-1">Gerencie sua senha de acesso.</p>
                                </div>
                                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <Shield size={24} className="text-red-500" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="max-w-md">
                                    <label className="block text-sm font-bold text-app-text-main mb-2">Senha Atual</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••••••"
                                        className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm font-mono tracking-widest"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-app-text-main mb-2">Nova Senha</label>
                                        <input
                                            type="password"
                                            placeholder="Mínimo 8 caracteres"
                                            className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-app-text-main mb-2">Confirmar Nova Senha</label>
                                        <input
                                            type="password"
                                            placeholder="Repetir nova senha"
                                            className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-stroke focus:border-primary focus:ring-4 focus:ring-primary/10 text-app-text-main text-sm font-medium transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Floating Bottom Bar (Glassmorphism) */}
                <div className={cn(
                    "fixed bottom-0 left-0 right-0 bg-app-card/80 backdrop-blur-md border-t border-app-stroke p-4 sm:p-5 flex items-center justify-between z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-all duration-300",
                    collapsed ? "lg:left-20" : "lg:left-72"
                )}>
                    {message ? (
                        <div className={`text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                            <span className="relative flex h-2.5 w-2.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            </span>
                            {message.text}
                        </div>
                    ) : (
                        <div className="text-sm font-medium text-app-text-muted hidden sm:block">
                            Última atualização de perfil: Hoje
                        </div>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-app-text-muted hover:text-app-text-main hover:bg-app-input transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
