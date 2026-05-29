import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { BrandLogo } from '../../components/ui/BrandLogo';

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-black p-4 relative overflow-hidden">
            {/* Background decorative element */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="w-full max-w-md relative z-10">
                {/* Logo e Título */}
                <div className="flex flex-col items-center text-center mb-8">
                    <BrandLogo variant="light" size="lg" className="mb-8" />
                    <h1 className="text-3xl font-bold text-white mb-2 font-display tracking-tight">Recuperar Senha</h1>
                    <p className="text-slate-400 text-sm">
                        Digite seu e-mail para receber as instruções de acesso premium.
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
                            <h3 className="text-white font-bold text-xl mb-2 font-display">E-mail enviado!</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                Se uma conta premium existir com este e-mail, você receberá as instruções em instantes.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-accent hover:text-white font-bold transition-all"
                            >
                                <ArrowLeft size={16} />
                                Voltar para o Advus
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-slate-300 text-sm font-medium ml-1">E-mail Profissional</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@advus.app"
                                        required
                                        className="w-full bg-white/5 border border-white/10 text-white pl-12 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all placeholder:text-white/20"
                                    />
                                </div>
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
                                disabled={loading}
                                className="w-full bg-accent hover:bg-white text-primary-dark font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-accent/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-primary-dark/30 border-t-primary-dark rounded-full animate-spin" />
                                        Enviando...
                                    </span>
                                ) : (
                                    'Solicitar Redefinição'
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
