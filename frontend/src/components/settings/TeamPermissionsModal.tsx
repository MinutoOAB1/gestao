import { useState, useEffect } from 'react';
import { X, Users, Shield, Search, Plus, Trash2, Edit2, Check, Crown, Scale, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { clsx } from 'clsx';
import { Avatar } from '../ui/Avatar';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    permissions?: string;
    twoFactorEnabled?: boolean;
    createdAt: string;
}

interface TeamPermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ROLES = [
    { value: 'ADMIN', label: 'Administrador', icon: Crown, color: 'text-amber-500', description: 'Acesso total ao sistema' },
    { value: 'LAWYER', label: 'Advogado', icon: Scale, color: 'text-blue-500', description: 'Acesso a processos e clientes' },
    { value: 'COLLABORATOR', label: 'Colaborador', icon: UserCog, color: 'text-slate-400', description: 'Acesso limitado' },
];

const PERMISSION_MODULES = [
    { key: 'processes', label: 'Processos' },
    { key: 'clients', label: 'Clientes' },
    { key: 'financial', label: 'Financeiro' },
    { key: 'documents', label: 'Documentos' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'contracts', label: 'Contratos' },
    { key: 'templates', label: 'Modelos' },
    { key: 'users', label: 'Usuários' },
];

export default function TeamPermissionsModal({ isOpen, onClose }: TeamPermissionsModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [saving, setSaving] = useState(false);

    // New user form
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'LAWYER' });

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) return;

        setSaving(true);
        try {
            await api.post('/auth/users', newUser);
            await fetchUsers();
            setShowAddUser(false);
            setNewUser({ name: '', email: '', password: '', role: 'LAWYER' });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao adicionar usuário');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await api.patch(`/auth/users/${userId}`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Error updating role:', error);
        }
    };

    const handleUpdatePermissions = async (userId: string, permissions: Record<string, boolean>) => {
        try {
            await api.patch(`/auth/users/${userId}`, { permissions: JSON.stringify(permissions) });
            setUsers(users.map(u => u.id === userId ? { ...u, permissions: JSON.stringify(permissions) } : u));
        } catch (error) {
            console.error('Error updating permissions:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário?')) return;

        try {
            await api.delete(`/auth/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const getUserPermissions = (user: User): Record<string, boolean> => {
        if (!user.permissions) {
            // Default permissions based on role
            if (user.role === 'ADMIN') {
                return Object.fromEntries(PERMISSION_MODULES.map(m => [m.key, true]));
            }
            return Object.fromEntries(PERMISSION_MODULES.map(m => [m.key, m.key !== 'users' && m.key !== 'financial']));
        }
        try {
            return JSON.parse(user.permissions);
        } catch {
            return {};
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-app-card border border-app-stroke rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-app-stroke shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Users size={20} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="font-bold text-app-text-main">Equipe & Permissões</h2>
                                <p className="text-xs text-app-text-muted">Gerencie membros e controle de acesso</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-app-text-muted hover:text-app-text-main">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between p-4 border-b border-app-stroke shrink-0">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar membro..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-app-bg border border-app-stroke rounded-lg text-sm text-app-text-main placeholder-app-text-muted focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setShowAddUser(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                        >
                            <Plus size={16} />
                            Adicionar Membro
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12 text-app-text-muted">
                                Nenhum membro encontrado
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredUsers.map((user) => {
                                    const roleInfo = ROLES.find(r => r.value === user.role) || ROLES[1];
                                    const permissions = getUserPermissions(user);
                                    const isEditing = editingUser?.id === user.id;

                                    return (
                                        <div
                                            key={user.id}
                                            className={clsx(
                                                "bg-app-bg border rounded-xl p-4 transition-all",
                                                isEditing ? "border-primary" : "border-app-stroke"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        src={user.avatar}
                                                        name={user.name}
                                                        size="md"
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-app-text-main">{user.name}</span>
                                                            {user.twoFactorEnabled && (
                                                                <span title="2FA Ativo">
                                                                    <Shield size={14} className="text-green-500" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-app-text-muted">{user.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Role Select */}
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                        className={clsx(
                                                            "text-sm font-medium px-3 py-1.5 rounded-lg border bg-app-card focus:ring-2 focus:ring-primary outline-none",
                                                            roleInfo.color
                                                        )}
                                                    >
                                                        {ROLES.map(role => (
                                                            <option key={role.value} value={role.value}>{role.label}</option>
                                                        ))}
                                                    </select>

                                                    {/* Edit Permissions */}
                                                    <button
                                                        onClick={() => setEditingUser(isEditing ? null : user)}
                                                        className={clsx(
                                                            "p-2 rounded-lg transition-colors",
                                                            isEditing ? "bg-primary text-white" : "bg-app-stroke/50 text-app-text-muted hover:text-app-text-main"
                                                        )}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-2 rounded-lg bg-app-stroke/50 text-app-text-muted hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Permissions Editor */}
                                            {isEditing && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="mt-4 pt-4 border-t border-app-stroke"
                                                >
                                                    <h4 className="text-sm font-medium text-app-text-main mb-3">Permissões por Módulo</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {PERMISSION_MODULES.map((module) => (
                                                            <label
                                                                key={module.key}
                                                                className={clsx(
                                                                    "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                                                                    permissions[module.key]
                                                                        ? "border-primary bg-primary/5"
                                                                        : "border-app-stroke bg-app-card hover:bg-app-stroke/30"
                                                                )}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={permissions[module.key] || false}
                                                                    onChange={(e) => {
                                                                        const newPerms = { ...permissions, [module.key]: e.target.checked };
                                                                        handleUpdatePermissions(user.id, newPerms);
                                                                    }}
                                                                    className="sr-only"
                                                                />
                                                                <div className={clsx(
                                                                    "w-4 h-4 rounded border flex items-center justify-center",
                                                                    permissions[module.key] ? "bg-primary border-primary" : "border-app-stroke"
                                                                )}>
                                                                    {permissions[module.key] && <Check size={10} className="text-white" />}
                                                                </div>
                                                                <span className="text-sm text-app-text-main">{module.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Add User Modal */}
                    {showAddUser && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                            <div className="bg-app-card rounded-2xl p-6 w-full max-w-md">
                                <h3 className="text-lg font-bold text-app-text-main mb-4 flex items-center gap-2">
                                    <Plus size={20} className="text-primary" />
                                    Adicionar Membro
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-app-text-muted mb-1">Nome</label>
                                        <input
                                            type="text"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-app-bg border border-app-stroke rounded-lg text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="Nome completo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-app-text-muted mb-1">E-mail</label>
                                        <input
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-app-bg border border-app-stroke rounded-lg text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="email@exemplo.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-app-text-muted mb-1">Senha Inicial</label>
                                        <input
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-app-bg border border-app-stroke rounded-lg text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-app-text-muted mb-1">Função</label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-app-bg border border-app-stroke rounded-lg text-app-text-main focus:ring-2 focus:ring-primary outline-none"
                                        >
                                            {ROLES.map(role => (
                                                <option key={role.value} value={role.value}>{role.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => { setShowAddUser(false); setNewUser({ name: '', email: '', password: '', role: 'LAWYER' }); }}
                                        className="flex-1 py-2.5 border border-app-stroke text-app-text-main rounded-lg font-medium hover:bg-app-stroke/30"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddUser}
                                        disabled={saving || !newUser.name || !newUser.email || !newUser.password}
                                        className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50"
                                    >
                                        {saving ? 'Adicionando...' : 'Adicionar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
