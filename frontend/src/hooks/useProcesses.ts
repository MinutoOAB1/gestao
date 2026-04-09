import { useState, useCallback } from 'react';
import api from '../services/api';

export interface Process {
    id: string;
    title: string;
    number: string;
    type: string;
    status: string;
    court: string;
    description?: string;
    clientId: string;
    client?: {
        id: string;
        name: string;
    };
    kanbanColumn?: string;
    deadline?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProcessFilters {
    status?: string;
    type?: string;
    clientId?: string;
    search?: string;
}

export interface CreateProcessData {
    title: string;
    number: string;
    type: string;
    status: string;
    court: string;
    description?: string;
    clientId: string;
    kanbanColumn?: string;
    deadline?: string;
}

export interface UpdateProcessData extends Partial<CreateProcessData> { }

export function useProcesses() {
    const [processes, setProcesses] = useState<Process[]>([]);
    const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProcesses = useCallback(async (filters?: ProcessFilters) => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (filters?.status) params.append('status', filters.status);
            if (filters?.type) params.append('type', filters.type);
            if (filters?.clientId) params.append('clientId', filters.clientId);
            if (filters?.search) params.append('search', filters.search);

            const response = await api.get(`/processes?${params.toString()}`);
            setProcesses(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao carregar processos';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchProcessById = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/processes/${id}`);
            setSelectedProcess(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao carregar processo';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createProcess = useCallback(async (data: CreateProcessData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/processes', data);
            setProcesses((prev) => [response.data, ...prev]);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao criar processo';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateProcess = useCallback(async (id: string, data: UpdateProcessData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.put(`/processes/${id}`, data);
            setProcesses((prev) =>
                prev.map((p) => (p.id === id ? response.data : p))
            );
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao atualizar processo';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteProcess = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.delete(`/processes/${id}`);
            setProcesses((prev) => prev.filter((p) => p.id !== id));
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao excluir processo';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        processes,
        selectedProcess,
        loading,
        error,
        fetchProcesses,
        fetchProcessById,
        createProcess,
        updateProcess,
        deleteProcess,
        setSelectedProcess,
    };
}
