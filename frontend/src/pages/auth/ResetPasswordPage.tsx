import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { BrandLogo } from '../../components/ui/BrandLogo';

export default function ResetPasswordPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [validatingToken, setValidatingToken] = useState(true);
    const [tokenValid, setTokenValid] = useState(true);

    // Password requirements
    const requirements = [
        { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
        { label: 'Uma letra maiúscula', met: /[A-Z]/.test(password) },
        { label: 'Uma letra minúscula', met: /[a-z]/.test(password) },
        { label: 'Um número', met: /\d/.test(password) },
    ];

    const allRequirementsMet = requirements.every(r => r.met);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    useEffect(() => {
        const validateToken = async () => {
            if (!token || token.length < 10) {
                setTokenValid(false);
            }
            setValidatingToken(false);
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!allRequirementsMet) {
            setError('A senha não atende aos requisitos mínimos.');
            return;
        }

        if (!passwordsMatch) {
            setError('As senhas não coincidem.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: password,
            });
            setSuccess(true);

            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao redefinir senha. O link pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    if (validatingToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary-dark">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-black p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <X className="text-red-400" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4 font-display">Acesso Expirado</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Este link de redefinição de segurança premium é inválido ou já foi utilizado.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary-dark rounded-xl font-bold hover:bg-slate-200 transition-all shadow-xl"
                    >
                        Solicitar Novo Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-black p-4 relative overflow-hidden">
             {/* Background decorative element */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo e Título */}
                <div className="flex flex-col items-center text-center mb-8">
                    <BrandLogo variant="light" size="lg" className="mb-8" />
                    <h1 className="text-3xl font-bold text-white mb-2 font-display tracking-tight">Nova Senha</h1>
                    <p className="text-slate-400 text-sm">
                        Crie uma nova credencial de acesso para sua conta premium.
                    </p>
                </div>

                {/* Card do Formulário */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent/20">
                                <Check className="text-accent" size={32} />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2 font-display">Senha Alterada!</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                Sua segurança foi atualizada com sucesso. Redirecionando para o Advus...
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-accent hover:text-white font-bold transition-all"
                            >
                                <ArrowLeft size={16} />
                                Ir para login
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nova Senha */}
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm font-medium ml-1">Nova Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-12 py-3.5 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Requisitos de Senha */}
                            <div className="bg-white/5 rounded-xl p-4 space-y-2.5 border border-white/5">
                                {requirements.map((req, i) => (
                                    <div key={i} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${req.met ? 'bg-accent' : 'bg-white/10'
                                            }`}>
                                            {req.met && <Check size={10} className="text-primary-dark" />}
                                        </div>
                                        <span className={req.met ? 'text-accent' : 'text-slate-500'}>
                                            {req.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Confirmar Senha */}
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm font-medium ml-1">Confirmar Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                                    />
                                </div>
                                {confirmPassword && (
                                    <div className={`flex items-center gap-2 text-xs font-medium px-1 ${passwordsMatch ? 'text-accent' : 'text-red-400'}`}>
                                        {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                                        {passwordsMatch ? 'As senhas coincidem' : 'As senhas não coincidem'}
                                    </div>
                                )}
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !allRequirementsMet || !passwordsMatch}
                                className="w-full bg-accent hover:bg-white text-primary-dark font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-dark/30 border-t-primary-dark rounded-full animate-spin" />
                                        Salvando...
                                    </span>
                                ) : (
                                    'Atualizar Senha'
                                )}
                            </button>

                            <Link
                                to="/login"
                                className="flex items-center justify-center gap-2 text-slate-400 hover:text-white font-medium transition-colors pt-2"
                            >
                                <ArrowLeft size={16} />
                                Voltar para login
                            </Link>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-12 font-medium">
                    © 2026 Advus Premium. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
