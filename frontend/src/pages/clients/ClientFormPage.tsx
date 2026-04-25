import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Save, User, Mail, Phone, MapPin, FileBadge,
    Globe, MessageSquare, FileText, AlertTriangle, Calendar,
    Building, Briefcase, ClipboardList, Clock, StickyNote
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Options for select fields
const LEAD_SOURCES = [
    { value: '', label: 'Selecione a origem...' },
    { value: 'GOOGLE', label: 'Google' },
    { value: 'INDICACAO', label: 'Indicação' },
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'SITE', label: 'Site' },
    { value: 'OUTRO', label: 'Outro' },
];

const DEMAND_TYPES = [
    { value: '', label: 'Selecione o tipo...' },
    { value: 'PREVIDENCIARIA', label: 'Previdenciária' },
    { value: 'TRABALHISTA', label: 'Trabalhista' },
    { value: 'BANCARIA', label: 'Bancária' },
    { value: 'CIVEL_GERAL', label: 'Cível Geral' },
    { value: 'EXECUCAO', label: 'Execução' },
    { value: 'CONSULTIVO', label: 'Consultivo' },
    { value: 'CONTENCIOSO', label: 'Contencioso' },
    { value: 'FAMILIA', label: 'Família' },
    { value: 'CRIMINAL', label: 'Criminal' },
    { value: 'OUTRO', label: 'Outro' },
];

const URGENCY_LEVELS = [
    { value: '', label: 'Selecione...' },
    { value: 'BAIXA', label: 'Baixa' },
    { value: 'MEDIA', label: 'Média' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'URGENTE', label: 'Urgente' },
];

const LEAD_STATUS = [
    { value: 'NOVO', label: 'Novo' },
    { value: 'EM_CONTATO', label: 'Em Contato' },
    { value: 'AGENDADO', label: 'Agendado' },
    { value: 'CONVERTIDO', label: 'Convertido' },
    { value: 'PERDIDO', label: 'Perdido' },
];

const STATES = [
    { value: '', label: 'UF' },
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
].map(s => typeof s === 'string' ? { value: s, label: s } : s);

