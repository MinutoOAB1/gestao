import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Scale, FileText, BadgeDollarSign, Users } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface Client {
    id: string;
    name: string;
    email?: string;
}

export default function ProcessFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const { addToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [loadingProcess, setLoadingProcess] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [formData, setFormData] = useState({
        number: '',
        title: '',
        description: '',
        court: '',
        area: 'Cível',
        value: '',
        status: 'ACTIVE',
        clientId: ''
    });

    useEffect(() => {
        fetchClients();
        if (isEditMode) {
            fetchProcess();
        }
    }, [id]);

    const fetchProcess = async () => {
        setLoadingProcess(true);
        try {
            const response = await api.get(`/processes/${id}`);
            const process = response.data;
            setFormData({
                number: process.number || '',
                title: process.title || '',
                description: process.description || '',
                court: process.court || '',
                area: process.area || 'Cível',
                value: process.value ? String(process.value) : '',
                status: process.status || 'ACTIVE',
                clientId: process.clientId || ''
            });
        } catch (error) {
            console.error('Erro ao carregar processo:', error);
            addToast('Erro ao carregar processo', 'error');
            navigate('/app/processos');
        } finally {
            setLoadingProcess(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data || []);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                value: formData.value ? parseFloat(formData.value) : undefined,
                clientId: formData.clientId || undefined
            };

            if (isEditMode) {
                await api.put(`/processes/${id}`, payload);
                addToast('Processo atualizado com sucesso!', 'success');
            } else {
                await api.post('/processes', payload);
                addToast('Processo criado com sucesso!', 'success');
            }
            navigate('/app/processos');
        } catch (error) {
            console.error('Erro ao salvar processo:', error);
            addToast('Erro ao salvar processo. Verifique os dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loadingProcess) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/app/processos')}
                    className="p-2 hover:bg-white/10 rounded-full text-app-text-muted transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-app-text-main">
                        {isEditMode ? 'Editar Processo' : 'Novo Processo'}
                    </h1>
                    <p className="text-app-text-muted text-sm">
                        {isEditMode ? 'Atualize os dados do processo' : 'Cadastre um novo caso jurídico no sistema'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-app-card rounded-2xl border border-app-stroke p-8 space-y-6">

                {/* Seção 1: Informações Básicas */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-primary" />
                        Dados Principais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Título do Processo / Parte</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ex: Ação de Cobrança - Silva vs Souza"
                                className="w-full px-4 py-3 bg-app-input border border-app-stroke rounded-lg text-app-text-main placeholder:text-app-text-label focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Número do Processo (CNJ)</label>
                            <input
                                type="text"
                                name="number"
                                value={formData.number}
                                onChange={handleChange}
                                placeholder="0000000-00.0000.0.00.0000"
                                className="w-full px-4 py-3 bg-app-input border border-app-stroke rounded-lg text-app-text-main placeholder:text-app-text-label focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Área do Direito</label>
                            <select
                                name="area"
                                value={formData.area}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-app-input border border-app-stroke rounded-lg text-app-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            >
                                <option value="Cível">Cível</option>
                                <option value="Trabalhista">Trabalhista</option>
                                <option value="Penal">Penal</option>
                                <option value="Previdenciário">Previdenciário</option>
                                <option value="Tributário">Tributário</option>
                                <option value="Família">Família</option>
                            </select>
                        </div>
                    </div>
                </div>

                <hr className="border-app-stroke" />

                {/* Seção 2: Cliente Vinculado */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users size={20} className="text-primary" />
                        Cliente Vinculado
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">
                            Selecione o Cliente (opcional)
                        </label>
                        <select
                            name="clientId"
                            value={formData.clientId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-app-input border border-app-stroke rounded-lg text-app-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            disabled={loadingClients}
                        >
                            <option value="">
                                {loadingClients ? 'Carregando clientes...' : 'Selecione um cliente'}
                            </option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.name} {client.email ? `(${client.email})` : ''}
                                </option>
                            ))}
                        </select>
                        {clients.length === 0 && !loadingClients && (
                            <p className="text-app-text-muted text-sm mt-2">
                                Nenhum cliente cadastrado.{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/app/clientes/novo')}
                                    className="text-primary hover:underline"
                                >
                                    Cadastrar cliente
                                </button>
                            </p>
                        )}
                    </div>
                </div>

                <hr className="border-app-stroke" />

                {/* Seção 3: Tribunal e Valores */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Scale size={20} className="text-primary" />
                        Juízo e Valores
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Tribunal / Vara</label>
                            <input
                                type="text"
                                name="court"
                                value={formData.court}
                                onChange={handleChange}
                                placeholder="Ex: 3ª Vara Cível de São Paulo"
                                className="w-full px-4 py-3 bg-app-input border border-app-stroke rounded-lg text-app-text-main placeholder:text-app-text-label focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-app-text-muted mb-2">Valor da Causa (R$)</label>
                            <div className="relative">
                                <BadgeDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
                                <input
                                    type="number"
                                    name="value"
                                    value={formData.value}
                                    onChange={handleChange}
                                    placeholder="0,00"
                                    step="0.01"
                                    className="w-full pl-10 pr-4 py-3 bg-app-input border border-app-stroke rounded-lg text-app-text-main placeholder:text-app-text-label focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-app-stroke" />

                {/* Seção 4: Detalhes */}
                <div>
                    <label className="block text-sm font-medium text-app-text-muted mb-2">Observações / Descrição</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-app-input border border-app-stroke rounded-lg text-app-text-main placeholder:text-app-text-label focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-all"
                        placeholder="Detalhes adicionais sobre o caso..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/app/processos')}
                        className="px-6 py-2.5 border border-app-stroke rounded-lg text-white font-medium hover:bg-white/5 transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                        disabled={loading}
                    >
                        <Save size={18} />
                        {loading ? 'Salvando...' : 'Salvar Processo'}
                    </button>
                </div>

            </form>
        </div>
    );
}
