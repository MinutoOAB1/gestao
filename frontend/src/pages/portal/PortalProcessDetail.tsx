import React, { useEffect, useState } from 'react';
import { ChevronRight, Briefcase, ArrowLeft, Clock, MapPin, DollarSign, Calendar, Scale, Info, MessageSquare, ShieldCheck, Download } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../../utils/haptics';
import { clsx } from 'clsx';

const PortalProcessDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [process, setProcess] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProcess = async () => {
      try {
        const response = await api.get(`/portal/processes/${id}`);
        setProcess(response.data);
      } catch (error) {
        console.error('Failed to load process details', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProcess();
  }, [id]);

  const getStatusConfig = (status: string) => {
    if (status === 'OPEN' || status === 'ATIVO') {
      return { label: 'Em Tramitação', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    }
    if (status === 'SUSPENSO') {
      return { label: 'Suspenso', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    }
    return { label: status, color: 'text-app-text-muted', bg: 'bg-app-text-muted/10', border: 'border-app-text-muted/20' };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full" 
          />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text-muted animate-pulse">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-8">
        <div className="bg-app-card rounded-[2rem] md:rounded-[3rem] p-8 md:p-16 border border-app-stroke shadow-2xl text-center space-y-8 max-w-lg">
          <div className="w-24 h-24 bg-app-bg border border-app-stroke rounded-[2.5rem] flex items-center justify-center mx-auto text-app-text-muted/20">
            <Scale size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-app-text-main uppercase tracking-tight">Processo não encontrado</h3>
            <p className="text-sm text-app-text-muted font-medium">O registro solicitado não existe ou você não possui permissão para acessá-lo.</p>
          </div>
          <button
            onClick={() => { haptics.light(); navigate('/portal/processos'); }}
            className="w-full bg-primary text-white font-black uppercase text-xs tracking-widest py-5 rounded-[1.5rem] shadow-xl shadow-primary/30 active:scale-95 transition-all"
          >
            Voltar para Listagem
          </button>
        </div>
      </div>
    );
  }

  const status = getStatusConfig(process.status);
  const infoItems = [
    { label: 'Classe Processual', value: process.title, icon: Briefcase },
    { label: 'Área de Atuação', value: process.area || 'Civil', icon: Scale },
    { label: 'Tribunal / Comarca', value: process.court || 'Justiça Estadual', icon: MapPin },
    { label: 'Valor da Causa', value: process.value ? formatCurrency(process.value) : 'Sigiloso', icon: DollarSign },
    { label: 'Data de Início', value: process.createdAt ? new Date(process.createdAt).toLocaleDateString('pt-BR') : '-', icon: Calendar },
    { label: 'Próximo Marco', value: process.deadline ? new Date(process.deadline).toLocaleDateString('pt-BR') : 'Sem Prazo', icon: Clock },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <button
          onClick={() => { haptics.light(); navigate('/portal/processos'); }}
          className="group flex items-center gap-3 text-app-text-muted hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <div className="w-10 h-10 rounded-full border border-app-stroke flex items-center justify-center group-hover:border-primary/30 transition-all">
            <ArrowLeft size={16} />
          </div>
          Voltar para meus processos
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-black text-app-text-main tracking-tighter leading-tight md:leading-none uppercase">
                PROCESSO {process.number || 'S/N'}
              </h1>
              <div className={clsx("flex items-center gap-2 px-4 py-1.5 rounded-full border", status.bg, status.border, status.color)}>
                <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", status.color.replace('text-', 'bg-'))} />
                <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
              </div>
            </div>
            <p className="text-lg text-app-text-muted font-medium italic">{process.title}</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-3 bg-app-card border border-app-stroke px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-app-text-main hover:bg-app-stroke/30 transition-all active:scale-95 shadow-xl">
              <Download size={18} className="text-primary" />
              Exportar Detalhes
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-10">
          {/* Quick Info Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-app-card rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-app-stroke shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-all">
              <Info size={120} />
            </div>
            <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
              <Info size={16} className="text-primary" />
              Detalhamento Técnico
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10">
              {infoItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-app-bg border border-app-stroke flex items-center justify-center text-primary/60 group-hover:scale-110 transition-transform">
                    <item.icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-black text-app-text-main leading-tight">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Description Section */}
          {process.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-app-card rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-app-stroke shadow-xl"
            >
              <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.3em] mb-6">Síntese do Caso</h3>
              <p className="text-sm text-app-text-main/70 font-medium leading-relaxed whitespace-pre-wrap">{process.description}</p>
            </motion.div>
          )}

          {/* Detailed Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-app-card rounded-[2rem] md:rounded-[3rem] border border-app-stroke shadow-2xl overflow-hidden"
          >
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-app-stroke/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-black text-app-text-main uppercase tracking-tight">Caminho Processual</h3>
            </div>

            <div className="p-6 md:p-10">
              {process.updates && process.updates.length > 0 ? (
                <div className="space-y-0 relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-app-stroke to-transparent" />
                  
                  {process.updates.map((update: any, idx: number) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="flex gap-10 group mb-12 last:mb-0"
                    >
                      <div className="relative z-10">
                        <div className={clsx("w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110", 
                          idx === 0 ? "bg-primary border-primary shadow-[0_0_20px_rgba(0,112,255,0.4)] text-white" : "bg-app-bg border-app-stroke text-app-text-muted"
                        )}>
                          <Clock size={20} />
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <span className={clsx("text-[10px] font-black uppercase tracking-widest", idx === 0 ? "text-primary" : "text-app-text-muted")}>
                              {update.type || 'MOVIMENTAÇÃO'}
                            </span>
                            <h4 className="text-base font-black text-app-text-main uppercase tracking-tight">{update.description}</h4>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <p className="text-xs font-black text-app-text-main">{new Date(update.date).toLocaleDateString('pt-BR')}</p>
                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{new Date(update.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        {update.comment && (
                          <div className="bg-app-bg/50 border border-app-stroke p-5 rounded-2xl">
                            <p className="text-sm text-app-text-main/60 italic font-medium leading-relaxed">"{update.comment}"</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-app-bg border border-app-stroke rounded-[2.5rem] flex items-center justify-center mx-auto text-app-text-muted/10">
                    <Clock size={40} />
                  </div>
                  <p className="text-sm font-black text-app-text-muted uppercase tracking-widest">Aguardando as primeiras movimentações...</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Info & Actions */}
        <div className="space-y-8">
          {/* Lawyer Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/40 group"
          >
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <ShieldCheck size={200} />
            </div>
            <div className="relative z-10 space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Advogado Titular</h3>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-3xl font-black shadow-2xl">
                  {process.assignedTo ? process.assignedTo.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <p className="text-xl font-black tracking-tight leading-none mb-2">{process.assignedTo || 'Setor Jurídico'}</p>
                  <p className="text-xs text-white/60 font-medium">Responsável direto pelo seu caso</p>
                </div>
              </div>
              <div className="pt-8 border-t border-white/10 space-y-4">
                <button 
                  onClick={() => haptics.medium()}
                  className="w-full bg-white text-primary font-black uppercase text-[10px] tracking-[0.2em] py-5 rounded-[1.5rem] hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <MessageSquare size={16} />
                  Solicitar Contato
                </button>
              </div>
            </div>
          </motion.div>

          {/* Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-app-card rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 border border-app-stroke shadow-xl space-y-10"
          >
            <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
              <ShieldCheck size={16} className="text-primary" />
              Resumo da Atividade
            </h3>
            
            <div className="space-y-6">
              {[
                { label: 'Movimentações', value: process.updates?.length || 0, icon: Clock },
                { label: 'Status Atual', value: status.label, icon: ShieldCheck, color: status.color },
                { label: 'Duração', value: '45 dias', icon: Calendar },
              ].map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-app-bg border border-app-stroke rounded-2xl group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <stat.icon size={16} className="text-app-text-muted group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <span className={clsx("text-xs font-black uppercase tracking-tight", stat.color || "text-app-text-main")}>{stat.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2rem] space-y-3">
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Nota do Escritório</p>
              <p className="text-xs text-app-text-muted font-medium leading-relaxed italic">
                "Este processo está sendo monitorado diariamente por nossa equipe técnica especializada."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PortalProcessDetail;
