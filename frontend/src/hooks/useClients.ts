import { useState, useCallback } from 'react';
import api from '../services/api';

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    cpfCnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClientFilters {
    search?: string;
}

export interface CreateClientData {
    name: string;
    email?: string;
    phone?: string;
    cpfCnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    notes?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> { }

export function useClients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchClients = useCallback(async (filters?: ClientFilters) => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (filters?.search) params.append('search', filters.search);

            const response = await api.get(`/clients?${params.toString()}`);
            setClients(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao carregar clientes';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchClientById = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/clients/${id}`);
            setSelectedClient(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao carregar cliente';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createClient = useCallback(async (data: CreateClientData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/clients', data);
            setClients((prev) => [response.data, ...prev]);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao criar cliente';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateClient = useCallback(async (id: string, data: UpdateClientData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.put(`/clients/${id}`, data);
            setClients((prev) =>
                prev.map((c) => (c.id === id ? response.data : c))
            );
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao atualizar cliente';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteClient = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.delete(`/clients/${id}`);
            setClients((prev) => prev.filter((c) => c.id !== id));
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao excluir cliente';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        clients,
        selectedClient,
        loading,
        error,
        fetchClients,
        fetchClientById,
        createClient,
        updateClient,
        deleteClient,
        setSelectedClient,
    };
}
