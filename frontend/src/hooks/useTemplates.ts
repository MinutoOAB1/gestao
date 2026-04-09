import { useState, useCallback } from 'react';
import api from '../services/api';

export interface Template {
    id: string;
    title: string;
    description?: string;
    content: string;
    category: string;
    icon: string;
    iconColor: string;
    variables?: string;
    docxPath?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TemplateFilters {
    category?: string;
    search?: string;
}

export interface CreateTemplateData {
    title: string;
    description?: string;
    content?: string;
    category: string;
    icon?: string;
    iconColor?: string;
    docxPath?: string;
    variables?: string;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> { }

export function useTemplates() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = useCallback(async (filters?: TemplateFilters) => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (filters?.category && filters.category !== 'Todos') {
                params.append('category', filters.category);
            }
            if (filters?.search) params.append('search', filters.search);

            const response = await api.get(`/templates?${params.toString()}`);
            setTemplates(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao carregar modelos';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTemplateById = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/templates/${id}`);
            setSelectedTemplate(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao carregar modelo';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createTemplate = useCallback(async (data: CreateTemplateData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/templates', data);
            setTemplates((prev) => [response.data, ...prev]);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao criar modelo';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateTemplate = useCallback(async (id: string, data: UpdateTemplateData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.put(`/templates/${id}`, data);
            setTemplates((prev) =>
                prev.map((t) => (t.id === id ? response.data : t))
            );
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao atualizar modelo';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteTemplate = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.delete(`/templates/${id}`);
            setTemplates((prev) => prev.filter((t) => t.id !== id));
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao excluir modelo';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fillTemplate = useCallback(async (id: string, variables: Record<string, string>) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post(`/templates/${id}/fill`, { variables });
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao preencher modelo';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const uploadTemplate = useCallback(async (file: File) => {
        try {
            setLoading(true);
            setError(null);
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/templates/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao fazer upload';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        templates,
        selectedTemplate,
        loading,
        error,
        fetchTemplates,
        fetchTemplateById,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        fillTemplate,
        uploadTemplate,
        setSelectedTemplate,
    };
}
