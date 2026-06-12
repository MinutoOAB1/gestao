import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Building, 
  User, 
  CreditCard, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Link, 
  Plus, 
  ExternalLink, 
  Trash2, 
  DollarSign, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { paymentsService } from '../../services/payments';
import { useToast } from '../../context/ToastContext';
import { haptics } from '../../utils/haptics';

// Helper formatting functions
const formatCPF = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
};

const formatCNPJ = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

const formatCEP = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

const formatPhone = (val: string) => {
  return val
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2')
    .slice(0, 15);
};

export default function AsaasConfigPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // App state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<{ isConfigured: boolean; balance?: number; name?: string; walletId?: string } | null>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [flowType, setFlowType] = useState<'create' | 'link' | null>(null); // 'create' = Criar Subconta, 'link' = Vincular Existente

  // Form states
  const [linkApiKey, setLinkApiKey] = useState('');
  const [linkWalletId, setLinkWalletId] = useState('');

  const [officeData, setOfficeData] = useState({
    name: '',
    cpfCnpj: '',
    phone: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    city: '',
    state: '',
    companyType: 'INDIVIDUAL',
    incomeValue: '5000'
  });

  const [legalRepData, setLegalRepData] = useState({
    name: '',
    cpf: '',
    email: '',
    mobilePhone: '',
    birthDate: ''
  });

  const [bankData, setBankData] = useState({
    bankName: '001 - Banco do Brasil S.A.',
    agency: '',
    account: '',
    digit: '',
    accountType: 'CONTA_CORRENTE'
  });

  // Load configuration on mount
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await paymentsService.getAsaasConfig();
      setConfig(res);
    } catch (error) {
      console.error('Error fetching ASAAS config:', error);
      addToast('Erro ao carregar dados da integração.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Form validation per step
  const validateStep = () => {
    if (flowType === 'create') {
      if (step === 2) {
        if (!officeData.name) return 'Razão Social/Nome é obrigatório';
        if (!officeData.cpfCnpj) return 'CNPJ ou CPF é obrigatório';
        if (!officeData.phone) return 'Telefone comercial é obrigatório';
        if (!officeData.postalCode) return 'CEP é obrigatório';
        if (!officeData.address) return 'Endereço é obrigatório';
        if (!officeData.addressNumber) return 'Número é obrigatório';
        if (!officeData.province) return 'Bairro é obrigatório';
        if (!officeData.city) return 'Cidade é obrigatória';
        if (!officeData.state) return 'Estado é obrigatório';
      }
      if (step === 3) {
        if (!legalRepData.name) return 'Nome completo é obrigatório';
        if (!legalRepData.cpf) return 'CPF é obrigatório';
        if (!legalRepData.email) return 'E-mail do responsável é obrigatório';
        if (!legalRepData.mobilePhone) return 'Celular do responsável é obrigatório';
        if (!legalRepData.birthDate) return 'Data de nascimento é obrigatória';
      }
      if (step === 4) {
        if (!bankData.agency) return 'Agência é obrigatória';
        if (!bankData.account) return 'Número da conta é obrigatório';
        if (!bankData.digit) return 'Dígito verificador é obrigatório';
      }
    } else if (flowType === 'link') {
      if (!linkApiKey) return 'A API Key do Asaas é obrigatória';
      if (!linkWalletId) return 'O Wallet ID do Asaas é obrigatório';
    }
    return null;
  };

  const handleNext = () => {
    haptics.light();
    const error = validateStep();
    if (error) {
      addToast(error, 'warning');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    haptics.light();
    if (step === 1) {
      navigate('/app/configuracoes');
    } else if (step === 2 && flowType === 'link') {
      setFlowType(null);
      setStep(1);
    } else {
      setStep(prev => prev - 1);
    }
  };

  // Submit linking account
  const handleLinkAccount = async () => {
    haptics.medium();
    const error = validateStep();
    if (error) {
      addToast(error, 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await paymentsService.linkAsaasAccount(linkApiKey, linkWalletId);
      addToast('Integração vinculada com sucesso!', 'success');
      setConfig({
        isConfigured: true,
        name: res.name,
        balance: res.balance,
        walletId: res.walletId
      });
      setFlowType(null);
      setStep(1);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Falha ao vincular conta. Verifique sua API Key e Wallet ID.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Submit creating subaccount
  const handleCreateSubaccount = async () => {
    haptics.medium();
    const error = validateStep();
    if (error) {
      addToast(error, 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: officeData.name,
        email: legalRepData.email,
        cpfCnpj: officeData.cpfCnpj,
        phone: officeData.phone,
        mobilePhone: legalRepData.mobilePhone,
        address: officeData.address,
        addressNumber: officeData.addressNumber,
        complement: officeData.complement,
        province: officeData.province,
        postalCode: officeData.postalCode,
        companyType: officeData.companyType,
        incomeValue: parseFloat(officeData.incomeValue) || 5000,
        bank: {
          bankName: bankData.bankName,
          agency: bankData.agency,
          account: bankData.account,
          digit: bankData.digit,
          accountType: bankData.accountType
        }
      };

      const res = await paymentsService.createAsaasSubaccount(payload);
      addToast('Subconta Asaas criada com sucesso!', 'success');
      setConfig({
        isConfigured: true,
        name: res.name,
        balance: 0,
        walletId: res.walletId
      });
      setFlowType(null);
      setStep(1);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Erro ao criar subconta. Revise os dados.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Disconnect integration
  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar o ASAAS? Você não poderá gerar cobranças até configurá-lo novamente.')) {
      return;
    }

    haptics.medium();
    setSaving(true);
    try {
      await paymentsService.disconnectAsaas();
      addToast('Integração desconectada.', 'success');
      setConfig({ isConfigured: false });
      setFlowType(null);
      setStep(1);
    } catch (error) {
      console.error(error);
      addToast('Erro ao desconectar integração.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // RENDER: SUCCESS / INTEGRATED STATE
  if (config?.isConfigured) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/app/configuracoes')}
            className="w-10 h-10 rounded-xl bg-app-card border border-app-stroke flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/20 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text-muted">Integrações</p>
            <h1 className="text-4xl font-black text-app-text-main tracking-tighter">Gateway ASAAS</h1>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-app-card rounded-[2.5rem] border border-app-stroke p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                <Check size={32} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-app-text-main tracking-tight uppercase">Integração Ativa</h2>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">
                    Operacional
                  </span>
                </div>
                <p className="text-sm text-app-text-muted font-medium">
                  Seu escritório está pronto para gerar cobranças via PIX e Boleto Bancário automaticamente.
                </p>
              </div>
            </div>

            <div className="bg-app-bg border border-app-stroke rounded-2xl p-6 flex items-center gap-4 min-w-[240px]">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-app-text-muted uppercase tracking-wider">Saldo Recebido</p>
                <p className="text-2xl font-black text-app-text-main">
                  R$ {config.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                </p>
              </div>
            </div>
          </div>

          <div className={`mt-8 pt-8 border-t border-app-stroke grid grid-cols-1 gap-8 text-sm ${config.walletId ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <div>
              <p className="text-xs font-black text-app-text-muted uppercase tracking-wider mb-2">Titular da Conta</p>
              <p className="font-bold text-app-text-main text-base">{config.name || 'Advogado Integrado'}</p>
            </div>
            <div>
              <p className="text-xs font-black text-app-text-muted uppercase tracking-wider mb-2">Chave de Conexão (API Key)</p>
              <p className="font-mono text-app-text-muted text-xs bg-app-bg px-3 py-2 rounded-lg border border-app-stroke inline-block">
                ••••••••••••••••••••••••••••••••
              </p>
            </div>
            {config.walletId && (
              <div>
                <p className="text-xs font-black text-app-text-muted uppercase tracking-wider mb-2">Wallet ID (Carteira)</p>
                <p className="font-mono text-app-text-muted text-xs bg-app-bg px-3 py-2 rounded-lg border border-app-stroke inline-block">
                  {config.walletId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="https://www.asaas.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-app-card rounded-2xl border border-app-stroke p-6 hover:border-primary/50 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <ExternalLink size={20} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-app-text-main">Acessar Painel Asaas</h3>
                <p className="text-xs text-app-text-muted">Acompanhe transferências e antecipações diretamente no Asaas.</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-app-text-muted group-hover:translate-x-1 transition-transform" />
          </a>

          <button
            onClick={handleDisconnect}
            disabled={saving}
            className="bg-app-card rounded-2xl border border-app-stroke p-6 hover:border-rose-500/30 hover:bg-rose-500/[0.02] transition-all flex items-center justify-between group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500">
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-app-text-main">Desconectar Gateway</h3>
                <p className="text-xs text-app-text-muted">Remover chaves de API e desativar emissão de cobranças.</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-app-text-muted group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // RENDER: WIZARD FLOW
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-xl bg-app-card border border-app-stroke flex items-center justify-center text-app-text-muted hover:text-app-text-main hover:bg-app-stroke/20 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-app-text-muted">Integrações</p>
          <h1 className="text-4xl font-black text-app-text-main tracking-tighter">Configure sua Integração ASAAS</h1>
        </div>
      </div>

      <p className="text-app-text-muted max-w-2xl -mt-4">
        Configure sua conta para começar a receber pagamentos de clientes de forma segura e rápida através da plataforma ASAAS.
      </p>

      {/* Steps Indicator (Wizard Timeline) */}
      {flowType === 'create' && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="flex items-center gap-4">
            {[
              { id: 1, icon: Shield, label: 'Tipo de Conta' },
              { id: 2, icon: Building, label: 'Empresa' },
              { id: 3, icon: User, label: 'Responsável' },
              { id: 4, icon: CreditCard, label: 'Recebimento' },
            ].map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    step === s.id 
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110' 
                      : step > s.id 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                      : 'bg-app-card border-app-stroke text-app-text-muted'
                  }`}>
                    <s.icon size={20} />
                  </div>
                </div>
                {idx < 3 && (
                  <div className={`w-12 h-[2px] mx-2 transition-colors duration-300 ${
                    step > s.id ? 'bg-emerald-500/30' : 'bg-app-stroke'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted mt-4">
            Passo {step} de 4: {[
              'Tipo de Conta',
              'Dados da Empresa',
              'Responsável Legal',
              'Dados de Recebimento'
            ][step - 1]}
          </p>
        </div>
      )}

      {/* Step Contents */}
      <div className="bg-app-card rounded-[2.5rem] border border-app-stroke p-8 shadow-xl">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-app-text-main uppercase tracking-tight">Como você deseja continuar?</h2>
                <p className="text-sm text-app-text-muted max-w-lg mx-auto">
                  Escolha entre criar uma nova subconta ou vincular uma conta existente no Asaas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                {/* Option 1: Create Account */}
                <div className="bg-app-bg border border-app-stroke rounded-3xl p-8 flex flex-col justify-between hover:border-primary/50 transition-all relative overflow-hidden group">
                  <div className="absolute top-4 right-4 bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Recomendado
                  </div>
                  <div>
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                      <Plus size={28} />
                    </div>
                    <h3 className="text-xl font-black text-app-text-main mb-2">Criar Subconta no Asaas</h3>
                    <p className="text-xs text-app-text-muted leading-relaxed mb-6">
                      Crie uma nova subconta no Asaas de forma rápida e integrada. Tudo será configurado automaticamente para você.
                    </p>
                    
                    <ul className="space-y-3 mb-8">
                      {[
                        'Configuração automática',
                        'Integração completa',
                        'Sem necessidade de API Key'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-app-text-muted">
                          <Check size={14} className="text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      haptics.light();
                      setFlowType('create');
                      setStep(2);
                    }}
                    className="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all text-center"
                  >
                    Criar Nova Conta
                  </button>
                </div>

                {/* Option 2: Link Account */}
                <div className="bg-app-bg border border-app-stroke rounded-3xl p-8 flex flex-col justify-between hover:border-primary/50 transition-all group">
                  <div>
                    <div className="w-14 h-14 bg-slate-500/10 rounded-2xl flex items-center justify-center text-app-text-muted mb-6 group-hover:scale-110 transition-transform">
                      <Link size={28} />
                    </div>
                    <h3 className="text-xl font-black text-app-text-main mb-2">Vincular Conta Existente</h3>
                    <p className="text-xs text-app-text-muted leading-relaxed mb-6">
                      Já possui uma conta no Asaas? Vincule-a aqui fornecendo suas credenciais de API.
                    </p>
                    
                    <ul className="space-y-3 mb-8">
                      {[
                        'Use sua conta existente',
                        'Requer API Key e Wallet ID',
                        'Configuração manual'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-app-text-muted">
                          <Check size={14} className="text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      haptics.light();
                      setFlowType('link');
                      setStep(2);
                    }}
                    className="w-full py-4 bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 active:scale-95 transition-all text-center"
                  >
                    Vincular Conta
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* VINCULAR ACCOUNT SCREEN (Flow Link, Step 2) */}
          {flowType === 'link' && step === 2 && (
            <motion.div 
              key="flow-link-step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-app-text-main uppercase tracking-tight">Vincular Conta Existente</h2>
                <p className="text-xs text-app-text-muted">Forneça as credenciais de API da sua conta Asaas para prosseguir.</p>
              </div>

              <div className="bg-primary/5 rounded-2xl border border-primary/10 p-5 flex items-start gap-4 text-xs text-app-text-muted">
                <AlertCircle className="text-primary shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <p className="font-bold text-app-text-main">Como obter sua API Key?</p>
                  <p>Acesse o painel do Asaas, vá em **Configurações da Conta** &gt; **Integrações** &gt; **Gerar API Key**.</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">
                    API Key (Token de Acesso)
                  </label>
                  <input
                    type="password"
                    placeholder="Chave de API do Asaas (ex: $aab...)"
                    value={linkApiKey}
                    onChange={(e) => setLinkApiKey(e.target.value)}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">
                    Wallet ID (Identificador da Carteira)
                  </label>
                  <input
                    type="text"
                    placeholder="ID da Carteira Asaas (ex: b64...)"
                    value={linkWalletId}
                    onChange={(e) => setLinkWalletId(e.target.value)}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-app-stroke">
                <button
                  onClick={handleBack}
                  className="px-6 py-4 rounded-xl border border-app-stroke text-app-text-muted text-[10px] font-black uppercase tracking-widest hover:text-app-text-main hover:bg-app-stroke/20 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleLinkAccount}
                  disabled={saving}
                  className="px-8 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Conectando...
                    </>
                  ) : (
                    <>
                      Conectar Conta
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* CREATE ACCOUNT: STEP 2 (Dados do Escritório) */}
          {flowType === 'create' && step === 2 && (
            <motion.div 
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-app-text-main uppercase tracking-tight">Dados da Empresa / Escritório</h2>
                <p className="text-xs text-app-text-muted">Esses dados serão utilizados para registrar a subconta no Asaas.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Razão Social / Nome Comercial</label>
                  <input
                    type="text"
                    value={officeData.name}
                    onChange={(e) => setOfficeData({ ...officeData, name: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="Ex: Santos & Advogados Associados"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">CNPJ ou CPF da Empresa</label>
                  <input
                    type="text"
                    value={officeData.cpfCnpj}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      const formatted = clean.length <= 11 ? formatCPF(clean) : formatCNPJ(clean);
                      setOfficeData({ ...officeData, cpfCnpj: formatted });
                    }}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="00.000.000/0001-00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Telefone Comercial</label>
                  <input
                    type="text"
                    value={officeData.phone}
                    onChange={(e) => setOfficeData({ ...officeData, phone: formatPhone(e.target.value) })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="(11) 3333-4444"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Tipo de Empresa</label>
                  <select
                    value={officeData.companyType}
                    onChange={(e) => setOfficeData({ ...officeData, companyType: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="INDIVIDUAL">Individual (CPF ou MEI)</option>
                    <option value="LIMITED">Sociedade Limitada (LTDA)</option>
                    <option value="ASSOCIATION">Associação</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">CEP</label>
                  <input
                    type="text"
                    value={officeData.postalCode}
                    onChange={(e) => setOfficeData({ ...officeData, postalCode: formatCEP(e.target.value) })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="00000-000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Endereço</label>
                  <input
                    type="text"
                    value={officeData.address}
                    onChange={(e) => setOfficeData({ ...officeData, address: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="Ex: Av. Paulista"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Número</label>
                  <input
                    type="text"
                    value={officeData.addressNumber}
                    onChange={(e) => setOfficeData({ ...officeData, addressNumber: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="1000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Complemento</label>
                  <input
                    type="text"
                    value={officeData.complement}
                    onChange={(e) => setOfficeData({ ...officeData, complement: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="Ex: Sala 202"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Bairro</label>
                  <input
                    type="text"
                    value={officeData.province}
                    onChange={(e) => setOfficeData({ ...officeData, province: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="Bela Vista"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Cidade</label>
                    <input
                      type="text"
                      value={officeData.city}
                      onChange={(e) => setOfficeData({ ...officeData, city: e.target.value })}
                      className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Estado (UF)</label>
                    <input
                      type="text"
                      value={officeData.state}
                      onChange={(e) => setOfficeData({ ...officeData, state: e.target.value.toUpperCase() })}
                      className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-app-stroke">
                <button
                  onClick={handleBack}
                  className="px-6 py-4 rounded-xl border border-app-stroke text-app-text-muted text-[10px] font-black uppercase tracking-widest hover:text-app-text-main hover:bg-app-stroke/20 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                >
                  Continuar
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* CREATE ACCOUNT: STEP 3 (Responsável Legal) */}
          {flowType === 'create' && step === 3 && (
            <motion.div 
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-app-text-main uppercase tracking-tight">Dados do Responsável Legal</h2>
                <p className="text-xs text-app-text-muted">A pessoa física legalmente responsável pela subconta junto ao Asaas.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                  <input
                    type="text"
                    value={legalRepData.name}
                    onChange={(e) => setLegalRepData({ ...legalRepData, name: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="Nome igual ao documento oficial"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">CPF do Responsável</label>
                  <input
                    type="text"
                    value={legalRepData.cpf}
                    onChange={(e) => setLegalRepData({ ...legalRepData, cpf: formatCPF(e.target.value) })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">E-mail Principal</label>
                  <input
                    type="email"
                    value={legalRepData.email}
                    onChange={(e) => setLegalRepData({ ...legalRepData, email: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="responsavel@escritorio.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Celular / WhatsApp</label>
                  <input
                    type="text"
                    value={legalRepData.mobilePhone}
                    onChange={(e) => setLegalRepData({ ...legalRepData, mobilePhone: formatPhone(e.target.value) })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={legalRepData.birthDate}
                    onChange={(e) => setLegalRepData({ ...legalRepData, birthDate: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-app-stroke">
                <button
                  onClick={handleBack}
                  className="px-6 py-4 rounded-xl border border-app-stroke text-app-text-muted text-[10px] font-black uppercase tracking-widest hover:text-app-text-main hover:bg-app-stroke/20 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleNext}
                  className="px-8 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                >
                  Continuar
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* CREATE ACCOUNT: STEP 4 (Dados Bancários) */}
          {flowType === 'create' && step === 4 && (
            <motion.div 
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-app-text-main uppercase tracking-tight">Dados Bancários para Recebimento</h2>
                <p className="text-xs text-app-text-muted">Conta bancária de mesma titularidade onde serão transferidos os valores recebidos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Instituição Bancária</label>
                  <select
                    value={bankData.bankName}
                    onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="001 - Banco do Brasil S.A.">001 - Banco do Brasil</option>
                    <option value="237 - Banco Bradesco S.A.">237 - Bradesco</option>
                    <option value="341 - Itaú Unibanco S.A.">341 - Itaú</option>
                    <option value="033 - Banco Santander (Brasil) S.A.">033 - Santander</option>
                    <option value="104 - Caixa Econômica Federal">104 - Caixa Federal</option>
                    <option value="260 - Nu Pagamentos S.A. (Nubank)">260 - Nubank</option>
                    <option value="077 - Banco Inter S.A.">077 - Inter</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Tipo de Conta</label>
                  <select
                    value={bankData.accountType}
                    onChange={(e) => setBankData({ ...bankData, accountType: e.target.value })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="CONTA_CORRENTE">Conta Corrente</option>
                    <option value="CONTA_POUPANCA">Conta Poupança</option>
                    <option value="CONTA_PAGAMENTO">Conta de Pagamento</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Agência</label>
                  <input
                    type="text"
                    value={bankData.agency}
                    onChange={(e) => setBankData({ ...bankData, agency: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                    placeholder="Sem o dígito (ex: 1234)"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Conta</label>
                    <input
                      type="text"
                      value={bankData.account}
                      onChange={(e) => setBankData({ ...bankData, account: e.target.value.replace(/\D/g, '') })}
                      className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                      placeholder="Número da conta"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] ml-1">Dígito</label>
                    <input
                      type="text"
                      value={bankData.digit}
                      onChange={(e) => setBankData({ ...bankData, digit: e.target.value.toUpperCase() })}
                      className="w-full bg-app-bg border border-app-stroke rounded-[1.25rem] px-5 py-4 text-app-text-main text-sm font-bold focus:border-primary outline-none transition-all shadow-inner"
                      placeholder="Díg."
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-app-stroke">
                <button
                  onClick={handleBack}
                  className="px-6 py-4 rounded-xl border border-app-stroke text-app-text-muted text-[10px] font-black uppercase tracking-widest hover:text-app-text-main hover:bg-app-stroke/20 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCreateSubaccount}
                  disabled={saving}
                  className="px-8 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 font-bold"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Criando Subconta...
                    </>
                  ) : (
                    <>
                      Concluir Integração
                      <Check size={14} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
