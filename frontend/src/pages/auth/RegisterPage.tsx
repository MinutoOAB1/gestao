import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Eye, EyeOff, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
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

export default function RegisterPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate images and quotes every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % officeImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!agreeTerms) {
            setError('Você precisa aceitar os termos de uso.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (formData.password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/register', {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                password: formData.password,
                companyName: `Escritório de ${formData.firstName}`
            });
            login(res.data.access_token, res.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
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

            {/* Right Side - Form (Always Light Theme for consistency) */}
            <div className="flex-1 bg-slate-50 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-lg">
                    {/* Mobile Logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <BrandLogo variant="dark" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Crie sua conta</h1>
                        <p className="text-slate-600 mb-8">
                            Junte-se a milhares de advogados e transforme a gestão do seu escritório.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nome
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Seu nome"
                                        required
                                        className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Sobrenome
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Seu sobrenome"
                                        required
                                        className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    E-mail profissional
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="exemplo@advocacia.com.br"
                                        required
                                        className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500"
                                    />
                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••••"
                                            required
                                            className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Confirmar Senha
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="••••••••••"
                                            required
                                            className="w-full bg-white border border-slate-300 text-slate-900 px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div 
                                className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500/50 transition-all group"
                                onClick={() => setAgreeTerms(!agreeTerms)}
                            >
                                <div className="mt-0.5">
                                    {agreeTerms ? (
                                        <CheckCircle2 className="text-blue-600" size={20} />
                                    ) : (
                                        <Circle className="text-slate-300 group-hover:text-slate-400" size={20} />
                                    )}
                                </div>
                                <label className="text-sm text-slate-600 cursor-pointer select-none">
                                    Concordo com os{' '}
                                    <Link to="/terms" className="text-blue-600 font-medium hover:text-blue-500">
                                        Termos de Uso
                                    </Link>
                                    {' '}e a{' '}
                                    <Link to="/privacy" className="text-blue-600 font-medium hover:text-blue-500">
                                        Política de Privacidade
                                    </Link>.
                                </label>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-slate-700 to-blue-800 hover:from-slate-600 hover:to-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Cadastrar
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-slate-600 text-sm mt-8">
                            Já possui uma conta?{' '}
                            <Link to="/login" className="text-blue-500 font-medium hover:text-blue-400">
                                Entrar agora
                            </Link>
                        </p>
                    </motion.div>

                    <p className="text-center text-slate-500 text-xs mt-12">
                        © 2024 Blue Adv. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
