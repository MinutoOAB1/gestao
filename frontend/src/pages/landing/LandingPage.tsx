import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/ui/BrandLogo';
import {
    FileText, Users, DollarSign, Calendar, Shield,
    Check, ArrowRight, Menu, X, Sparkles,
    Globe, Clock, MessageSquare, Folder, ChevronDown, Star
} from 'lucide-react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';

// Hook for scroll-triggered reveal animations
function useScrollReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: threshold });
    return { ref, isInView };
}
// Static Hero Background with curved topographic wave grid
function AnimatedHeroBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const drawWaves = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, width, height);

            // Subtle dark background grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
            ctx.lineWidth = 1;
            const gridSize = 65;
            for (let x = 0; x < width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            for (let y = 0; y < height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Draw premium elegant static wave lines (topographic curved waves)
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(79, 115, 245, 0.15)';
            
            const numWaves = 7;
            for (let w = 0; w < numWaves; w++) {
                ctx.beginPath();
                ctx.lineWidth = 1.0;
                
                const opacity = 0.03 + (w * 0.015);
                ctx.strokeStyle = w % 2 === 0 ? `rgba(184, 155, 94, ${opacity})` : `rgba(79, 115, 245, ${opacity})`;

                // Draw a beautiful smooth curved static wave across the screen
                for (let x = 0; x <= width; x += 10) {
                    const y = height * 0.62 + 
                              Math.sin(x * 0.0018 + w * 0.55) * 75 + 
                              Math.cos(x * 0.0009 - w * 0.25) * 45;
                    
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }
        };

        drawWaves();

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            drawWaves();
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Base dark canvas backdrop overlay */}
            <div className="absolute inset-0 bg-[#000000] z-[-2]" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80 z-[-1]" />

            {/* Glowing peripheral gradient backlights */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#4F73F5]/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[5%] left-[-8%] w-[500px] h-[500px] rounded-full bg-[#B89B5E]/5 blur-[100px] pointer-events-none" />
        </div>
    );
}

// Scroll-reveal wrapper component
function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    const { ref, isInView } = useScrollReveal();
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// Navbar Component
function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <BrandLogo variant="light" size="md" />
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-10">
                        <a href="#features" className="text-white/70 hover:text-[#B89B5E] font-medium transition-colors text-sm uppercase tracking-widest">
                            Recursos
                        </a>
                        <a href="#pricing" className="text-white/70 hover:text-[#B89B5E] font-medium transition-colors text-sm uppercase tracking-widest">
                            Assinatura
                        </a>
                        <a href="#testimonials" className="text-white/70 hover:text-[#B89B5E] font-medium transition-colors text-sm uppercase tracking-widest">
                            Ecossistema
                        </a>
                        <a href="#faq" className="text-white/70 hover:text-[#B89B5E] font-medium transition-colors text-sm uppercase tracking-widest">
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
                            className="px-6 py-2.5 bg-[#4F73F5] text-white font-black rounded-xl hover:bg-white hover:text-black transition-all shadow-lg shadow-primary/10 text-xs uppercase tracking-tighter"
                        >
                            CRIAR CONTA
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
                    <div className="md:hidden py-6 border-t border-white/10 bg-black/95 backdrop-blur-3xl px-4 rounded-b-3xl shadow-lg">
                        <div className="flex flex-col gap-5">
                            <a href="#features" className="text-white font-medium text-lg">Recursos</a>
                            <a href="#pricing" className="text-white font-medium text-lg">Assinatura</a>
                            <a href="#testimonials" className="text-white font-medium text-lg">Ecossistema</a>
                            <a href="#faq" className="text-white font-medium text-lg">FAQ</a>
                            <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
                                <button onClick={() => navigate('/login')} className="py-4 text-center text-white font-bold border border-white/10 rounded-2xl bg-white/5">
                                    ENTRAR
                                </button>
                                <button onClick={() => navigate('/register')} className="py-4 text-center bg-[#4F73F5] text-white font-black rounded-2xl shadow-sm">
                                    CRIAR CONTA
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

