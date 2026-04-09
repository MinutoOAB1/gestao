import { useState, useCallback } from 'react';
import api from '../services/api';

export interface Document {
    id: string;
    name: string;
    type: string;
    size: number;
    mimeType: string;
    path: string;
    folderId?: string;
    processId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Folder {
    id: string;
    name: string;
    parentId?: string;
    children?: Folder[];
    documents?: Document[];
    createdAt: string;
    updatedAt: string;
}

export interface DocumentFilters {
    folderId?: string;
    processId?: string;
    search?: string;
}

export function useDocuments() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async (filters?: DocumentFilters) => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (filters?.folderId) params.append('folderId', filters.folderId);
            if (filters?.processId) params.append('processId', filters.processId);
            if (filters?.search) params.append('search', filters.search);

            const response = await api.get(`/documents?${params.toString()}`);
            setDocuments(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao carregar documentos';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchFolders = useCallback(async (parentId?: string) => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (parentId) params.append('parentId', parentId);

            const response = await api.get(`/documents/folders?${params.toString()}`);
            setFolders(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao carregar pastas';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createFolder = useCallback(async (name: string, parentId?: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/documents/folders', { name, parentId });
            setFolders((prev) => [response.data, ...prev]);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao criar pasta';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const uploadDocument = useCallback(async (file: File, folderId?: string, processId?: string) => {
        try {
            setLoading(true);
            setError(null);
            const formData = new FormData();
            formData.append('file', file);
            if (folderId) formData.append('folderId', folderId);
            if (processId) formData.append('processId', processId);

            const response = await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDocuments((prev) => [response.data, ...prev]);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao fazer upload';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteDocument = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.delete(`/documents/${id}`);
            setDocuments((prev) => prev.filter((d) => d.id !== id));
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao excluir documento';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteFolder = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.delete(`/documents/folders/${id}`);
            setFolders((prev) => prev.filter((f) => f.id !== id));
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao excluir pasta';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const downloadDocument = useCallback(async (id: string, filename: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/documents/${id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao baixar documento';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        documents,
        folders,
        currentFolder,
        loading,
        error,
        fetchDocuments,
        fetchFolders,
        createFolder,
        uploadDocument,
        deleteDocument,
        deleteFolder,
        downloadDocument,
        setCurrentFolder,
    };
}
