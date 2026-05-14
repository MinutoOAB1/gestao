import React, { useEffect, useState } from 'react';
import { Building2, Clock, Calendar, ChevronRight, UploadCloud, Video, FileText } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const PortalDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  const activeCount = data?.activeProcesses || 0;
  const updates = data?.recentUpdates || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-sm border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-[#F1F5F9] rounded-sm text-[#0F172A]">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-[#64748B]">+2 este mês</span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-[#64748B]">Processos Ativos</p>
            <p className="text-4xl font-bold text-[#0F172A] mt-1">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-[#EEF2FF] rounded-sm text-[#4F46E5]">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold bg-[#D97706] text-white px-2 py-1 rounded-sm uppercase tracking-wider">Novo</span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-[#64748B]">Novas Movimentações</p>
            <p className="text-4xl font-bold text-[#0F172A] mt-1">{updates.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-[#F8FAFC] rounded-sm text-[#64748B]">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-[#64748B]">Próxima: Amanhã</span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold text-[#64748B]">Próximas Reuniões</p>
            <p className="text-4xl font-bold text-[#0F172A] mt-1">03</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Updates */}
          <div className="bg-white rounded-sm border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-bold text-[#0F172A]">Últimas Atualizações</h3>
              <button className="text-sm font-semibold text-[#0F172A] hover:underline">Ver todas</button>
            </div>
            <div className="p-0">
              {updates.length === 0 ? (
                <div className="p-6 text-center text-[#64748B]">Nenhuma movimentação recente.</div>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {updates.map((update: any, idx: number) => (
                    <div key={idx} className="p-6 flex items-start hover:bg-[#F8FAFC] transition-colors">
                      <div className="mr-4 mt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#0F172A]">{update.description}</p>
                        <p className="text-xs text-[#64748B] mt-1">Processo nº {update.processNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#0F172A]">
                          {new Date(update.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-[#64748B]">Hoje</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-sm border border-[#E2E8F0] shadow-sm p-6">
              <h3 className="text-lg font-bold text-[#0F172A] mb-4">Distribuição por Área</h3>
              <div className="h-40 flex items-center justify-center bg-[#F8FAFC] text-[#64748B] rounded-sm border border-dashed border-[#CBD5E1]">
                [Gráfico de Distribuição]
              </div>
            </div>
            <div className="bg-white rounded-sm border border-[#E2E8F0] shadow-sm p-6">
              <h3 className="text-lg font-bold text-[#0F172A] mb-4">Relatório Mensal</h3>
              <p className="text-sm text-[#64748B] mb-4">O relatório consolidado do mês já está disponível.</p>
              <button className="flex items-center text-sm font-bold text-[#0F172A] border border-[#E2E8F0] px-4 py-2 rounded-sm hover:bg-[#F8FAFC]">
                <FileText className="w-4 h-4 mr-2" /> Baixar PDF
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Next Appointment Card */}
          <div className="bg-[#0F172A] rounded-sm shadow-sm text-white p-6 relative overflow-hidden">
            {/* Decorative BG element */}
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
              <Video className="w-32 h-32" />
            </div>
            
            <p className="text-xs font-semibold tracking-wider text-[#94A3B8] uppercase mb-4">Próximo Compromisso</p>
            
            <div className="flex items-start mb-6 relative z-10">
              <div className="bg-white text-[#0F172A] rounded-sm text-center px-3 py-2 mr-4 flex-shrink-0">
                <p className="text-xl font-bold leading-none">25</p>
                <p className="text-[10px] font-bold uppercase mt-1">Out</p>
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight mb-1">Reunião de Alinhamento Estratégico</h4>
                <p className="text-xs text-[#94A3B8]">Via Zoom • 14:00 - 15:30</p>
              </div>
            </div>

            <button className="w-full bg-white text-[#0F172A] font-bold py-2.5 rounded-sm hover:bg-[#F1F5F9] transition-colors text-sm relative z-10">
              Acessar Sala Virtual
            </button>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-sm border border-[#E2E8F0] border-dashed border-2 shadow-sm p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#F8FAFC] transition-colors">
            <div className="w-12 h-12 bg-[#F1F5F9] text-[#64748B] rounded-sm flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#0F172A] mb-1">Anexar Documentos</p>
            <p className="text-xs text-[#64748B]">Arraste ou clique para enviar novos arquivos PDF ou DOCX</p>
          </div>

          {/* Banner */}
          <div className="rounded-sm bg-gradient-to-r from-[#0F172A] to-[#334155] p-6 text-white shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <p className="font-bold text-sm mb-1">Dúvidas?</p>
              <p className="text-xs text-[#CBD5E1] mb-4">Fale agora com seu assessor jurídico dedicado.</p>
              <button className="text-xs font-bold uppercase tracking-wider text-white border border-white/30 px-3 py-1.5 rounded-sm hover:bg-white/10 transition-colors">
                Contatar Suporte
              </button>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default PortalDashboard;
