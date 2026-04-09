import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';
import {
    Scale, FileText, Users, DollarSign, Calendar, Shield,
    Check, ArrowRight, Menu, X, Sparkles,
    BarChart3, Zap, Lock, Globe
} from 'lucide-react';

// Navbar Component
function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-slate-800/30">
                            <Scale className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Blue Adv
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                            Recursos
                        </a>
                        <a href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                            Preços
                        </a>
                        <a href="#testimonials" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                            Depoimentos
                        </a>
                        <a href="#contact" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                            Contato
                        </a>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:text-blue-600 transition-colors"
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-5 py-2.5 bg-gradient-to-r from-slate-700 to-blue-800 hover:from-slate-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg shadow-slate-800/25 transition-all hover:shadow-xl hover:shadow-slate-800/30"
                        >
                            Começar Grátis
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-slate-600 dark:text-slate-300"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col gap-3">
                            <a href="#features" className="py-2 text-slate-600 dark:text-slate-300 font-medium">Recursos</a>
                            <a href="#pricing" className="py-2 text-slate-600 dark:text-slate-300 font-medium">Preços</a>
                            <a href="#testimonials" className="py-2 text-slate-600 dark:text-slate-300 font-medium">Depoimentos</a>
                            <a href="#contact" className="py-2 text-slate-600 dark:text-slate-300 font-medium">Contato</a>
                            <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button onClick={() => navigate('/login')} className="py-2.5 text-center text-slate-700 dark:text-slate-300 font-medium border border-slate-300 dark:border-slate-700 rounded-lg">
                                    Entrar
                                </button>
                                <button onClick={() => navigate('/register')} className="py-2.5 text-center bg-blue-600 text-white font-medium rounded-lg">
                                    Começar Grátis
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

