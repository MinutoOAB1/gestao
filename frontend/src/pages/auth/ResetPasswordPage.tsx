import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Scale, Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

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
        // Simulate token validation 
        const validateToken = async () => {
            // In a real implementation, you might call an endpoint to validate the token
            // For now, just check if token exists
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

            // Redirect to login after 3 seconds
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <X className="text-red-400" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Link Inválido</h1>
                    <p className="text-slate-400 mb-6">
                        Este link de redefinição de senha é inválido ou expirou. Solicite um novo link.
                    </p>
                    <Link
                        to="/forgot-password"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
                    >
                        Solicitar Novo Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo e Título */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                        <Scale size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Nova Senha</h1>
                    <p className="text-slate-400 text-sm">
                        Crie uma nova senha segura para sua conta
                    </p>
                </div>

                {/* Card do Formulário */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="text-green-400" size={32} />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Senha Alterada!</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Sua senha foi redefinida com sucesso. Redirecionando para login...
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Ir para login
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Nova Senha */}
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm font-medium">Nova Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-slate-900/50 border border-slate-600/50 text-white pl-12 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Requisitos de Senha */}
                            <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                                {requirements.map((req, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-green-500' : 'bg-slate-600'
                                            }`}>
                                            {req.met && <Check size={10} className="text-white" />}
                                        </div>
                                        <span className={req.met ? 'text-green-400' : 'text-slate-400'}>
                                            {req.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Confirmar Senha */}
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm font-medium">Confirmar Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-slate-900/50 border border-slate-600/50 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                {confirmPassword && (
                                    <div className={`flex items-center gap-2 text-sm ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                                        {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                                        {passwordsMatch ? 'Senhas coincidem' : 'Senhas não coincidem'}
                                    </div>
                                )}
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !allRequirementsMet || !passwordsMatch}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                    </span>
                                ) : (
                                    'Redefinir Senha'
                                )}
                            </button>

                            <Link
                                to="/login"
                                className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors pt-2"
                            >
                                <ArrowLeft size={16} />
                                Voltar para login
                            </Link>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-8">
                    © 2025 Sistema Jurídico. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
