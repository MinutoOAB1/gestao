import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/ui/BrandLogo';
import {
    FileText, Users, DollarSign, Calendar, Shield,
    Check, ArrowRight, Menu, X, Sparkles,
    Globe, Clock, MessageSquare, Folder, ChevronDown, Star,
    AlertTriangle, CheckCircle2, Send, Search, ShieldCheck,
    Layers, Lock, CheckSquare, ChevronUp, Award
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
                        A Nova Era da sua Gestão{' '}<br className="hidden md:block" />
                        <span className="text-[#4F73F5]">Jurídica</span>
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

            {/* Infinite Marquee Scroll of Integrations */}
            <div className="mt-28 border-t border-white/5 pt-12 relative z-10 w-full overflow-hidden">
                <div className="text-center mb-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
                        Integrado nativamente com as melhores soluções do mercado
                    </span>
                </div>
                
                <style>{`
                    @keyframes marquee {
                        0% { transform: translateX(0%); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        display: flex;
                        width: max-content;
                        animation: marquee 25s linear infinite;
                    }
                    .animate-marquee:hover {
                        animation-play-state: paused;
                    }
                `}</style>
                
                <div className="relative w-full overflow-hidden flex">
                    {/* Left & Right fading gradient overlays for depth */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
                    
                    <div className="animate-marquee gap-10">
                        {/* First Set */}
                        {[
                            {
                                label: 'WhatsApp API',
                                desc: 'Notificações Automáticas',
                                logo: () => (
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" fill="#25D366">
                                        <path d="M20.52 3.48A11.96 11.96 0 0 0 11.97 0a12 12 0 0 0-10.4 18l.12 4.2L6 20.84a12 12 0 0 0 5.97 1.6h.01a12 12 0 0 0 8.54-20.96Zm-8.55 17.55a9.92 9.92 0 0 1-5.07-1.39l-.36-.21-3.76 1.18 1.18-3.66-.23-.38a9.91 9.91 0 1 1 8.24 4.46Zm5.44-7.42c-.3-.15-1.78-.88-2.05-1a.33.33 0 0 0-.17-.05c-.15 0-.3.2-.41.34-.11.14-.23.28-.33.41l-.22.25c-.1.12-.2.14-.52 0-.29-.15-1.22-.45-2.32-1.43a8.67 8.67 0 0 1-1.61-2.05c-.15-.24-.13-.37.1-.51l.3-.2c.1-.06.17-.15.25-.23.08-.09.11-.15.17-.25.06-.1 0-.19-.03-.27l-.46-1.12c-.11-.26-.22-.22-.3-.22h-.25c-.09 0-.24.03-.38.19-.14.15-.55.53-.55 1.3 0 .77.57 1.51.65 1.62.08.11 1.12 2.72 2.72 3.82.37.26.66.41 1.05.52.45.14.86.12 1.19.07.36-.05 1.12-.46 1.28-.9.16-.44.16-.82.11-.9-.05-.08-.18-.13-.38-.23Z" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Autentique',
                                desc: 'Assinaturas Digitais',
                                logo: () => (
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" fill="#1AD1B5">
                                        <path d="m18.54 1.225-.27 1.66a10.57 10.57 0 0 0-6.114-2.32L0 11.99h12.156V6.062c3.199 0 5.74 2.434 5.74 5.917 0 3.687-2.614 5.98-5.73 5.98-2.594 0-4.648-1.557-5.429-3.898L0 11.984c0 6.43 4.591 11.45 11.543 11.45 1.666 0 4.259-.383 6.706-2.325l.29 1.64H24V1.225Z" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Google Calendar',
                                desc: 'Agendamento Sincronizado',
                                logo: () => (
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" fill="#4285F4">
                                        <path d="M22.0113 3.269h-5.8219a4.2894 4.2894 0 0 0-4.1854 3.3452A4.2894 4.2894 0 0 0 7.8186 3.269h-5.818A2.0007 2.0007 0 0 0 0 5.2697v10.2434a2.0007 2.0007 0 0 0 2.0007 2.0007h3.7372c4.2574 0 5.5299 1.0244 6.138 3.133a.112.112 0 0 0 .1121.084h.024a.112.112 0 0 0 .112-.084c.6122-2.1086 1.8807-3.133 6.138-3.133h3.7372a2.0007 2.0007 0 0 0 2.0007-2.0007V5.2697a2.0007 2.0007 0 0 0-2.0007-2.0007z" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Asaas Gateway',
                                desc: 'Boletos e Pix',
                                logo: () => (
                                    <svg viewBox="0 0 100 100" className="w-8 h-8 flex-shrink-0" fill="none">
                                        <defs>
                                            <linearGradient id="asaasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#00A3FF" />
                                                <stop offset="100%" stopColor="#0030B8" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="50" cy="50" r="46" fill="url(#asaasGrad)" />
                                        <path d="M32 52 l12 12 l28 -28" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )
                            },
                            {
                                label: 'PJe & Tribunais',
                                desc: 'Rastreamento de Prazos',
                                logo: () => (
                                    <svg viewBox="0 0 100 100" className="w-8 h-8 flex-shrink-0" fill="none">
                                        <circle cx="50" cy="50" r="46" fill="#004A8F" />
                                        <path d="M50 22 v52 M30 38 h40 M38 52 c0 6 5 11 12 11 s12-5 12-11" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
                                        <circle cx="50" cy="22" r="3" fill="#FFB900" />
                                        <circle cx="30" cy="38" r="3" fill="#FFB900" />
                                        <circle cx="70" cy="38" r="3" fill="#FFB900" />
                                        <text x="50" y="82" fill="#fff" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">PJe</text>
                                    </svg>
                                )
                            },
                            {
                                label: 'Nuvem Segura AWS',
                                desc: 'Backup Criptografado',
                                logo: () => (
                                    <svg viewBox="0 0 100 60" className="w-12 h-8 flex-shrink-0" fill="none">
                                        <path d="M22.5 35c0 4-2 6-5.5 6-3 0-5-2-5-5.5 0-4.5 3-7 10.5-7.5v7zm10.5 5V21h-5v3.5c-2-3-5.5-4-8.5-4C11.5 20.5 6 25 6 32.5c0 7 5 11.5 12.5 11.5 4 0 7-1.5 9-4.5v4.5h5zm20-19l-4.5 16-4.5-16h-5.5l7.5 24h5.5l7.5-24h-6zm15.5 8c0-3.5 2-5 5.5-5 3 0 5 1.5 5 4.5v.5c-7 .5-10.5 2-10.5 5 0 2.5 1.5 4 4.5 4 3 0 5-1.5 6.5-3.5V39c-1.5 2-4.5 3.5-7.5 3.5-5.5 0-8-3-8-7.5zm16 4.5V26.5c0-4-3-6-7.5-6-3.5 0-6.5 1.5-8 3.5l3.5 3c1-1.5 2.5-2.5 4.5-2.5 2.5 0 3.5 1 3.5 3V29c-6 .5-10 2.5-10 7 0 4 3 6.5 7.5 6.5 3.5 0 5.5-1.5 6.5-3.5V39h5z" fill="#fff" />
                                        <path d="M12 45c10 8 38 12 76 0" stroke="#FF9900" strokeWidth="4" strokeLinecap="round" />
                                        <path d="M82 42.5l7.5 4.5-5-6.5" stroke="#FF9900" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="#FF9900" />
                                    </svg>
                                )
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 px-8 py-2 opacity-50 hover:opacity-100 transition-all duration-300 cursor-pointer">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                    <item.logo />
                                </div>
                                <div className="text-left">
                                    <span className="text-xs font-black uppercase tracking-wider text-white block">{item.label}</span>
                                    <span className="text-[9px] text-white/40 font-medium block">{item.desc}</span>
                                </div>
                            </div>
                        ))}
                        
                        {/* Duplicated Set for infinite loop */}
                        {[
                            {
                                label: 'WhatsApp API',
                                desc: 'Notificações Automáticas',
                                logo: () => (
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" fill="#25D366">
                                        <path d="M20.52 3.48A11.96 11.96 0 0 0 11.97 0a12 12 0 0 0-10.4 18l.12 4.2L6 20.84a12 12 0 0 0 5.97 1.6h.01a12 12 0 0 0 8.54-20.96Zm-8.55 17.55a9.92 9.92 0 0 1-5.07-1.39l-.36-.21-3.76 1.18 1.18-3.66-.23-.38a9.91 9.91 0 1 1 8.24 4.46Zm5.44-7.42c-.3-.15-1.78-.88-2.05-1a.33.33 0 0 0-.17-.05c-.15 0-.3.2-.41.34-.11.14-.23.28-.33.41l-.22.25c-.1.12-.2.14-.52 0-.29-.15-1.22-.45-2.32-1.43a8.67 8.67 0 0 1-1.61-2.05c-.15-.24-.13-.37.1-.51l.3-.2c.1-.06.17-.15.25-.23.08-.09.11-.15.17-.25.06-.1 0-.19-.03-.27l-.46-1.12c-.11-.26-.22-.22-.3-.22h-.25c-.09 0-.24.03-.38.19-.14.15-.55.53-.55 1.3 0 .77.57 1.51.65 1.62.08.11 1.12 2.72 2.72 3.82.37.26.66.41 1.05.52.45.14.86.12 1.19.07.36-.05 1.12-.46 1.28-.9.16-.44.16-.82.11-.9-.05-.08-.18-.13-.38-.23Z" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Autentique',
                                desc: 'Assinaturas Digitais',
                                logo: () => (
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" fill="#1AD1B5">
                                        <path d="m18.54 1.225-.27 1.66a10.57 10.57 0 0 0-6.114-2.32L0 11.99h12.156V6.062c3.199 0 5.74 2.434 5.74 5.917 0 3.687-2.614 5.98-5.73 5.98-2.594 0-4.648-1.557-5.429-3.898L0 11.984c0 6.43 4.591 11.45 11.543 11.45 1.666 0 4.259-.383 6.706-2.325l.29 1.64H24V1.225Z" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Google Calendar',
                                desc: 'Agendamento Sincronizado',
                                logo: () => (
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 flex-shrink-0" fill="#4285F4">
                                        <path d="M22.0113 3.269h-5.8219a4.2894 4.2894 0 0 0-4.1854 3.3452A4.2894 4.2894 0 0 0 7.8186 3.269h-5.818A2.0007 2.0007 0 0 0 0 5.2697v10.2434a2.0007 2.0007 0 0 0 2.0007 2.0007h3.7372c4.2574 0 5.5299 1.0244 6.138 3.133a.112.112 0 0 0 .1121.084h.024a.112.112 0 0 0 .112-.084c.6122-2.1086 1.8807-3.133 6.138-3.133h3.7372a2.0007 2.0007 0 0 0 2.0007-2.0007V5.2697a2.0007 2.0007 0 0 0-2.0007-2.0007z" />
                                    </svg>
                                )
                            },
                            {
                                label: 'Asaas Gateway',
                                desc: 'Boletos e Pix',
                                logo: () => (
                                    <svg viewBox="0 0 100 100" className="w-8 h-8 flex-shrink-0" fill="none">
                                        <defs>
                                            <linearGradient id="asaasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#00A3FF" />
                                                <stop offset="100%" stopColor="#0030B8" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="50" cy="50" r="46" fill="url(#asaasGrad)" />
                                        <path d="M32 52 l12 12 l28 -28" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )
                            },
                            {
                                label: 'PJe & Tribunais',
                                desc: 'Rastreamento de Prazos',
                                logo: () => (
                                    <svg viewBox="0 0 100 100" className="w-8 h-8 flex-shrink-0" fill="none">
                                        <circle cx="50" cy="50" r="46" fill="#004A8F" />
                                        <path d="M50 22 v52 M30 38 h40 M38 52 c0 6 5 11 12 11 s12-5 12-11" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
                                        <circle cx="50" cy="22" r="3" fill="#FFB900" />
                                        <circle cx="30" cy="38" r="3" fill="#FFB900" />
                                        <circle cx="70" cy="38" r="3" fill="#FFB900" />
                                        <text x="50" y="82" fill="#fff" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">PJe</text>
                                    </svg>
                                )
                            },
                            {
                                label: 'Nuvem Segura AWS',
                                desc: 'Backup Criptografado',
                                logo: () => (
                                    <svg viewBox="0 0 100 60" className="w-12 h-8 flex-shrink-0" fill="none">
                                        <path d="M22.5 35c0 4-2 6-5.5 6-3 0-5-2-5-5.5 0-4.5 3-7 10.5-7.5v7zm10.5 5V21h-5v3.5c-2-3-5.5-4-8.5-4C11.5 20.5 6 25 6 32.5c0 7 5 11.5 12.5 11.5 4 0 7-1.5 9-4.5v4.5h5zm20-19l-4.5 16-4.5-16h-5.5l7.5 24h5.5l7.5-24h-6zm15.5 8c0-3.5 2-5 5.5-5 3 0 5 1.5 5 4.5v.5c-7 .5-10.5 2-10.5 5 0 2.5 1.5 4 4.5 4 3 0 5-1.5 6.5-3.5V39c-1.5 2-4.5 3.5-7.5 3.5-5.5 0-8-3-8-7.5zm16 4.5V26.5c0-4-3-6-7.5-6-3.5 0-6.5 1.5-8 3.5l3.5 3c1-1.5 2.5-2.5 4.5-2.5 2.5 0 3.5 1 3.5 3V29c-6 .5-10 2.5-10 7 0 4 3 6.5 7.5 6.5 3.5 0 5.5-1.5 6.5-3.5V39h5z" fill="#fff" />
                                        <path d="M12 45c10 8 38 12 76 0" stroke="#FF9900" strokeWidth="4" strokeLinecap="round" />
                                        <path d="M82 42.5l7.5 4.5-5-6.5" stroke="#FF9900" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="#FF9900" />
                                    </svg>
                                )
                            }
                        ].map((item, idx) => (
                            <div key={`dup-${idx}`} className="flex items-center gap-4 px-8 py-2 opacity-50 hover:opacity-100 transition-all duration-300 cursor-pointer">
                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                    <item.logo />
                                </div>
                                <div className="text-left">
                                    <span className="text-xs font-black uppercase tracking-wider text-white block">{item.label}</span>
                                    <span className="text-[9px] text-white/40 font-medium block">{item.desc}</span>
                                </div>
                            </div>
                        ))}
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
                                <div className="w-16 h-16 rounded-2xl bg-[#B89B5E]/10 text-[#4F73F5] flex items-center justify-center mb-10 border border-[#EAE6DF] group-hover:scale-110 transition-transform duration-500">
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

// Interactive AI Simulator Section (Item 1)
function AiSimulatorSection() {
    const documents = [
        {
            id: 'contrato',
            name: 'Contrato de Aluguel.docx',
            type: 'Contrato de Locação',
            safeScore: 78,
            analysis: {
                summary: 'Contrato de locação residencial padrão. Identificadas cláusulas com riscos potenciais de rescisão antecipada e reajuste acima dos limites legais.',
                risks: [
                    { title: 'Reajuste Abusivo', desc: 'Cláusula 4.2 permite reajuste semestral. A lei exige reajuste anual.' },
                    { title: 'Foro de Eleição Desvantajoso', desc: 'Cláusula 12 define foro de eleição em comarca distante do imóvel.' },
                ],
                suggestions: 'Alterar a periodicidade de reajuste para anual (conforme Lei do Inquilinato) e estabelecer o foro na comarca do imóvel.'
            },
            questions: [
                { q: 'Existem multas de rescisão abusivas?', a: 'Sim. A Cláusula 9 estipula multa de rescisão equivalente a 6 meses de aluguel, o que ultrapassa a prática legal comum de 3 meses proporcionais. Sugerimos readequar.' },
                { q: 'Qual o índice de correção utilizado?', a: 'O contrato menciona IGPM. Dada a alta volatilidade histórica do IGPM, é recomendável adicionar o IPCA como índice alternativo ou teto.' },
            ]
        },
        {
            id: 'peticao',
            name: 'Petição Inicial Cobrança.pdf',
            type: 'Ação Monitória',
            safeScore: 92,
            analysis: {
                summary: 'Petição inicial de cobrança fundamentada em duplicatas vencidas. Estrutura processual robusta com fatos bem delineados e pedidos alinhados à jurisprudência.',
                risks: [
                    { title: 'Juros de Mora Excedentes', desc: 'Cláusula de juros estipulada em 2% ao mês. O teto legal é 1% ao mês salvo convenção específica.' },
                ],
                suggestions: 'Reduzir os juros de mora para 1% ao mês para mitigar riscos de contestação parcial e sucumbência recíproca.'
            },
            questions: [
                { q: 'O valor da causa está correto?', a: 'O valor da causa reflete exatamente o somatório do principal corrigido mais juros legais acumulados até a data da propositura (R$ 48.550,00). Está em plena conformidade com o Art. 292 do CPC.' },
                { q: 'Há risco de prescrição da dívida?', a: 'As duplicatas venceram há 3 anos. O prazo prescricional para cobrança de dívidas líquidas constantes de instrumento público ou particular é de 5 anos (Art. 206, § 5º, I do CC). Logo, está seguro.' },
            ]
        },
        {
            id: 'trabalhista',
            name: 'Acordo Homologação.docx',
            type: 'Acordo Extrajudicial',
            safeScore: 65,
            analysis: {
                summary: 'Minuta de termo de acordo trabalhista extrajudicial. Pede atenção especial para as verbas indenizatórias e a quitação geral do contrato de trabalho.',
                risks: [
                    { title: 'Quitação Geral Irrestrita', desc: 'Cláusula 5 prevê quitação geral irrestrita sem ressalvas, o que pode sofrer resistência de homologação em juízo.' },
                    { title: 'Multa por Descumprimento', desc: 'Cláusula penal fixada em 100% do saldo restante. Jurisprudência costuma moderar para 50%.' },
                ],
                suggestions: 'Especificar detalhadamente as verbas objeto da quitação para garantir a segurança jurídica da homologação.'
            },
            questions: [
                { q: 'Quais verbas estão inclusas no acordo?', a: 'O termo inclui saldo de salário, férias proporcionais + 1/3, 13º proporcional e indenização estabilidade. Não há discriminação de FGTS, o que exige atenção.' },
                { q: 'Este termo prevê assistência sindical?', a: 'Não há menção à assistência sindical. Para termos de acordo extrajudiciais, a homologação exige que as partes estejam devidamente representadas por advogados distintos.' },
            ]
        }
    ];

    const [activeDocId, setActiveDocId] = useState('contrato');
    const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
        { sender: 'ai', text: 'Olá! Sou a IA do Advus. Selecione um documento ao lado e clique em qualquer pergunta sugerida para simular a análise automática.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const doc = documents.find(d => d.id === activeDocId) || documents[0];

    const handleSelectDoc = (id: string) => {
        setActiveDocId(id);
        const selected = documents.find(d => d.id === id) || documents[0];
        setChatMessages([
            { sender: 'ai', text: `Olá! Sou a IA do Advus. Analisei o documento "${selected.name}". O score de conformidade jurídica é de ${selected.safeScore}%. O que deseja saber sobre ele?` }
        ]);
    };

    const handleQuestionClick = (questionText: string, answerText: string) => {
        if (isTyping) return;
        
        // Add user question
        setChatMessages(prev => [...prev, { sender: 'user', text: questionText }]);
        setIsTyping(true);

        // Simulate typing
        setTimeout(() => {
            setIsTyping(false);
            setChatMessages(prev => [...prev, { sender: 'ai', text: answerText }]);
        }, 1200);
    };

    return (
        <section className="py-24 bg-[#050505] relative overflow-hidden">
            {/* Soft Glow Elements */}
            <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-[#4F73F5]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-[#B89B5E]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <ScrollReveal>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4F73F5]/10 border border-[#4F73F5]/30 rounded-full text-xs font-black uppercase tracking-widest text-[#4F73F5] mb-6">
                            <Sparkles size={14} className="animate-pulse" />
                            Inteligência Artificial Integrada
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-none font-display uppercase">
                            Simulador de IA <span className="text-[#4F73F5]">Advus</span>
                        </h2>
                        <p className="mt-6 text-white/50 text-base sm:text-lg leading-relaxed font-medium">
                            Teste como nossa inteligência artificial audita riscos jurídicos, aponta inconformidades e responde a dúvidas complexas em segundos.
                        </p>
                    </ScrollReveal>
                </div>

                <ScrollReveal>
                    {/* Simulated Interface Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl relative z-10">
                        
                        {/* Sidebar: Documents selector (4 columns) */}
                        <div className="lg:col-span-4 space-y-6 lg:border-r lg:border-white/5 lg:pr-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Selecione o Documento</h3>
                            <div className="space-y-3">
                                {documents.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => handleSelectDoc(d.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left ${
                                            activeDocId === d.id
                                                ? 'bg-[#4F73F5]/10 border-[#4F73F5]/50 text-white'
                                                : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText size={20} className={activeDocId === d.id ? 'text-[#4F73F5]' : 'text-white/40'} />
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[180px]">{d.name}</p>
                                                <p className="text-[10px] text-white/40 font-medium">{d.type}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-xs font-black font-display ${
                                            d.safeScore >= 80 
                                                ? 'bg-emerald-500/10 text-emerald-400' 
                                                : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                            {d.safeScore}%
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Automatic Analysis Summary */}
                            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Análise do Advus</h4>
                                    <span className="text-[10px] text-emerald-400 font-black uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">Pronto</span>
                                </div>
                                <p className="text-xs text-white/55 leading-relaxed font-medium">
                                    {doc.analysis.summary}
                                </p>
                            </div>
                        </div>

                        {/* Analysis & Chat Simulation (8 columns) */}
                        <div className="lg:col-span-8 flex flex-col h-[520px] justify-between lg:pl-4">
                            {/* Top Risk & Suggestion Badges */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-white/5">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                        <AlertTriangle size={12} /> Riscos Identificados
                                    </span>
                                    <div className="space-y-1.5">
                                        {doc.analysis.risks.map((r, i) => (
                                            <div key={i} className="text-xs text-white/70 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl">
                                                <strong className="text-white font-bold block">{r.title}</strong>
                                                <span className="text-white/50 text-[11px] leading-tight block mt-0.5">{r.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 size={12} /> Sugestão da IA Advus
                                    </span>
                                    <div className="text-xs text-white/70 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl h-[86px] overflow-y-auto leading-relaxed">
                                        {doc.analysis.suggestions}
                                    </div>
                                </div>
                            </div>

                            {/* Chat Screen area */}
                            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-2 custom-scrollbar">
                                {chatMessages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                                            msg.sender === 'user'
                                                ? 'bg-[#4F73F5] text-white font-medium rounded-tr-none'
                                                : 'bg-white/5 border border-white/5 text-white/80 rounded-tl-none font-medium'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 text-xs text-white/40 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Question Suggestion pill row & placeholder input */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-white/30">Sugestões de Perguntas:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {doc.questions.map((q, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleQuestionClick(q.q, q.a)}
                                                disabled={isTyping}
                                                className="text-[11px] font-bold bg-[#4F73F5]/10 hover:bg-[#4F73F5]/20 border border-[#4F73F5]/20 text-[#4F73F5] px-3.5 py-1.5 rounded-full transition-all duration-300 disabled:opacity-50 text-left"
                                            >
                                                {q.q}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Selecione uma das perguntas sugeridas acima para simular..."
                                        className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-xs text-white/30 placeholder-white/20 outline-none cursor-not-allowed"
                                    />
                                    <button disabled className="absolute right-2.5 top-2 p-1.5 bg-white/5 text-white/20 rounded-lg cursor-not-allowed">
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}



// Interactive Comparison Table Section (Item 3)
function ComparisonSection() {
    const comparisonData: any = [
        {
            category: 'Gestão de Processos & Prazos',
            items: [
                { feature: 'Painel visual Kanban interativo de andamento processual', advus: true, legacy: 'Lista simples', sheet: 'Não possui' },
                { feature: 'Varredura automática e alertas de novos prazos e intimações', advus: true, legacy: 'Muitas falhas', sheet: 'Manual' },
                { feature: 'Agenda jurídica compartilhada e sincronizada', advus: true, legacy: 'Básico', sheet: 'Manual' }
            ]
        },
        {
            category: 'Inteligência Artificial (IA)',
            items: [
                { feature: 'Auditoria de contratos e peças jurídicas com score de segurança', advus: true, legacy: 'Não possui', sheet: 'Não possui' },
                { feature: 'Cláusulas de risco destacadas com sugestão automática de correção', advus: true, legacy: 'Não possui', sheet: 'Não possui' },
                { feature: 'Chatbot inteligente de auditoria integrado a cada arquivo', advus: true, legacy: 'Não possui', sheet: 'Não possui' }
            ]
        },
        {
            category: 'Controle Financeiro & Honorários',
            items: [
                { feature: 'Módulo financeiro integrado com fluxo de caixa consolidado', advus: true, legacy: 'Pago à parte', sheet: 'Desconectado' },
                { feature: 'Lançamento automático de honorários contratuais e sucumbenciais', advus: true, legacy: 'Parcial', sheet: 'Manual' },
                { feature: 'Geração nativa de boletos e chaves Pix via integração Asaas', advus: true, legacy: 'Sem integração', sheet: 'Não possui' }
            ]
        },
        {
            category: 'Cadeia de Valor & Horas (Timesheet)',
            items: [
                { feature: 'Mapeamento visual e otimização por Cadeia de Valor', advus: true, legacy: 'Não possui', sheet: 'Não possui' },
                { feature: 'Lançamento de horas faturáveis (Timesheet) integrado a clientes', advus: true, legacy: 'Não possui', sheet: 'Manual' }
            ]
        },
        {
            category: 'Documentos & Assinaturas',
            items: [
                { feature: 'Editor de textos avançado integrado com templates (modelos)', advus: true, legacy: 'Upload de Word', sheet: 'Local' },
                { feature: 'Assinatura digital integrada com validade legal (Autentique)', advus: true, legacy: 'Pago à parte', sheet: 'Não possui' }
            ]
        }
    ];

    const [openCategoryIdx, setOpenCategoryIdx] = useState<number>(0);

    const toggleCategory = (idx: number) => {
        setOpenCategoryIdx(openCategoryIdx === idx ? -1 : idx);
    };

    return (
        <section className="py-24 bg-[#FAF8F5] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] bg-[#4F73F5]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <ScrollReveal>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4F73F5]/10 border border-[#4F73F5]/30 rounded-full text-xs font-black uppercase tracking-widest text-[#4F73F5] mb-6">
                            <CheckSquare size={14} />
                            Comparação de Mercado
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-[#2E2C29] tracking-tighter leading-none font-display uppercase">
                            Compare o <span className="text-[#4F73F5]">Advus</span> com Alternativas
                        </h2>
                        <p className="mt-6 text-[#2E2C29]/65 text-base sm:text-lg leading-relaxed font-medium">
                            Veja em detalhes o salto tecnológico que sua operação jurídica ganha ao migrar para a inteligência artificial do Advus.
                        </p>
                    </ScrollReveal>
                </div>

                <ScrollReveal>
                    {/* Matrix Card Grid container */}
                    <div className="bg-white border border-[#EAE6DF] rounded-[2.5rem] p-4 md:p-8 shadow-[0_15px_40px_rgba(79,115,245,0.03)]">
                        {/* Table Header Row */}
                        <div className="hidden md:grid grid-cols-12 gap-4 pb-6 border-b border-[#EAE6DF] text-center text-xs font-black uppercase tracking-widest text-[#2E2C29]/50">
                            <div className="col-span-6 text-left pl-4">Recursos & Funcionalidades</div>
                            <div className="col-span-2 text-[#4F73F5] font-black">ADVUS (COM IA)</div>
                            <div className="col-span-2">SISTEMAS LEGADOS</div>
                            <div className="col-span-2">PLANILHAS / PAPEL</div>
                        </div>

                        {/* Accordion Categories */}
                        <div className="space-y-4 mt-6">
                            {comparisonData.map((cat, catIdx) => {
                                const isOpen = openCategoryIdx === catIdx;
                                return (
                                    <div key={catIdx} className="border border-[#EAE6DF] rounded-2xl overflow-hidden transition-all duration-300">
                                        {/* Accordion Trigger Header */}
                                        <button
                                            onClick={() => toggleCategory(catIdx)}
                                            className="w-full flex items-center justify-between p-5 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 transition-all text-left"
                                        >
                                            <h3 className="text-sm md:text-base font-black text-[#2E2C29] uppercase tracking-tight font-display">{cat.category}</h3>
                                            <span className="text-[#2E2C29]/40">
                                                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </span>
                                        </button>

                                        {/* Accordion Rows */}
                                        {isOpen && (
                                            <div className="divide-y divide-[#EAE6DF] bg-white">
                                                {cat.items.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5 px-5 items-center text-center text-xs font-medium">
                                                        
                                                        {/* Feature Description */}
                                                        <div className="col-span-1 md:col-span-6 text-left text-[#2E2C29]/80 font-semibold md:pl-2">
                                                            {item.feature}
                                                        </div>

                                                        {/* Advus column */}
                                                        <div className="col-span-1 md:col-span-2 bg-[#4F73F5]/5 md:bg-transparent py-2.5 md:py-0 rounded-xl md:rounded-none border border-[#4F73F5]/10 md:border-none">
                                                            <span className="md:hidden block text-[10px] text-[#2E2C29]/40 uppercase tracking-widest font-black mb-1">Advus</span>
                                                            <div className="flex justify-center text-emerald-600 font-bold text-xs">
                                                                {item.advus === true ? <Check size={18} className="text-emerald-500" /> : item.advus}
                                                            </div>
                                                        </div>

                                                        {/* Legacy software column */}
                                                        <div className="col-span-1 md:col-span-2 py-2.5 md:py-0">
                                                            <span className="md:hidden block text-[10px] text-[#2E2C29]/40 uppercase tracking-widest font-black mb-1">Sistemas Legados</span>
                                                            <div className="flex justify-center text-[#2E2C29]/50 text-xs font-bold">
                                                                {item.legacy === false ? <X size={18} className="text-rose-500/80" /> : item.legacy}
                                                            </div>
                                                        </div>

                                                        {/* Sheets / Manual column */}
                                                        <div className="col-span-1 md:col-span-2 py-2.5 md:py-0">
                                                            <span className="md:hidden block text-[10px] text-[#2E2C29]/40 uppercase tracking-widest font-black mb-1">Planilhas</span>
                                                            <div className="flex justify-center text-[#2E2C29]/50 text-xs font-bold">
                                                                {item.sheet === false ? <X size={18} className="text-rose-500/80" /> : item.sheet}
                                                            </div>
                                                        </div>

                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
            <AiSimulatorSection />
            <PricingSection />
            <ComparisonSection />
            <TestimonialsSection />
            <FAQSection />
            <CTASection />
            <Footer />
        </div>
    );
}
