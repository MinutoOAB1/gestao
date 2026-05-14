import React, { useEffect, useState } from 'react';
import { Printer, MessageSquare, Download, FileText, ChevronRight, Briefcase } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

const PortalProcessDetail = () => {
  const { id } = useParams<{ id: string }>();
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
    return <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!process) {
    return <div className="p-8 text-center text-[#64748B]">Processo não encontrado.</div>;
  }

  const getStatusLabel = (status: string) => {
    if (status === 'OPEN' || status === 'ATIVO') return 'Em Andamento';
    return status;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wider">
            <Link to="/portal/processos" className="hover:text-[#0F172A] transition-colors">Processos</Link>
            <ChevronRight className="w-3 h-3 mx-2" />
            <span className="text-[#0F172A]">Detalhes do Processo</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">
            Processo nº {process.number || 'Não informado'}
          </h2>
        </div>
        <button className="bg-[#0F172A] text-white px-4 py-2 rounded-sm text-sm font-bold flex items-center hover:bg-[#1E293B] transition-colors shadow-sm">
          <Printer className="w-4 h-4 mr-2" /> Imprimir Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Card */}
          <div className="bg-white rounded-sm border border-[#E2E8F0] shadow-sm p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#0F172A]">Resumo do Processo</h3>
              <span className="bg-[#E0E7FF] text-[#4F46E5] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {getStatusLabel(process.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Classe Processual</p>
                <p className="text-sm font-semibold text-[#0F172A]">{process.title}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Assunto</p>
                <p className="text-sm font-semibold text-[#0F172A]">{process.area || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Data de Ajuizamento</p>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {process.createdAt ? new Date(process.createdAt).toLocaleDateString() : 'Não informado'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Órgão Julgador</p>
                <p className="text-sm font-semibold text-[#0F172A]">{process.court || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Valor da Causa</p>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {process.value ? formatCurrency(process.value) : 'Não informado'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Última Atualização</p>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {process.updates && process.updates.length > 0 
                    ? new Date(process.updates[0].date).toLocaleDateString() 
                    : 'Nenhuma'}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-sm border border-[#E2E8F0] shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#0F172A] mb-6">Movimentações Recentes</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#E2E8F0] before:to-transparent">
              {process.updates && process.updates.length > 0 ? (
                process.updates.map((update: any, idx: number) => (
                  <div key={idx} className="relative flex items-start group">
                    <div className="hidden md:block w-[120px] pt-1 text-right pr-6">
                      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                        {new Date(update.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()}
                      </p>
                      <p className="text-[10px] text-[#94A3B8] font-semibold">{new Date(update.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    
                    <div className="absolute left-0 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-5 h-5 rounded-full border-4 border-white bg-[#0F172A] group-hover:bg-[#4F46E5] transition-colors mt-1.5 z-10"></div>
                    
                    <div className="pl-8 md:pl-6 flex-1 pt-1 pb-4">
                      <div className="md:hidden mb-2">
                        <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider mr-2">
                           {new Date(update.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase()}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-semibold">
                          {new Date(update.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0F172A] mb-1">{update.type}</h4>
                      <p className="text-sm text-[#64748B] leading-relaxed">{update.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-[#64748B] py-8 relative z-10 bg-white">Nenhuma movimentação registrada.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Lawyer Card */}
          <div className="bg-[#0F172A] rounded-sm shadow-sm p-6 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/4 -translate-y-1/4">
               <Briefcase className="w-40 h-40" />
            </div>
            <h3 className="text-lg font-bold mb-6 relative z-10">Advogado Responsável</h3>
            
            <div className="flex items-center space-x-4 mb-6 relative z-10">
              <div className="w-14 h-14 rounded-full bg-[#1E293B] border border-[#334155] overflow-hidden flex items-center justify-center text-xl font-bold">
                {/* Fallback avatar if no image */}
                {process.assignedTo ? process.assignedTo.charAt(0) : 'A'}
              </div>
              <div>
                <p className="font-bold text-sm">Dr. {process.assignedTo || 'Ricardo Menezes'}</p>
                <p className="text-xs text-[#94A3B8] font-medium mt-0.5">OAB/RS 123.456</p>
              </div>
            </div>

            <button className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-bold py-2.5 rounded-sm transition-colors text-sm flex items-center justify-center relative z-10">
              <MessageSquare className="w-4 h-4 mr-2" /> Falar com o Advogado
            </button>
          </div>

          {/* Documents Card */}
          <div className="bg-white rounded-sm border border-[#E2E8F0] shadow-sm p-6 flex flex-col h-full">
            <h3 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-[#64748B]" /> Documentos
            </h3>
            
            <div className="space-y-3 flex-1">
              {[
                { name: 'Petição Inicial.pdf', size: '2.4 MB', date: '14/03/2023', icon: 'PDF' },
                { name: 'Procuração.pdf', size: '0.8 MB', date: '12/03/2023', icon: 'PDF' },
                { name: 'Decisão_Tutela.pdf', size: '1.1 MB', date: '18/10/2023', icon: 'PDF' },
                { name: 'Contrato_Prestação.docx', size: '1.5 MB', date: '10/03/2023', icon: 'DOCX' },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-sm hover:border-[#CBD5E1] transition-colors group">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                      doc.icon === 'PDF' ? 'bg-[#FEE2E2] text-[#EF4444]' : 'bg-[#E0E7FF] text-[#4F46E5]'
                    }`}>
                      {doc.icon}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{doc.name}</p>
                      <p className="text-[10px] text-[#64748B] uppercase tracking-wider">{doc.size} • {doc.date}</p>
                    </div>
                  </div>
                  <button className="text-[#94A3B8] hover:text-[#0F172A] p-1">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 border border-[#E2E8F0] text-[#0F172A] font-bold py-2 rounded-sm text-sm hover:bg-[#F8FAFC] transition-colors">
              Ver Todos os Documentos
            </button>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default PortalProcessDetail;
