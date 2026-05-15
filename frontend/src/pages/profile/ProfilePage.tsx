import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Camera, Mail, Phone, MapPin, Shield, Save, X, BadgeCheck, Briefcase, ArrowLeft, Palette, CheckCircle2, AlertCircle, Sparkles, UserCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../../utils/haptics';

const PremiumInput = memo(({ label, icon: Icon, ...props }: any) => (
    <div className="space-y-2 group">
        <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1 group-focus-within:text-primary transition-colors">{label}</label>
        <div className="relative">
            {Icon && <Icon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-primary transition-colors" />}
            <input
                {...props}
                className={clsx(
                    "w-full bg-app-bg border border-app-stroke rounded-[1.5rem] py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner focus:ring-4 focus:ring-primary/10",
                    Icon ? "pl-14 pr-5" : "px-6"
                )}
            />
        </div>
    </div>
));

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
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
        haptics.light();
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
        haptics.medium();
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
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar. Tente novamente.' });
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
        { id: 'personal', label: 'Dados Pessoais', icon: UserCircle },
        { id: 'professional', label: 'Profissional', icon: Briefcase },
        { id: 'contact', label: 'Contato', icon: Mail },
        { id: 'security', label: 'Segurança', icon: Shield },
    ];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full" 
                    />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text-muted animate-pulse">Sincronizando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1200px] mx-auto space-y-10 pb-20"
        >
            <div className="bg-app-card rounded-[3rem] border border-app-stroke shadow-2xl overflow-hidden relative group">
                {/* Visual Banner */}
                <div 
                    className="h-64 relative overflow-hidden transition-all duration-700"
                    style={{ backgroundColor: bannerColor }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute -top-20 -right-20 w-96 h-96 bg-white rounded-full blur-[100px]" 
                    />
                    
                    <div className="absolute top-8 right-8 z-20">
                        <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10 transition-all flex items-center gap-3 active:scale-95 group/color">
                            <Palette size={18} className="group-hover/color:rotate-12 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Personalizar</span>
                            <input 
                                type="color" 
                                value={bannerColor}
                                onChange={(e) => { haptics.light(); setBannerColor(e.target.value); }}
                                className="opacity-0 w-0 h-0 absolute"
                            />
                        </label>
                    </div>

                    <div className="absolute bottom-8 left-10 flex items-center gap-8 z-10 w-full">
                        <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
                            <Avatar
                                src={formData.avatar || undefined}
                                name={formData.name}
                                size="xl"
                                className="w-32 h-32 sm:w-40 sm:h-40 border-8 border-white/10 shadow-2xl relative z-10 rounded-[2.5rem]"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 m-1 border-2 border-white/20">
                                <Camera size={32} className="text-white drop-shadow-lg" />
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>

                        <div className="space-y-3 pb-2">
                            <motion.h2 
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none"
                            >
                                {formData.name || 'Seu Nome'}
                            </motion.h2>
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles size={12} className="text-yellow-400" />
                                    {getRoleLabel(user?.role || 'LAWYER')}
                                </span>
                                {formData.oabNumber && (
                                    <span className="px-4 py-1.5 bg-black/20 backdrop-blur-md border border-white/5 rounded-full text-[10px] font-black text-white/80 uppercase tracking-widest">
                                        OAB {formData.oabNumber}/{formData.oabState}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-12 space-y-12">
                    {/* Modern Tabs */}
                    <div className="flex gap-2 p-1.5 bg-app-bg border border-app-stroke rounded-3xl w-fit">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => { haptics.light(); setActiveTab(tab.id); }}
                                    className={clsx(
                                        "flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeTab === tab.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                                            : "text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/30"
                                    )}
                                >
                                    <Icon size={16} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-10"
                                >
                                    {activeTab === 'personal' && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                <PremiumInput 
                                                    label="Nome Completo"
                                                    value={formData.name}
                                                    onChange={(e: any) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                                <PremiumInput 
                                                    label="CPF"
                                                    value={formData.cpf}
                                                    placeholder="000.000.000-00"
                                                    onChange={(e: any) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                                                />
                                                <PremiumInput 
                                                    label="Data de Nascimento"
                                                    type="date"
                                                    value={formData.birthDate}
                                                    onChange={(e: any) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1 group-focus-within:text-primary transition-colors">Bio Profissional</label>
                                                <textarea
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                                    placeholder="Sua trajetória, expertises e visão..."
                                                    rows={6}
                                                    className="w-full bg-app-bg border border-app-stroke rounded-[2rem] px-8 py-6 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner resize-none focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'contact' && (
                                        <div className="space-y-8">
                                            <PremiumInput 
                                                label="Email Oficial"
                                                icon={Mail}
                                                value={formData.email}
                                                disabled
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                <PremiumInput 
                                                    label="Telefone Comercial"
                                                    icon={Phone}
                                                    value={formData.phone}
                                                    onChange={(e: any) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                />
                                                <PremiumInput 
                                                    label="WhatsApp"
                                                    icon={Phone}
                                                    value={formData.mobile}
                                                    onChange={(e: any) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                                                />
                                            </div>
                                            <PremiumInput 
                                                label="Endereço de Atendimento"
                                                icon={MapPin}
                                                value={formData.address}
                                                onChange={(e: any) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            />
                                        </div>
                                    )}

                                    {activeTab === 'professional' && (
                                        <div className="space-y-10">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                <PremiumInput 
                                                    label="Número da OAB"
                                                    icon={BadgeCheck}
                                                    value={formData.oabNumber}
                                                    onChange={(e: any) => setFormData(prev => ({ ...prev, oabNumber: e.target.value }))}
                                                />
                                                <div className="space-y-2 group">
                                                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1 group-focus-within:text-primary transition-colors">Seccional (UF)</label>
                                                    <select
                                                        value={formData.oabState}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, oabState: e.target.value }))}
                                                        className="w-full bg-app-bg border border-app-stroke rounded-[1.5rem] px-6 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner appearance-none"
                                                    >
                                                        {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                            <option key={uf} value={uf}>{uf}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Especialidades</label>
                                                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">+ Adicionar Nova</button>
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    {formData.specialties.map((spec, i) => (
                                                        <motion.span 
                                                            key={i} 
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className="flex items-center gap-3 bg-app-bg border border-app-stroke text-app-text-main px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-primary transition-all group/spec"
                                                        >
                                                            {spec}
                                                            <button
                                                                onClick={() => { haptics.light(); setFormData(prev => ({ ...prev, specialties: prev.specialties.filter((_, idx) => idx !== i) })); }}
                                                                className="text-app-text-muted hover:text-rose-500 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </motion.span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'security' && (
                                        <div className="space-y-8">
                                            <PremiumInput 
                                                label="Senha Atual"
                                                type="password"
                                                placeholder="••••••••••••"
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                <PremiumInput 
                                                    label="Nova Senha"
                                                    type="password"
                                                    placeholder="Nova senha poderosa"
                                                />
                                                <PremiumInput 
                                                    label="Confirmar Senha"
                                                    type="password"
                                                    placeholder="Repita para confirmar"
                                                />
                                            </div>
                                            <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-8 flex gap-6 items-start">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                                    <Shield size={24} />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-black text-app-text-main uppercase tracking-tight">Segurança Reforçada</h4>
                                                    <p className="text-sm text-app-text-muted font-medium leading-relaxed">
                                                        Sua senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="space-y-10">
                            <div className="bg-app-bg border border-app-stroke rounded-[2.5rem] p-8 space-y-8">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-app-text-main uppercase tracking-widest">Resumo do Perfil</h3>
                                    <p className="text-xs text-app-text-muted font-medium">Status da sua presença digital</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-app-card rounded-2xl border border-app-stroke/50">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                            <span className="text-xs font-bold text-app-text-main">Email Verificado</span>
                                        </div>
                                        <BadgeCheck size={16} className="text-primary" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-app-card rounded-2xl border border-app-stroke/50">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                            <span className="text-xs font-bold text-app-text-main">Status da Conta</span>
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Ativa</span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-app-stroke/50">
                                    <div className="flex items-start gap-4 text-app-text-muted">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-medium leading-relaxed italic">
                                            Alguns dados como cargo e email oficial requerem validação do administrador para serem alterados.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] py-5 rounded-[1.5rem] hover:opacity-90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                    ) : <Save size={18} />}
                                    Salvar Alterações
                                </button>
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-full bg-app-bg border border-app-stroke text-app-text-muted font-black uppercase text-[10px] tracking-[0.2em] py-5 rounded-[1.5rem] hover:text-app-text-main hover:bg-app-stroke/30 transition-all"
                                >
                                    Descartar
                                </button>
                                <AnimatePresence>
                                    {message && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={clsx(
                                                "flex items-center gap-3 p-4 rounded-2xl border",
                                                message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                            )}
                                        >
                                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                            <span className="text-xs font-bold">{message.text}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
