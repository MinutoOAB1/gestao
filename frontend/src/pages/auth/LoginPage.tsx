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

const quotes = [
    "A tecnologia que transforma a gestão do seu escritório, permitindo que você foque no que realmente importa: a justiça.",
    "Simplifique a gestão do seu escritório com ferramentas inteligentes e automatizadas para advogados modernos.",
    "Conecte processos, clientes e documentos em uma única plataforma segura e eficiente para seu escritório."
];

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
            setCurrentIndex((prev) => (prev + 1) % officeImages.length);
        }, 5000);
        return () => clearInterval(interval);
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

            login(res.data.access_token, res.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Credenciais inválidas. Tente novamente.');
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
            <div className="hidden lg:flex lg:w-1/2 bg-[#0c1220] flex-col p-8 relative">
                {/* Logo */}
                <div className="absolute top-8 left-8 z-20">
                    <BrandLogo variant="light" />
                </div>

                {/* Background Image Carousel */}
                <div className="absolute inset-0">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentIndex}
                            src={officeImages[currentIndex]}
                            alt="Escritório de advocacia"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.35 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1220] via-[#0c1220]/80 to-[#0c1220]/40" />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Quote Card with better visibility */}
                <div className="z-10 relative">
                    <div className="bg-[#0c1220]/90 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20 shadow-xl shadow-blue-500/5">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="text-white text-lg leading-relaxed font-medium"
                            >
                                "{quotes[currentIndex]}"
                            </motion.p>
                        </AnimatePresence>

                        {/* Indicators */}
                        <div className="flex gap-2 mt-6">
                            {officeImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                        ? 'w-8 bg-blue-500'
                                        : 'w-2 bg-slate-600 hover:bg-slate-500'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form (Supports both themes) */}
            <div className="flex-1 bg-slate-50 dark:bg-[#0c1220] flex items-center justify-center p-8 relative">
                {/* Subtle background pattern for dark mode */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />
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
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <Shield className="text-blue-600 dark:text-blue-400" size={24} />
                                    </div>
                                </div>

                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verificação em Duas Etapas</h1>
                                <p className="text-slate-600 dark:text-slate-400 mb-8">
                                    Digite o código de 6 dígitos do seu aplicativo autenticador.
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
                                            className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white px-4 py-4 text-center text-2xl tracking-[0.5em] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/30 font-mono"
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
                                        className="w-full bg-gradient-to-r from-slate-700 to-blue-800 hover:from-slate-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/20 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Bem-vindo de volta</h1>
                                <p className="text-slate-600 dark:text-slate-400 mb-8">
                                    Acesse sua conta para gerenciar seus processos.
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
                                                placeholder="exemplo@advocacia.com.br"
                                                required
                                                className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-white/30"
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
                                                className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-white/30"
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

                                    <div className="flex justify-end">
                                        <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-400 font-medium">
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
                                        className="w-full bg-gradient-to-r from-slate-700 to-blue-800 hover:from-slate-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/20 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                    <Link to="/register" className="text-blue-500 font-medium hover:text-blue-400">
                                        Cadastre-se agora
                                    </Link>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-center text-slate-500 dark:text-slate-600 text-xs mt-12">
                        © 2026 Blue Adv. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}

