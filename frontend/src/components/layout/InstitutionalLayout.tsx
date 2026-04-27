import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrandLogo } from '../ui/BrandLogo';

interface InstitutionalLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export const InstitutionalLayout: React.FC<InstitutionalLayoutProps> = ({ children, title, subtitle }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-accent selection:text-primary-dark font-sans overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <BrandLogo variant="light" size="md" />
                        </div>
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate('/login')} className="text-white/70 font-bold hover:text-white transition-colors text-sm uppercase">Entrar</button>
                            <button onClick={() => navigate('/register')} className="px-6 py-2.5 bg-accent text-white font-black rounded-xl hover:bg-white hover:text-primary-dark transition-all text-xs uppercase tracking-widest">Acessar</button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="pt-40 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-6 font-display uppercase"
                        >
                            {title}
                        </motion.h1>
                        {subtitle && (
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg md:text-xl text-white/50 leading-relaxed font-medium"
                            >
                                {subtitle}
                            </motion.p>
                        )}
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 md:p-16 backdrop-blur-sm"
                    >
                        {children}
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-24 bg-primary-dark border-t border-white/5 text-white/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-16 mb-20">
                        <div className="col-span-2 md:col-span-1">
                            <BrandLogo variant="light" size="sm" className="mb-8" />
                            <p className="text-xs font-medium leading-loose mb-8 max-w-xs">A plataforma definitiva para escritórios de advocacia que não aceitam nada menos que a excelência.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Tecnologia</h4>
                            <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                                <li><a href="#features" className="hover:text-accent transition-colors">Recursos</a></li>
                                <li><a href="#" className="hover:text-accent transition-colors">IA Jurídica</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Empresa</h4>
                            <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                                <li><button onClick={() => navigate('/about')} className="hover:text-accent transition-colors text-left">Sobre Nós</button></li>
                                <li><button onClick={() => navigate('/contact')} className="hover:text-accent transition-colors text-left">Contato</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Legal</h4>
                            <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                                <li><button onClick={() => navigate('/terms')} className="hover:text-accent transition-colors text-left">Termos</button></li>
                                <li><button onClick={() => navigate('/privacy')} className="hover:text-accent transition-colors text-left">Privacidade</button></li>
                                <li><button onClick={() => navigate('/lgpd')} className="hover:text-accent transition-colors text-left">LGPD</button></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
                        <p>© 2026 Advus Global. Todos os direitos reservados.</p>
                        <p className="text-accent">Feito para a Elite</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
