import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Eye, EyeOff, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { BrandLogo } from '../../components/ui/BrandLogo';

const officeImages = [
    '/office1.png',
    '/office2.png',
    '/office3.png'
];

const slogans = [
    {
        badge: 'Gestão Inteligente',
        title: 'Sua advocacia com',
        highlight: 'poder absoluto',
        subtitle: 'Conecte processos, clientes e documentos em uma única plataforma segura e eficiente para seu escritório.'
    },
    {
        badge: 'IA Jurídica',
        title: 'Análise de documentos com',
        highlight: 'precisão cirúrgica',
        subtitle: 'A tecnologia que transforma a gestão do seu escritório, permitindo que você foque no que realmente importa: a justiça.'
    },
    {
        badge: 'Portal do Cliente',
        title: 'Transmita segurança e',
        highlight: 'transparência total',
        subtitle: 'Ofereça um portal exclusivo para seus clientes acompanharem as movimentações em tempo real.'
    }
];

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // 2FA State
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    // Auto-rotate images and quotes every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slogans.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    // Load remembered email
    useEffect(() => {
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', {
                email,
                password,
                twoFactorCode: requires2FA ? twoFactorCode : undefined
            });

            // Check if 2FA is required
            if (res.data.requiresTwoFactor) {
                setRequires2FA(true);
                setLoading(false);
                return;
            }

            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
            } else {
                localStorage.removeItem('remembered_email');
            }

            login(res.data.access_token, res.data.user);
            navigate('/app');
        } catch (err: any) {
            const serverMessage = err.response?.data?.message;
            const finalMessage = Array.isArray(serverMessage) ? serverMessage[0] : serverMessage;
            setError(finalMessage || 'Credenciais inválidas. Tente novamente.');
            // If 2FA code was wrong, don't go back to password step
            if (!requires2FA) {
                setTwoFactorCode('');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setRequires2FA(false);
        setTwoFactorCode('');
        setError('');
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Dark with Image Carousel (Hidden on Mobile) */}
            {/* Left Side - Premium Dark Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] flex-col p-12 relative overflow-hidden">
                {/* Background effect */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                {/* Logo */}
                <div className="relative z-20 mb-auto">
                    <BrandLogo variant="light" />
                </div>

                {/* Content Carousel */}
                <div className="relative z-20 max-w-lg">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <Shield size={14} className="text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                                    {slogans[currentIndex].badge}
                                </span>
                            </div>

                            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                                {slogans[currentIndex].title} <br />
                                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                                    {slogans[currentIndex].highlight}
                                </span>
                            </h2>

                            <p className="text-white/50 text-lg leading-relaxed font-medium">
                                {slogans[currentIndex].subtitle}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Indicators */}
                    <div className="flex gap-2 mt-12">
                        {slogans.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-1 rounded-full transition-all duration-500 ${index === currentIndex
                                    ? 'w-12 bg-primary'
                                    : 'w-4 bg-white/10 hover:bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="relative z-20 mt-auto pt-12 border-t border-white/5">
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                        © 2026 Advus Global Legal Technology
                    </p>
                </div>
            </div>

            {/* Right Side - Form (Supports both themes) */}
            <div className="flex-1 bg-white dark:bg-black flex items-center justify-center p-8 relative">
                {/* Subtle background pattern for dark mode */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.05),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none" />
                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <BrandLogo variant="dark" />
                    </div>

                    <AnimatePresence mode="wait">
                        {requires2FA ? (
                            /* 2FA Step */
                            <motion.div
                                key="2fa"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 text-sm font-medium transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                    Voltar
                                </button>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center">
                                        <Shield className="text-primary dark:text-primary-light" size={24} />
                                    </div>
                                </div>

                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display">Verificação em Duas Etapas</h1>
                                <p className="text-slate-600 dark:text-slate-400 mb-8">
                                    Digite o código de 6 dígitos do seu aplicativo autenticador para garantir a segurança premium da sua conta.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Código de Verificação
                                        </label>
                                        <input
                                            type="text"
                                            value={twoFactorCode}
                                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            required
                                            autoFocus
                                            maxLength={6}
                                            className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white px-4 py-4 text-center text-2xl tracking-[0.5em] rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:border-primary-light outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/30 font-mono"
                                        />
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm text-center"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || twoFactorCode.length !== 6}
                                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Verificar
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            /* Login Step */
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <h1 className="text-3xl font-bold text-black dark:text-white mb-2 font-display tracking-tight">Bem-vindo ao Advus</h1>
                                <p className="text-slate-600 dark:text-slate-400 mb-8">
                                    Acesse sua plataforma de gestão jurídica premium.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            E-mail ou Usuário
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="exemplo@advus.com.br"
                                                required
                                                className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:border-primary-light outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-white/30"
                                            />
                                            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/40" size={20} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Senha
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••••"
                                                required
                                                className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:border-primary-light outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-white/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={rememberMe}
                                                    onChange={(e) => setRememberMe(e.target.checked)}
                                                    className="peer appearance-none w-5 h-5 border border-slate-300 dark:border-white/10 rounded-md bg-white dark:bg-white/5 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                                                />
                                                <svg
                                                    className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </div>
                                            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                                Lembrar-me
                                            </span>
                                        </label>
                                        <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-light font-medium transition-colors">
                                            Esqueci minha senha
                                        </Link>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm text-center"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Entrar
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <p className="text-center text-slate-600 dark:text-slate-400 text-sm mt-8">
                                    Ainda não tem uma conta?{' '}
                                    <Link to="/register" className="text-primary font-medium hover:text-primary-light transition-colors">
                                        Cadastre-se agora
                                    </Link>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-center text-gray-500 dark:text-gray-600 text-xs mt-12">
                        © 2026 Advus. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}