// Hero Section
function HeroSection() {
    const navigate = useNavigate();

    return (
        <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

            {/* Decorative Blobs */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
                        <Sparkles size={16} />
                        O software #1 para escritórios de advocacia
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                        Gerencie seu escritório com{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                            inteligência e eficiência
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                        Processos, clientes, finanças e documentos em um só lugar.
                        Simplifique sua rotina jurídica e aumente sua produtividade em até 40%.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-slate-700 to-blue-800 hover:from-slate-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-xl shadow-slate-800/25 transition-all hover:shadow-2xl hover:shadow-slate-800/30 group"
                        >
                            Começar Teste Grátis
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                            Ver Demonstração
                        </button>
                    </div>

                    {/* Social Proof */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <Check size={18} className="text-green-500" />
                            14 dias grátis
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={18} className="text-green-500" />
                            Sem cartão de crédito
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={18} className="text-green-500" />
                            Cancele quando quiser
                        </div>
                    </div>
                </div>

                {/* Hero Video/Dashboard Preview */}
                <div className="mt-16 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" style={{ top: '80%' }} />
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-200 dark:border-slate-700">
                        {/* Local Video Player */}
                        <video
                            className="w-full aspect-video object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                            controls
                            poster=""
                        >
                            <source src="/landingpage.mp4" type="video/mp4" />
                            Seu navegador não suporta vídeos HTML5.
                        </video>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Features Section
function FeaturesSection() {
    const features = [
        {
            icon: FileText,
            title: 'Gestão de Processos',
            description: 'Acompanhe todos os seus processos com Kanban intuitivo, prazos e alertas automáticos.',
            color: 'blue'
        },
        {
            icon: Users,
            title: 'CRM Jurídico',
            description: 'Gerencie clientes, histórico de atendimentos e documentos em um único lugar.',
            color: 'purple'
        },
        {
            icon: DollarSign,
            title: 'Controle Financeiro',
            description: 'Honorários, despesas, repasses e relatórios financeiros completos.',
            color: 'green'
        },
        {
            icon: Calendar,
            title: 'Agenda Inteligente',
            description: 'Audiências, reuniões e prazos sincronizados com alertas por email e push.',
            color: 'orange'
        },
        {
            icon: Shield,
            title: 'Análise de Contratos com IA',
            description: 'Inteligência artificial para analisar riscos e cláusulas em contratos.',
            color: 'red'
        },
        {
            icon: BarChart3,
            title: 'Relatórios e Métricas',
            description: 'Dashboards com métricas de performance e produtividade do escritório.',
            color: 'teal'
        }
    ];

    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    };

    return (
        <section id="features" className="py-20 md:py-28 bg-white dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium mb-4">
                        <Zap size={16} />
                        Recursos Poderosos
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Tudo que seu escritório precisa
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Uma plataforma completa para modernizar sua prática jurídica e impressionar seus clientes.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all hover:shadow-xl"
                        >
                            <div className={`w-14 h-14 rounded-xl ${colorClasses[feature.color]} flex items-center justify-center mb-5`}>
                                <feature.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Stats Section
function StatsSection() {
    const stats = [
        { value: '500+', label: 'Escritórios Ativos' },
        { value: '50k+', label: 'Processos Gerenciados' },
        { value: '99.9%', label: 'Uptime Garantido' },
        { value: '24/7', label: 'Suporte Dedicado' },
    ];

    return (
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-3xl md:text-4xl font-black text-white mb-2">
                                {stat.value}
                            </div>
                            <div className="text-blue-200 font-medium">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Pricing Section
function PricingSection() {
    const navigate = useNavigate();
    const plans = [
        {
            name: 'Starter',
            price: 'R$ 47',
            period: '/mês',
            description: 'Ideal para advogados autônomos',
            features: [
                'Até 50 processos',
                'Até 100 clientes',
                'Agenda e prazos',
                'Relatórios básicos',
                'Suporte por email',
            ],
            cta: 'Começar Grátis',
            popular: false
        },
        {
            name: 'Profissional',
            price: 'R$ 99',
            period: '/mês',
            description: 'Para escritórios em crescimento',
            features: [
                'Processos ilimitados',
                'Clientes ilimitados',
                'Módulo financeiro completo',
                'Análise de contratos com IA',
                'Integrações avançadas',
                'Suporte prioritário',
            ],
            cta: 'Começar Grátis',
            popular: true
        },
        {
            name: 'Enterprise',
            price: 'Sob consulta',
            period: '',
            description: 'Para grandes escritórios',
            features: [
                'Tudo do Profissional',
                'Multi-escritório',
                'API personalizada',
                'SLA garantido',
                'Gerente de conta dedicado',
                'Treinamento presencial',
            ],
            cta: 'Falar com Vendas',
            popular: false
        }
    ];

    return (
        <section id="pricing" className="py-20 md:py-28 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Planos para todos os tamanhos
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Escolha o plano ideal para o seu escritório. Todos incluem 14 dias de teste grátis.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`relative p-8 rounded-2xl border-2 transition-all ${plan.popular
                                ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-xl shadow-blue-500/10 scale-105'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                                    Mais Popular
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                                    {plan.description}
                                </p>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">
                                        {plan.price}
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-400">
                                        {plan.period}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, fidx) => (
                                    <li key={fidx} className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <Check size={18} className="text-green-500 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => navigate('/register')}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.popular
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Testimonials Section
function TestimonialsSection() {
    const testimonials = [
        {
            name: 'Dr. Carlos Silva',
            role: 'Advogado Tributarista',
            company: 'Silva & Associados',
            content: 'O Blue Adv revolucionou nosso escritório. Reduzimos em 50% o tempo gasto com tarefas administrativas.',
            avatar: 'CS'
        },
        {
            name: 'Dra. Marina Costa',
            role: 'Advogada Trabalhista',
            company: 'Costa Advocacia',
            content: 'A análise de contratos com IA é incrível! Economizo horas em cada contrato que preciso revisar.',
            avatar: 'MC'
        },
        {
            name: 'Dr. Roberto Mendes',
            role: 'Sócio Fundador',
            company: 'Mendes & Partners',
            content: 'O módulo financeiro é completo e nos deu total controle sobre honorários e despesas do escritório.',
            avatar: 'RM'
        }
    ];

    return (
        <section id="testimonials" className="py-20 md:py-28 bg-white dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        O que nossos clientes dizem
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Veja como o Blue Adv está transformando escritórios em todo o Brasil.
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, idx) => (
                        <div
                            key={idx}
                            className="p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">
                                        {testimonial.name}
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                "{testimonial.content}"
                            </p>
                            <p className="mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {testimonial.company}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// CTA Section
function CTASection() {
    const navigate = useNavigate();

    return (
        <section className="py-20 md:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                    Pronto para transformar seu escritório?
                </h2>
                <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                    Junte-se a mais de 500 escritórios que já estão usando o Blue Adv para crescer com eficiência.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate('/register')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all group"
                    >
                        Começar Teste Grátis
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="w-full sm:w-auto px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
                        Agendar Demonstração
                    </button>
                </div>
            </div>
        </section>
    );
}

// Footer
function Footer() {
    return (
        <footer id="contact" className="py-16 bg-slate-900 dark:bg-slate-950 text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* Company */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-3 mb-4">
                            <BrandLogo variant="light" />
                        </div>
                        <p className="text-sm leading-relaxed mb-4">
                            A plataforma completa para gestão de escritórios de advocacia.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Globe size={18} />
                            </a>
                            <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                                <Lock size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Produto</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#features" className="hover:text-white transition-colors">Recursos</a></li>
                            <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Integrações</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Empresa</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Termos</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                    <p>© 2024 Blue Adv. Todos os direitos reservados.</p>
                    <p>Feito com ❤️ no Brasil</p>
                </div>
            </div>
        </footer>
    );
}

// Main Landing Page Component
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <StatsSection />
            <PricingSection />
            <TestimonialsSection />
            <CTASection />
            <Footer />
        </div>
    );
}
