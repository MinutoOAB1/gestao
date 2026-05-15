import React, { useEffect, useState, useMemo } from 'react';
import { Briefcase, Clock, TrendingUp, ChevronRight, Scale, FileText, Calendar, Bell, ExternalLink, Sparkles, UserCircle } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../../utils/haptics';
import { clsx } from 'clsx';

const PortalDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = usePortalAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/portal/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const stats = useMemo(() => {
    const activeCount = data?.activeProcesses || 0;
    const updatesCount = data?.recentUpdates?.length || 0;
    const totalCount = data?.totalProcesses || 0;

    return [
      {
        label: 'Processos Ativos',
        value: activeCount,
        icon: Briefcase,
        color: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20'
      },
      {
        label: 'Atualizações',
        value: updatesCount,
        icon: Bell,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20'
      },
      {
        label: 'Total Geral',
        value: totalCount,
        icon: TrendingUp,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20'
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full" 
          />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text-muted animate-pulse">Sincronizando painel...</p>
        </div>
      </div>
    );
  }

  const updates = data?.recentUpdates || [];

  return (
    <div className="space-y-12 pb-20">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-2">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Portal do Cliente</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-app-text-main tracking-tighter leading-tight md:leading-none">
            {getGreeting()}, <span className="text-primary">{user?.name?.split(' ')[0] || 'Cliente'}</span> 👋
          </h1>
          <p className="text-sm text-app-text-muted font-medium max-w-lg">
            Seja bem-vindo ao seu espaço de transparência. Aqui você acompanha cada passo da sua jornada jurídica em tempo real.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-app-card border border-app-stroke p-4 md:p-4 rounded-2xl md:rounded-[2rem] shadow-xl w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-app-bg border border-app-stroke flex items-center justify-center text-primary">
            <Calendar size={20} />
          </div>
          <div className="pr-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted">Hoje é dia</p>
            <p className="text-sm font-black text-app-text-main">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-app-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-app-stroke shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={80} />
            </div>
            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center border mb-6 transition-transform group-hover:scale-110", stat.bg, stat.border, stat.color)}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted mb-1">{stat.label}</p>
            <p className="text-4xl font-black text-app-text-main tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Updates */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-app-card rounded-[2rem] md:rounded-[3rem] border border-app-stroke shadow-2xl overflow-hidden">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-app-stroke/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Clock size={20} />
                </div>
                <h3 className="text-lg font-black text-app-text-main uppercase tracking-tight">Movimentações Recentes</h3>
              </div>
              <Link 
                to="/portal/processos" 
                onClick={() => haptics.light()}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-2"
              >
                Ver Histórico <ChevronRight size={14} />
              </Link>
            </div>
            
            <div className="divide-y divide-app-stroke/30">
              {updates.length === 0 ? (
                <div className="px-10 py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-app-bg border border-app-stroke rounded-[2rem] flex items-center justify-center mx-auto text-app-text-muted/30">
                    <Scale size={40} />
                  </div>
                  <p className="text-sm font-bold text-app-text-muted italic">Nenhuma nova movimentação no momento.</p>
                </div>
              ) : (
                updates.slice(0, 6).map((update: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="px-6 md:px-10 py-5 md:py-6 hover:bg-primary/5 transition-colors group cursor-default"
                  >
                    <div className="flex items-start gap-6">
                      <div className="mt-1 relative">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_rgba(0,112,255,0.5)] group-hover:scale-125 transition-transform" />
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-16 bg-app-stroke/50" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                          <p className="text-sm font-black text-app-text-main leading-tight group-hover:text-primary transition-colors">{update.description}</p>
                          <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest whitespace-nowrap">
                            {new Date(update.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {new Date(update.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted flex items-center gap-2">
                          <Briefcase size={12} />
                          Processo: <span className="text-app-text-main/60">{update.processTitle}</span>
                          <span className="opacity-40">•</span>
                          <span className="font-mono text-[9px]">{update.processNumber}</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Sidebar Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-8"
        >
          {/* Main CTA */}
          <Link to="/portal/processos" onClick={() => haptics.medium()}>
            <div className="bg-primary rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden group shadow-2xl shadow-primary/40 hover:-translate-y-1 transition-all">
              <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                <Briefcase size={180} />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h4 className="text-2xl font-black tracking-tight leading-none mb-2">Meus Processos</h4>
                  <p className="text-xs text-white/70 font-medium leading-relaxed">
                    Acesse a lista completa, documentos anexados e o histórico detalhado de cada ação.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 w-fit px-4 py-2 rounded-full backdrop-blur-md group-hover:bg-white group-hover:text-primary transition-all">
                  Explorar Agora <ExternalLink size={14} />
                </div>
              </div>
            </div>
          </Link>

          {/* Help Card */}
          <div className="bg-app-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-app-stroke shadow-xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <UserCircle size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted">Atendimento</p>
                <p className="text-sm font-black text-app-text-main">Precisa de Ajuda?</p>
              </div>
            </div>
            <p className="text-xs text-app-text-muted font-medium leading-relaxed">
              Dúvidas sobre o andamento do seu processo? Entre em contato diretamente com seu advogado.
            </p>
            <button 
              onClick={() => haptics.light()}
              className="w-full bg-app-bg border border-app-stroke text-app-text-main font-black uppercase text-[10px] tracking-[0.2em] py-4 rounded-2xl hover:bg-app-stroke/30 transition-all active:scale-95"
            >
              Falar com Escritório
            </button>
          </div>

          {/* System Status */}
          <div className="flex items-center justify-center gap-3 opacity-40">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-app-text-muted">Sistema Online & Sincronizado</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PortalDashboard;
