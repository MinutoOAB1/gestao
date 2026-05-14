import React, { useEffect, useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const PortalProcessList = () => {
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    return <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  const activeProcesses = processes.filter(p => p.status === 'OPEN' || p.status === 'ATIVO').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A]">Processos do Cliente</h2>
        <p className="text-[#64748B] mt-1 text-sm">Visualize e gerencie todos os processos jurídicos em andamento e encerrados.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-sm border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#94A3B8]" />
          </div>
          <input
            type="text"
            placeholder="Buscar por número ou tipo..."
            className="w-full pl-10 pr-3 py-2 border border-[#E2E8F0] rounded-sm text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A]"
          />
        </div>

        <div className="flex space-x-4 w-full sm:w-auto">
          <select className="flex-1 sm:flex-none border border-[#E2E8F0] rounded-sm px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0F172A]">
            <option>Status: Todos</option>
            <option>Ativos</option>
            <option>Encerrados</option>
          </select>
          <button className="bg-[#0F172A] text-white px-4 py-2 rounded-sm text-sm font-semibold flex items-center hover:bg-[#1E293B] transition-colors">
            <Filter className="w-4 h-4 mr-2" /> Filtrar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E2E8F0]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Número do Processo</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Tipo de Ação</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Tribunal</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Última Atualização</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E2E8F0]">
              {processes.map((process) => (
                <tr key={process.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-[#0F172A]">{process.number || 'Sem número'}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{process.title}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748B]">
                    {process.area || 'Não informado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748B]">
                    {process.court || 'Não informado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      process.status === 'OPEN' || process.status === 'ATIVO' 
                        ? 'bg-[#E0E7FF] text-[#4F46E5]' 
                        : process.status === 'SUSPENSO'
                        ? 'bg-[#F1F5F9] text-[#64748B]'
                        : 'bg-[#FEF3C7] text-[#D97706]'
                    }`}>
                      {process.status === 'OPEN' ? 'Ativo' : process.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748B]">
                    {process.updates && process.updates[0] ? (
                      <>
                        <p>{new Date(process.updates[0].date).toLocaleDateString()}</p>
                        <p className="text-xs mt-0.5">{new Date(process.updates[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </>
                    ) : (
                      'Nenhuma atualização'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/portal/processos/${process.id}`} className="text-[#0F172A] hover:underline font-bold">Ver Detalhes</Link>
                  </td>
                </tr>
              ))}
              {processes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#64748B]">
                    Nenhum processo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-white px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
          <p className="text-sm text-[#64748B]">Mostrando {processes.length} processos</p>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-[#E2E8F0] rounded-sm text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button className="px-3 py-1 bg-[#0F172A] text-white rounded-sm text-sm font-medium">1</button>
            <button className="px-3 py-1 border border-[#E2E8F0] rounded-sm text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        <div className="bg-[#0F172A] rounded-sm p-6 text-white relative overflow-hidden flex flex-col justify-between h-48 shadow-sm">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
             <Briefcase className="w-48 h-48" />
          </div>
          <p className="text-xs font-bold tracking-wider text-[#94A3B8] uppercase">Total de Ativos</p>
          <p className="text-6xl font-bold mt-2 relative z-10">{activeProcesses}</p>
        </div>

        <div className="bg-white rounded-sm border border-[#E2E8F0] p-6 shadow-sm flex flex-col justify-between h-48">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Informação Importante</h3>
            <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
              Seus processos estão sendo monitorados 24/7. Novas movimentações são notificadas automaticamente via e-mail e push.
            </p>
          </div>
          <div className="flex justify-end mt-4">
             <button className="bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-bold py-2 px-4 rounded-sm transition-colors">
               Agendar Reunião com Advogado
             </button>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#0F172A] rounded-sm shadow-lg flex items-center justify-center text-white hover:bg-[#1E293B] transition-colors z-50">
        <Plus className="w-6 h-6" />
      </button>

    </div>
  );
};

export default PortalProcessList;
