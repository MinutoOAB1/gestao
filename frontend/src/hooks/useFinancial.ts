import { useState, useCallback } from 'react';
import api from '../services/api';

export interface FinancialRecord {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description: string;
    amount: number;
    date: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    recurrence?: string;
    urgent?: boolean;
    notes?: string;
    linkTo?: string;
    processId?: string;
    clientId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FinancialFilters {
    type?: 'INCOME' | 'EXPENSE';
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface CreateFinancialData {
    type: 'INCOME' | 'EXPENSE';
    category: string;
    description: string;
    amount: number;
    date: string;
    status?: string;
    recurrence?: string;
    urgent?: boolean;
    notes?: string;
    linkTo?: string;
    processId?: string;
    clientId?: string;
}

export interface UpdateFinancialData extends Partial<CreateFinancialData> { }

export function useFinancial() {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate summary
    const summary = {
        totalIncome: records.filter(r => r.type === 'INCOME' && r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0),
        totalExpense: records.filter(r => r.type === 'EXPENSE' && r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0),
        pending: records.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0),
        get balance() { return this.totalIncome - this.totalExpense; },
    };

    const fetchRecords = useCallback(async (filters?: FinancialFilters) => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (filters?.type) params.append('type', filters.type);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.startDate) params.append('startDate', filters.startDate);
            if (filters?.endDate) params.append('endDate', filters.endDate);
            if (filters?.search) params.append('search', filters.search);

            const response = await api.get(`/financial?${params.toString()}`);
            setRecords(response.data);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao carregar registros';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createRecord = useCallback(async (data: CreateFinancialData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/financial', data);
            setRecords((prev) => [response.data, ...prev]);
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao criar registro';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateRecord = useCallback(async (id: string, data: UpdateFinancialData) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.put(`/financial/${id}`, data);
            setRecords((prev) =>
                prev.map((r) => (r.id === id ? response.data : r))
            );
            return response.data;
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao atualizar registro';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteRecord = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.delete(`/financial/${id}`);
            setRecords((prev) => prev.filter((r) => r.id !== id));
        } catch (err: any) {
            const message = err.response?.data?.message || 'Erro ao excluir registro';
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        records,
        selectedRecord,
        loading,
        error,
        summary,
        fetchRecords,
        createRecord,
        updateRecord,
        deleteRecord,
        setSelectedRecord,
    };
}
