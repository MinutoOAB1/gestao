import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Camera, Mail, Phone, MapPin, Shield, Save, X, BadgeCheck, Briefcase, ArrowLeft, Palette } from 'lucide-react';
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
    const [bannerColor, setBannerColor] = useState('#0070FF');

    useEffect(() => {
        if (user?.id) {
            const savedColor = localStorage.getItem(`profile_banner_color_${user.id}`);
            if (savedColor) setBannerColor(savedColor);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            localStorage.setItem(`profile_banner_color_${user.id}`, bannerColor);
        }
    }, [bannerColor, user?.id]);

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
                {/* Profile Header Banner */}
                <div 
                    className="rounded-2xl shadow-sm mb-8 overflow-hidden relative"
                    style={{ backgroundColor: bannerColor, minHeight: '160px' }}
                >
                    <div className="absolute top-4 right-4 z-20">
                        <label className="cursor-pointer bg-black/20 hover:bg-black/40 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2">
                            <Palette size={16} />
                            <span className="text-xs font-medium">Cor</span>
                            <input 
                                type="color" 
                                value={bannerColor}
                                onChange={(e) => setBannerColor(e.target.value)}
                                className="opacity-0 w-0 h-0 absolute"
                            />
                        </label>
                    </div>
                    
                    <div className="absolute inset-0 flex items-center px-6 sm:px-10">
                        <div className="flex items-center gap-6 z-10 w-full">
                            <div className="relative group cursor-pointer flex-shrink-0" onClick={handleAvatarClick}>
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 shadow-xl overflow-hidden bg-slate-200 dark:bg-slate-700 relative z-10">
                                    {formData.avatar ? (
                                        <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400 bg-slate-100 dark:bg-slate-800">
                                            {formData.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 m-1">
                                    <Camera size={24} className="text-white drop-shadow-md" />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex flex-col text-left text-white drop-shadow-md flex-1">
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{formData.name || 'Seu Nome'}</h2>
                                <p className="font-medium mt-0.5 text-white/90 text-sm sm:text-base">{getRoleLabel(user?.role || 'LAWYER')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Minimalist Tabs */}
                <div className="mb-8 border-b border-app-stroke/50">
                    <div className="flex gap-6 overflow-x-auto scrollbar-hide px-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-1 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 relative -bottom-px",
                                    activeTab === tab.id
                                        ? "text-primary border-primary"
                                        : "text-app-text-muted border-transparent hover:text-app-text-main hover:border-app-stroke"
                                )}
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
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-app-text-main">Informações Pessoais</h3>
                                <p className="text-sm text-app-text-muted mt-1">Atualize seus dados básicos e biografia.</p>
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
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-app-text-main">Contato & Endereço</h3>
                                <p className="text-sm text-app-text-muted mt-1">Onde clientes e equipe podem te encontrar.</p>
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
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-app-text-main">Dados Profissionais</h3>
                                <p className="text-sm text-app-text-muted mt-1">Suas credenciais na OAB e áreas de expertise.</p>
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
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-app-text-main">Segurança da Conta</h3>
                                <p className="text-sm text-app-text-muted mt-1">Gerencie sua senha de acesso.</p>
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
                    {/* Action Buttons */}
                    <div className="mt-8 pt-6 border-t border-app-stroke/50 flex flex-col sm:flex-row items-center gap-4 sm:justify-start">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : null}
                            Salvar Alterações
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-app-text-muted hover:text-app-text-main hover:bg-app-input transition-colors"
                        >
                            Cancelar
                        </button>
                        {message && (
                            <div className={`ml-auto text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {message.text}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
