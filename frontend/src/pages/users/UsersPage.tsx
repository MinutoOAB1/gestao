import { useState, useEffect } from 'react';
import {
    Shield, Edit2, Trash2, Check, X,
    Search, UserPlus, Lock, Eye, EyeOff,
    Briefcase, GraduationCap, Handshake, Crown
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import { Protect } from '../../components/auth/Protect';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../../components/ui/Avatar';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'LAWYER' | 'INTERN' | 'PARTNER';
    createdAt: string;
    isActive?: boolean;
}

const ROLES = [
    {
        value: 'ADMIN',
        label: 'Administrador',
        description: 'Acesso total ao sistema',
        icon: Crown,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        permissions: ['Gerenciar usuários', 'Ver relatórios', 'Editar configurações', 'Acesso financeiro completo']
    },
    {
        value: 'LAWYER',
        label: 'Advogado',
        description: 'Acesso completo a processos e clientes',
        icon: Briefcase,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        permissions: ['Gerenciar processos', 'Gerenciar clientes', 'Criar documentos', 'Ver financeiro']
    },
    {
        value: 'INTERN',
        label: 'Estagiário',
        description: 'Acesso limitado com supervisão',
        icon: GraduationCap,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        permissions: ['Ver processos atribuídos', 'Criar andamentos', 'Ver clientes', 'Criar documentos']
    },
    {
        value: 'PARTNER',
        label: 'Parceiro',
        description: 'Acesso restrito a processos compartilhados',
        icon: Handshake,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        permissions: ['Ver processos compartilhados', 'Adicionar andamentos', 'Ver documentos relacionados']
    },
];

