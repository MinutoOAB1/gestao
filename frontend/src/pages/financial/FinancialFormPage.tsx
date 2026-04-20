import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign, Calendar, Users, Plus, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useEffect } from 'react';

export default function FinancialFormPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'INCOME',
        description: '',
        amount: '',
        category: 'Honorários',
        date: new Date().toISOString().split('T')[0],
        status: 'PAID',
        clientId: ''
    });

    const [clients, setClients] = useState<Array<{ id: string, name: string }>>([]);
    const [isQuickAddClient, setIsQuickAddClient] = useState(false);
    const [quickAddClientName, setQuickAddClientName] = useState('');
    const [isCreatingClient, setIsCreatingClient] = useState(false);

    useEffect(() => {
        api.get('/clients').then(res => setClients(res.data)).catch(console.error);
    }, []);

    const handleQuickAddClient = async () => {
        if (!quickAddClientName.trim()) return;
        setIsCreatingClient(true);
        try {
            const res = await api.post('/clients', { name: quickAddClientName });
            setClients(prev => [...prev, res.data]);
            setFormData(prev => ({ ...prev, clientId: res.data.id }));
            setIsQuickAddClient(false);
            setQuickAddClientName('');
            addToast('Cliente criado com sucesso!', 'success');
        } catch (error) {
            addToast('Erro ao criar cliente.', 'error');
        } finally {
            setIsCreatingClient(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = {
                ...formData,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date).toISOString(),
            };

            if (!payload.clientId) {
                delete payload.clientId; // Remove empty clientId
            }

            await api.post('/financial', payload);
            navigate('/app/financeiro');
            addToast('Transação salva com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao salvar transação:', error);
            addToast('Erro ao salvar transação.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/app/financeiro')}
                    className="p-2 hover:bg-legal-100 rounded-full text-legal-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-legal-900">Nova Transação</h1>
                    <p className="text-legal-500 text-sm">Registre uma receita ou despesa</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-legal-200 shadow-sm p-8 space-y-6">

                <div className="flex bg-legal-50 p-1 rounded-lg mb-6">
                    <button
                        type="button"
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${formData.type === 'INCOME' ? 'bg-white shadow text-green-700' : 'text-legal-500 hover:text-legal-900'}`}
                        onClick={() => setFormData(prev => ({ ...prev, type: 'INCOME' }))}
                    >
                        Receita
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${formData.type === 'EXPENSE' ? 'bg-white shadow text-red-700' : 'text-legal-500 hover:text-legal-900'}`}
                        onClick={() => setFormData(prev => ({ ...prev, type: 'EXPENSE' }))}
                    >
                        Despesa
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium text-legal-700 mb-1">Descrição</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder={formData.type === 'INCOME' ? "Ex: Honorários Processo 123" : "Ex: Aluguel Escritório"}
                        className="w-full px-4 py-2 border border-legal-300 rounded-md focus:ring-2 focus:ring-legal-900 focus:border-transparent outline-none"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-legal-700 mb-1">Valor (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-legal-400" size={18} />
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                step="0.01"
                                className="w-full pl-10 pr-4 py-2 border border-legal-300 rounded-md focus:ring-2 focus:ring-legal-900 focus:border-transparent outline-none"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-legal-700 mb-1">Data</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-legal-400" size={18} />
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 border border-legal-300 rounded-md focus:ring-2 focus:ring-legal-900 focus:border-transparent outline-none"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-legal-700 mb-1">Categoria</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-legal-300 rounded-md focus:ring-2 focus:ring-legal-900 focus:border-transparent outline-none"
                        >
                            {formData.type === 'INCOME' ? (
                                <>
                                    <option value="Honorários">Honorários</option>
                                    <option value="Consulta">Consulta</option>
                                    <option value="Outros">Outros</option>
                                </>
                            ) : (
                                <>
                                    <option value="Aluguel">Aluguel</option>
                                    <option value="Software">Software</option>
                                    <option value="Equipamentos">Equipamentos</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Impostos">Impostos</option>
                                    <option value="Outros">Outros</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-legal-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-legal-300 rounded-md focus:ring-2 focus:ring-legal-900 focus:border-transparent outline-none"
                        >
                            <option value="PENDING">Pendente</option>
                            <option value="PAID">Pago / Recebido</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-legal-700 mb-1">
                        <Users size={14} className="inline mr-1" />
                        Cliente Vinculado (Opcional)
                    </label>
                    {isQuickAddClient ? (
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="Nome do novo cliente..." 
                                value={quickAddClientName} 
                                onChange={e => setQuickAddClientName(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleQuickAddClient())}
                                className="flex-1 px-4 py-2 border border-legal-300 rounded-md focus:ring-2 focus:ring-legal-900 focus:border-transparent outline-none" 
                            />
                            <button 
                                type="button" 
                                onClick={handleQuickAddClient} 
                                disabled={isCreatingClient || !quickAddClientName.trim()} 
                                className="px-4 py-2 bg-legal-900 text-white rounded-md text-sm font-medium hover:bg-legal-800 disabled:opacity-50 transition-colors"
                            >
                                {isCreatingClient ? '...' : 'Salvar'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setIsQuickAddClient(false)} 
                                className="px-3 py-2 bg-legal-100 text-legal-600 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <select
                                name="clientId"
                                value={formData.clientId || ''}
                                onChange={handleChange}
                                className="flex-1 px-4 py-2 border border-legal-300 rounded-md focus:ring-2 focus:ring-legal-900 focus:border-transparent outline-none"
                            >
                                <option value="">Nenhum</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button 
                                type="button" 
                                onClick={() => setIsQuickAddClient(true)} 
                                className="px-4 py-2 bg-legal-100 text-legal-700 rounded-md hover:bg-legal-200 text-sm font-medium flex items-center gap-1 transition-colors"
                                title="Cadastrar cliente rápido"
                            >
                                <Plus size={16} /> <span className="hidden sm:inline">Novo</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-legal-100">
                    <button
                        type="button"
                        onClick={() => navigate('/app/financeiro')}
                        className="px-6 py-2 border border-legal-300 rounded-md text-legal-700 font-medium hover:bg-legal-50 transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-legal-900 text-white rounded-md font-medium hover:bg-legal-800 transition-colors flex items-center gap-2"
                        disabled={loading}
                    >
                        <Save size={18} />
                        {loading ? 'Salvar Transação' : 'Salvar Transação'}
                    </button>
                </div>

            </form>
        </div>
    );
}
