import React, { useEffect, useState } from 'react';
import { Briefcase, Clock, TrendingUp, ChevronRight, Scale, FileText } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { usePortalAuth } from '../../context/PortalAuthContext';
import { motion } from 'framer-motion';

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCount = data?.activeProcesses || 0;
  const closedCount = data?.closedProcesses || 0;
  const totalCount = data?.totalProcesses || 0;
  const updates = data?.recentUpdates || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const stats = [
    {
      label: 'Processos Ativos',
      value: activeCount,
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
    },
    {
      label: 'Novas Movimentações',
      value: updates.length,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
    },
    {
      label: 'Total de Processos',
      value: totalCount,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Cliente'} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Acompanhe aqui o andamento dos seus processos jurídicos.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="bg-white dark:bg-white/[0.06] rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] hover:shadow-md dark:hover:bg-white/[0.08] transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon size={20} className={stat.text} />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Recent Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="bg-white dark:bg-white/[0.06] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/[0.06]">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Movimentações Recentes</h3>
              <Link to="/portal/processos" className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                Ver tudo <ChevronRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {updates.length === 0 ? (
                <div className="p-8 text-center">
                  <Scale className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 dark:text-white/40">Nenhuma movimentação recente.</p>
                </div>
              ) : (
                updates.slice(0, 5).map((update: any, idx: number) => (
                  <div key={idx} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{update.description}</p>
                        <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
                          Processo nº {update.processNumber} • {update.processTitle}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-slate-500 dark:text-white/50">
                          {new Date(update.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-white/30">
                          {new Date(update.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Right - Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-4"
        >
          {/* View Processes CTA */}
          <Link to="/portal/processos" className="block">
            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-5 text-white relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                <Briefcase className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Acessar</p>
                <h4 className="text-lg font-black mb-1">Meus Processos</h4>
                <p className="text-xs text-white/50 mb-4">Veja detalhes, movimentações e documentos.</p>
                <div className="flex items-center gap-2 text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                  Ver todos <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </Link>

          {/* Encerrados */}
          <div className="bg-white dark:bg-white/[0.06] rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08]">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10">
                <FileText size={18} className="text-slate-500 dark:text-white/50" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">Encerrados</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{closedCount}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-white/40 leading-relaxed">
              Processos finalizados e arquivados estão disponíveis para consulta.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-br from-blue-500/10 to-violet-500/10 dark:from-blue-500/20 dark:to-violet-500/20 rounded-2xl p-5 border border-blue-200/50 dark:border-blue-500/20">
            <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">Precisa de ajuda?</p>
            <p className="text-xs text-slate-500 dark:text-white/50 mb-4 leading-relaxed">
              Entre em contato com seu advogado responsável.
            </p>
            <button className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-colors">
              Contatar Escritório
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PortalDashboard;
