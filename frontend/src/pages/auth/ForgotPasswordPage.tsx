import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Scale, ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao processar solicitação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo e Título */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                        <Scale size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Recuperar Senha</h1>
                    <p className="text-slate-400 text-sm">
                        Digite seu e-mail para receber as instruções
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
                            <h3 className="text-white font-bold text-lg mb-2">E-mail enviado!</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Se uma conta existir com este e-mail, você receberá as instruções de recuperação.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Voltar para login
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm font-medium">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        required
                                        className="w-full bg-slate-900/50 border border-slate-600/50 text-white pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500"
                                    />
                                </div>
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
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Enviando...
                                    </span>
                                ) : (
                                    'Enviar Link de Recuperação'
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
