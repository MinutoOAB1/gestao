import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('advus-cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('advus-cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('advus-cookie-consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[400px] z-[9999]"
                >
                    <div className="bg-white dark:bg-app-card border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-2xl p-6 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                        
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Shield size={20} className="text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-app-text-main uppercase tracking-widest mb-1">Privacidade & Cookies</h3>
                                <p className="text-xs text-app-text-muted leading-relaxed mb-4">
                                    Utilizamos cookies para melhorar sua experiência e garantir a segurança jurídica de seus dados conforme a <Link to="/legal/lgpd" className="text-primary underline">LGPD</Link>.
                                </p>
                            </div>
                            <button onClick={() => setIsVisible(false)} className="text-app-text-muted hover:text-app-text-main transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleAccept}
                                className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                <Check size={12} /> Aceitar Tudo
                            </button>
                            <button
                                onClick={handleDecline}
                                className="flex-1 bg-gray-100 dark:bg-white/5 text-app-text-muted py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            >
                                Recusar
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
