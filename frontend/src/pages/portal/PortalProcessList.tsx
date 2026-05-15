import React, { useEffect, useState } from 'react';
import { Search, ChevronRight, Briefcase, Scale, Filter, Hash, MapPin, Clock } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../../utils/haptics';

const PortalProcessList = () => {
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const response = await api.get('/portal/processes');
        setProcesses(response.data);
      } catch (error) {
        console.error('Failed to load processes', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProcesses();
  }, []);

  const filtered = processes.filter((p) => {
    const matchSearch = search === '' || 
      (p.number && p.number.toLowerCase().includes(search.toLowerCase())) ||
      (p.title && p.title.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = filterStatus === 'ALL' ||
      (filterStatus === 'ATIVO' && (p.status === 'OPEN' || p.status === 'ATIVO')) ||
      (filterStatus === 'ENCERRADO' && p.status !== 'OPEN' && p.status !== 'ATIVO');

    return matchSearch && matchStatus;
  });

  const activeProcesses = processes.filter(p => p.status === 'OPEN' || p.status === 'ATIVO').length;

  const getStatusBadge = (status: string) => {
    if (status === 'OPEN' || status === 'ATIVO') {
      return (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Tramitando</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-app-text-muted/10 border border-app-text-muted/20 px-3 py-1 rounded-full">
        <span className="text-[10px] font-black uppercase tracking-widest text-app-text-muted">Finalizado</span>
      </div>
    );
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
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text-muted animate-pulse">Carregando processos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-app-text-main tracking-tighter leading-none uppercase">Meus Processos</h1>
          <p className="text-sm text-app-text-muted font-medium max-w-lg">
            {processes.length} registros encontrados • <span className="text-primary">{activeProcesses} ativos agora</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          {['ALL', 'ATIVO', 'ENCERRADO'].map((status) => (
            <button
              key={status}
              onClick={() => { haptics.light(); setFilterStatus(status); }}
              className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterStatus === status
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'bg-app-card border border-app-stroke text-app-text-muted hover:bg-app-stroke/30'
              }`}
            >
              {status === 'ALL' ? 'Todos' : status === 'ATIVO' ? 'Ativos' : 'Encerrados'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-app-text-muted/40 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="PESQUISAR POR NÚMERO OU TÍTULO DO PROCESSO..."
          className="w-full pl-16 pr-8 py-6 bg-app-card border border-app-stroke rounded-[2rem] text-sm font-black text-app-text-main placeholder:text-app-text-muted/30 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-xl"
        />
      </motion.div>

      {/* Process Cards */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-app-card rounded-[3rem] p-20 border border-app-stroke shadow-2xl text-center space-y-6"
          >
            <div className="w-24 h-24 bg-app-bg border border-app-stroke rounded-[2.5rem] flex items-center justify-center mx-auto text-app-text-muted/30">
              <Scale size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-app-text-main uppercase tracking-tight">Nenhum processo encontrado</h3>
              <p className="text-sm text-app-text-muted font-medium">Não encontramos nenhum registro com esses critérios.</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((process, idx) => (
              <motion.div
                key={process.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/portal/processos/${process.id}`}
                  onClick={() => haptics.medium()}
                  className="block bg-app-card rounded-[2.5rem] p-8 border border-app-stroke hover:border-primary/50 shadow-lg hover:shadow-2xl transition-all group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all">
                    <Briefcase size={120} />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-start gap-6 flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-app-bg border border-app-stroke flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/5 transition-all">
                        <Briefcase size={28} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-4 flex-wrap">
                          <h3 className="text-xl font-black text-app-text-main tracking-tight group-hover:text-primary transition-colors truncate uppercase">{process.title}</h3>
                          {getStatusBadge(process.status)}
                        </div>
                        
                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="flex items-center gap-2 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">
                            <Hash size={14} className="text-primary/60" />
                            {process.number || 'SEM NÚMERO'}
                          </div>
                          {process.area && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">
                              <Scale size={14} className="text-primary/60" />
                              {process.area}
                            </div>
                          )}
                          {process.court && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">
                              <MapPin size={14} className="text-primary/60" />
                              {process.court}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-2">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-app-text-muted/60">Última Movimentação</span>
                        <div className="flex items-center gap-2 text-xs font-black text-app-text-main uppercase tracking-tight">
                          <Clock size={12} className="text-primary" />
                          {process.updates && process.updates[0] 
                            ? new Date(process.updates[0].date).toLocaleDateString('pt-BR')
                            : 'Nenhuma'
                          }
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-app-bg border border-app-stroke flex items-center justify-center text-app-text-muted/40 group-hover:text-primary group-hover:border-primary/30 transition-all">
                        <ChevronRight size={24} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortalProcessList;
