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
  Loader2,
  Barcode
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
    if (!formData.clientId || !formData.amount || !formData.dueDate) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsService.generate(formData as GeneratePaymentData);
      setResult(res);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao gerar cobrança.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-app-card border border-app-stroke w-full max-w-[500px] rounded-[32px] shadow-2xl overflow-hidden relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="p-8">
          {!success ? (
            <div className="w-full">
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
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Pagador</label>
                  {clientId ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{clientName || 'Cliente'}</p>
                    </div>
                  ) : (
                    <select
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      className="w-full bg-app-bg border border-app-stroke rounded-xl py-3 px-4 text-sm font-bold"
                    >
                      <option value="">Selecione...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Valor</label>
                    <input 
                      type="number" 
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                      className="w-full bg-app-bg border border-app-stroke rounded-xl py-3 px-4 text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Vencimento</label>
                    <input 
                      type="date" 
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full bg-app-bg border border-app-stroke rounded-xl py-3 px-4 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Método</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormData({...formData, billingType: 'PIX'})}
                      className={clsx("p-4 rounded-2xl border-2", formData.billingType === 'PIX' ? "border-blue-600 bg-blue-50" : "border-app-stroke")}
                    >
                      PIX
                    </button>
                    <button
                      onClick={() => setFormData({...formData, billingType: 'BOLETO'})}
                      className={clsx("p-4 rounded-2xl border-2", formData.billingType === 'BOLETO' ? "border-blue-600 bg-blue-50" : "border-app-stroke")}
                    >
                      Boleto
                    </button>
                  </div>
                </div>

                <button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase">
                  {loading ? 'Gerando...' : 'Gerar Cobrança'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <h2 className="text-2xl font-black mb-2">Sucesso!</h2>
              <button onClick={onClose} className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase">Fechar</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
