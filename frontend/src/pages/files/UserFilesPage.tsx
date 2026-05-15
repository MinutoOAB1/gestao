import { useState, useEffect, useCallback } from 'react';
import { UploadCloud, Folder, ChevronRight, Download, Eye, Trash2, File, Image, FileText, HardDrive, FolderPlus, Grid, List } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

interface UserFile {
    id: string;
    name: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
    folder: string | null;
    createdAt: string;
}

interface StorageStats {
    user: {
        usedGb: string;
        quotaGb: number;
        usedMb: number;
        percentUsed: number;
    };
    tenant: {
        usedGb: string;
        quotaGb: number;
        usedMb: number;
        percentUsed: number;
        maxUsers: number;
    };
    fileCount: number;
}

// Format file size
const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Get file icon based on mime type
const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('pdf')) return FileText;
    return File;
};

// Get full URL for file (handles relative URLs from backend)
const getFullUrl = (url: string): string => {
    if (!url) return '';
    // If already absolute URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Build full URL with backend host
    const backendUrl = `http://${window.location.hostname}:3000`;
    return `${backendUrl}${url}`;
};

// Storage Progress Bar
const StorageBar = ({ stats }: { stats: StorageStats }) => (
    <div className="bg-app-card border border-app-stroke rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-primary" />
                <span className="text-sm font-medium text-app-text-main">Meu Armazenamento</span>
            </div>
            <span className="text-xs text-app-text-muted">{stats.user.usedGb} GB / {stats.user.quotaGb} GB</span>
        </div>
        <div className="h-2 bg-app-stroke rounded-full overflow-hidden">
            <div
                className={clsx(
                    "h-full rounded-full transition-all",
                    stats.user.percentUsed > 90 ? "bg-red-500" : stats.user.percentUsed > 70 ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(stats.user.percentUsed, 100)}%` }}
            />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-app-text-label">
            <span>{stats.fileCount} arquivos</span>
            <span>Conta: {stats.tenant.usedGb} GB / {stats.tenant.quotaGb} GB</span>
        </div>
    </div>
);

// File Card Component
const FileCard = ({ file, onDelete, onPreview }: { file: UserFile; onDelete: () => void; onPreview: () => void }) => {
    const FileIcon = getFileIcon(file.mimeType);
    const isImage = file.mimeType.startsWith('image/');
    const fullUrl = getFullUrl(file.url);

    return (
        <div className="bg-app-card border border-app-stroke rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all group">
            {/* Preview Area */}
            <div
                className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center cursor-pointer"
                onClick={onPreview}
            >
                {isImage && fullUrl ? (
                    <img src={fullUrl} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                    <FileIcon size={40} className="text-app-text-muted" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye size={24} className="text-white" />
                </div>
            </div>

            {/* File Info */}
            <div className="p-3">
                <h4 className="font-medium text-sm text-app-text-main line-clamp-1" title={file.name}>{file.name}</h4>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-app-text-muted">{formatSize(file.sizeBytes)}</span>
                    <div className="flex gap-1">
                        <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-app-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Baixar"
                        >
                            <Download size={14} />
                        </a>
                        <button
                            onClick={onDelete}
                            className="p-1.5 text-app-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Drag & Drop Upload Zone
const UploadZone = ({ onUpload, isUploading }: { onUpload: (files: FileList) => void; isUploading: boolean }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onUpload(e.dataTransfer.files);
        }
    }, [onUpload]);

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={clsx(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                isDragging ? "border-primary bg-primary/10" : "border-app-stroke hover:border-primary/50",
                isUploading && "opacity-50 pointer-events-none"
            )}
        >
            <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                onChange={(e) => e.target.files && onUpload(e.target.files)}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
                <UploadCloud size={40} className={clsx("mx-auto mb-3", isDragging ? "text-primary" : "text-app-text-muted")} />
                <p className="text-sm font-medium text-app-text-main mb-1">
                    {isUploading ? "Enviando..." : "Arraste arquivos aqui"}
                </p>
                <p className="text-xs text-app-text-muted">ou clique para selecionar</p>
            </label>
        </div>
    );
};

export default function UserFilesPage() {
    const { addToast } = useToast();
    const [files, setFiles] = useState<UserFile[]>([]);
    const [stats, setStats] = useState<StorageStats>({
        user: { usedGb: '0.00', quotaGb: 10, usedMb: 0, percentUsed: 0 },
        tenant: { usedGb: '0.00', quotaGb: 30, usedMb: 0, percentUsed: 0, maxUsers: 3 },
        fileCount: 0,
    });
    const [folders, setFolders] = useState<string[]>([]);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modals
    const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Fetch data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch files
            const filesRes = await api.get('/user-files', { params: { folder: currentFolder } });
            setFiles(filesRes.data || []);
        } catch (error) {
            console.error('Failed to fetch files', error);
            setFiles([]);
        }

        try {
            // Fetch stats
            const statsRes = await api.get('/user-files/stats');
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
            // Keep default stats
        }

        try {
            // Fetch folders
            const foldersRes = await api.get('/user-files/folders');
            setFolders(foldersRes.data || []);
        } catch (error) {
            console.error('Failed to fetch folders', error);
            setFolders([]);
        }

        setIsLoading(false);
    }, [currentFolder]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Upload handler
    const handleUpload = async (fileList: FileList) => {
        setIsUploading(true);
        try {
            for (const file of Array.from(fileList)) {
                const formData = new FormData();
                formData.append('file', file);
                await api.post('/user-files/upload', formData, {
                    params: { folder: currentFolder },
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            fetchData();
            addToast('Upload concluído com sucesso!', 'success');
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Erro ao enviar arquivo', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    // Delete handler
    const handleDelete = async (file: UserFile) => {
        if (!confirm(`Excluir "${file.name}"?`)) return;
        try {
            await api.delete(`/user-files/${file.id}`);
            fetchData();
            addToast('Arquivo excluído com sucesso.', 'success');
        } catch (error) {
            addToast('Erro ao excluir arquivo', 'error');
        }
    };

    // Create folder handler
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        // Folders are virtual - we just need to upload a file to that folder
        setCurrentFolder(currentFolder ? `${currentFolder}/${newFolderName.trim()}` : newFolderName.trim());
        setNewFolderName('');
        setIsNewFolderOpen(false);
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-theme(spacing.20))] overflow-hidden bg-app-bg text-app-text-main gap-4 md:gap-6 p-1">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-app-text-muted text-xs font-medium">LegalDesk</span>
                        <ChevronRight size={12} className="text-app-text-muted" />
                        <span className="text-primary text-xs font-medium">Meus Arquivos</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-app-text-main">Meus Arquivos</h1>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setIsNewFolderOpen(true)}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-app-card border border-app-stroke rounded-lg text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-app-stroke/20 text-app-text-main"
                    >
                        <FolderPlus size={16} /> Nova Pasta
                    </button>
                    <label
                        htmlFor="file-upload-btn"
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-primary text-white rounded-lg text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-primary-dark cursor-pointer"
                    >
                        <UploadCloud size={16} /> Upload
                    </label>
                    <input
                        type="file"
                        id="file-upload-btn"
                        className="hidden"
                        multiple
                        onChange={(e) => e.target.files && handleUpload(e.target.files)}
                    />
                </div>
            </header>

            {/* Storage Stats */}
            {stats && <StorageBar stats={stats} />}

            {/* Breadcrumbs & View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => setCurrentFolder(null)}
                        className={clsx("hover:text-primary", !currentFolder && "text-primary font-medium")}
                    >
                        Todos
                    </button>
                    {currentFolder && (
                        <>
                            <ChevronRight size={14} className="text-app-text-muted" />
                            <span className="text-app-text-main font-medium">{currentFolder}</span>
                        </>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx("p-2 rounded-lg", viewMode === 'grid' ? "bg-primary text-white" : "text-app-text-muted bg-app-card border border-app-stroke")}
                    >
                        <Grid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx("p-2 rounded-lg", viewMode === 'list' ? "bg-primary text-white" : "text-app-text-muted bg-app-card border border-app-stroke")}
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-app-card border border-app-stroke rounded-2xl overflow-hidden flex flex-col p-4 md:p-6 gap-4">
                {/* Folders */}
                {folders.length > 0 && !currentFolder && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {folders.map(folder => (
                            <button
                                key={folder}
                                onClick={() => setCurrentFolder(folder)}
                                className="flex items-center gap-3 p-3 bg-app-stroke/20 rounded-xl hover:bg-app-stroke/40 transition-colors"
                            >
                                <Folder className="text-amber-500" size={20} />
                                <span className="text-sm font-medium truncate">{folder}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Files Grid/List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : files.length === 0 ? (
                        <UploadZone onUpload={handleUpload} isUploading={isUploading} />
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {files.map(file => (
                                <FileCard
                                    key={file.id}
                                    file={file}
                                    onDelete={() => handleDelete(file)}
                                    onPreview={() => setPreviewFile(file)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {files.map(file => {
                                const FileIcon = getFileIcon(file.mimeType);
                                return (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-4 p-3 bg-app-stroke/10 rounded-xl hover:bg-app-stroke/20 transition-colors"
                                    >
                                        <FileIcon size={24} className="text-app-text-muted shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{file.name}</p>
                                            <p className="text-xs text-app-text-muted">{formatSize(file.sizeBytes)}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => setPreviewFile(file)} className="p-2 hover:bg-app-stroke rounded-lg"><Eye size={16} /></button>
                                            <a href={getFullUrl(file.url)} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-app-stroke rounded-lg"><Download size={16} /></a>
                                            <button onClick={() => handleDelete(file)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Upload Zone when files exist */}
                {files.length > 0 && (
                    <div className="border-t border-app-stroke pt-4">
                        <UploadZone onUpload={handleUpload} isUploading={isUploading} />
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            <Modal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                title={previewFile?.name || ''}
                size="xl"
                footer={
                    <div className="flex gap-2">
                        <button onClick={() => setPreviewFile(null)} className="px-4 py-2 text-app-text-muted hover:bg-app-stroke rounded-lg">Fechar</button>
                        <a href={previewFile ? getFullUrl(previewFile.url) : ''} target="_blank" className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2">
                            <Download size={16} /> Baixar
                        </a>
                    </div>
                }
            >
                <div className="min-h-[400px] flex items-center justify-center bg-app-stroke/20 rounded-lg">
                    {previewFile?.mimeType.startsWith('image/') ? (
                        <img src={getFullUrl(previewFile.url)} alt={previewFile.name} className="max-w-full max-h-[60vh] object-contain" />
                    ) : previewFile?.mimeType.includes('pdf') ? (
                        <iframe src={getFullUrl(previewFile.url)} className="w-full h-[60vh]" title={previewFile.name} />
                    ) : (
                        <div className="text-center p-8">
                            <File size={64} className="mx-auto text-app-text-muted mb-4" />
                            <p className="text-app-text-muted">Visualização não disponível</p>
                            <p className="text-xs text-app-text-label mt-1">Clique em "Baixar" para visualizar</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* New Folder Modal */}
            <Modal
                isOpen={isNewFolderOpen}
                onClose={() => setIsNewFolderOpen(false)}
                title="Nova Pasta"
                footer={
                    <>
                        <button onClick={() => setIsNewFolderOpen(false)} className="px-4 py-2 text-app-text-muted">Cancelar</button>
                        <button onClick={handleCreateFolder} className="px-4 py-2 bg-primary text-white rounded-lg">Criar</button>
                    </>
                }
            >
                <input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Nome da pasta"
                    className="w-full bg-app-stroke/20 border border-app-stroke rounded-lg p-3 text-app-text-main"
                    autoFocus
                />
            </Modal>
        </div>
    );
}
