import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { haptics } from '../../utils/haptics';

const PortalLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = usePortalAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    haptics.medium();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/portal/login', { email, password });
      login(response.data.token, response.data.client);
      addToast('Login realizado com sucesso!', 'success');
      navigate('/portal');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'E-mail ou senha inválidos.';
      setError(msg);
      addToast(msg, 'error');
      haptics.heavy();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050A18] relative overflow-hidden font-sans selection:bg-primary/30 selection:text-white">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-indigo-500/20 to-transparent blur-[120px]" 
        />
      </div>

      <div className="container max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 relative z-10 items-center">
        {/* Brand Section */}
        <div className="hidden lg:block space-y-12 pr-12 border-r border-white/5">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-5"
          >
            <div className="w-16 h-16 bg-white rounded-[1.25rem] shadow-2xl flex items-center justify-center p-3">
              <img src="/Logo-pwa2.png" alt="Advus" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-black text-white tracking-tighter leading-none">ADVUS</span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mt-1">Portal do Cliente</span>
            </div>
          </motion.div>

          <div className="space-y-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-black text-white leading-[1.05] tracking-tighter"
            >
              Transparência na palma da <span className="text-primary italic">sua mão.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-white/50 leading-relaxed max-w-md font-medium"
            >
              Acompanhe cada etapa do seu processo com segurança, clareza e agilidade. O portal definitivo para a sua jornada jurídica.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-10"
          >
            {[
              { label: 'Seguro', icon: Shield },
              { label: 'Realtime', icon: Sparkles },
              { label: 'Completo', icon: Mail }
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <item.icon size={20} className="text-primary/60" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 sm:p-14 shadow-2xl relative overflow-hidden group"
        >
          {/* Internal Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />
          
          <div className="relative z-10 space-y-10">
            <div className="space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-2">
                <Shield size={14} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Acesso Restrito</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter">Bem-vindo ao Portal</h1>
              <p className="text-white/40 text-sm font-medium">Insira suas credenciais para acessar seus processos.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 group-focus-within:text-primary transition-colors">E-mail de Acesso</label>
                  <div className="relative">
                    <Mail size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@email.com"
                      required
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] py-5 pl-16 pr-6 text-white text-sm font-bold focus:border-primary outline-none transition-all focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 group-focus-within:text-primary transition-colors">Sua Senha</label>
                  <div className="relative">
                    <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] py-5 pl-16 pr-16 text-white text-sm font-bold focus:border-primary outline-none transition-all focus:ring-4 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => { haptics.light(); setShowPassword(!showPassword); }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[10px] font-black uppercase tracking-widest text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-dark text-white font-black uppercase text-xs tracking-[0.3em] py-6 rounded-[1.75rem] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 shadow-2xl shadow-primary/30"
              >
                {isLoading ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full" 
                  />
                ) : (
                  <>
                    Acessar meu Painel
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                Escritório de Advocacia parceiro <span className="text-white/40">Advus</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Label */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/20 uppercase tracking-[0.5em] hidden sm:block">
        © 2026 Advus Technology
      </div>
    </div>
  );
};

export default PortalLogin;
