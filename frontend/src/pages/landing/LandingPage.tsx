import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/ui/BrandLogo';
import {
    FileText, Users, DollarSign, Calendar, Shield,
    Check, ArrowRight, Menu, X, Sparkles,
    Globe, Clock, MessageSquare, Folder, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Navbar Component
function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <BrandLogo variant="light" size="md" />
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-10">
                        <a href="#features" className="text-white/60 hover:text-accent font-medium transition-colors text-sm uppercase tracking-widest">
                            Recursos
                        </a>
                        <a href="#pricing" className="text-white/60 hover:text-accent font-medium transition-colors text-sm uppercase tracking-widest">
                            Assinatura
                        </a>
                        <a href="#testimonials" className="text-white/60 hover:text-accent font-medium transition-colors text-sm uppercase tracking-widest">
                            Ecossistema
                        </a>
                        <a href="#faq" className="text-white/60 hover:text-accent font-medium transition-colors text-sm uppercase tracking-widest">
                            FAQ
                        </a>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-white/70 font-bold hover:text-white transition-colors text-sm"
                        >
                            ENTRAR
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-6 py-2.5 bg-accent text-primary-dark font-black rounded-xl hover:bg-white transition-all shadow-lg shadow-accent/10 text-xs uppercase tracking-tighter"
                        >
                            SOLICITE UMA DEMO
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-white"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-6 border-t border-white/10 bg-black/90 backdrop-blur-3xl px-4 rounded-b-3xl">
                        <div className="flex flex-col gap-5">
                            <a href="#features" className="text-white/80 font-medium text-lg">Recursos</a>
                            <a href="#pricing" className="text-white/80 font-medium text-lg">Assinatura</a>
                            <a href="#testimonials" className="text-white/80 font-medium text-lg">Ecossistema</a>
                            <a href="#faq" className="text-white/80 font-medium text-lg">FAQ</a>
                            <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
                                <button onClick={() => navigate('/login')} className="py-4 text-center text-white font-bold border border-white/10 rounded-2xl">
                                    ENTRAR
                                </button>
                                <button onClick={() => navigate('/register')} className="py-4 text-center bg-accent text-primary-dark font-black rounded-2xl">
                                    SOLICITE UMA DEMO
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
        <section className="relative pt-32 md:pt-48 pb-24 md:pb-40 overflow-hidden bg-primary-dark">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[160px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 blur-[140px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 text-accent rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 shadow-2xl backdrop-blur-md"
                    >
                        <Sparkles size={14} className="animate-pulse" />
                        Inteligência Jurídica de Elite
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-10 font-display"
                    >
                        A Nova Era da <br className="hidden md:block" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/40 lowercase">
                            gestão de escritórios de advocacia
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-2xl text-white/50 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
                    >
                        Advus é uma plataforma de gestão jurídica integrada, projetada para escritórios de advocacia que buscam eficiência, controle financeiro e satisfação de clientes.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
                    >
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-primary text-white font-black rounded-2xl hover:bg-white hover:text-primary transition-all shadow-[0_20px_50px_rgba(79,115,245,0.15)] group uppercase tracking-widest text-sm"
                        >
                            Começar Agora
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md uppercase tracking-widest text-sm">
                            Solicite uma Demo
                        </button>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30"
                    >
                        <div className="flex items-center gap-2">
                            <Check size={16} className="text-accent" />
                            Criptografia AES-256-GCM
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={16} className="text-accent" />
                            Assinaturas via Autentique
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={16} className="text-accent" />
                            Suporte 24/7 Concierge
                        </div>
                    </motion.div>
                </div>

                {/* Hero Dashboard Preview */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mt-24 relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-transparent to-transparent z-10 pointer-events-none" style={{ top: '60%' }} />
                    <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/10 bg-black/40 backdrop-blur-md p-2">
                        <img
                            src="/home-image.png"
                            alt="Advus Platform Preview"
                            className="w-full rounded-[2.2rem] aspect-video object-cover"
                        />
                        {/* Glass Overlays */}
                        <div className="absolute top-10 left-10 p-6 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 hidden lg:block animate-bounce-slow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                                    <Sparkles className="text-accent" />
                                </div>
                                <div>
                                    <div className="text-white font-black text-xs uppercase tracking-widest">IA Jurídica</div>
                                    <div className="text-white/40 text-[10px]">Análise de Risco 98%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// Features Section
function FeaturesSection() {
    const features = [
        {
            icon: Folder,
            title: 'Gestão de Processos',
            description: 'Acompanhe cada movimento processual com uma interface intuitiva e poderosa.',
        },
        {
            icon: Users,
            title: 'CRM de Clientes',
            description: 'Gestão 360º de clientes com histórico completo e automação de atendimento.',
        },
        {
            icon: Sparkles,
            title: 'IA Jurídica',
            description: 'Análise profunda de contratos e identificação de riscos com tecnologia de elite.',
        },
        {
            icon: Shield,
            title: 'Criptografia AES-256',
            description: 'Dados protegidos por criptografia de nível bancário AES-256-GCM em todas as camadas.',
        },
        {
            icon: FileText,
            title: 'Assinaturas Digitais',
            description: 'Assinaturas de documentos com validade jurídica integradas via Autentique.',
        },
        {
            icon: DollarSign,
            title: 'Finanças Premium',
            description: 'Controle absoluto de honorários, despesas e fluxo de caixa com relatórios executivos.',
        },
    ];

    return (
        <section id="features" className="py-32 md:py-48 bg-black relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(49,46,129,0.1),transparent_50%)]" />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-32">
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter font-display">
                        Recursos <br />
                        <span className="text-white/30">de Gestão</span>
                    </h2>
                    <p className="text-xl text-white/40 leading-relaxed font-medium">
                        Desenvolvido especificamente para as necessidades da advocacia de alta performance.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group p-10 bg-white/[0.02] hover:bg-white/[0.04] rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-2"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.01] text-accent flex items-center justify-center mb-10 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                <feature.icon size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-4 font-display uppercase tracking-tight">
                                {feature.title}
                            </h3>
                            <p className="text-white/40 leading-relaxed font-medium">
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
        { value: '500+', label: 'ESCRITÓRIOS DE ELITE' },
        { value: 'R$ 2B+', label: 'VALORES GERENCIADOS' },
        { value: '99.9%', label: 'DISPONIBILIDADE' },
        { value: '24/7', label: 'CONCIERGE VIP' },
    ];

    return (
        <section className="py-32 bg-primary-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-4xl md:text-6xl font-black text-white mb-4 font-display">
                                {stat.value}
                            </div>
                            <div className="text-accent text-[10px] font-black uppercase tracking-[0.3em]">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Engagement Tools Section
function EngagementSection() {
    const [roi, setRoi] = useState<number>(0);
    const [hoursSaved, setHoursSaved] = useState<number>(10);
    const [teamSize, setTeamSize] = useState<number>(5);
    const navigate = useNavigate();

    useEffect(() => {
        // Simple ROI calculation: (Hours saved * Team Size * Avg Hourly Rate) * 12 months
        // Assuming avg hourly rate of R$ 150
        const calculatedRoi = hoursSaved * teamSize * 150 * 12;
        setRoi(calculatedRoi);
    }, [hoursSaved, teamSize]);

    return (
        <section className="py-32 md:py-48 bg-primary-dark/50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-24">
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter font-display">
                        Ferramentas <br />
                        <span className="text-white/30">de Engajamento</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* ROI Calculator */}
                    <div className="p-10 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                                <DollarSign size={24} />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Calculadora de ROI</h3>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">
                                    Horas economizadas/mês por advogado: {hoursSaved}h
                                </label>
                                <input 
                                    type="range" min="1" max="40" value={hoursSaved}
                                    onChange={(e) => setHoursSaved(parseInt(e.target.value))}
                                    className="w-full accent-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">
                                    Tamanho da Equipe: {teamSize}
                                </label>
                                <input 
                                    type="range" min="1" max="50" value={teamSize}
                                    onChange={(e) => setTeamSize(parseInt(e.target.value))}
                                    className="w-full accent-accent"
                                />
                            </div>
                            <div className="pt-8 border-t border-white/5">
                                <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-2">Economia Anual Estimada</div>
                                <div className="text-4xl font-black text-white font-display">
                                    R$ {roi.toLocaleString('pt-BR')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Onboarding Checklist */}
                    <div className="p-10 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                                <Check size={24} />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Checklist de Onboarding</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                'Cadastro de Clientes',
                                'Gestão de Processos',
                                'Controle Financeiro',
                                'Agenda de Prazos',
                                'Configuração de Equipe'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-accent/30 transition-colors cursor-pointer group">
                                    <div className="w-6 h-6 rounded-lg border-2 border-white/10 group-hover:border-accent flex items-center justify-center transition-colors">
                                        <Check size={14} className="text-accent opacity-0 group-hover:opacity-100" />
                                    </div>
                                    <span className="text-xs font-bold text-white/70 uppercase tracking-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Management Quiz */}
                    <div className="p-10 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Quiz de Necessidades</h3>
                        </div>
                        <div className="text-center py-10">
                            <p className="text-white/50 text-sm mb-8 leading-relaxed">
                                Descubra o nível de maturidade digital do seu escritório em 2 minutos.
                            </p>
                            <button 
                                onClick={() => navigate('/register')}
                                className="w-full py-4 bg-accent text-primary-dark font-black rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-xs"
                            >
                                Iniciar Avaliação
                            </button>
                        </div>
                        <div className="mt-8 grid grid-cols-3 gap-2">
                            <div className="h-1 bg-accent rounded-full"></div>
                            <div className="h-1 bg-white/10 rounded-full"></div>
                            <div className="h-1 bg-white/10 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Pricing Section
function PricingSection() {
    const navigate = useNavigate();
    
    return (
        <section id="pricing" className="py-32 md:py-48 bg-black relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-24">
                    <h2 id="pricing-title" className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter font-display">
                        Assinatura <br />
                        <span className="text-white/30">Planos Premium</span>
                    </h2>
                    <p className="text-xl text-white/40 leading-relaxed font-medium">
                        Acesso ilimitado ao ecossistema mais sofisticado do Brasil.
                    </p>
                </div>

                {/* Pricing Card */}
                <div className="max-w-xl mx-auto">
                    <div className="relative p-12 rounded-[3rem] border border-accent/30 bg-gradient-to-br from-primary-dark/80 to-black backdrop-blur-3xl shadow-[0_50px_100px_rgba(212,175,55,0.1)] overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                        
                        <div className="text-center mb-12">
                            <div className="inline-block px-4 py-1 bg-accent text-primary-dark text-[10px] font-black rounded-full uppercase tracking-widest mb-6">
                                MAIS ESCOLHIDO
                            </div>
                            <h3 className="text-4xl font-black text-white mb-4 font-display uppercase">ADV PLUS ELITE</h3>
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-white/50 text-2xl font-bold italic line-through">R$ 147</span>
                                <span className="text-6xl font-black text-white">R$ 47</span>
                                <span className="text-white/40 font-bold uppercase tracking-widest text-sm">/mês</span>
                            </div>
                        </div>

                        <ul className="space-y-5 mb-12">
                            {[
                                'Usuários e Clientes Ilimitados',
                                'Inteligência Artificial Ilimitada',
                                'Financeiro Executivo Completo',
                                'Ecossistema de Colaboração VIP',
                                'Suporte Concierge 24/7',
                                'Armazenamento Seguro em Nuvem',
                                'Treinamento de Implantação'
                            ].map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-4 text-white/70">
                                    <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                        <Check size={12} className="text-primary-dark font-black" />
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-tight">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => navigate('/register')}
                            className="w-full py-6 rounded-[1.5rem] font-black bg-accent hover:bg-white text-primary-dark transition-all shadow-2xl uppercase tracking-[0.2em] text-sm"
                        >
                            Solicitar Assinatura
                        </button>
                        
                        <p className="mt-8 text-center text-[10px] text-white/30 font-black uppercase tracking-[0.1em]">
                            Cancelamento simplificado • Upgrade imediato
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Testimonials Section
function TestimonialsSection() {
    const testimonials = [
        {
            name: 'Carlos Silva',
            role: 'ADVOGADO SÊNIOR',
            company: 'SILVA & ASSOC.',
            content: 'O Advus redefiniu nossa cultura de produtividade. Não é apenas software, é vantagem competitiva.',
            avatar: 'CS'
        },
        {
            name: 'Marina Costa',
            role: 'LEGAL DESIGNER',
            company: 'COSTA HUB',
            content: 'A experiência de usuário é impecável. Reflete exatamente o posicionamento premium que temos.',
            avatar: 'MC'
        },
        {
            name: 'Roberto Mendes',
            role: 'CEO',
            company: 'MENDES GROUP',
            content: 'A IA Jurídica do Advus é o nosso filtro mais confiável em auditorias complexas. Indispensável.',
            avatar: 'RM'
        }
    ];

    return (
        <section id="testimonials" className="py-32 md:py-48 bg-primary-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-24">
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter font-display">
                        Depoimentos <br />
                        <span className="text-white/30">de Quem Decide</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {testimonials.map((testimonial, idx) => (
                        <div
                            key={idx}
                            className="p-10 bg-white/[0.03] rounded-[2.5rem] border border-white/5 relative"
                        >
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent font-black border border-accent/20 text-xl">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <h4 className="font-black text-white uppercase tracking-tight">
                                        {testimonial.name}
                                    </h4>
                                    <p className="text-[10px] text-accent font-black uppercase tracking-widest">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </div>
                            <p className="text-white/60 leading-relaxed font-medium italic mb-6">
                                "{testimonial.content}"
                            </p>
                            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                                {testimonial.company}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// FAQ Section
function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: 'O que é o Advus e para quem é indicado?',
            answer: 'O Advus é uma plataforma de gestão jurídica completa, criada para escritórios de advocacia de todos os tamanhos. Centralizamos processos, clientes, controle financeiro, agenda de prazos, documentos com assinatura digital e IA jurídica em um único lugar — eliminando planilhas e ferramentas dispersas.'
        },
        {
            question: 'Quanto custa o plano ADV Plus Elite?',
            answer: 'O plano ADV Plus Elite está disponível por R$ 47/mês (de R$ 147). Você tem acesso completo a todos os recursos: usuários e clientes ilimitados, IA Jurídica sem restrições, controle financeiro executivo, assinaturas digitais via Autentique, armazenamento em nuvem e suporte Concierge 24/7. Sem limites artificiais.'
        },
        {
            question: 'Como funciona a IA Jurídica da plataforma?',
            answer: 'A IA Jurídica do Advus analisa contratos, petições e documentos em profundidade, identificando cláusulas de risco, inconsistências e pontos de atenção com precisão de 98%. Você pode fazer perguntas em linguagem natural sobre qualquer documento carregado e receber análises estruturadas em segundos.'
        },
        {
            question: 'Meus dados estão seguros na plataforma?',
            answer: 'Absolutamente. O Advus utiliza criptografia AES-256-GCM em todas as camadas — o mesmo padrão adotado por instituições bancárias. Seus dados são armazenados com segurança em nuvem, com backups automáticos. Estamos em conformidade com a LGPD e não compartilhamos suas informações com terceiros.'
        },
        {
            question: 'Posso assinar documentos diretamente pela plataforma?',
            answer: 'Sim! O Advus possui integração nativa com a Autentique, permitindo envio, assinatura e gestão de documentos com validade jurídica total, tudo dentro da plataforma. Sem precisar de outras ferramentas ou plataformas externas.'
        },
        {
            question: 'Como funciona o controle financeiro?',
            answer: 'O módulo financeiro do Advus permite controlar honorários, despesas processuais, lançamentos recorrentes e gerar relatórios executivos. Você visualiza o fluxo de caixa, inadimplências e projeções em dashboards intuitivos, com filtros por cliente, processo ou período.'
        },
        {
            question: 'Quantos usuários posso cadastrar?',
            answer: 'No plano ADV Plus Elite, você cadastra usuários ilimitados. Cada usuário tem perfil e permissões configuráveis, permitindo que sócios, associados e estagiários acessem apenas o que é relevante para cada função no escritório.'
        },
        {
            question: 'É possível cancelar a assinatura a qualquer momento?',
            answer: 'Sim. O Advus não tem fidelidade ou multas de cancelamento. Você pode cancelar sua assinatura a qualquer momento diretamente nas configurações da conta. Nosso processo de cancelamento é simples e sem burocracia — porque confiamos que você ficará pela qualidade do produto.'
        },
        {
            question: 'Como é feito o onboarding e implantação?',
            answer: 'Todos os planos incluem treinamento de implantação com nossa equipe. O processo é guiado: cadastro de clientes, importação de processos, configuração da agenda de prazos, integração financeira e configuração de equipe. Nossa equipe de Concierge acompanha você em cada etapa.'
        },
        {
            question: 'O Advus funciona em dispositivos móveis?',
            answer: 'Sim. A plataforma é totalmente responsiva e funciona em smartphones, tablets e desktops. Você acessa todas as funcionalidades pelo navegador sem precisar instalar aplicativos adicionais, com a mesma experiência premium em qualquer dispositivo.'
        },
    ];

    const toggle = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <section id="faq" className="py-32 md:py-48 bg-black relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.04),transparent_60%)]" />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-24">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 text-accent rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 backdrop-blur-md">
                        <MessageSquare size={14} />
                        Perguntas Frequentes
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter font-display leading-[0.9] mb-8">
                        Suas Dúvidas <br />
                        <span className="text-white/30">Respondidas</span>
                    </h2>
                    <p className="text-xl text-white/40 leading-relaxed font-medium max-w-2xl mx-auto">
                        Tudo o que você precisa saber antes de transformar a gestão do seu escritório.
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <button
                                id={`faq-item-${idx}`}
                                onClick={() => toggle(idx)}
                                className={`w-full text-left p-8 rounded-[1.75rem] border transition-all duration-300 group ${
                                    openIndex === idx
                                        ? 'bg-white/[0.05] border-accent/30 shadow-[0_0_40px_rgba(212,175,55,0.05)]'
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-6">
                                    <span className={`text-base md:text-lg font-bold tracking-tight transition-colors ${
                                        openIndex === idx ? 'text-white' : 'text-white/70 group-hover:text-white'
                                    }`}>
                                        {faq.question}
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                                        openIndex === idx
                                            ? 'bg-accent text-primary-dark rotate-180'
                                            : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'
                                    }`}>
                                        <ChevronDown size={16} />
                                    </div>
                                </div>

                                <AnimatePresence initial={false}>
                                    {openIndex === idx && (
                                        <motion.div
                                            key="content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <p className="pt-6 text-white/50 leading-relaxed font-medium text-sm md:text-base border-t border-white/5 mt-6">
                                                {faq.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-20 text-center p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                    <p className="text-white/50 text-base mb-2 font-medium">Ainda tem dúvidas?</p>
                    <p className="text-white font-black text-xl mb-8 uppercase tracking-tight">Nossa equipe Concierge está disponível 24/7</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://wa.me/5511999999999"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent text-primary-dark font-black rounded-2xl hover:bg-white transition-all uppercase tracking-widest text-xs"
                        >
                            <MessageSquare size={16} />
                            Falar no WhatsApp
                        </a>
                        <a
                            href="mailto:contato@advus.app"
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
                        >
                            <Globe size={16} />
                            Enviar E-mail
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

// CTA Section
function CTASection() {
    const navigate = useNavigate();

    return (
        <section className="py-32 md:py-48 bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#312E81_0%,transparent_70%)] opacity-20" />
            
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter font-display leading-[0.9]">
                    Sua Ascensão <br />
                    <span className="text-accent">Começa Aqui.</span>
                </h2>
                <p className="text-xl md:text-2xl text-white/50 mb-14 max-w-2xl mx-auto font-medium">
                    Junte-se à elite da advocacia brasileira e experimente o poder da gestão Advus.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                    <button
                        onClick={() => navigate('/register')}
                        className="w-full sm:w-auto px-14 py-6 bg-white text-primary-dark font-black rounded-2xl shadow-2xl hover:bg-accent transition-all uppercase tracking-widest text-sm"
                    >
                        Criar Conta Premium
                    </button>
                    <button className="w-full sm:w-auto px-14 py-6 border border-white/10 text-white font-black rounded-2xl hover:bg-white/5 transition-all uppercase tracking-widest text-sm backdrop-blur-md">
                        Consultoria VIP
                    </button>
                </div>
            </div>
        </section>
    );
}

// Footer
function Footer() {
    const navigate = useNavigate();
    return (
        <footer id="contact" className="py-24 bg-primary-dark border-t border-white/5 text-white/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-20">
                    <div className="col-span-2 md:col-span-1">
                        <BrandLogo variant="light" size="sm" className="mb-8" />
                        <p className="text-xs font-medium leading-loose mb-8 max-w-xs">
                            A plataforma definitiva para escritórios de advocacia que não aceitam nada menos que a excelência.
                        </p>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all cursor-pointer border border-white/5">
                                <Globe size={18} />
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-accent hover:text-primary-dark transition-all cursor-pointer border border-white/5">
                                <Shield size={18} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Tecnologia</h4>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                            <li><a href="#features" className="hover:text-accent transition-colors">Recursos</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">IA Jurídica</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Segurança</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">API Dev</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Assinatura</h4>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                            <li><a href="#pricing" className="hover:text-accent transition-colors">Planos Elite</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Concierge</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Treinamentos</a></li>
                            <li><a href="#" className="hover:text-accent transition-colors">Upgrade</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Institucional</h4>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                            <li><button onClick={() => navigate('/about')} className="hover:text-accent transition-colors text-left uppercase">Sobre</button></li>
                            <li><button onClick={() => navigate('/privacy')} className="hover:text-accent transition-colors text-left uppercase">Privacidade</button></li>
                            <li><button onClick={() => navigate('/lgpd')} className="hover:text-accent transition-colors text-left uppercase">LGPD</button></li>
                            <li><button onClick={() => navigate('/terms')} className="hover:text-accent transition-colors text-left uppercase">Termos</button></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
                    <p>© 2026 Advus Global. Todos os direitos reservados.</p>
                    <p className="text-accent">Feito para a Elite</p>
                </div>
            </div>
        </footer>
    );
}

// Main Landing Page Component
export default function LandingPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/app');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-accent selection:text-primary-dark">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <StatsSection />
            <EngagementSection />
            <PricingSection />
            <TestimonialsSection />
            <FAQSection />
            <CTASection />
            <Footer />
        </div>
    );
}
