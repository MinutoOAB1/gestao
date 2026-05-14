import React, { useEffect, useState } from 'react';
import { Search, ChevronRight, Briefcase, Scale, Filter } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
      return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400">Ativo</span>;
    }
    if (status === 'SUSPENSO') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400">Suspenso</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-500 dark:text-slate-400">{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Meus Processos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {processes.length} processos encontrados • {activeProcesses} ativos
          </p>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-white/[0.06] rounded-2xl p-4 border border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row gap-3 items-center"
      >
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número ou título..."
            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {['ALL', 'ATIVO', 'ENCERRADO'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterStatus === status
                  ? 'bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A]'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {status === 'ALL' ? 'Todos' : status === 'ATIVO' ? 'Ativos' : 'Encerrados'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Process Cards */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-white/[0.06] rounded-2xl p-12 border border-slate-200/80 dark:border-white/[0.08] text-center"
        >
          <Scale className="w-12 h-12 text-slate-300 dark:text-white/20 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Nenhum processo encontrado</h3>
          <p className="text-sm text-slate-400 dark:text-white/40">Ajuste os filtros para ver seus processos.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((process, idx) => (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Link
                to={`/portal/processos/${process.id}`}
                className="block bg-white dark:bg-white/[0.06] rounded-2xl p-5 border border-slate-200/80 dark:border-white/[0.08] hover:shadow-md dark:hover:bg-white/[0.08] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 flex-shrink-0 mt-0.5">
                      <Briefcase size={20} className="text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{process.title}</h3>
                        {getStatusBadge(process.status)}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-white/40">
                        {process.number ? `Nº ${process.number}` : 'Sem número'} 
                        {process.area && ` • ${process.area}`}
                        {process.court && ` • ${process.court}`}
                      </p>
                      {process.updates && process.updates[0] && (
                        <p className="text-xs text-slate-400 dark:text-white/30 mt-2">
                          Última atualização: {new Date(process.updates[0].date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 dark:text-white/20 flex-shrink-0 group-hover:text-blue-500 transition-colors mt-2" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortalProcessList;
