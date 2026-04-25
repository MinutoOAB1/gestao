import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Copy, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  QrCode,
  FileText
} from 'lucide-react';
import { paymentsService } from '../../services/payments';
import { useToast } from '../../context/ToastContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Invoice {
  id: string;
  asaasId: string;
  amount: number;
  status: string;
  dueDate: string;
  paymentLink: string;
  paymentMethod: string;
  pixQrCode?: string;
  pixText?: string;
  client: {
    name: string;
    email: string;
  };
  financialRecord?: {
    description: string;
    category: string;
  };
  createdAt: string;
}

export const InvoiceManagementTab: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await paymentsService.list();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      addToast('Erro ao carregar cobranças.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSyncStatus = async (asaasId: string) => {
    setRefreshingId(asaasId);
    try {
      await paymentsService.getStatus(asaasId);
      await fetchInvoices();
      addToast('Status sincronizado com o Asaas.', 'success');
    } catch (error) {
      addToast('Erro ao sincronizar status.', 'error');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleCancel = async (asaasId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta cobrança no Asaas?')) return;
    try {
      await paymentsService.cancel(asaasId);
      await fetchInvoices();
      addToast('Cobrança cancelada com sucesso.', 'success');
    } catch (error) {
      addToast('Erro ao cancelar cobrança.', 'error');
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    addToast('Link de pagamento copiado!', 'success');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Clock size={10} /> Pendente
          </span>
        );
      case 'PAID':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle size={10} /> Paga
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle size={10} /> Vencida
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <X size={10} /> Cancelada
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Clock size={10} /> Pendente
          </span>
        );
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.asaasId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.financialRecord?.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-app-card p-4 rounded-[2rem] border border-app-stroke shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por cliente ou ID da cobrança..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-app-bg border border-app-stroke rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-app-text-main outline-none focus:ring-2 ring-black/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={fetchInvoices}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 gap-4">
        {loading && invoices.length === 0 ? (
          <div className="py-20 text-center">
            <RefreshCw className="animate-spin mx-auto text-blue-500 mb-4" size={40} />
            <p className="text-slate-500 font-medium">Carregando cobranças...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#161b2c] rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">Nenhuma cobrança encontrada.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredInvoices.map((invoice) => (
              <motion.div 
                key={invoice.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-app-card border border-app-stroke rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                  {/* Icon & Method */}
                  <div className={clsx(
                    "w-16 h-16 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner",
                    invoice.paymentMethod === 'PIX' ? "bg-indigo-500/10 text-indigo-600" : "bg-blue-500/10 text-blue-600"
                  )}>
                    {invoice.paymentMethod === 'PIX' ? <QrCode size={28} /> : <FileText size={28} />}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                        {invoice.client.name}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                      <span className="truncate max-w-[300px]">{invoice.financialRecord?.description || 'Cobrança Avulsa'}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="font-mono text-[10px] opacity-70">ID: {invoice.asaasId}</span>
                    </p>
                  </div>

                  {/* Amount & Due Date */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-6 lg:gap-1 shrink-0 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(invoice.amount)}
                    </span>
                    <span className={clsx(
                      "text-[10px] font-black uppercase tracking-widest",
                      invoice.status === 'OVERDUE' ? "text-black font-black" : "text-app-text-muted"
                    )}>
                      Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full lg:w-auto pt-4 lg:pt-0">
                    <button 
                      onClick={() => handleSyncStatus(invoice.asaasId)}
                      disabled={refreshingId === invoice.asaasId}
                      className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-2xl transition-all"
                      title="Sincronizar Status"
                    >
                      <RefreshCw size={18} className={refreshingId === invoice.asaasId ? "animate-spin" : ""} />
                    </button>
                    <a 
                      href={invoice.paymentLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-2xl transition-all"
                      title="Abrir Link de Pagamento"
                    >
                      <ExternalLink size={18} />
                    </a>
                    <button 
                      onClick={() => copyLink(invoice.paymentLink)}
                      className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-2xl transition-all"
                      title="Copiar Link"
                    >
                      <Copy size={18} />
                    </button>
                    {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                      <button 
                        onClick={() => handleCancel(invoice.asaasId)}
                        className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                        title="Cancelar Cobrança"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
