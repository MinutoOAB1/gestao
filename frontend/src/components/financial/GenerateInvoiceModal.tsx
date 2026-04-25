import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  QrCode, 
  FileText, 
  DollarSign, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { paymentsService, GeneratePaymentData } from '../../services/payments';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientName?: string;
  defaultAmount?: number;
  financialRecordId?: string;
  clients?: Array<{id: string, name: string}>;
}

export const GenerateInvoiceModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  clientId, 
  clientName,
  defaultAmount,
  financialRecordId,
  clients = []
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [formData, setFormData] = useState<Partial<GeneratePaymentData>>({
    clientId,
    amount: defaultAmount || 0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    billingType: 'PIX',
    financialRecordId
  });

  // Sync props with state when modal opens or props change
  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        clientId: clientId || prev.clientId,
        amount: defaultAmount || prev.amount || 0,
        financialRecordId: financialRecordId || prev.financialRecordId
      }));
      setSuccess(false);
      setResult(null);
      setError(null);
    }
  }, [isOpen, clientId, defaultAmount]);

  const handleGenerate = async () => {
    console.log('Generating invoice for:', formData);
    if (!formData.clientId || !formData.amount || !formData.dueDate) {
      setError('Por favor, preencha todos os campos obrigatórios (Cliente, Valor e Vencimento).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await paymentsService.generate(formData as GeneratePaymentData);
      setResult(res);
      setSuccess(true);
    } catch (err: any) {
      console.error('Asaas Generation Error:', err);
      setError(err.response?.data?.message || 'Falha ao gerar cobrança no Asaas. Certifique-se que o cliente possui CPF/CNPJ e Telefone cadastrados.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-app-card border border-app-stroke w-full max-w-[500px] rounded-[32px] shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {!success ? (
            <>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-black/10 rounded-2xl flex items-center justify-center text-black dark:text-white">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Emitir Cobrança</h2>
                  <p className="text-xs text-slate-500 font-medium">Asaas • PIX & Boleto</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Client Info */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Pagador (Cliente)</label>
                  {clientId ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{clientName || 'Cliente Selecionado'}</p>
                    </div>
                  ) : (
                      <select
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      className="w-full bg-app-bg border border-app-stroke rounded-xl py-3 px-4 text-sm font-bold text-app-text-main outline-none focus:ring-2 ring-black/20 transition-all appearance-none"
                    >
                      <option value="">Selecione um cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Valor (R$)</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number" 
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                        className="w-full bg-app-bg border border-app-stroke rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-app-text-main outline-none focus:ring-2 ring-black/20 transition-all"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Vencimento</label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="date" 
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        className="w-full bg-app-bg border border-app-stroke rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-app-text-main outline-none focus:ring-2 ring-black/20 transition-all"
                      />
                    </div>
                  </div>
                        className="w-full bg-app-bg border border-app-stroke rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-app-text-main outline-none focus:ring-2 ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Método de Pagamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('PIX')}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        paymentMethod === 'PIX' ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md" : "border-app-stroke hover:border-blue-300"
                      )}
                    >
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center">
                        <QrCode size={24} />
                      </div>
                      <span className="text-xs font-bold text-app-text-main uppercase">PIX</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('BOLETO')}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                        paymentMethod === 'BOLETO' ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md" : "border-app-stroke hover:border-blue-300"
                      )}
                    >
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center">
                        <Barcode size={24} />
                      </div>
                      <span className="text-xs font-bold text-app-text-main uppercase">Boleto</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Descrição</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-app-bg border border-app-stroke rounded-xl p-4 text-xs font-medium text-app-text-main outline-none focus:ring-2 ring-blue-500/20 transition-all resize-none h-20"
                    placeholder="Ex: Honorários Advocatícios - Processo X..."
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-500">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-[10px] font-bold leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Gerar Cobrança Agora'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase">Sucesso!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">Cobrança gerada com sucesso no Asaas.</p>

              {formData.billingType === 'PIX' && result?.pixQrCode && (
                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <img 
                    src={`data:image/png;base64,${result.pixQrCode}`} 
                    alt="PIX QR Code" 
                    className="w-48 h-48 mx-auto mb-4 rounded-xl shadow-lg"
                  />
                  <button 
                    onClick={() => copyToClipboard(result.pixText)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#161b2c] border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 mx-auto hover:text-blue-500 transition-all"
                  >
                    <Copy size={14} /> Copiar Chave PIX
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <a 
                  href={result?.invoiceUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <ExternalLink size={16} /> Abrir Link de Pagamento
                </a>
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-transparent text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all"
                >
                  Concluído
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
