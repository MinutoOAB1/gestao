import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subscriptionsService } from '../../services/subscriptions';
import { Check, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function BillingPage() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const { url } = await subscriptionsService.createCheckoutSession();
            window.location.href = url;
        } catch (error) {
            console.error('Error starting checkout:', error);
            addToast('Erro ao iniciar checkout. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const isSubscribed = user?.subscriptionStatus === 'active';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-app-text-main">Assinatura e Faturamento</h1>
                <p className="text-app-text-muted">Gerencie o plano do seu escritório e detalhes de pagamento.</p>
            </div>

            {/* Current Plan Card */}
            <div className="bg-app-card rounded-2xl border border-app-stroke p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-app-text-muted uppercase tracking-wider">Plano Atual</span>
                            {isSubscribed && (
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                    ATIVO
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl font-black text-app-text-main">
                            {isSubscribed ? 'Adv Plus' : 'Plano Grátis'}
                        </h2>
                        <p className="text-app-text-muted">
                            {isSubscribed 
                                ? 'Seu escritório tem acesso total a todas as funcionalidades.' 
                                : 'Você está usando a versão limitada. Faça o upgrade para liberar todo o potencial.'}
                        </p>
                    </div>

                    {!isSubscribed && (
                        <button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Zap size={18} />
                                    Upgrade para Adv Plus
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Features Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-app-card rounded-2xl border border-app-stroke p-6">
                    <h3 className="text-lg font-bold text-app-text-main mb-4 flex items-center gap-2">
                        <ShieldCheck className="text-blue-500" size={20} />
                        O que está incluso no Adv Plus
                    </h3>
                    <ul className="space-y-3">
                        {[
                            'Usuários ilimitados',
                            'Processos e clientes ilimitados',
                            'Financeiro completo',
                            'Análise de contratos com IA',
                            'Agenda e prazos inteligentes',
                            '10 GB de armazenamento',
                            'Suporte prioritário 24/7',
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-app-text-muted">
                                <Check size={16} className="text-emerald-500 flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-app-card rounded-2xl border border-app-stroke p-6 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center">
                        <CreditCard className="text-blue-600" size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-app-text-main">Preço Único e Justo</h3>
                        <p className="text-3xl font-black text-app-text-main mt-2">R$ 47<span className="text-sm font-normal text-app-text-muted">/mês</span></p>
                    </div>
                    <p className="text-xs text-app-text-muted">
                        Sem fidelidade. Cancele a qualquer momento diretamente pelo portal do Stripe.
                    </p>
                </div>
            </div>
        </div>
    );
}