// Animated counter hook for stats
function useAnimatedCounter(end: number, duration = 2000, decimals = 0, startOnView = true) {
    const [count, setCount] = useState('0');
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    const hasStarted = useRef(false);

    useEffect(() => {
        if (!startOnView || !isInView || hasStarted.current) return;
        hasStarted.current = true;
        const startTime = Date.now();
        const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const value = eased * end;
            setCount(value.toFixed(decimals));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [isInView, end, duration, decimals, startOnView]);

    return { count, ref };
}

// Hero Section
function HeroSection() {
    const navigate = useNavigate();

    return (
        <section className="relative pt-32 md:pt-48 pb-24 md:pb-40 overflow-hidden bg-black">
            {/* Animated Background */}
            <AnimatedHeroBackground />
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 text-[#B89B5E] rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 shadow-sm backdrop-blur-md"
                    >
                        <Sparkles size={14} className="animate-pulse" />
                        Inteligência Jurídica de Elite
                    </motion.div>

                    {/* Static Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-tight mb-10 font-display"
                    >
                        A Nova Era da sua{' '}<br className="hidden md:block" />
                        <span className="text-[#8B5CF6]">Gestão Jurídica</span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-2xl text-white/75 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
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
                        <motion.button
                            onClick={() => navigate('/register')}
                            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(79,115,245,0.25)' }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-lg group uppercase tracking-widest text-sm"
                        >
                            Criar Conta
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                        <motion.button
                            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 shadow-sm uppercase tracking-widest text-sm"
                        >
                            Ver Planos
                        </motion.button>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/50"
                    >
                        <div className="flex items-center gap-2">
                            <Check size={16} className="text-[#B89B5E]" />
                            Criptografia AES-256-GCM
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={16} className="text-[#B89B5E]" />
                            Assinaturas via Autentique
                        </div>
                        <div className="flex items-center gap-2">
                            <Check size={16} className="text-[#B89B5E]" />
                            Suporte Especializado 24/7
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
                            className="w-full h-auto rounded-xl object-contain"
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
        <section id="features" className="py-32 md:py-48 bg-[#FAF8F5] relative">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <ScrollReveal className="text-center max-w-3xl mx-auto mb-32">
                    <h2 className="text-5xl md:text-7xl font-black text-[#2E2C29] mb-8 tracking-tighter font-display">
                        Recursos <br />
                        <span className="text-[#2E2C29]/40">de Gestão</span>
                    </h2>
                    <p className="text-xl text-[#2E2C29]/60 leading-relaxed font-medium">
                        Desenvolvido especificamente para as necessidades da advocacia de alta performance.
                    </p>
                </ScrollReveal>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {features.map((feature, idx) => (
                        <ScrollReveal key={idx} delay={idx * 0.1}>
                            <div
                                className="group p-10 bg-white rounded-[2.5rem] border border-[#EAE6DF] shadow-[0_8px_30px_rgba(46,44,41,0.02)] hover:shadow-[0_12px_40px_rgba(46,44,41,0.06)] hover:border-[#B89B5E]/30 transition-all duration-500 hover:-translate-y-2 h-full"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-[#B89B5E]/10 text-accent flex items-center justify-center mb-10 border border-[#EAE6DF] group-hover:scale-110 transition-transform duration-500">
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-2xl font-black text-[#2E2C29] mb-4 font-display uppercase tracking-tight">
                                    {feature.title}
                                </h3>
                                <p className="text-[#2E2C29]/60 leading-relaxed font-medium">
                                    {feature.description}
                                </p>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Animated Stat Component
function AnimatedStat({ end, suffix, prefix, label, duration, decimals = 0 }: { end: number; suffix?: string; prefix?: string; label: string; duration?: number; decimals?: number }) {
    const { count, ref } = useAnimatedCounter(end, duration || 2000, decimals);
    
    // Strip trailing .0 if present for integers formatted as floats (e.g. 2.0 to 2)
    const displayValue = count.endsWith('.0') ? count.slice(0, -2) : count;

    return (
        <div ref={ref} className="text-center">
            <div className="text-4xl md:text-6xl font-black text-[#2E2C29] mb-4 font-display">
                {prefix}{displayValue}{suffix}
            </div>
            <div className="text-[#B89B5E] text-[10px] font-black uppercase tracking-[0.3em]">
                {label}
            </div>
        </div>
    );
}

// Stats Section
function StatsSection() {
    return (
        <section className="py-20 bg-[#F4F1EC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 border-t border-[#EAE6DF] pt-20">
                    <ScrollReveal delay={0}>
                        <AnimatedStat end={500} suffix="+" label="ESCRITÓRIOS DE ELITE" />
                    </ScrollReveal>
                    <ScrollReveal delay={0.15}>
                        <AnimatedStat end={2} prefix="R$ " suffix="B+" label="VALORES GERENCIADOS" duration={1800} decimals={1} />
                    </ScrollReveal>
                    <ScrollReveal delay={0.3}>
                        <AnimatedStat end={99.9} suffix="%" label="DISPONIBILIDADE" decimals={1} />
                    </ScrollReveal>
                    <ScrollReveal delay={0.45}>
                        <AnimatedStat end={24} suffix="/7" label="SUPORTE VIP" duration={1500} />
                    </ScrollReveal>
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
        <section className="py-24 bg-[#FAF8F5] relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ScrollReveal className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-black text-[#2E2C29] tracking-tighter font-display">
                        Ferramentas <br />
                        <span className="text-[#2E2C29]/40">de Engajamento</span>
                    </h2>
                </ScrollReveal>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* ROI Calculator */}
                    <div className="p-10 bg-white rounded-[2.5rem] border border-[#EAE6DF] shadow-[0_8px_30px_rgba(46,44,41,0.02)]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#B89B5E]/10 rounded-2xl flex items-center justify-center text-[#B89B5E]">
                                <DollarSign size={24} />
                            </div>
                            <h3 className="text-xl font-black text-[#2E2C29] uppercase tracking-tight">Calculadora de ROI</h3>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-[#2E2C29]/50 uppercase tracking-widest mb-4">
                                    Horas economizadas/mês por advogado: {hoursSaved}h
                                </label>
                                <input 
                                    type="range" min="1" max="40" value={hoursSaved}
                                    onChange={(e) => setHoursSaved(parseInt(e.target.value))}
                                    className="w-full accent-[#4F73F5]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[#2E2C29]/50 uppercase tracking-widest mb-4">
                                    Tamanho da Equipe: {teamSize}
                                </label>
                                <input 
                                    type="range" min="1" max="50" value={teamSize}
                                    onChange={(e) => setTeamSize(parseInt(e.target.value))}
                                    className="w-full accent-[#4F73F5]"
                                />
                            </div>
                            <div className="pt-8 border-t border-[#EAE6DF]">
                                <div className="text-[10px] font-black text-[#B89B5E] uppercase tracking-[0.2em] mb-2">Economia Anual Estimada</div>
                                <div className="text-4xl font-black text-[#2E2C29] font-display">
                                    R$ {roi.toLocaleString('pt-BR')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Onboarding Checklist */}
                    <div className="p-10 bg-white rounded-[2.5rem] border border-[#EAE6DF] shadow-[0_8px_30px_rgba(46,44,41,0.02)]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#B89B5E]/10 rounded-2xl flex items-center justify-center text-[#B89B5E]">
                                <Check size={24} />
                            </div>
                            <h3 className="text-xl font-black text-[#2E2C29] uppercase tracking-tight">Checklist de Onboarding</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                'Cadastro de Clientes',
                                'Gestão de Processos',
                                'Controle Financeiro',
                                'Agenda de Prazos',
                                'Configuração de Equipe'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-[#FAF8F5] rounded-2xl border border-[#EAE6DF] hover:border-[#B89B5E]/50 transition-colors cursor-pointer group">
                                    <div className="w-6 h-6 rounded-lg border-2 border-[#EAE6DF] group-hover:border-[#B89B5E] flex items-center justify-center transition-colors">
                                        <Check size={14} className="text-[#B89B5E] opacity-0 group-hover:opacity-100" />
                                    </div>
                                    <span className="text-xs font-bold text-[#2E2C29]/80 uppercase tracking-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Management Quiz */}
                    <div className="p-10 bg-white rounded-[2.5rem] border border-[#EAE6DF] shadow-[0_8px_30px_rgba(46,44,41,0.02)]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#B89B5E]/10 rounded-2xl flex items-center justify-center text-[#B89B5E]">
                                <Sparkles size={24} />
                            </div>
                            <h3 className="text-xl font-black text-[#2E2C29] uppercase tracking-tight">Quiz de Necessidades</h3>
                        </div>
                        <div className="text-center py-10">
                            <p className="text-[#2E2C29]/60 text-sm mb-8 leading-relaxed">
                                Descubra o nível de maturidade digital do seu escritório em 2 minutos.
                            </p>
                            <button 
                                onClick={() => navigate('/register')}
                                className="w-full py-4 bg-[#4F73F5] text-white font-black rounded-2xl hover:bg-black transition-all uppercase tracking-widest text-xs shadow-md shadow-primary/10"
                            >
                                Iniciar Avaliação
                            </button>
                        </div>
                        <div className="mt-8 grid grid-cols-3 gap-2">
                            <div className="h-1 bg-[#B89B5E] rounded-full"></div>
                            <div className="h-1 bg-[#EAE6DF] rounded-full"></div>
                            <div className="h-1 bg-[#EAE6DF] rounded-full"></div>
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
                <ScrollReveal className="text-center max-w-3xl mx-auto mb-24">
                    <h2 id="pricing-title" className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter font-display">
                        Assinatura <br />
                        <span className="text-white/30">Planos Premium</span>
                    </h2>
                    <p className="text-xl text-white/40 leading-relaxed font-medium">
                        Acesso ilimitado ao ecossistema mais sofisticado do Brasil.
                    </p>
                </ScrollReveal>

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
                                'Suporte Especializado 24/7',
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

// Helper function to render quotes with styled highlight words
function renderQuote(content: string, highlight?: string) {
    if (!highlight) return `"${content}"`;
    const index = content.toLowerCase().indexOf(highlight.toLowerCase());
    if (index === -1) return `"${content}"`;
    
    const before = content.substring(0, index);
    const matched = content.substring(index, index + highlight.length);
    const after = content.substring(index + highlight.length);
    
    return (
        <>
            "{before}
            <span className="text-[#B89B5E] font-extrabold">{matched}</span>
            {after}"
        </>
    );
}

// Testimonials Section — Infinite horizontal marquee, pauses on hover
function TestimonialsSection() {
    const testimonials = [
        {
            name: 'Dr. Marcos F.',
            role: 'Advogado Previdenciarista',
            company: 'Belo Horizonte',
            content: 'Tentei planilha, app de banco, caderninho. Nada durava mais de um mês. O Advus dura porque entende que eu faço audiências e atendo clientes. Tudo aparece num lugar só.',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
            highlight: 'dura'
        },
        {
            name: 'Dra. Camila S.',
            role: 'Sócia de Escritório',
            company: 'Florianópolis',
            content: 'Sempre tive medo de olhar para os números. Percebi que minha prática jurídica estava saudável — eu é que não tinha clareza. Reajustei meus honorários com segurança e parei de perder prazos.',
            photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
            highlight: 'saudável'
        },
        {
            name: 'Dra. Roberta T.',
            role: 'Advogada Tributarista',
            company: 'Curitiba',
            content: 'Em três meses entendi pela primeira vez quanto custa o meu escritório de verdade. Era muito mais do que eu imaginava — e agora eu cobro o que vale por cada contrato.',
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
            highlight: 'de verdade'
        },
        {
            name: 'Dra. Ana Paula',
            role: 'Gestora Jurídica',
            company: 'São Paulo',
            content: 'Nos primeiros atendimentos eu já estava pagando a assinatura de um ano inteiro do Advus. O controle financeiro e a facilidade de gerar briefing de processos mudaram o jogo.',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
            highlight: 'mudaram o jogo'
        }
    ];

    // Triple for seamless loop
    const marqueeItems = [...testimonials, ...testimonials, ...testimonials];

    return (
        <section id="testimonials" className="py-16 md:py-20 bg-[#F4F1EC] overflow-hidden">
            <ScrollReveal className="text-center mb-10 px-4">
                <h2 className="text-3xl md:text-5xl font-black text-[#2E2C29] tracking-tighter font-display">
                    Depoimentos <span className="text-[#2E2C29]/40">de Quem Decide</span>
                </h2>
            </ScrollReveal>

            {/* Marquee container with warm edge shadows */}
            <div className="relative py-4">
                <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[#F4F1EC] via-[#F4F1EC]/90 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[#F4F1EC] via-[#F4F1EC]/90 to-transparent z-10 pointer-events-none" />

                <div
                    className="animate-marquee-scroll"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.animationPlayState = 'running'; }}
                >
                    {marqueeItems.map((t, idx) => (
                        <div
                            key={idx}
                            className="flex-shrink-0 w-[440px] bg-[#FAF8F5] rounded-[2rem] border border-[#EAE6DF] shadow-[0_8px_30px_rgba(46,44,41,0.03)] hover:shadow-[0_12px_40px_rgba(46,44,41,0.06)] hover:border-[#D4CFC5] transition-all duration-300 p-10 flex flex-col justify-between"
                        >
                            {/* Avatar on top-left */}
                            <div className="flex justify-start mb-6">
                                <img
                                    src={t.photo}
                                    alt={t.name}
                                    className="w-16 h-16 rounded-full object-cover border border-[#EAE6DF] shadow-sm"
                                />
                            </div>
                            {/* Quote */}
                            <div className="flex-1 mb-8">
                                <p className="text-[#2E2C29] font-serif italic text-base leading-relaxed text-left min-h-[72px]">
                                    {renderQuote(t.content, t.highlight)}
                                </p>
                            </div>
                            {/* Divider and Author details */}
                            <div>
                                <div className="border-t border-[#EAE6DF] pt-6 flex flex-col items-start">
                                    <h4 className="font-bold text-[#1A1A1A] text-sm mb-1">{t.name}</h4>
                                    <p className="font-mono text-[10px] text-[#8C8882] uppercase tracking-wider">
                                        {t.role} · {t.company}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes marquee-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.3333%); }
                }
            `}</style>
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
            answer: 'O plano ADV Plus Elite está disponível por R$ 47/mês (de R$ 147). Você tem acesso completo a todos os recursos: usuários e clientes ilimitados, IA Jurídica sem restrições, controle financeiro executivo, assinaturas digitais via Autentique, armazenamento em nuvem e suporte VIP 24/7. Sem limites artificiais.'
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
            answer: 'Todos os planos incluem treinamento de implantação com nossa equipe. O processo é guiado: cadastro de clientes, importação de processos, configuração da agenda de prazos, integração financeira e configuração de equipe. Nossa equipe de suporte acompanha você em cada etapa.'
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
                    <p className="text-white font-black text-xl mb-8 uppercase tracking-tight">Nossa equipe de suporte está disponível 24/7</p>
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
        <footer id="contact" className="py-24 bg-[#F4F1EC] border-t border-[#EAE6DF] text-[#2E2C29]/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-20">
                    <div className="col-span-2 md:col-span-1">
                        <BrandLogo variant="dark" size="sm" className="mb-8" />
                        <p className="text-xs font-medium leading-loose mb-8 max-w-xs text-[#2E2C29]/60">
                            A plataforma definitiva para escritórios de advocacia que não aceitam nada menos que a excelência.
                        </p>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#2E2C29]/5 flex items-center justify-center hover:bg-[#4F73F5] hover:text-white transition-all cursor-pointer border border-[#EAE6DF]">
                                <Globe size={18} />
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#2E2C29]/5 flex items-center justify-center hover:bg-[#4F73F5] hover:text-white transition-all cursor-pointer border border-[#EAE6DF]">
                                <Shield size={18} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[#2E2C29] font-black uppercase tracking-[0.2em] text-[10px] mb-8">Tecnologia</h4>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                            <li><a href="#features" className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors">Recursos</a></li>
                            <li><a href="#" className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors">IA Jurídica</a></li>
                            <li><a href="#" className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors">Segurança</a></li>
                            <li><a href="#" className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors">API Dev</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[#2E2C29] font-black uppercase tracking-[0.2em] text-[10px] mb-8">Assinatura</h4>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                            <li><a href="#pricing" className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors">Planos Elite</a></li>
                            <li><a href="#" className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors">Suporte</a></li>
                            <li><a href="#" className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors">Treinamentos</a></li>
                            <li><a href="#" className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors">Upgrade</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[#2E2C29] font-black uppercase tracking-[0.2em] text-[10px] mb-8">Institucional</h4>
                        <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                            <li><button onClick={() => navigate('/about')} className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors text-left uppercase">Sobre</button></li>
                            <li><button onClick={() => navigate('/privacy')} className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors text-left uppercase">Privacidade</button></li>
                            <li><button onClick={() => navigate('/lgpd')} className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors text-left uppercase">LGPD</button></li>
                            <li><button onClick={() => navigate('/terms')} className="text-[#2E2C29]/70 hover:text-[#B89B5E] transition-colors text-left uppercase">Termos</button></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-[#EAE6DF] flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
                    <p>© 2026 Advus Global. Todos os direitos reservados.</p>
                    <p className="text-[#B89B5E]">Feito para a Elite</p>
                </div>
            </div>
        </footer>
    );
}

// PWA Mobile Section (Inspired by premium Xtracky banner with rounded borders smartphone mockup)
function PwaMobileSection() {
    const navigate = useNavigate();
    
    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Glow Elements directly on the section background */}
            <div className="absolute top-[10%] right-[-5%] w-[600px] h-[600px] bg-[#4F73F5]/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-[#B89B5E]/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <ScrollReveal>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
                        {/* Phone Mockup Image on the left (5 columns) */}
                        <div className="lg:col-span-5 flex justify-center lg:justify-start">
                            <img 
                                src="/imagem22.png" 
                                alt="Advus Mobile Platform" 
                                className="relative w-full max-w-[440px] rounded-[1.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] transform hover:scale-[1.02] transition-all duration-500"
                                draggable={false}
                            />
                        </div>

                        {/* Info Content on the right (7 columns) */}
                        <div className="lg:col-span-7 space-y-8 text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4F73F5]/10 border border-[#4F73F5]/30 rounded-full text-xs font-black uppercase tracking-widest text-[#4F73F5]">
                                <span className="w-2 h-2 rounded-full bg-[#4F73F5] animate-ping" />
                                Progressive Web App (PWA)
                            </div>

                            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-none font-display">
                                Sua operação jurídica, <br />
                                <span className="text-white/40">na palma da mão.</span>
                            </h2>

                            <p className="text-white/50 text-base sm:text-lg leading-relaxed font-medium">
                                Acesse o ecossistema Advus diretamente do celular com a mesma robustez e velocidade do desktop. 
                                Sem necessidade de downloads em lojas virtuais (App Store ou Google Play), nossa plataforma utiliza tecnologia PWA 
                                para rodar em alto desempenho com instalação instantânea de um clique.
                            </p>

                            <hr className="border-white/5" />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-[#B89B5E]/20 flex items-center justify-center text-[#B89B5E] text-xs font-bold">1</div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Como Instalar no iOS (Safari)</h4>
                                    </div>
                                    <p className="text-white/40 text-xs leading-relaxed pl-9">
                                        Toque no ícone de <strong>Compartilhar</strong> (seta para cima) no Safari e selecione <strong>Adicionar à Tela de Início</strong>.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-[#4F73F5]/20 flex items-center justify-center text-[#4F73F5] text-xs font-bold">2</div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Como Instalar no Android (Chrome)</h4>
                                    </div>
                                    <p className="text-white/40 text-xs leading-relaxed pl-9">
                                        Clique no menu de <strong>três pontos</strong> do Chrome e selecione a opção <strong>Instalar Aplicativo</strong> ou Adicionar à tela inicial.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row gap-4">
                                <button 
                                    onClick={() => navigate('/register')}
                                    className="px-8 py-4 bg-[#4F73F5] hover:bg-white hover:text-black text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_20px_rgba(79,115,245,0.25)]"
                                >
                                    Criar Conta Grátis
                                </button>
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all"
                                >
                                    Acessar Plataforma
                                </button>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}

// Main Landing Page Component
export default function LandingPage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.add('landing-page-body');
        if (isAuthenticated) {
            navigate('/app');
        }
        return () => {
            document.documentElement.classList.remove('landing-page-body');
        };
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-accent selection:text-primary-dark">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <PwaMobileSection />
            <PricingSection />
            <TestimonialsSection />
            <FAQSection />
            <CTASection />
            <Footer />
        </div>
    );
}
