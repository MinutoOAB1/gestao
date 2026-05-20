import { useState, useEffect, useRef } from 'react';
import { Folder, MoreVertical, LayoutGrid, List, FileText, UploadCloud, ChevronRight, Download, Eye, Trash2, Database, FileCheck, Kanban, Lock, Unlock, Shield, History, User, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';

import { DocumentStatCard } from '../../components/documents/DocumentStatCard';
import { DocumentActionsMenu } from '../../components/documents/DocumentActionsMenu';
import { DocumentKanbanCard, DocumentKanbanColumn, FileItem, KanbanStatus } from '../../components/documents/DocumentKanban';

type ViewMode = 'grid' | 'list' | 'kanban';

interface FolderItem {
    id: string;
    name: string;
    parentId?: string;
    isLocked: boolean;
    createdAt: string;
}

interface AuditLog {
    id: string;
    action: string;
    userName: string;
    details: string;
    createdAt: string;
}

;


export default function DocumentsPage() {
    const { addToast } = useToast();
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedFileIds(filteredFiles.map(f => f.id));
        else setSelectedFileIds([]);
    };

    const toggleSelectFile = (id: string) => {
        setSelectedFileIds(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]);
    };

    // Navigation State
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'Meus Arquivos' }]);

    useEffect(() => { setSelectedFileIds([]); }, [currentFolderId, searchTerm, activeFilter]);

    // Data State
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Storage State (real data from API)
    const [storageInfo, setStorageInfo] = useState<{
        usedGb: number;
        quotaGb: number;
        percentUsed: number;
    }>({ usedGb: 0, quotaGb: 30, percentUsed: 0 });

    // Modal States
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

    // Advanced Modals
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditFile, setAuditFile] = useState<FileItem | null>(null);

    // Global Audit Modal
    const [isGlobalAuditOpen, setIsGlobalAuditOpen] = useState(false);
    const [globalAuditLogs, setGlobalAuditLogs] = useState<AuditLog[]>([]);

    const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
    const [permissionFile, setPermissionFile] = useState<FileItem | null>(null);
    const [allowedRolesInput, setAllowedRolesInput] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<{ id: string; name: string; role: string }[]>([]);

    // Bulk Actions Modal states
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [selectedDestinationFolderId, setSelectedDestinationFolderId] = useState<string>('');


    // Kanban Column Titles (editable, stored in localStorage)
    const [kanbanTitles, setKanbanTitles] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('doc-kanban-titles');
        return saved ? JSON.parse(saved) : { TODO: 'A Fazer', IN_PROGRESS: 'Em Progresso', REVIEW: 'Em Revisão', DONE: 'Concluído' };
    });
    const updateKanbanTitle = (id: string, title: string) => {
        const updated = { ...kanbanTitles, [id]: title };
        setKanbanTitles(updated);
        localStorage.setItem('doc-kanban-titles', JSON.stringify(updated));
    };


    // Fetch Data
    const fetchData = async (folderId: string | null = null) => {
        try {
            setIsLoading(true);
            const [foldersRes, filesRes] = await Promise.all([
                api.get('/documents/folders', { params: { parentId: folderId } }),
                api.get('/documents', { params: { folderId } })
            ]);
            setFolders(foldersRes.data);
            setFiles(filesRes.data);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch storage info (real data)
    const fetchStorageInfo = async () => {
        try {
            const res = await api.get('/settings/storage');
            setStorageInfo({
                usedGb: res.data.usedGb || 0,
                quotaGb: res.data.quotaGb || 100,
                percentUsed: res.data.percentUsed || 0
            });
        } catch (error) {
            console.error("Failed to fetch storage info", error);
        }
    };

    useEffect(() => {
        fetchData(currentFolderId);
        fetchStorageInfo();
        // Fetch users for permissions modal
        api.get('/users').then(res => setAllUsers(res.data)).catch(() => { });
    }, [currentFolderId]);

    // Handlers
    const handleFolderClick = (folder: FolderItem) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
        setActiveFilter('Todos');
    };

    const handleBreadcrumbClick = (index: number) => {
        const targetCrumb = breadcrumbs[index];
        setCurrentFolderId(targetCrumb.id);
        setBreadcrumbs(prev => prev.slice(0, index + 1));
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            addToast('Digite um nome para a pasta.', 'warning');
            return;
        }
        try {
            await api.post('/documents/folders', { name: newFolderName.trim(), parentId: currentFolderId });
            setNewFolderName(''); setIsNewFolderOpen(false); fetchData(currentFolderId);
            addToast('Pasta criada com sucesso!', 'success');
        } catch (error: any) { addToast(error.response?.data?.message || 'Erro ao criar pasta.', 'error'); }
    };

    const handleUpload = async () => {
        if (!uploadFile) {
            addToast('Selecione um arquivo.', 'warning');
            return;
        }
        try {
            const ext = uploadFile.name.split('.').pop()?.toLowerCase() || 'file';
            let docType = 'file';
            if (['pdf'].includes(ext)) docType = 'pdf';
            if (['doc', 'docx'].includes(ext)) docType = 'doc';
            if (['jpg', 'png', 'jpeg'].includes(ext)) docType = 'image';

            const size = uploadFile.size < 1024 * 1024 ? `${(uploadFile.size / 1024).toFixed(1)} KB` : `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB`;

            // Base64 helper
            const toBase64 = (file: File) => new Promise<string | null>((resolve) => {
                if (file.size > 10 * 1024 * 1024) resolve(null);
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            });
            const url = await toBase64(uploadFile);

            await api.post('/documents', { name: uploadFile.name, type: docType, size, folderId: currentFolderId, url });
            setUploadFile(null); setIsUploadOpen(false); fetchData(currentFolderId);
            addToast('Arquivo enviado!', 'success');
        } catch (error: any) { addToast(error.response?.data?.message || 'Erro ao fazer upload.', 'error'); }
    };

    const handleDelete = async (file: FileItem) => {
        if (!confirm(`Deseja excluir "${file.name}"?`)) return;
        try {
            await api.delete(`/documents/${file.id}`);
            fetchData(currentFolderId);
            setSelectedFileIds(prev => prev.filter(id => id !== file.id));
            addToast('Arquivo excluído', 'success');
        } catch (error) { addToast('Erro ao excluir arquivo.', 'error'); }
    };

    const handleBulkDownload = () => {
        const filesToDownload = files.filter(f => selectedFileIds.includes(f.id) && f.url);
        if (filesToDownload.length === 0) {
            addToast('Nenhum arquivo com url para baixar.', 'warning');
            return;
        }
        filesToDownload.forEach(f => window.open(f.url, '_blank'));
        addToast(`${filesToDownload.length} arquivo(s) baixado(s).`, 'success');
        setSelectedFileIds([]);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Deseja excluir os ${selectedFileIds.length} arquivos selecionados?`)) return;
        try {
            await Promise.all(selectedFileIds.map(id => api.delete(`/documents/${id}`)));
            fetchData(currentFolderId);
            setSelectedFileIds([]);
            addToast(`${selectedFileIds.length} arquivos excluídos`, 'success');
        } catch (error) { 
            addToast('Erro ao excluir arquivos.', 'error'); 
        }
    };

    const handleBulkMove = async () => {
        if (!selectedDestinationFolderId && selectedDestinationFolderId !== 'root') {
            addToast('Selecione uma pasta de destino', 'warning');
            return;
        }
        try {
            const destId = selectedDestinationFolderId === 'root' ? null : selectedDestinationFolderId;
            await Promise.all(selectedFileIds.map(id => api.patch(`/documents/${id}`, { folderId: destId })));
            fetchData(currentFolderId);
            setSelectedFileIds([]);
            setIsMoveModalOpen(false);
            addToast(`${selectedFileIds.length} arquivo(s) movido(s)`, 'success');
        } catch (error) {
            addToast('Erro ao mover arquivos.', 'error');
        }
    };

    const handleLock = async (file: FileItem) => {
        try {
            await api.post(`/documents/${file.id}/lock`);
            fetchData(currentFolderId);
            addToast(file.isLocked ? 'Arquivo desbloqueado' : 'Arquivo bloqueado', 'info');
        } catch (error) { addToast("Erro ao alterar bloqueio.", 'error'); }
    };

    const handleFolderLock = async (folder: FolderItem) => {
        try {
            await api.post(`/documents/folders/${folder.id}/lock`);
            fetchData(currentFolderId);
            addToast(folder.isLocked ? 'Pasta desbloqueada' : 'Pasta bloqueada', 'info');
        } catch (error) { addToast("Erro ao alterar bloqueio da pasta.", 'error'); }
    };


    const handleAudit = async (file: FileItem) => {
        setAuditFile(file);
        try {
            const res = await api.get(`/documents/${file.id}/audit`);
            setAuditLogs(res.data);
            setIsAuditOpen(true);
        } catch (error) { addToast("Erro ao carregar auditoria.", 'error'); }
    };

    const handlePermissions = (file: FileItem) => {
        setPermissionFile(file);
        setAllowedRolesInput(file.allowedRoles || '');
        setIsPermissionsOpen(true);
    };

    const savePermissions = async () => {
        if (!permissionFile) return;
        try {
            await api.patch(`/documents/${permissionFile.id}/permissions`, { allowedRoles: allowedRolesInput });
            setIsPermissionsOpen(false);
            fetchData(currentFolderId);
            addToast('Permissões salvas com sucesso', 'success');
        } catch (error) { addToast("Erro ao salvar permissões.", 'error'); }
    };

    const handleGlobalAudit = async () => {
        try {
            const res = await api.get('/documents/audit/all');
            setGlobalAuditLogs(res.data);
            setIsGlobalAuditOpen(true);
        } catch (error) { addToast("Erro ao carregar auditoria.", 'error'); }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const fileId = active.id as string;
        const newStatus = over.id as string;
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, kanbanStatus: newStatus as KanbanStatus } : f));
        try {
            await api.patch(`/documents/${fileId}/status`, { status: newStatus });
        } catch (error) {
            console.error("Failed to move file", error);
            fetchData(currentFolderId);
        }
    };

    // Filter Logic
    const filteredFiles = files.filter(file => {
        const nameLower = file.name.toLowerCase();
        const matchesSearch = nameLower.includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        switch(activeFilter) {
            case 'Todos': return true;
            case 'PDF': return file.type === 'pdf';
            case 'Word': return file.type === 'doc';
            case 'Imagens': return file.type === 'image';
            case 'Petições': return nameLower.includes('peti') || nameLower.includes('inicial');
            case 'Contratos': return nameLower.includes('contrat');
            case 'Guias': return nameLower.includes('guia') || nameLower.includes('custas');
            case 'Procurações': return nameLower.includes('procura');
            default: return true;
        }
    });

    const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const getMenuActions = (file: FileItem) => ({
        onPreview: () => { setPreviewFile(file); setIsPreviewOpen(true); },
        onDownload: () => file.url && window.open(file.url, '_blank'),
        onDelete: () => handleDelete(file),
        onRename: () => { },
        onLock: () => handleLock(file),
        onAudit: () => handleAudit(file),
        onPermissions: () => handlePermissions(file)
    });

    const QUICK_FILTERS = ['Todos', 'Petições', 'Contratos', 'Guias', 'Procurações', 'PDF'];

    return (
        <div 
            className="flex h-full w-full overflow-hidden bg-transparent text-app-text-main gap-4 relative"
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDraggingOver(false); }}
            onDrop={(e) => { 
                e.preventDefault(); 
                setIsDraggingOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setUploadFile(e.dataTransfer.files[0]);
                    setIsUploadOpen(true);
                }
            }}
        >
            {/* Immersive Drag & Drop Overlay */}
            <AnimatePresence>
                {isDraggingOver && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="absolute inset-0 z-[100] bg-primary/20 dark:bg-primary/10 flex flex-col items-center justify-center rounded-2xl border-4 border-dashed border-primary m-2 pointer-events-none"
                    >
                        <motion.div 
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                            className="bg-app-card p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 pointer-events-none"
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-bounce">
                                <UploadCloud size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-app-text-main tracking-tight">Solte seus documentos aqui</h2>
                            <p className="text-app-text-muted text-sm text-center max-w-xs">Eles serão preparados para envio na pasta atual.</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className={clsx("flex flex-col h-full overflow-hidden transition-all duration-500 ease-in-out px-4 md:px-8 py-4 md:py-6 relative w-full", isPreviewOpen ? "hidden lg:flex lg:w-[65%] xl:w-[70%]" : "flex-1")}>
                {/* Header - Mobile Responsive */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 mb-4 md:mb-6">
                    {/* Search and Predictive Filters */}
                <div className="w-full md:flex-1 md:max-w-2xl flex flex-col gap-2">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Buscar documentos, contratos, petições..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-app-card border border-app-stroke rounded-xl pl-4 pr-10 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                        />
                        <Filter size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                        <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider shrink-0">Filtros Rápidos:</span>
                        {QUICK_FILTERS.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={clsx(
                                    "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                                    activeFilter === filter 
                                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                                        : "bg-app-card border border-app-stroke text-app-text-muted hover:border-primary/50 hover:text-app-text-main"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
                    <button onClick={() => setIsNewFolderOpen(true)} className="flex-1 md:flex-none px-3 md:px-4 py-2.5 bg-app-card border border-app-stroke rounded-xl text-xs md:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-app-stroke/20 text-app-text-main transition-colors shadow-sm hover:shadow-md">
                        <Folder size={16} /> <span className="hidden sm:inline">Nova Pasta</span><span className="sm:hidden">Pasta</span>
                    </button>
                    <button onClick={handleGlobalAudit} className="flex-1 md:flex-none px-3 md:px-4 py-2.5 bg-app-card border border-app-stroke rounded-xl text-xs md:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-app-stroke/20 text-app-text-main transition-colors shadow-sm hover:shadow-md">
                        <History size={16} /> Auditoria
                    </button>
                    <button onClick={() => setIsUploadOpen(true)} className="flex-1 md:flex-none px-3 md:px-4 py-2.5 bg-primary text-white rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5">
                        <UploadCloud size={16} /> Upload
                    </button>
                </div>
            </header>


            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 shrink-0">
                <DocumentStatCard icon={Database} label="Armazenamento" value={`${storageInfo.usedGb} GB`} subtext={`/ ${storageInfo.quotaGb} GB`} color="bg-blue-600" />
                <DocumentStatCard icon={FileCheck} label="Arquivos" value={files.length.toString()} subtext="Docs" color="bg-green-600" />
                <DocumentStatCard icon={Lock} label="Protegidos" value={files.filter(f => f.isLocked).length.toString()} subtext="Arquivos" color="bg-amber-600" />
                <DocumentStatCard icon={Folder} label="Pastas" value={folders.length.toString()} subtext="Total" color="bg-purple-600" />
            </div>


            <div className="flex-1 bg-app-bg/50 border border-app-stroke/50 rounded-2xl overflow-hidden flex flex-col p-4 md:p-6 gap-4 relative">
                <div className="flex justify-between items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 text-sm text-app-text-main font-bold overflow-x-auto no-scrollbar whitespace-nowrap -mx-2 px-2 sm:mx-0 sm:px-0">
                        {breadcrumbs.map((crumb, idx) => (
                            <div key={idx} className="flex items-center gap-2 shrink-0">
                                {idx > 0 && <ChevronRight size={14} className="shrink-0" />}
                                <button onClick={() => handleBreadcrumbClick(idx)} className="hover:text-primary font-medium whitespace-nowrap">{crumb.name}</button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('list')} className={clsx("p-2 rounded-lg", viewMode === 'list' ? "bg-primary text-white" : "text-app-text-muted bg-app-card border border-app-stroke")}><List size={16} /></button>
                        <button onClick={() => setViewMode('grid')} className={clsx("p-2 rounded-lg", viewMode === 'grid' ? "bg-primary text-white" : "text-app-text-muted bg-app-card border border-app-stroke")}><LayoutGrid size={16} /></button>
                        <button onClick={() => setViewMode('kanban')} className={clsx("p-2 rounded-lg", viewMode === 'kanban' ? "bg-primary text-white" : "text-app-text-muted bg-app-card border border-app-stroke")}><Kanban size={16} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Folders (only in List/Grid) */}
                    {viewMode !== 'kanban' && filteredFolders.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {filteredFolders.map(folder => (
                                <div key={folder.id} className={clsx("bg-app-card border p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:border-primary/50 relative group", folder.isLocked ? "border-amber-500/40 bg-amber-500/5" : "border-app-stroke")}>
                                    <div onClick={() => handleFolderClick(folder)} className="flex items-center gap-3 flex-1 min-w-0">
                                        <Folder className={folder.isLocked ? "text-amber-600" : "text-amber-500"} size={24} />
                                        <span className="font-medium text-sm truncate text-app-text-main">{folder.name}</span>
                                        {folder.isLocked && <Lock size={12} className="text-amber-500 shrink-0" />}
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); handleFolderLock(folder); }} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" title={folder.isLocked ? "Desbloquear pasta" : "Bloquear pasta"}>
                                        {folder.isLocked ? <Unlock size={14} className="text-gray-500" /> : <Lock size={14} className="text-gray-400" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex-1 flex flex-col">
                            {viewMode === 'kanban' ? (
                                <div className="flex gap-4 h-full min-h-[400px] overflow-x-hidden animate-pulse">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex-1 min-w-[220px] bg-gray-100 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col gap-2">
                                            <div className="h-4 w-20 bg-app-stroke/50 rounded mb-2" />
                                            {[...Array(3)].map((_, j) => (
                                                <div key={j} className="h-24 bg-white dark:bg-slate-700/50 rounded-xl border border-app-stroke/30" />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 animate-pulse">
                                    {[...Array(12)].map((_, i) => (
                                        <div key={i} className="bg-app-card border border-app-stroke rounded-xl overflow-hidden h-48 flex flex-col">
                                            <div className="flex-1 bg-app-stroke/20" />
                                            <div className="p-3 bg-app-card h-16 border-t border-app-stroke/30 flex gap-2 items-center">
                                                <div className="w-8 h-8 bg-app-stroke/30 rounded-lg shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-app-stroke/40 rounded w-full" />
                                                    <div className="h-2 bg-app-stroke/30 rounded w-1/2" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-app-card border border-app-stroke rounded-xl p-4 animate-pulse space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 border-b border-app-stroke/30 pb-4 last:border-0 last:pb-0">
                                            <div className="w-8 h-8 rounded bg-app-stroke/30" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-app-stroke/40 rounded w-1/3" />
                                                <div className="h-2 bg-app-stroke/30 rounded w-16" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {viewMode === 'kanban' && (
                                <motion.div 
                                    key="kanban"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.12 }}
                                    className="h-full"
                                >
                                    <DndContext onDragEnd={handleDragEnd}>
                                        <div className="flex gap-2 md:gap-4 h-full min-h-[300px] md:min-h-[400px] overflow-x-auto pb-4">
                                            <DocumentKanbanColumn id="TODO" title={kanbanTitles.TODO} files={filteredFiles.filter(f => f.kanbanStatus === 'TODO')} onMenuActions={getMenuActions} onTitleChange={updateKanbanTitle} />
                                            <DocumentKanbanColumn id="IN_PROGRESS" title={kanbanTitles.IN_PROGRESS} files={filteredFiles.filter(f => f.kanbanStatus === 'IN_PROGRESS')} onMenuActions={getMenuActions} onTitleChange={updateKanbanTitle} />
                                            <DocumentKanbanColumn id="REVIEW" title={kanbanTitles.REVIEW} files={filteredFiles.filter(f => f.kanbanStatus === 'REVIEW')} onMenuActions={getMenuActions} onTitleChange={updateKanbanTitle} />
                                            <DocumentKanbanColumn id="DONE" title={kanbanTitles.DONE} files={filteredFiles.filter(f => f.kanbanStatus === 'DONE')} onMenuActions={getMenuActions} onTitleChange={updateKanbanTitle} />
                                        </div>
                                    </DndContext>
                                </motion.div>
                            )}

                            {viewMode === 'grid' && (
                                <motion.div 
                                    key="grid"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.12 }}
                                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
                                >
                                    {filteredFiles.map(file => (
                                        <div key={file.id}
                                            className={clsx(
                                                "bg-app-card border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg relative group transition-all", 
                                                selectedFileIds.includes(file.id) ? "border-primary ring-1 ring-primary/50 bg-primary/5" : file.isLocked ? "border-amber-500/40 bg-amber-500/5" : "border-app-stroke hover:border-primary/50"
                                            )}
                                            onClick={() => { setPreviewFile(file); setIsPreviewOpen(true); }}
                                        >
                                            {/* Select Checkbox */}
                                            <div className={clsx("absolute top-2 left-2 z-20 transition-opacity", selectedFileIds.includes(file.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100")} onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" checked={selectedFileIds.includes(file.id)} onChange={() => toggleSelectFile(file.id)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer shadow-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm" />
                                            </div>

                                            {/* Preview Thumbnail Area */}
                                            <div className="relative h-32 md:h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                                                {file.url && (file.type === 'pdf' || file.name.toLowerCase().endsWith('.pdf')) ? (
                                                    <>
                                                        {/* PDF Thumbnail - shows first page */}
                                                        <iframe
                                                            src={`${file.url}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                                            className="w-full h-full pointer-events-none scale-100 origin-top-left"
                                                            title={file.name}
                                                            style={{ border: 'none' }}
                                                        />
                                                        {/* Overlay gradient for better visual */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                                    </>
                                                ) : file.url && (file.type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)) ? (
                                                    <img
                                                        src={file.url}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    /* Placeholder for other file types */
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <div className="text-center">
                                                            {file.type === 'pdf' ? (
                                                                <FileText size={56} className="mx-auto text-red-500 mb-2" />
                                                            ) : file.type === 'doc' ? (
                                                                <FileText size={56} className="mx-auto text-blue-500 mb-2" />
                                                            ) : (
                                                                <FileText size={56} className="mx-auto text-gray-400 mb-2" />
                                                            )}
                                                            <span className="text-xs text-app-text-muted uppercase font-bold">{file.type}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Lock indicator */}
                                                {file.isLocked && (
                                                    <div className="absolute top-2 left-2 bg-amber-500/90 p-1.5 rounded-lg shadow-lg">
                                                        <Lock size={12} className="text-white" />
                                                    </div>
                                                )}

                                                {/* Hover overlay with Eye icon */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                                        <Eye size={24} className="text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* File Info Section */}
                                            <div className="p-3">
                                                <div className="flex items-start gap-2">
                                                    {/* File Type Icon */}
                                                    <div className={clsx(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                        file.type === 'pdf' ? "bg-red-500/10" : file.type === 'doc' ? "bg-blue-500/10" : file.type === 'image' ? "bg-green-500/10" : "bg-gray-500/10"
                                                    )}>
                                                        {file.type === 'pdf' ? (
                                                            <FileText size={16} className="text-red-500" />
                                                        ) : file.type === 'doc' ? (
                                                            <FileText size={16} className="text-blue-500" />
                                                        ) : file.type === 'image' ? (
                                                            <FileText size={16} className="text-green-500" />
                                                        ) : (
                                                            <FileText size={16} className="text-gray-500" />
                                                        )}
                                                    </div>

                                                    {/* File Name and Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-app-text-main line-clamp-2 leading-tight">{file.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] text-app-text-muted uppercase font-medium">{file.type.toUpperCase()}</span>
                                                            <span className="w-1 h-1 rounded-full bg-app-text-muted" />
                                                            <span className="text-[10px] text-app-text-muted">{file.size}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Uploader & Permissions */}
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-app-stroke/30">
                                                    <div className="flex items-center gap-1.5">
                                                        {file.createdBy ? (
                                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[8px] font-bold text-white" title={`Enviado por: ${file.createdBy.name}`}>
                                                                {file.createdBy.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        ) : <div className="w-5 h-5 rounded-full bg-app-stroke flex items-center justify-center"><User size={10} className="text-app-text-muted" /></div>}
                                                        <span className="text-[10px] text-app-text-muted truncate max-w-[60px]">{file.createdBy?.name || 'Sistema'}</span>
                                                    </div>
                                                    {file.allowedRoles && (
                                                        <div className="flex gap-0.5">
                                                            {file.allowedRoles.split(',').slice(0, 2).map((role, i) => (
                                                                <span key={i} className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1 py-0.5 rounded font-bold">{role.trim().substring(0, 3)}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions Menu */}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DocumentActionsMenu {...getMenuActions(file)} isLocked={file.isLocked} />
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {viewMode === 'list' && (
                                <motion.div 
                                    key="list"
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 15 }}
                                    transition={{ duration: 0.12 }}
                                    className="bg-app-card border border-app-stroke rounded-xl overflow-hidden shadow-sm"
                                >
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-app-stroke/30 text-app-text-muted font-medium">
                                            <tr>
                                                <th className="px-4 py-3 w-10 text-center"><input type="checkbox" checked={selectedFileIds.length > 0 && selectedFileIds.length === filteredFiles.length} onChange={handleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer mt-0.5" /></th>
                                                <th className="px-4 py-3">Nome</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFiles.map(file => (
                                                <tr key={file.id} className={clsx("border-b border-app-stroke/50 cursor-pointer transition-colors", selectedFileIds.includes(file.id) ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-app-stroke/10")} onClick={() => { setPreviewFile(file); setIsPreviewOpen(true); }}>
                                                    <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                                        <input type="checkbox" checked={selectedFileIds.includes(file.id)} onChange={() => toggleSelectFile(file.id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer mt-0.5" />
                                                    </td>
                                                    <td className="px-4 py-3 flex items-center gap-3">
                                                        {file.isLocked ? <Lock size={12} className="text-amber-500" /> : <FileText size={12} className="text-blue-400" />}
                                                        <span className="font-medium text-app-text-main">{file.name}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="bg-app-stroke/30 px-2 py-0.5 rounded text-[10px] font-medium">{kanbanTitles[file.kanbanStatus] || file.kanbanStatus}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end relative h-4">
                                                            <div className="absolute -top-1" onClick={e => e.stopPropagation()}>
                                                                <DocumentActionsMenu {...getMenuActions(file)} isLocked={file.isLocked} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* 1. New Folder & Upload (Reused) */}
            <Modal isOpen={isNewFolderOpen} onClose={() => setIsNewFolderOpen(false)} title="Nova Pasta"
                footer={<><button onClick={() => setIsNewFolderOpen(false)} className="bg-transparent text-app-text-muted px-4 py-2 text-xs">Cancelar</button><button onClick={handleCreateFolder} className="bg-primary text-white rounded px-4 py-2 text-xs">Criar</button></>}>
                <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nome da pasta" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-2 text-sm text-gray-900 dark:text-white" />
            </Modal>

            <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload de Arquivo"
                footer={<><button onClick={() => setIsUploadOpen(false)} className="bg-transparent text-app-text-muted px-4 py-2 text-xs">Cancelar</button><button onClick={handleUpload} className="bg-primary text-white rounded px-4 py-2 text-xs">Enviar</button></>}>
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                    <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="text-gray-900 dark:text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer" />
                    {uploadFile && <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Arquivo: {uploadFile.name}</p>}
                </div>
            </Modal>

            {/* 2. Audit Modal */}
            <Modal isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} title={`Auditoria: ${auditFile?.name}`} footer={<button onClick={() => setIsAuditOpen(false)} className="w-full bg-app-stroke/20 text-app-text-main py-2 rounded">Fechar</button>}>
                <div className="max-h-[300px] overflow-y-auto space-y-3">
                    {auditLogs.length === 0 ? <p className="text-app-text-muted text-center py-4">Nenhum registro encontrado.</p> : auditLogs.map(log => (
                        <div key={log.id} className="flex gap-3 text-xs border-b border-app-stroke/30 pb-2">
                            <div className="w-8 h-8 rounded-full bg-app-stroke flex items-center justify-center shrink-0">
                                <User size={14} className="text-app-text-muted" />
                            </div>
                            <div>
                                <p className="text-app-text-main font-bold">{log.userName} <span className="font-normal text-app-text-muted">realizou</span> {log.action}</p>
                                <p className="text-app-text-label">{log.details}</p>
                                <p className="text-app-text-muted text-[10px] mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* 3. Permission Modal with User Selection */}
            <Modal isOpen={isPermissionsOpen} onClose={() => setIsPermissionsOpen(false)} title="Permissões de Acesso" footer={<button onClick={savePermissions} className="w-full bg-primary text-white py-2 rounded">Salvar Alterações</button>}>
                <div className="space-y-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Defina os cargos e/ou usuários que podem acessar este arquivo.</p>

                    {/* Roles Input */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Cargos Permitidos</label>
                        <input value={allowedRolesInput} onChange={e => setAllowedRolesInput(e.target.value)} placeholder="Ex: ADMIN, LAWYER" className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-2 text-sm text-gray-900 dark:text-white" />
                    </div>

                    {/* Users Dropdown */}
                    <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Usuários com Acesso</label>
                        <div className="border border-gray-200 dark:border-slate-700 rounded max-h-[150px] overflow-y-auto p-2 bg-gray-50 dark:bg-slate-800">
                            {allUsers.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-2">Nenhum usuário disponível</p>
                            ) : (
                                allUsers.map(user => (
                                    <label key={user.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded cursor-pointer">
                                        <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={e => {
                                            if (e.target.checked) setSelectedUserIds([...selectedUserIds, user.id]);
                                            else setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                                        }} className="accent-primary" />
                                        <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{user.name}</span>
                                        <span className="text-[10px] bg-gray-200 dark:bg-slate-600 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">{user.role}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Selected Users Summary */}
                    {selectedUserIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {selectedUserIds.map(id => {
                                const user = allUsers.find(u => u.id === id);
                                return user ? (
                                    <span key={id} className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                                        {user.name}
                                        <button onClick={() => setSelectedUserIds(selectedUserIds.filter(uid => uid !== id))} className="hover:text-red-500">×</button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}
                </div>
            </Modal>
            {/* 4. Global Audit Modal */}
            <Modal isOpen={isGlobalAuditOpen} onClose={() => setIsGlobalAuditOpen(false)} title="Auditoria do Sistema" footer={<button onClick={() => setIsGlobalAuditOpen(false)} className="w-full bg-app-stroke/20 text-app-text-main py-2 rounded">Fechar</button>}>
                <div className="max-h-[400px] overflow-y-auto space-y-3">
                    {globalAuditLogs.length === 0 ? <p className="text-app-text-muted text-center py-4">Nenhum registro encontrado.</p> : globalAuditLogs.map(log => (
                        <div key={log.id} className="flex gap-3 text-xs border-b border-app-stroke/30 pb-2">
                            <div className="w-8 h-8 rounded-full bg-app-stroke flex items-center justify-center shrink-0">
                                <User size={14} className="text-app-text-muted" />
                            </div>
                            <div>
                                <p className="text-app-text-main font-bold">{log.userName} <span className="font-normal text-app-text-muted">realizou</span> {log.action}</p>
                                <p className="text-app-text-label">{log.details}</p>
                                <p className="text-app-text-muted text-[10px] mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* 5. Move Files Modal */}
            <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title={`Mover ${selectedFileIds.length} arquivo(s)`} 
                footer={
                    <>
                        <button onClick={() => setIsMoveModalOpen(false)} className="bg-transparent text-app-text-muted px-4 py-2 text-xs">Cancelar</button>
                        <button onClick={handleBulkMove} className="bg-primary text-white rounded px-4 py-2 text-xs shadow-md">Mover Arquivos</button>
                    </>
                }>
                <div className="space-y-4">
                    <p className="text-sm text-app-text-muted">Selecione a pasta de destino para os arquivos selecionados:</p>
                    <select 
                        value={selectedDestinationFolderId} 
                        onChange={(e) => setSelectedDestinationFolderId(e.target.value)}
                        className="w-full bg-app-card border border-app-stroke rounded-xl px-4 py-3 text-sm focus:border-primary outline-none"
                    >
                        <option value="">-- Selecione uma pasta --</option>
                        <option value="root">Raiz (Documentos)</option>
                        {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                    </select>
                </div>
            </Modal>
            </div> {/* End of Main Content Area */}

            {/* Split-Screen Side Panel for Preview */}
            <AnimatePresence>
                {isPreviewOpen && previewFile && (
                    <motion.div 
                        initial={{ opacity: 0, width: 0, x: 50 }}
                        animate={{ opacity: 1, width: "auto", x: 0 }}
                        exit={{ opacity: 0, width: 0, x: 50 }}
                        transition={{ duration: 0.4, type: "spring", bounce: 0.1 }}
                        className={clsx(
                            "absolute md:relative right-0 top-0 bottom-0 z-50 flex flex-col bg-app-card border border-app-stroke rounded-2xl overflow-hidden shadow-2xl shrink-0 h-full",
                            "w-full md:w-[400px] lg:w-[35%] xl:w-[30%]"
                        )}
                    >
                        {/* Side Panel Header */}
                        <div className="p-4 border-b border-app-stroke flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                    previewFile.type === 'pdf' ? "bg-red-500/10 text-red-500" : previewFile.type === 'doc' ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
                                )}>
                                    <FileText size={16} />
                                </div>
                                <h3 className="font-bold text-sm text-app-text-main truncate" title={previewFile.name}>{previewFile.name}</h3>
                            </div>
                            <button onClick={() => setIsPreviewOpen(false)} className="p-2 text-app-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors shrink-0 flex items-center gap-1">
                                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Fechar</span>
                                <span aria-hidden="true" className="text-xl leading-none">&times;</span>
                            </button>
                        </div>
                        
                        {/* Side Panel Content (PDF / Image iframe) */}
                        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-900 flex flex-col">
                            {previewFile.url ? (
                                previewFile.type === 'pdf' || previewFile.name.toLowerCase().endsWith('.pdf') ? (
                                    <iframe src={`${previewFile.url}#view=FitH`} className="w-full h-full border-0" title={previewFile.name} />
                                ) : previewFile.type.startsWith('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(previewFile.name) ? (
                                    <div className="w-full h-full p-4 flex items-center justify-center">
                                        <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                        <FileText size={48} className="text-gray-400 mb-4" />
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Visualização não suportada no navegador.</p>
                                    </div>
                                )
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <Eye size={48} className="text-gray-300 mb-4" />
                                    <p className="text-sm text-gray-500">Documento sem URL de visualização.</p>
                                </div>
                            )}
                        </div>

                        {/* Side Panel Footer Actions */}
                        <div className="p-4 border-t border-app-stroke flex gap-2 shrink-0 bg-app-card">
                            <button onClick={() => fileWrapper(previewFile).download()} className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary-dark transition-all hover:-translate-y-0.5">
                                <Download size={16} /> Baixar Arquivo
                            </button>
                            <button onClick={() => { setIsPreviewOpen(false); handleAudit(previewFile); }} className="px-4 py-2 bg-app-stroke/20 text-app-text-main text-xs font-bold rounded-xl hover:bg-app-stroke/40 transition-colors">
                                Auditoria
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Actions Floating Bar */}
            <AnimatePresence>
                {selectedFileIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-gray-800 dark:border-gray-200"
                    >
                        <span className="font-bold text-sm tracking-tight">{selectedFileIds.length} selecionados</span>
                        <div className="flex items-center gap-2 border-l border-gray-700 dark:border-gray-200 pl-6">
                            <button className="p-2 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 tooltip" title="Mover para Pasta" onClick={() => setIsMoveModalOpen(true)}>
                                <Folder size={18} />
                            </button>
                            <button className="p-2 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-full transition-colors text-green-400 dark:text-green-600 flex items-center gap-2 tooltip" title="Baixar" onClick={handleBulkDownload}>
                                <Download size={18} />
                            </button>
                            <div className="w-px h-6 bg-gray-700 dark:bg-gray-200 mx-1" />
                            <button className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-500 flex items-center gap-2 tooltip" title="Remover" onClick={handleBulkDelete}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

// Helper to wrap file for download if needed, though ActionsMenu handles it direct
const fileWrapper = (f: FileItem) => ({ download: () => f.url && window.open(f.url, '_blank') });