export default function UsersPage() {
    const { addToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string>('');

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'LAWYER' as string,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/auth/users');
            setUsers(res.data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            addToast('Preencha todos os campos obrigatórios', 'warning');
            return;
        }

        setSaving(true);
        try {
            await api.post('/auth/users', formData);
            await fetchUsers();
            setShowAddModal(false);
            resetForm();
            addToast('Usuário criado com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            addToast('Erro ao criar usuário', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEditUser = async () => {
        if (!selectedUser) return;

        setSaving(true);
        try {
            await api.patch(`/auth/users/${selectedUser.id}`, {
                name: formData.name,
                role: formData.role,
            });
            await fetchUsers();
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
            addToast('Usuário atualizado com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            addToast('Erro ao atualizar usuário', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Tem certeza que deseja remover o usuário ${user.name}?`)) return;

        try {
            await api.delete(`/auth/users/${user.id}`);
            await fetchUsers();
            addToast('Usuário removido com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao remover usuário:', error);
            addToast('Erro ao remover usuário', 'error');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'LAWYER' });
        setShowPassword(false);
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({ name: user.name, email: user.email, password: '', role: user.role });
        setShowEditModal(true);
    };

    const getRoleInfo = (role: string) => {
        return ROLES.find(r => r.value === role) || ROLES[1];
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !filterRole || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-app-text-main flex items-center gap-3">
                        <Shield className="text-primary" size={28} />
                        Usuários & Controle de Acesso
                    </h1>
                    <p className="text-app-text-muted text-sm mt-1">
                        Gerencie usuários e defina níveis de permissão
                    </p>
                </div>
                <Protect roles={['ADMIN', 'LAWYER']}>
                    <button
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                        className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <UserPlus size={18} /> Novo Usuário
                    </button>
                </Protect>
            </div>

            {/* Role Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ROLES.map(role => {
                    const count = users.filter(u => u.role === role.value).length;
                    return (
                        <div
                            key={role.value}
                            className={clsx(
                                "bg-app-card border border-app-stroke rounded-xl p-4 cursor-pointer transition-all hover:border-primary/30",
                                filterRole === role.value && "border-primary ring-1 ring-primary/20"
                            )}
                            onClick={() => setFilterRole(filterRole === role.value ? '' : role.value)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", role.bgColor)}>
                                    <role.icon size={20} className={role.color} />
                                </div>
                                <span className="text-2xl font-bold text-app-text-main">{count}</span>
                            </div>
                            <h3 className="font-semibold text-app-text-main">{role.label}</h3>
                            <p className="text-xs text-app-text-muted mt-1">{role.description}</p>
                        </div>
                    );
                })}
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar usuários..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-app-input border border-app-stroke rounded-xl text-app-text-main placeholder:text-app-text-label focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2.5 bg-app-input border border-app-stroke rounded-xl text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="">Todos os níveis</option>
                    {ROLES.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-app-card border border-app-stroke rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-app-stroke bg-app-bg/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-app-text-muted uppercase tracking-wider">Usuário</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-app-text-muted uppercase tracking-wider">Nível de Acesso</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-app-text-muted uppercase tracking-wider">Permissões</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-app-text-muted uppercase tracking-wider">Status</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-app-text-muted uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-stroke">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-app-text-muted">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-app-text-muted">
                                        Nenhum usuário encontrado
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => {
                                    const roleInfo = getRoleInfo(user.role);
                                    return (
                                        <tr key={user.id} className="hover:bg-app-bg/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={user.name} size="md" />
                                                    <div>
                                                        <p className="font-medium text-app-text-main">{user.name}</p>
                                                        <p className="text-sm text-app-text-muted">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", roleInfo.bgColor)}>
                                                        <roleInfo.icon size={16} className={roleInfo.color} />
                                                    </div>
                                                    <span className="font-medium text-app-text-main">{roleInfo.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {roleInfo.permissions.slice(0, 2).map((perm, i) => (
                                                        <span key={i} className="px-2 py-0.5 text-xs bg-app-stroke/50 text-app-text-muted rounded">
                                                            {perm}
                                                        </span>
                                                    ))}
                                                    {roleInfo.permissions.length > 2 && (
                                                        <span className="px-2 py-0.5 text-xs bg-app-stroke/50 text-app-text-muted rounded">
                                                            +{roleInfo.permissions.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={clsx(
                                                    "px-2 py-1 text-xs font-medium rounded-full",
                                                    user.isActive !== false
                                                        ? "bg-green-500/10 text-green-400"
                                                        : "bg-red-500/10 text-red-400"
                                                )}>
                                                    {user.isActive !== false ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Protect roles={['ADMIN', 'LAWYER']}>
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="p-2 hover:bg-app-stroke/50 rounded-lg text-app-text-muted hover:text-app-text-main transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </Protect>
                                                    <Protect roles={['ADMIN']}>
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="p-2 hover:bg-red-500/10 rounded-lg text-app-text-muted hover:text-red-400 transition-colors"
                                                            title="Remover"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </Protect>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Permissions Info */}
            <div className="bg-app-card border border-app-stroke rounded-xl p-6">
                <h3 className="text-lg font-bold text-app-text-main mb-4 flex items-center gap-2">
                    <Lock size={20} className="text-primary" />
                    Matriz de Permissões
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-app-stroke">
                                <th className="text-left py-3 px-4 text-app-text-muted font-medium">Recurso</th>
                                {ROLES.map(role => (
                                    <th key={role.value} className="text-center py-3 px-4">
                                        <span className={role.color}>{role.label}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-app-stroke/50">
                            {[
                                { resource: 'Gerenciar Usuários', perms: [true, false, false, false] },
                                { resource: 'Ver Todos os Processos', perms: [true, true, false, false] },
                                { resource: 'Criar/Editar Processos', perms: [true, true, false, false] },
                                { resource: 'Ver Clientes', perms: [true, true, true, false] },
                                { resource: 'Gerenciar Clientes', perms: [true, true, false, false] },
                                { resource: 'Acesso Financeiro', perms: [true, true, false, false] },
                                { resource: 'Criar Documentos', perms: [true, true, true, false] },
                                { resource: 'Gerar Relatórios IA', perms: [true, true, false, false] },
                                { resource: 'Ver Agenda', perms: [true, true, true, true] },
                                { resource: 'Adicionar Andamentos', perms: [true, true, true, true] },
                            ].map((row, i) => (
                                <tr key={i}>
                                    <td className="py-3 px-4 text-app-text-main">{row.resource}</td>
                                    {row.perms.map((perm, j) => (
                                        <td key={j} className="text-center py-3 px-4">
                                            {perm ? (
                                                <Check size={18} className="inline text-green-400" />
                                            ) : (
                                                <X size={18} className="inline text-red-400/50" />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-app-card border border-app-stroke rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-app-text-main flex items-center gap-2">
                                <UserPlus size={20} className="text-primary" />
                                Novo Usuário
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="text-app-text-muted hover:text-app-text-main">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-app-text-muted mb-1">Nome *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-app-input border border-app-stroke rounded-xl text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Nome completo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-app-text-muted mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-app-input border border-app-stroke rounded-xl text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="email@exemplo.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-app-text-muted mb-1">Senha *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-app-input border border-app-stroke rounded-xl text-app-text-main focus:ring-2 focus:ring-primary outline-none pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text-main"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-app-text-muted mb-2">Nível de Acesso *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                                            className={clsx(
                                                "p-3 rounded-xl border text-left transition-all",
                                                formData.role === role.value
                                                    ? "border-primary bg-primary/10"
                                                    : "border-app-stroke hover:border-app-stroke/80"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <role.icon size={16} className={role.color} />
                                                <span className="font-medium text-app-text-main text-sm">{role.label}</span>
                                            </div>
                                            <p className="text-xs text-app-text-muted">{role.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2.5 border border-app-stroke rounded-xl text-app-text-muted hover:bg-app-stroke/30 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Salvando...' : 'Criar Usuário'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-app-card border border-app-stroke rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-app-text-main flex items-center gap-2">
                                <Edit2 size={20} className="text-primary" />
                                Editar Usuário
                            </h2>
                            <button onClick={() => setShowEditModal(false)} className="text-app-text-muted hover:text-app-text-main">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-app-text-muted mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-app-input border border-app-stroke rounded-xl text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-app-text-muted mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-app-input border border-app-stroke rounded-xl text-app-text-muted cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-app-text-muted mb-2">Nível de Acesso</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                                            className={clsx(
                                                "p-3 rounded-xl border text-left transition-all",
                                                formData.role === role.value
                                                    ? "border-primary bg-primary/10"
                                                    : "border-app-stroke hover:border-app-stroke/80"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <role.icon size={16} className={role.color} />
                                                <span className="font-medium text-app-text-main text-sm">{role.label}</span>
                                            </div>
                                            <p className="text-xs text-app-text-muted">{role.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-2.5 border border-app-stroke rounded-xl text-app-text-muted hover:bg-app-stroke/30 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditUser}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
