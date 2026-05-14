import React, { useEffect, useState } from 'react';
import { ChevronRight, Briefcase, ArrowLeft, Clock, MapPin, DollarSign, Calendar, Scale } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="text-center py-20">
        <Scale className="w-12 h-12 text-slate-300 dark:text-white/20 mx-auto mb-4" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Processo não encontrado</h3>
        <p className="text-sm text-slate-400 dark:text-white/40 mb-4">O processo solicitado não foi encontrado.</p>
        <button
          onClick={() => navigate('/portal/processos')}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors"
        >
          Voltar aos Processos
        </button>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    if (status === 'OPEN' || status === 'ATIVO') return 'Ativo';
    if (status === 'SUSPENSO') return 'Suspenso';
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'OPEN' || status === 'ATIVO') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    if (status === 'SUSPENSO') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    return 'bg-slate-500/10 text-slate-500 dark:text-slate-400';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const infoItems = [
    { label: 'Classe Processual', value: process.title, icon: Briefcase },
    { label: 'Área', value: process.area || 'Não informado', icon: Scale },
    { label: 'Tribunal', value: process.court || 'Não informado', icon: MapPin },
    { label: 'Valor da Causa', value: process.value ? formatCurrency(process.value) : 'Não informado', icon: DollarSign },
    { label: 'Data de Abertura', value: process.createdAt ? new Date(process.createdAt).toLocaleDateString('pt-BR') : 'Não informado', icon: Calendar },
    { label: 'Prazo', value: process.deadline ? new Date(process.deadline).toLocaleDateString('pt-BR') : 'Sem prazo', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button
          onClick={() => navigate('/portal/processos')}
          className="flex items-center gap-2 text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar aos Processos
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Processo nº {process.number || 'S/N'}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(process.status)}`}>
                {getStatusLabel(process.status)}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{process.title}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Process Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white dark:bg-white/[0.06] rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08]"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Informações do Processo</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {infoItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 flex-shrink-0 mt-0.5">
                    <item.icon size={14} className="text-slate-400 dark:text-white/40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-0.5">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Description */}
          {process.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-white dark:bg-white/[0.06] rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08]"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Descrição</h3>
              <p className="text-sm text-slate-500 dark:text-white/50 leading-relaxed whitespace-pre-wrap">{process.description}</p>
            </motion.div>
          )}

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white dark:bg-white/[0.06] rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08]"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5">Movimentações</h3>

            {process.updates && process.updates.length > 0 ? (
              <div className="space-y-0">
                {process.updates.map((update: any, idx: number) => (
                  <div key={idx} className="flex gap-4 group">
                    {/* Timeline line & dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${idx === 0 ? 'bg-blue-500 ring-4 ring-blue-500/20' : 'bg-slate-300 dark:bg-white/20'}`} />
                      {idx < process.updates.length - 1 && (
                        <div className="w-px flex-1 bg-slate-200 dark:bg-white/10 my-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-6 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">{update.type}</p>
                          <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed">{update.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-semibold text-slate-400 dark:text-white/40">
                            {new Date(update.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </p>
                          <p className="text-[10px] text-slate-300 dark:text-white/25">
                            {new Date(update.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto mb-3" />
                <p className="text-sm text-slate-400 dark:text-white/40">Nenhuma movimentação registrada.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Lawyer Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl p-5 text-white relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/4 -translate-y-1/4">
              <Briefcase className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Advogado Responsável</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/10">
                  {process.assignedTo ? process.assignedTo.charAt(0) : 'A'}
                </div>
                <div>
                  <p className="font-bold text-sm">{process.assignedTo || 'Não atribuído'}</p>
                  <p className="text-xs text-white/40">Responsável pelo caso</p>
                </div>
              </div>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all">
                Enviar Mensagem
              </button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white dark:bg-white/[0.06] rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08]"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Resumo</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-white/40">Total de Movimentações</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{process.updates?.length || 0}</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-white/40">Status</span>
                <span className={`text-xs font-bold ${(process.status === 'OPEN' || process.status === 'ATIVO') ? 'text-blue-500' : 'text-slate-400'}`}>
                  {getStatusLabel(process.status)}
                </span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-white/40">Aberto em</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {process.createdAt ? new Date(process.createdAt).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PortalProcessDetail;