export default function ClientFormPage() {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);

    const [activeSection, setActiveSection] = useState(0);

    const [formData, setFormData] = useState({
        // Dados do Lead (Contato e Origem)
        name: '',
        email: '',
        phone: '',
        leadSource: '',
        referredBy: '',

        // Fatos e Informações Iniciais
        demandType: '',
        demandSummary: '',
        factsDescription: '',
        urgencyLevel: '',

        // Dados Pessoais e Adicionais
        document: '',
        rg: '',
        birthDate: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        occupation: '',

        // Acompanhamento do Lead
        leadStatus: 'NOVO',
        nextAction: '',
        nextActionDate: '',
        internalNotes: '',

        customFields: {} as any
    });

    useEffect(() => {
        if (isEditMode) {
            const fetchClient = async () => {
                try {
                    const response = await api.get(`/clients/${id}`);
                    const c = response.data;
                    setFormData({
                        name: c.name || '',
                        email: c.email || '',
                        phone: c.phone || '',
                        leadSource: c.leadSource || '',
                        referredBy: c.referredBy || '',
                        demandType: c.demandType || '',
                        demandSummary: c.demandSummary || '',
                        factsDescription: c.factsDescription || '',
                        urgencyLevel: c.urgencyLevel || '',
                        document: c.document || '',
                        rg: c.rg || '',
                        birthDate: c.birthDate ? c.birthDate.split('T')[0] : '',
                        address: c.address || '',
                        city: c.city || '',
                        state: c.state || '',
                        zipCode: c.zipCode || '',
                        occupation: c.occupation || '',
                        leadStatus: c.leadStatus || 'NOVO',
                        nextAction: c.nextAction || '',
                        nextActionDate: c.nextActionDate ? c.nextActionDate.substring(0, 16) : '',
                        internalNotes: c.internalNotes || '',
                        customFields: c.customFields || {}
                    });
                } catch (error) {
                    console.error('Error fetching client:', error);
                    addToast('Erro ao carregar dados do cliente.', 'error');
                } finally {

                }
            };
            fetchClient();
        }
    }, [id, isEditMode, addToast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomFieldChange = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            customFields: {
                ...prev.customFields,
                [key]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditMode) {
                await api.patch(`/clients/${id}`, formData);
                addToast('Cliente atualizado com sucesso', 'success');
            } else {
                await api.post('/clients', formData);
                addToast('Lead salvo com sucesso', 'success');
            }
            navigate(isEditMode ? `/app/clientes/${id}` : '/app/clientes');
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            const errorMessage = error.response?.data?.message || 'Erro ao salvar o cliente.';
            addToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const sections = [
        { title: 'Dados do Lead', icon: User, color: 'text-black dark:text-white' },
        { title: 'Fatos e Informações', icon: FileText, color: 'text-neutral-500' },
        { title: 'Dados Pessoais', icon: FileBadge, color: 'text-neutral-400' },
        { title: 'Acompanhamento', icon: ClipboardList, color: 'text-black dark:text-white' },
    ];

    const inputClass = "w-full px-4 py-2.5 bg-app-bg border border-app-stroke rounded-lg text-app-text-main placeholder-app-text-muted focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-colors";
    const labelClass = "block text-sm font-medium text-app-text-muted mb-1.5";
    const sectionClass = "bg-app-card border border-app-stroke rounded-xl p-6 space-y-5";

    return (
        <div className="max-w-5xl mx-auto pb-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/app/clientes')}
                    className="p-2 hover:bg-app-stroke/50 rounded-full text-app-text-muted transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-app-text-main">{isEditMode ? 'Editar Cliente' : 'Novo Lead'}</h1>
                    <p className="text-app-text-muted text-sm">{isEditMode ? 'Atualize as informações do cliente abaixo' : 'Registre todas as informações do primeiro atendimento'}</p>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {sections.map((section, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveSection(idx)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${activeSection === idx
                            ? 'bg-black text-white dark:bg-white dark:text-black border border-black/10 dark:border-white/10 shadow-lg'
                            : 'bg-app-card border border-app-stroke text-app-text-muted hover:text-app-text-main hover:border-app-text-muted/30'
                            }`}
                    >
                        <section.icon size={16} className={activeSection === idx ? (idx % 2 === 0 ? 'text-white dark:text-black' : 'text-white dark:text-black') : section.color} />
                        {section.title}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Section 1: Dados do Lead */}
                {activeSection === 0 && (
                    <div className={sectionClass}>
                        <h3 className="text-lg font-black text-app-text-main flex items-center gap-2 pb-3 border-b border-app-stroke uppercase tracking-widest">
                            <User size={20} className="text-black dark:text-white" />
                            Dados do Lead (Contato e Origem)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Nome Completo *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Nome do lead"
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Telefone / WhatsApp *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="(00) 00000-0000"
                                        className={`${inputClass} pl-10`}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="email@exemplo.com"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Origem do Lead *</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                    <select
                                        name="leadSource"
                                        value={formData.leadSource}
                                        onChange={handleChange}
                                        className={`${inputClass} pl-10`}
                                        required
                                    >
                                        {LEAD_SOURCES.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Indicado por</label>
                                <input
                                    type="text"
                                    name="referredBy"
                                    value={formData.referredBy}
                                    onChange={handleChange}
                                    placeholder="Nome de quem indicou (se aplicável)"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 2: Fatos e Informações Iniciais */}
                {activeSection === 1 && (
                    <div className={sectionClass}>
                        <h3 className="text-lg font-black text-app-text-main flex items-center gap-2 pb-3 border-b border-app-stroke uppercase tracking-widest">
                            <FileText size={20} className="text-neutral-500" />
                            Fatos e Informações Iniciais
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Tipo de Demanda</label>
                                <select
                                    name="demandType"
                                    value={formData.demandType}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    {DEMAND_TYPES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Nível de Urgência</label>
                                <div className="relative">
                                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                    <select
                                        name="urgencyLevel"
                                        value={formData.urgencyLevel}
                                        onChange={handleChange}
                                        className={`${inputClass} pl-10`}
                                    >
                                        {URGENCY_LEVELS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Resumo da Demanda</label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 text-app-text-muted" size={18} />
                                    <textarea
                                        name="demandSummary"
                                        value={formData.demandSummary}
                                        onChange={handleChange}
                                        placeholder="Descreva brevemente o que o cliente precisa..."
                                        className={`${inputClass} pl-10 min-h-[100px] resize-none`}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Descrição dos Fatos</label>
                                <textarea
                                    name="factsDescription"
                                    value={formData.factsDescription}
                                    onChange={handleChange}
                                    placeholder="Detalhe os fatos relevantes narrados pelo lead..."
                                    className={`${inputClass} min-h-[150px] resize-none`}
                                />
                            </div>

                            {/* Campos Específicos por Área */}
                            {formData.demandType === 'PREVIDENCIARIA' && (
                                <>
                                    <div className="md:col-span-2">
                                        <h4 className="text-[13px] font-bold text-app-text-muted uppercase tracking-wider mt-4 mb-1 border-b border-app-stroke pb-2">Dados Previdenciários</h4>
                                    </div>
                                    <div>
                                        <label className={labelClass}>NIT / PIS / PASEP</label>
                                        <input type="text" value={formData.customFields?.nit || ''} onChange={(e) => handleCustomFieldChange('nit', e.target.value)} className={inputClass} placeholder="Número" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Data de Início (DIB/DER)</label>
                                        <input type="date" value={formData.customFields?.dib || ''} onChange={(e) => handleCustomFieldChange('dib', e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Benefício Pretendido</label>
                                        <input type="text" value={formData.customFields?.benefit || ''} onChange={(e) => handleCustomFieldChange('benefit', e.target.value)} className={inputClass} placeholder="Ex: Aposentadoria por Idade" />
                                    </div>
                                </>
                            )}

                            {formData.demandType === 'TRABALHISTA' && (
                                <>
                                    <div className="md:col-span-2">
                                        <h4 className="text-[13px] font-bold text-app-text-muted uppercase tracking-wider mt-4 mb-1 border-b border-app-stroke pb-2">Dados Trabalhistas</h4>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Data de Admissão</label>
                                        <input type="date" value={formData.customFields?.admissionDate || ''} onChange={(e) => handleCustomFieldChange('admissionDate', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Data de Demissão</label>
                                        <input type="date" value={formData.customFields?.resignationDate || ''} onChange={(e) => handleCustomFieldChange('resignationDate', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Último Salário (R$)</label>
                                        <input type="text" value={formData.customFields?.lastSalary || ''} onChange={(e) => handleCustomFieldChange('lastSalary', e.target.value)} className={inputClass} placeholder="Ex: 2.500,00" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Cargo Exercido</label>
                                        <input type="text" value={formData.customFields?.role || ''} onChange={(e) => handleCustomFieldChange('role', e.target.value)} className={inputClass} placeholder="Ex: Vendedor" />
                                    </div>
                                </>
                            )}

                            {formData.demandType === 'BANCARIA' && (
                                <>
                                    <div className="md:col-span-2">
                                        <h4 className="text-[13px] font-bold text-app-text-muted uppercase tracking-wider mt-4 mb-1 border-b border-app-stroke pb-2">Dados de Ação Bancária</h4>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Banco Envolvido</label>
                                        <input type="text" value={formData.customFields?.bankName || ''} onChange={(e) => handleCustomFieldChange('bankName', e.target.value)} className={inputClass} placeholder="Ex: Banco do Brasil" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Número do Contrato</label>
                                        <input type="text" value={formData.customFields?.contractNumber || ''} onChange={(e) => handleCustomFieldChange('contractNumber', e.target.value)} className={inputClass} placeholder="Nº do Empréstimo/Financiamento" />
                                    </div>
                                </>
                            )}

                            {formData.demandType === 'CIVEL_GERAL' && (
                                <>
                                    <div className="md:col-span-2">
                                        <h4 className="text-[13px] font-bold text-app-text-muted uppercase tracking-wider mt-4 mb-1 border-b border-app-stroke pb-2">Dados Cíveis Genéricos</h4>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Parte Contrária</label>
                                        <input type="text" value={formData.customFields?.opponentName || ''} onChange={(e) => handleCustomFieldChange('opponentName', e.target.value)} className={inputClass} placeholder="Nome do Réu/Autor" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Valor Envolvido (R$)</label>
                                        <input type="text" value={formData.customFields?.civelValue || ''} onChange={(e) => handleCustomFieldChange('civelValue', e.target.value)} className={inputClass} placeholder="Ex: 15.000,00" />
                                    </div>
                                </>
                            )}

                            {formData.demandType === 'EXECUCAO' && (
                                <>
                                    <div className="md:col-span-2">
                                        <h4 className="text-[13px] font-bold text-app-text-muted uppercase tracking-wider mt-4 mb-1 border-b border-app-stroke pb-2">Dados de Execução</h4>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Título Executivo</label>
                                        <input type="text" value={formData.customFields?.executionTitle || ''} onChange={(e) => handleCustomFieldChange('executionTitle', e.target.value)} className={inputClass} placeholder="Ex: Cheque, Promissória, Sentença" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Valor da Dívida (R$)</label>
                                        <input type="text" value={formData.customFields?.debtValue || ''} onChange={(e) => handleCustomFieldChange('debtValue', e.target.value)} className={inputClass} placeholder="Valor Atualizado" />
                                    </div>
                                </>
                            )}

                        </div>
                    </div>
                )}

                {/* Section 3: Dados Pessoais e Adicionais */}
                {activeSection === 2 && (
                    <div className={sectionClass}>
                        <h3 className="text-lg font-black text-app-text-main flex items-center gap-2 pb-3 border-b border-app-stroke uppercase tracking-widest">
                            <FileBadge size={20} className="text-neutral-400" />
                            Dados Pessoais e Adicionais
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClass}>CPF / CNPJ</label>
                                <input
                                    type="text"
                                    name="document"
                                    value={formData.document}
                                    onChange={handleChange}
                                    placeholder="000.000.000-00"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>RG</label>
                                <input
                                    type="text"
                                    name="rg"
                                    value={formData.rg}
                                    onChange={handleChange}
                                    placeholder="Número do RG"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Data de Nascimento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                    <input
                                        type="date"
                                        name="birthDate"
                                        value={formData.birthDate}
                                        onChange={handleChange}
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Profissão</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                    <input
                                        type="text"
                                        name="occupation"
                                        value={formData.occupation}
                                        onChange={handleChange}
                                        placeholder="Ex: Empresário, Médico..."
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Endereço</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Rua, número, complemento"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Cidade</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="Cidade"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Estado</label>
                                <select
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    {STATES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>CEP</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleChange}
                                    placeholder="00000-000"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 4: Acompanhamento do Lead */}
                {activeSection === 3 && (
                    <div className={sectionClass}>
                        <h3 className="text-lg font-black text-app-text-main flex items-center gap-2 pb-3 border-b border-app-stroke uppercase tracking-widest">
                            <ClipboardList size={20} className="text-black dark:text-white" />
                            Acompanhamento do Lead
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Status do Lead</label>
                                <select
                                    name="leadStatus"
                                    value={formData.leadStatus}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    {LEAD_STATUS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Data da Próxima Ação</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                    <input
                                        type="datetime-local"
                                        name="nextActionDate"
                                        value={formData.nextActionDate}
                                        onChange={handleChange}
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Próxima Ação</label>
                                <input
                                    type="text"
                                    name="nextAction"
                                    value={formData.nextAction}
                                    onChange={handleChange}
                                    placeholder="Ex: Retornar ligação, Enviar proposta, Agendar reunião..."
                                    className={inputClass}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Notas Internas</label>
                                <div className="relative">
                                    <StickyNote className="absolute left-3 top-3 text-app-text-muted" size={18} />
                                    <textarea
                                        name="internalNotes"
                                        value={formData.internalNotes}
                                        onChange={handleChange}
                                        placeholder="Anotações internas sobre este lead (não visíveis para o cliente)..."
                                        className={`${inputClass} pl-10 min-h-[150px] resize-none`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation and Submit */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-app-stroke">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                            disabled={activeSection === 0}
                            className="px-4 py-2 border border-app-stroke rounded-lg text-app-text-muted font-medium hover:bg-app-stroke/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Anterior
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection(Math.min(3, activeSection + 1))}
                            disabled={activeSection === 3}
                            className="px-4 py-2 border border-app-stroke rounded-lg text-app-text-muted font-medium hover:bg-app-stroke/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próximo →
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/app/clientes')}
                            className="px-6 py-2.5 border border-app-stroke rounded-lg text-app-text-muted font-medium hover:bg-app-stroke/30 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-xl shadow-black/20"
                            disabled={loading}
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
}
