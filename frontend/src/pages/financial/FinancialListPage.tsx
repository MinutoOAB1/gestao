import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { Plus, TrendingUp, TrendingDown, Download, Search, Filter, RefreshCw, Paperclip, AlertTriangle, Building, Users, DollarSign, Trash2, Calendar, MessageSquare, Info, CheckCircle2, Hourglass, Repeat, QrCode, ExternalLink, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { clsx } from 'clsx';
import Modal from '../../components/ui/Modal';
import { Protect } from '../../components/auth/Protect';
import { useToast } from '../../context/ToastContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GenerateInvoiceModal } from '../../components/financial/GenerateInvoiceModal';
import { InvoiceManagementTab } from '../../components/financial/InvoiceManagementTab';
import { InadimplenciaTab } from '../../components/financial/InadimplenciaTab';
import { TransactionModal } from '../../components/financial/TransactionModal';
import { PartnerModal } from '../../components/financial/PartnerModal';

import { 
    FinancialRecord, Partner, FinancialStats, ProcessItem, ClientItem, 
    NewTransaction, NewPartner, FinancialCategory, INCOME_CATEGORIES, EXPENSE_CATEGORY_LIST, 
    PARTNER_TYPES, PARTNER_COLORS 
} from '../../types/financial';
import { formatBRL } from '../../utils/formatters';

export default function FinancialListPage() {
    const { addToast } = useToast();
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [processes, setProcesses] = useState<ProcessItem[]>([]);
    const [clients, setClients] = useState<ClientItem[]>([]);
    const [repasses, setRepasses] = useState<any[]>([]);
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeNoteRecord, setActiveNoteRecord] = useState<FinancialRecord | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilterStart, setDateFilterStart] = useState('');
    const [dateFilterEnd, setDateFilterEnd] = useState('');
    const [chartPeriod, setChartPeriod] = useState<'7D' | '1M' | '1A'>('1M');
    const [activeTab, setActiveTab] = useState<'transactions' | 'repasses' | 'invoices' | 'inadimplencia'>('transactions');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<{id: string, name: string, amount?: number, financialRecordId?: string} | undefined>();

    const [newTransaction, setNewTransaction] = useState<NewTransaction>({
        type: 'INCOME',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        accrualDate: new Date().toISOString().split('T')[0],
        paymentDate: '',
        costCenter: '',
        status: 'PENDING',
        recurrence: 'UNICA',
        installments: 1,
        urgent: true,
        notes: '',
        linkTo: '',
        partnerId: '',
        partnerPercentage: 0
    });

    const [newPartner, setNewPartner] = useState<NewPartner>({
        name: '',
        initials: '',
        type: 'CÍVEL',
        percentage: '',
        fixedAmount: '',
        color: 'bg-blue-500',
        email: '',
        phone: '',
        notes: ''
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [recordsRes, statsRes, partnersRes, processesRes, clientsRes, repassesRes, categoriesRes] = await Promise.all([
                api.get('/financial'),
                api.get('/financial/stats'),
                api.get('/partnerships').catch(() => ({ data: [] })),
                api.get('/processes').catch(() => ({ data: [] })),
                api.get('/clients').catch(() => ({ data: [] })),
                api.get('/partnerships/transactions/all').catch(() => ({ data: [] })),
                api.get('/financial-categories').catch(() => ({ data: [] }))
            ]);
            setRecords(recordsRes.data);
            setStats(statsRes.data);
            setPartners(partnersRes.data);
            setProcesses(processesRes.data);
            setClients(clientsRes.data);
            setRepasses(repassesRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Installment grouping expand/collapse state
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };


    // Memoized stats and filtered data
    const totalRepasses = useMemo(() =>
        partners.reduce((sum, p) => sum + (p.pendingAmount || 0), 0),
        [partners]);

    const currentMonthBalance = useMemo(() => {
        return records.filter(r => {
            if (!r.date || r.date.length < 10) return false;
            const [year, month, day] = r.date.substring(0, 10).split('-').map(Number);
            const d = new Date(year, month - 1, day);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            return r.status === 'PAID' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).reduce((acc, r) => {
            return acc + (r.type === 'INCOME' ? (Number(r.amount) || 0) : -(Number(r.amount) || 0));
        }, 0);
    }, [records]);

    const chartData = useMemo(() => {
        const data = [];
        const now = new Date();

        if (chartPeriod === '7D') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

                const dayRecords = records.filter(r => {
                    const recordDate = new Date(r.date);
                    return recordDate.getDate() === date.getDate() &&
                        recordDate.getMonth() === date.getMonth() &&
                        recordDate.getFullYear() === date.getFullYear() &&
                        r.status === 'PAID';
                });

                const income = dayRecords.filter(r => r.type === 'INCOME').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                const expense = dayRecords.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

                data.push({
                    name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                    Receitas: income,
                    Despesas: expense,
                    Saldo: income - expense
                });
            }
        } else if (chartPeriod === '1M') {
            for (let i = 29; i >= 0; i -= 2) {
                const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
                const dayName = date.getDate().toString().padStart(2, '0') + '/' + (date.getMonth() + 1).toString().padStart(2, '0');

                const dayRecords = records.filter(r => {
                    const recordDate = new Date(r.date);
                    const diffTime = date.getTime() - recordDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays < 2 && r.status === 'PAID';
                });

                const income = dayRecords.filter(r => r.type === 'INCOME').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                const expense = dayRecords.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

                data.push({
                    name: dayName,
                    Receitas: income,
                    Despesas: expense,
                    Saldo: income - expense
                });
            }
        } else if (chartPeriod === '1A') {
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');

                const monthRecords = records.filter(r => {
                    const recordDate = new Date(r.date);
                    return recordDate.getMonth() === date.getMonth() &&
                        recordDate.getFullYear() === date.getFullYear() &&
                        r.status === 'PAID';
                });

                const income = monthRecords.filter(r => r.type === 'INCOME').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                const expense = monthRecords.filter(r => r.type === 'EXPENSE').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

                data.push({
                    name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                    Receitas: income,
                    Despesas: expense,
                    Saldo: income - expense
                });
            }
        }

        return data;
    }, [records, chartPeriod]);

    const handleSaveTransaction = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (!newTransaction.amount || !newTransaction.description || !newTransaction.category || !newTransaction.date) {
                addToast('Preencha todos os campos obrigatórios: Descrição, Valor, Data e Categoria', 'warning');
                return;
            }

            const amountStr = newTransaction.amount.toString().replace(',', '.');
            const amount = parseFloat(amountStr);

            if (isNaN(amount) || amount <= 0) {
                addToast('Valor inválido', 'warning');
                return;
            }

            const payload: any = {
                type: newTransaction.type,
                category: newTransaction.category,
                amount: amount,
                description: newTransaction.description,
                date: newTransaction.date,
                accrualDate: newTransaction.accrualDate || newTransaction.date,
                paymentDate: newTransaction.status === 'PAID' ? (newTransaction.paymentDate || newTransaction.date) : null,
                costCenter: newTransaction.costCenter,
                categoryId: newTransaction.categoryId,
                status: newTransaction.status || 'PENDING',
                recurrenceType: newTransaction.recurrence,
                totalInstallments: newTransaction.recurrence !== 'UNICA' ? newTransaction.installments : 1,
                isUrgent: newTransaction.urgent,
                notes: newTransaction.notes,
                issAmount: newTransaction.issAmount || 0,
                irrfAmount: newTransaction.irrfAmount || 0,
                pisAmount: newTransaction.pisAmount || 0,
                cofinsAmount: newTransaction.cofinsAmount || 0,
            };

            if (newTransaction.linkTo && newTransaction.linkTo.startsWith('client:')) {
                payload.clientId = newTransaction.linkTo.replace('client:', '');
            }

            if (newTransaction.type === 'INCOME' && newTransaction.partnerId) {
                payload.partnerId = newTransaction.partnerId;
                payload.partnerPercentage = newTransaction.partnerPercentage;
            }

            if (editingRecord) {
                await api.patch(`/financial/${editingRecord.id}`, payload);
            } else {
                await api.post('/financial', payload);
            }

            setIsModalOpen(false);
            setEditingRecord(null);
            resetTransactionForm();
            fetchData();
            addToast(editingRecord ? 'Transação atualizada com sucesso' : 'Transação salva com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao salvar transação:', error);
            addToast('Erro ao salvar transação. Tente novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, newTransaction, editingRecord, addToast, fetchData]);

    const handleSavePartner = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (!newPartner.name || !newPartner.initials || !newPartner.type) {
                addToast('Preencha nome, iniciais e tipo', 'warning');
                return;
            }

            const payload = {
                name: newPartner.name,
                initials: newPartner.initials.toUpperCase(),
                type: newPartner.type,
                percentage: newPartner.percentage ? parseFloat(newPartner.percentage) : null,
                fixedAmount: newPartner.fixedAmount ? parseFloat(newPartner.fixedAmount) : null,
                color: newPartner.color,
                email: newPartner.email || null,
                phone: newPartner.phone || null,
                notes: newPartner.notes || null
            };

            if (editingPartner) {
                await api.patch(`/partnerships/${editingPartner.id}`, payload);
            } else {
                await api.post('/partnerships', payload);
            }

            setIsPartnerModalOpen(false);
            setEditingPartner(null);
            resetPartnerForm();
            fetchData();
            addToast(editingPartner ? 'Parceria atualizada' : 'Parceria salva', 'success');
        } catch (error) {
            console.error('Erro ao salvar parceria:', error);
            addToast('Erro ao salvar parceria. Tente novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, newPartner, editingPartner, addToast, fetchData]);

    const handleDeletePartner = useCallback(async (id: string) => {
        if (!confirm('Tem certeza que deseja desativar esta parceria?')) return;
        try {
            await api.delete(`/partnerships/${id}`);
            fetchData();
        } catch (error) {
            console.error('Erro ao excluir parceria:', error);
        }
    }, [fetchData]);

    const handleCancel = useCallback(async (id: string) => {
        if (!confirm('Tem certeza que deseja estornar/cancelar contabilmente este lançamento? Isso manterá o registro para auditoria com status CANCELADO.')) return;
        try {
            await api.post(`/financial/${id}/cancel`);
            fetchData();
            addToast('Lançamento estornado com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao estornar:', error);
            addToast('Erro ao estornar lançamento.', 'error');
        }
    }, [fetchData, addToast]);

    const handlePayRepasse = useCallback(async (id: string) => {
        try {
            await api.patch(`/partnerships/transactions/${id}/pay`);
            fetchData();
            addToast('Repasse pago com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao pagar repasse:', error);
            addToast('Erro ao confirmar pagamento do repasse.', 'error');
        }
    }, [fetchData, addToast]);

    const handleGenerateReceipt = useCallback(async (record: FinancialRecord) => {
        try {
            const settingsRes = await api.get('/settings');
            const settings = settingsRes.data;

            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            
            // --- Design Constants ---
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);

            // Background Decorative Element (Subtle side bar)
            doc.setFillColor(0, 0, 0, 0.05); // black alpha
            doc.rect(0, 0, 5, pageHeight, 'F');

            // Draw Logo
            if (settings?.logoUrl) {
                try {
                    const isPng = settings.logoUrl.includes('image/png') || settings.logoUrl.startsWith('data:image/png');
                    doc.addImage(settings.logoUrl, isPng ? 'PNG' : 'JPEG', margin, margin, 35, 35);
                } catch (e) {
                    console.error('Error adding logo to PDF:', e);
                }
            }

            // Draw Office Details (Header Right)
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text(settings?.officeName || 'ESCRITÓRIO DE ADVOCACIA', pageWidth - margin, margin + 5, { align: 'right' });
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(`CNPJ: ${settings?.cnpj || 'N/A'}`, pageWidth - margin, margin + 11, { align: 'right' });
            doc.text(`Email: ${settings?.email || 'N/A'}`, pageWidth - margin, margin + 16, { align: 'right' });
            if (settings?.phone) doc.text(`Tel: ${settings.phone}`, pageWidth - margin, margin + 21, { align: 'right' });

            // Horizontal Separator
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.line(margin, 60, pageWidth - margin, 60);

            // Receipt Title & Number
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('RECIBO', margin, 75);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(`Nº RECIBO: ${record.id.substring(0, 8).toUpperCase()}`, pageWidth - margin, 75, { align: 'right' });

            // Value Highlight Box
            doc.setFillColor(248, 250, 252); // slate-50
            doc.roundedRect(margin, 85, contentWidth, 25, 3, 3, 'F');
            
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text('VALOR DO PAGAMENTO', margin + 10, 95);
            
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0); // black
            const valueStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.amount);
            doc.text(valueStr, margin + 10, 104);

            // Main Content
            const dateObj = new Date(record.date);
            const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            const typeStr = record.type === 'INCOME' ? 'Recebemos de' : 'Pagamos a';
            const clientName = record.client?.name || 'Cliente / Terceiro';

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105); // slate-600
            
            const introText = `${typeStr} ${clientName.toUpperCase()}, a quantia supra mencionada de ${valueStr}.`;
            doc.text(introText, margin, 125, { maxWidth: contentWidth });

            // Details Table-like layout
            let y = 145;
            const drawDetail = (label: string, value: string) => {
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(100, 116, 139);
                doc.text(label, margin, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 41, 59);
                doc.text(value, margin + 40, y);
                y += 10;
            };

            drawDetail('REFERENTE A:', record.description);
            drawDetail('CATEGORIA:', record.category);
            drawDetail('FORMA PGTO:', record.paymentMethod || 'Transferência / Pix');
            drawDetail('STATUS:', record.status === 'PAID' ? 'LIQUIDADO' : 'PENDENTE');

            // Date & Location
            y += 10;
            doc.setFontSize(11);
            doc.text(`Emitido em ${dateStr}.`, margin, y);

            // Signature Section
            const sigY = 220;
            doc.setDrawColor(203, 213, 225); // slate-300
            doc.line(pageWidth / 2 - 40, sigY, pageWidth / 2 + 40, sigY);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(settings?.officeName?.toUpperCase() || 'RESPONSÁVEL', pageWidth / 2, sigY + 7, { align: 'center' });
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            doc.text('ESTE É UM DOCUMENTO DIGITAL EMITIDO PELO SISTEMA Advus', pageWidth / 2, sigY + 15, { align: 'center' });

            // Footer
            doc.setFillColor(30, 41, 59);
            doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text('Comprovante de Transação Financeira - Todos os direitos reservados', pageWidth / 2, pageHeight - 4, { align: 'center' });

            doc.save(`Recibo_${record.description.replace(/\s+/g, '_').substring(0, 15)}.pdf`);
            addToast('Recibo Profissional gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar recibo:', error);
            addToast('Erro ao gerar recibo PDF.', 'error');
        }
    }, [addToast]);

    const handleEdit = useCallback((record: FinancialRecord) => {
        setEditingRecord(record);
        setNewTransaction({
            type: record.type,
            category: record.category,
            amount: record.amount.toString(),
            description: record.description,
            date: record.date ? record.date.substring(0, 10) : new Date().toISOString().split('T')[0],
            accrualDate: record.accrualDate ? record.accrualDate.substring(0, 10) : (record.date ? record.date.substring(0, 10) : new Date().toISOString().split('T')[0]),
            paymentDate: record.paymentDate ? record.paymentDate.substring(0, 10) : '',
            costCenter: record.costCenter || '',
            categoryId: record.categoryId || '',
            status: record.status,
            recurrence: (record.recurrenceType as 'UNICA' | 'MENSAL' | 'ANUAL' | 'PERSONALIZADO') || 'UNICA',
            installments: record.totalInstallments || 1,
            urgent: record.isUrgent || false,
            notes: record.notes || '',
            linkTo: record.clientId ? `client:${record.clientId}` : '',
            partnerId: record.partnerId || '',
            partnerPercentage: (record as any).partnerPercentage || 0,
            issAmount: record.issAmount || 0,
            irrfAmount: record.irrfAmount || 0,
            pisAmount: record.pisAmount || 0,
            cofinsAmount: record.cofinsAmount || 0,
        });
        setIsModalOpen(true);
    }, []);

    const handleEditPartner = useCallback((partner: Partner) => {
        setEditingPartner(partner);
        setNewPartner({
            name: partner.name,
            initials: partner.initials,
            type: partner.type,
            percentage: partner.percentage?.toString() || '',
            fixedAmount: partner.fixedAmount?.toString() || '',
            color: partner.color,
            email: partner.email || '',
            phone: partner.phone || '',
            notes: partner.notes || ''
        });
        setIsPartnerModalOpen(true);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await api.delete(`/financial/${id}`);
            setDeleteConfirm(null);
            fetchData();
            addToast('Transação excluída com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao excluir:', error);
            addToast('Erro ao excluir transação.', 'error');
        }
    }, [fetchData, addToast]);


    const resetTransactionForm = () => {
        setNewTransaction({
            type: 'INCOME',
            category: '',
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            accrualDate: new Date().toISOString().split('T')[0],
            paymentDate: '',
            costCenter: '',
            status: 'PENDING',
            recurrence: 'UNICA',
            installments: 1,
            urgent: false,
            notes: '',
            linkTo: '',
            partnerId: '',
            partnerPercentage: 0,
            issAmount: 0,
            irrfAmount: 0,
            pisAmount: 0,
            cofinsAmount: 0,
        });
    };

    const resetPartnerForm = () => {
        setNewPartner({
            name: '',
            initials: '',
            type: 'CÍVEL',
            percentage: '',
            fixedAmount: '',
            color: 'bg-blue-500',
            email: '',
            phone: '',
            notes: ''
        });
    };

    const openNewTransaction = () => {
        resetTransactionForm();
        setEditingRecord(null);
        setIsModalOpen(true);
    };

    const openNewPartner = () => {
        resetPartnerForm();
        setEditingPartner(null);
        setIsPartnerModalOpen(true);
    };

    // Open report in new tab
    const openReport = async () => {
        try {
            addToast("Buscando dados e gerando relatório...", "info");
            const params = new URLSearchParams();
            if (dateFilterStart) params.append('startDate', dateFilterStart);
            if (dateFilterEnd) params.append('endDate', dateFilterEnd);
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);
            
            const response = await api.get(`/financial/report/pdf?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
            window.open(url, '_blank');
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            addToast('Erro ao gerar o relatório financeiro.', 'error');
        }
    };

    // Check if overdue (must be defined before groupedRecords useMemo)
    const isOverdue = (dateStr: string, status: string) => {
        if (status === 'PAID') return false;
        if (!dateStr || dateStr.length < 10) return false;

        const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return dueDate < today;
    };

    // Memoized grouped records - groups recurring installments together
    const groupedRecords = useMemo(() => {
        const filtered = records.filter(r => {
            const description = r.description || '';
            const category = r.category || '';
            const query = debouncedSearch.toLowerCase();
            const matchesSearch = description.toLowerCase().includes(query) ||
                category.toLowerCase().includes(query);
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'pending' && r.status === 'PENDING') ||
                (statusFilter === 'paid' && r.status === 'PAID') ||
                (statusFilter === 'overdue' && r.status === 'PENDING' && isOverdue(r.date, r.status));
            let matchesDate = true;
            if (dateFilterStart || dateFilterEnd) {
                const rDate = new Date(r.date);
                if (dateFilterStart) {
                    const start = new Date(dateFilterStart);
                    start.setHours(0,0,0,0);
                    if (rDate < start) matchesDate = false;
                }
                if (dateFilterEnd) {
                    const end = new Date(dateFilterEnd);
                    end.setHours(23,59,59,999);
                    if (rDate > end) matchesDate = false;
                }
            }
            return matchesSearch && matchesStatus && matchesDate;
        });
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Group recurring installments by description+type+category+totalInstallments
        const groupMap = new Map<string, any[]>();
        const placed = new Set<string>();
        const result: any[] = [];

        for (const rec of filtered) {
            if (rec.isRecurring && rec.totalInstallments && rec.totalInstallments > 1) {
                const key = (rec.description || '').trim().toLowerCase() + '|' + rec.type + '|' + (rec.category || '') + '|' + rec.totalInstallments;
                if (!groupMap.has(key)) groupMap.set(key, []);
                groupMap.get(key)!.push(rec);
            }
        }

        for (const rec of filtered) {
            if (rec.isRecurring && rec.totalInstallments && rec.totalInstallments > 1) {
                const key = (rec.description || '').trim().toLowerCase() + '|' + rec.type + '|' + (rec.category || '') + '|' + rec.totalInstallments;
                const group = groupMap.get(key);
                if (group && group.length >= 2 && !placed.has(key)) {
                    placed.add(key);
                    const paidCount = group.filter((g: any) => g.status === 'PAID').length;
                    const anyOverdue = group.some((g: any) => g.status === 'PENDING' && isOverdue(g.date, g.status));
                    const totalAmount = group.reduce((sum: number, g: any) => sum + (Number(g.amount) || 0), 0);
                    result.push({
                        _isGroupHeader: true,
                        _groupKey: key,
                        _children: group,
                        _paidCount: paidCount,
                        _anyOverdue: anyOverdue,
                        id: 'group_' + key,
                        description: group[0].description,
                        type: group[0].type,
                        category: group[0].category,
                        client: group[0].client,
                        date: group[0].date,
                        amount: totalAmount,
                        status: paidCount === group.length ? 'PAID' : 'PENDING',
                        totalInstallments: group[0].totalInstallments,
                        isRecurring: true,
                        isUrgent: group.some((g: any) => g.isUrgent),
                    });
                } else if (!group || group.length < 2) {
                    result.push(rec);
                }
                // if group.length >= 2 && placed, skip (already placed header)
            } else {
                result.push(rec);
            }
        }
        return result;
    }, [records, debouncedSearch, statusFilter]);

    // Get relative date label
    const getDateLabel = (dateStr: string) => {
        if (!dateStr || dateStr.length < 10) return 'Data Inválida';
        // Parse date manually to avoid UTC drift (YYYY-MM-DD)
        const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
        const date = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dTime = date.getTime();
        const tTime = today.getTime();
        const yTime = yesterday.getTime();
        const tmTime = tomorrow.getTime();

        if (dTime === tTime) return 'Hoje';
        if (dTime === yTime) return 'Ontem';
        if (dTime === tmTime) return 'Amanhã';

        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };





    if (loading) {
        return (
            <div className="space-y-6 pb-20 md:pb-0 animate-pulse">
                {/* Header skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="h-8 w-52 bg-app-stroke/40 rounded-lg" />
                        <div className="h-4 w-80 bg-app-stroke/30 rounded-lg mt-2" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-44 bg-app-stroke/30 rounded-xl" />
                        <div className="h-10 w-28 bg-app-stroke/30 rounded-xl" />
                        <div className="h-10 w-40 bg-primary/20 rounded-xl" />
                    </div>
                </div>
                {/* Cards skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-app-card border border-app-stroke rounded-2xl p-5">
                            <div className="h-3 w-24 bg-app-stroke/40 rounded mb-3" />
                            <div className="h-7 w-36 bg-app-stroke/50 rounded mb-2" />
                            <div className="h-2 w-full bg-app-stroke/30 rounded-full" />
                        </div>
                    ))}
                </div>
                {/* Table skeleton */}
                <div className="bg-app-card border border-app-stroke rounded-2xl overflow-hidden">
                    <div className="h-12 bg-app-bg border-b border-app-stroke" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-app-stroke/30">
                            <div className="w-1 h-8 bg-app-stroke/40 rounded-full" />
                            <div className="h-4 w-20 bg-app-stroke/30 rounded" />
                            <div className="flex-1 flex items-center gap-3">
                                <div className="w-8 h-8 bg-app-stroke/30 rounded-lg" />
                                <div className="h-4 w-40 bg-app-stroke/40 rounded" />
                            </div>
                            <div className="h-4 w-20 bg-app-stroke/30 rounded" />
                            <div className="h-6 w-16 bg-app-stroke/30 rounded-full" />
                            <div className="h-4 w-24 bg-app-stroke/40 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-app-text-main">Gestão Financeira</h1>
                    <p className="text-app-text-muted text-sm mt-1">
                        Central de controle de fluxo de caixa e contratos de parceria.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">

                    <Protect roles={['ADMIN', 'LAWYER']}>
                        <button
                            onClick={openReport}
                            className="flex items-center gap-2 px-4 py-2 bg-app-card border border-app-stroke text-app-text-main rounded-xl text-sm font-medium hover:bg-app-stroke/50 transition-colors"
                        >
                            <Download size={16} />
                            Relatórios
                        </button>
                    </Protect>
                    <Protect roles={['ADMIN', 'LAWYER']}>
                        <button
                            onClick={() => {
                                setSelectedClientForInvoice(undefined);
                                setIsInvoiceModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-black dark:text-white rounded-xl text-sm font-bold hover:bg-black/10 transition-colors"
                        >
                            <QrCode size={16} />
                            Emitir Cobrança
                        </button>
                    </Protect>
                    <Protect roles={['ADMIN', 'LAWYER']}>
                        <button
                            onClick={openNewTransaction}
                            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-black/20"
                        >
                            <DollarSign size={16} />
                            Nova Movimentação
                        </button>
                    </Protect>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Saldo Atual */}
                <motion.div
                    className={clsx(
                        "border rounded-2xl p-5 relative overflow-hidden transition-all",
                        (stats?.balance || 0) >= 0 ? "bg-gradient-to-br from-emerald-500/10 to-app-card border-emerald-500/20 shadow-lg shadow-emerald-500/5" : "bg-gradient-to-br from-rose-500/10 to-app-card border-rose-500/20 shadow-lg shadow-rose-500/5"
                    )}
                    whileHover={{ scale: 1.02, y: -2 }}
                >
                    <div className={clsx(
                        "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl",
                        (stats?.balance || 0) >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                    )} />
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-app-text-muted text-xs">Saldo Atual</p>
                        <div className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            (stats?.balance || 0) >= 0 ? "bg-emerald-500" : "bg-rose-500"
                        )}>
                            <Building size={16} className="text-white" />
                        </div>
                    </div>
                    <p className="text-sm text-app-text-muted">R$</p>
                    <div className="flex items-center gap-2">
                        <p className={clsx(
                            "text-2xl font-bold text-app-text-main"
                        )}>
                            {formatBRL(stats?.balance || 0).replace('R$', '').trim()}
                        </p>
                        {(stats?.balance || 0) >= 0 ? (
                            <TrendingUp size={20} className="text-emerald-500" />
                        ) : (
                            <TrendingDown size={20} className="text-rose-500" />
                        )}
                    </div>
                    <p className="text-xs text-app-text-muted mt-1">
                        Disponível em Caixa
                    </p>
                </motion.div>

                {/* Contas a Receber */}
                <motion.div
                    className={clsx(
                        "border rounded-2xl p-5 relative overflow-hidden transition-all",
                        (stats?.pendingIncome || 0) > 0 ? "bg-gradient-to-br from-emerald-500/5 to-app-card border-emerald-500/20 shadow-lg shadow-emerald-500/5" : "bg-app-card border-app-stroke"
                    )}
                    whileHover={{ scale: 1.02, y: -2 }}
                >
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-app-text-muted text-xs">Contas a Receber</p>
                            <p className="text-[10px] text-app-text-muted">(Mês Atual)</p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                            {stats?.pendingIncomeCount || 0} Pendentes
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(stats?.pendingIncome || 0)}</p>
                    <div className="mt-2 pt-2 border-t border-app-stroke">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-app-text-muted">Progresso do Mês</span>
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{stats?.receivedPercent || 0}% Recebido</span>
                        </div>
                        <div className="h-1.5 bg-app-stroke rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${stats?.receivedPercent || 0}%` }} />
                        </div>
                    </div>
                </motion.div>

                {/* Contas a Pagar */}
                <motion.div
                    className="bg-app-card border border-app-stroke rounded-2xl p-5 relative overflow-hidden"
                    whileHover={{ scale: 1.02, y: -2 }}
                >
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-app-text-muted text-xs">Contas a Pagar</p>
                            <p className="text-[10px] text-app-text-muted">(Total Pendente)</p>
                        </div>
                        <span className={clsx(
                            "px-2 py-0.5 text-[10px] font-bold rounded-full",
                            (stats?.dueTodayCount || 0) > 0 ? "bg-amber-500 text-white animate-pulse" : "bg-app-stroke text-app-text-muted"
                        )}>
                            {stats?.dueTodayCount || 0} Vencendo
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatBRL(stats?.pendingExpense || 0)}</p>
                    <div className="mt-2 pt-2 border-t border-app-stroke flex justify-between items-center">
                        <span className="text-xs text-app-text-muted">
                            Vencimento Hoje:
                        </span>
                        <span className={clsx(
                            "text-sm font-bold text-app-text-main"
                        )}>
                            {formatBRL(stats?.dueTodayAmount || 0)}
                        </span>
                    </div>
                </motion.div>

                {/* Resultado do Mês (New Metric) */}
                <motion.div
                    className={clsx(
                        "border rounded-2xl p-5 relative overflow-hidden transition-all",
                        currentMonthBalance >= 0 ? "bg-gradient-to-br from-emerald-500/5 to-app-card border-emerald-500/20 shadow-lg shadow-emerald-500/5" : "bg-gradient-to-br from-rose-500/5 to-app-card border-rose-500/20 shadow-lg shadow-rose-500/5"
                    )}
                    whileHover={{ scale: 1.02, y: -2 }}
                >
                    <div className={clsx(
                        "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl",
                        currentMonthBalance >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                    )} />
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-app-text-muted text-xs">Resultado Realizado (Mês Atual)</p>
                        <div className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            currentMonthBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"
                        )}>
                            {currentMonthBalance >= 0 ? <TrendingUp size={16} className="text-white" /> : <TrendingDown size={16} className="text-white" />}
                        </div>
                    </div>
                    <p className="text-sm text-app-text-muted">R$</p>
                    <p className={clsx(
                        "text-2xl font-bold",
                        currentMonthBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                        {formatBRL(Math.abs(currentMonthBalance)).replace('R$', '').trim()}
                    </p>
                    <p className="text-xs text-app-text-muted mt-1">
                        {currentMonthBalance >= 0 ? 'Lucro Recebido' : 'Prejuízo Efetivo'}
                    </p>
                </motion.div>

                {/* Repasses de Parcerias */}
                <motion.div
                    className="bg-app-card border border-app-stroke rounded-2xl p-5 relative overflow-hidden hidden"
                    whileHover={{ scale: 1.02, y: -2 }}
                >
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-app-text-muted text-xs">Repasses de Parcerias</p>
                        <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                            <Users size={16} className="text-violet-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-app-text-main">{formatBRL(totalRepasses)}</p>
                    <p className="text-xs text-app-text-muted mt-1">A repassar este mês</p>
                </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Cash Flow Chart */}
                <div className="lg:col-span-2 bg-app-card border border-app-stroke rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <div>
                            <h3 className="text-app-text-main font-bold text-lg">Fluxo de Caixa</h3>
                            <p className="text-app-text-muted text-xs">Entradas vs Saídas e projeção para o próximo trimestre</p>
                        </div>
                        <div className="flex bg-app-bg border border-app-stroke rounded-lg p-1">
                            {(['7D', '1M', '1A'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setChartPeriod(period)}
                                    className={clsx(
                                        "relative px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                        chartPeriod === period
                                            ? "text-app-text-main"
                                            : "text-app-text-muted hover:text-app-text-main"
                                    )}
                                >
                                    {chartPeriod === period && (
                                        <motion.div
                                            layoutId="chartPeriodTab"
                                            className="absolute inset-0 bg-app-card rounded-md shadow"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10">{period === '7D' ? '7 Dias' : period === '1M' ? '30 Dias' : '90 Dias'}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interactive Wave Chart */}
                    <div className="h-64 relative w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value / 1000 > 0 ? (value / 1000) + 'k' : value}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-stroke)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--app-card)', border: '1px solid var(--app-stroke)', borderRadius: '12px', color: 'var(--app-text-main)' }}
                                    itemStyle={{ color: 'var(--app-text-main)' }}
                                    formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), '']}
                                />
                                <Area type="monotone" dataKey="Saldo" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSaldo)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Partnership Contracts */}
                <div className="bg-app-card border border-app-stroke rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-app-text-main font-bold">Contratos de Parceria</h3>
                        <Protect roles={['ADMIN', 'LAWYER']}>
                            <button
                                onClick={openNewPartner}
                                className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white hover:opacity-90 transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        </Protect>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        {partners.length > 0 ? (
                            partners.map((partner) => (
                                <div
                                    key={partner.id}
                                    onClick={() => handleEditPartner(partner)}
                                    className="bg-app-bg border border-app-stroke rounded-xl p-3 hover:border-primary/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div style={{ backgroundColor: partner.color }} className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                            {partner.initials}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-app-text-main">{partner.name}</p>
                                                <span className="text-xs text-app-text-muted">
                                                    {partner.percentage !== null ? `${partner.percentage}%` : 'Fixo'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-app-text-muted uppercase">{partner.type}</p>
                                        </div>
                                    </div>
                                    {partner.pendingAmount > 0 && (
                                        <div className="mt-2 pt-2 border-t border-app-stroke flex justify-between items-center">
                                            <span className="text-[10px] text-app-text-muted">Repasse Pendente</span>
                                            <span className="text-sm font-bold text-app-text-main">{formatBRL(partner.pendingAmount)}</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-app-text-muted">
                                <Users size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nenhum parceiro cadastrado</p>
                                <button
                                    onClick={openNewPartner}
                                    className="mt-2 text-black font-bold text-sm hover:underline"
                                >
                                    Adicionar primeiro parceiro
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Row */}
            <div className="flex border-b border-app-stroke mb-8">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={clsx(
                            "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'transactions'
                                ? "bg-black text-white shadow-lg shadow-black/20"
                                : "bg-app-card text-app-text-muted hover:text-app-text-main border border-app-stroke"
                        )}
                    >
                        Transações
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={clsx(
                            "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            activeTab === 'invoices'
                                ? "bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/20"
                                : "bg-app-card text-app-text-muted hover:text-app-text-main border border-app-stroke"
                        )}
                    >
                        <QrCode size={14} />
                        Cobranças Emitidas
                    </button>
                    <button
                        onClick={() => setActiveTab('repasses')}
                        className={clsx(
                            "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'repasses'
                                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                                : "bg-app-card text-app-text-muted hover:text-app-text-main border border-app-stroke"
                        )}
                    >
                        Repasses / Parcerias
                    </button>
                    <button
                        onClick={() => setActiveTab('inadimplencia')}
                        className={clsx(
                            "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            activeTab === 'inadimplencia'
                                ? "bg-[#C4A052] text-white shadow-lg shadow-[#C4A052]/20 border-transparent"
                                : "bg-app-card text-app-text-muted hover:text-[#C4A052] border border-app-stroke"
                        )}
                    >
                        Inadimplência
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'transactions' ? (
                <div className="space-y-6">
                    {/* Summary View Mobile */}
                    <div className="md:hidden flex flex-col gap-3">
                        {groupedRecords.length > 0 ? (
                            groupedRecords.map((record) => (
                                <FinancialMobileRow 
                                    key={record.id} 
                                    record={record} 
                                    expandedGroups={expandedGroups}
                                    toggleGroup={toggleGroup}
                                    handleEdit={handleEdit} 
                                    handleDelete={handleDelete}
                                    deleteConfirm={deleteConfirm}
                                    setDeleteConfirm={setDeleteConfirm}
                                    isOverdue={isOverdue}
                                    getDateLabel={getDateLabel}
                                    setActiveNoteRecord={setActiveNoteRecord}
                                    setSelectedClientForInvoice={setSelectedClientForInvoice}
                                    setIsInvoiceModalOpen={setIsInvoiceModalOpen}
                                />
                            ))
                        ) : (
                            <div className="bg-app-card p-10 text-center rounded-2xl border border-app-stroke">
                                <p className="text-app-text-muted">Nenhuma transação encontrada para os filtros aplicados.</p>
                            </div>
                        )}
                    </div>

                    {/* Full Table Desktop */}
                    <div className="hidden md:block bg-app-card border border-app-stroke rounded-[2rem] overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-app-bg/50">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest border-b border-app-stroke w-10">#</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest border-b border-app-stroke">Descrição / Categoria</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest border-b border-app-stroke">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest border-b border-app-stroke">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest border-b border-app-stroke text-right">Valor</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-app-text-label tracking-widest border-b border-app-stroke text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                    {groupedRecords.length > 0 ? (
                                        groupedRecords.map((record) => (
                                            <FinancialTableRow 
                                                key={record.id} 
                                                record={record} 
                                                expandedGroups={expandedGroups} 
                                                toggleGroup={toggleGroup} 
                                                handleEdit={handleEdit} 
                                                handleDelete={handleDelete}
                                                deleteConfirm={deleteConfirm}
                                                setDeleteConfirm={setDeleteConfirm}
                                                isOverdue={isOverdue}
                                                setActiveNoteRecord={setActiveNoteRecord}
                                                setSelectedClientForInvoice={setSelectedClientForInvoice}
                                                setIsInvoiceModalOpen={setIsInvoiceModalOpen}
                                                handleGenerateReceipt={handleGenerateReceipt}
                                                handleCancel={handleCancel}
                                            />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-app-text-muted font-medium">
                                                Nenhum registro encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'invoices' ? (
                    <InvoiceManagementTab />
                ) : activeTab === 'inadimplencia' ? (
                    <InadimplenciaTab records={records} />
                ) : (
                    <div className="bg-app-card border border-app-stroke rounded-2xl overflow-hidden mt-4">

                    <div className="p-5 border-b border-app-stroke flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-app-text-main">Repasses de Honorários</h3>
                            <p className="text-sm text-app-text-muted">Lista dos valores devidos a parceiros do escritório.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-app-stroke/50 bg-app-bg/50 text-xs font-semibold text-app-text-muted">
                                    <th className="px-6 py-4 rounded-tl-xl whitespace-nowrap">DATA</th>
                                    <th className="px-6 py-4 whitespace-nowrap">PARCEIRO</th>
                                    <th className="px-6 py-4 whitespace-nowrap">ORIGEM</th>
                                    <th className="px-6 py-4 whitespace-nowrap">VALOR DO REPASSE</th>
                                    <th className="px-6 py-4 whitespace-nowrap">STATUS</th>
                                    <th className="px-6 py-4 rounded-tr-xl text-right whitespace-nowrap">AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {repasses?.length > 0 ? (
                                    repasses.map((rep: any) => (
                                        <tr key={rep.id} className="border-b border-app-stroke/50 hover:bg-app-bg/30 transition-colors group">
                                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-app-text-main">
                                                    <Calendar size={14} className="text-app-text-muted" />
                                                    {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString('pt-BR') : 'Sem data'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <div style={{ backgroundColor: rep.partner?.color }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                        {rep.partner?.initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-app-text-main whitespace-nowrap">
                                                            {rep.partner?.name}
                                                        </p>
                                                        <p className="text-[10px] text-app-text-muted">
                                                            {rep.partner?.type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle max-w-[200px]">
                                                <p className="text-sm text-app-text-main truncate" title={rep.description}>
                                                    {rep.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                                                <span className="text-sm font-bold text-app-text-main">
                                                    {formatBRL(rep.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                                                <span className={clsx(
                                                    "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit",
                                                    rep.status === 'PAID'
                                                        ? "bg-black/10 text-black"
                                                        : "bg-amber-400/10 text-amber-600"
                                                )}>
                                                    <div className={clsx(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        rep.status === 'PAID' ? "bg-black" : "bg-amber-400"
                                                    )} />
                                                    {rep.status === 'PAID' ? 'Pago' : 'Pendente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-right whitespace-nowrap">
                                                {rep.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handlePayRepasse(rep.id)}
                                                        className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg hover:opacity-90 transition-colors shadow-lg shadow-black/20"
                                                    >
                                                        Marcar Pago
                                                    </button>
                                                )}
                                                {rep.status === 'PAID' && (
                                                    <span className="text-xs text-app-text-muted italic">Repassado</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-app-text-muted">
                                            Nenhum repasse registrado na planilha de honorários.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Transaction Modal */}
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                newTransaction={newTransaction}
                setNewTransaction={setNewTransaction}
                processes={processes}
                clients={clients}
                partners={partners}
                categories={categories}
                isSubmitting={isSubmitting}
                handleSaveTransaction={handleSaveTransaction}
            />

            {/* Partner Modal */}
            <PartnerModal
                isOpen={isPartnerModalOpen}
                onClose={() => setIsPartnerModalOpen(false)}
                newPartner={newPartner}
                setNewPartner={setNewPartner}
                editingPartner={editingPartner}
                isSubmitting={isSubmitting}
                handleSavePartner={handleSavePartner}
                handleDeletePartner={handleDeletePartner}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Excluir Transação"
            >
                <div>
                    <p className="text-app-text-muted mb-6">Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-4 py-2 text-sm text-app-text-muted hover:text-app-text-main transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </Modal>



            {/* Note View Modal */}
            <Modal
                isOpen={!!activeNoteRecord}
                onClose={() => setActiveNoteRecord(null)}
                title="Observações do Lançamento"
                size="md"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-app-bg/50 border border-app-stroke rounded-xl">
                        <div className={clsx(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            activeNoteRecord?.type === 'INCOME' ? "bg-black/10 text-black" : "bg-neutral-800 text-white"
                        )}>
                            {activeNoteRecord?.type === 'INCOME' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-app-text-main">{activeNoteRecord?.description}</p>
                            <p className="text-xs text-app-text-muted">
                                {activeNoteRecord?.date && getDateLabel(activeNoteRecord.date)} • {activeNoteRecord?.category}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl relative">
                        <div className="absolute top-4 right-4 text-primary/20">
                            <Info size={40} />
                        </div>
                        <h4 className="text-xs font-bold text-primary uppercase mb-2">Nota Adicional:</h4>
                        <p className="text-sm text-app-text-main leading-relaxed whitespace-pre-wrap relative z-10">
                            {activeNoteRecord?.notes || 'Nenhuma observação detalhada para este lançamento.'}
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={() => setActiveNoteRecord(null)}
                            className="px-6 py-2 bg-app-bg border border-app-stroke rounded-lg text-sm font-medium text-app-text-main hover:bg-app-stroke/50 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Asaas Invoice Modal */}
            <GenerateInvoiceModal 
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                clientId={selectedClientForInvoice?.id}
                clientName={selectedClientForInvoice?.name}
                defaultAmount={selectedClientForInvoice?.amount}
                financialRecordId={selectedClientForInvoice?.financialRecordId}
                clients={clients}
            />
        </div>
    );
}

// Memoized Helper Components


const FinancialTableRow = memo(({
    record, expandedGroups, toggleGroup, handleEdit, handleDelete, deleteConfirm, setDeleteConfirm, isOverdue, setActiveNoteRecord,
    setSelectedClientForInvoice, setIsInvoiceModalOpen, handleGenerateReceipt, handleCancel
}: any) => {
    const isGroup = record._isGroupHeader === true;
    const isExpanded = isGroup && expandedGroups?.has(record.id);

    const getDateLabel = (dateStr: string) => {
        if (!dateStr || dateStr.length < 10) return 'Data Inválida';
        const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dTime = date.getTime();
        if (dTime === today.getTime()) return 'Hoje';
        if (dTime === yesterday.getTime()) return 'Ontem';
        if (dTime === tomorrow.getTime()) return 'Amanhã';

        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <React.Fragment key={record.id}>
            <tr className={clsx(
                "border-b border-app-stroke/30 transition-colors group",
                isGroup ? "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer" : "hover:bg-app-bg/50 even:bg-app-bg/20"
            )} onClick={() => isGroup ? toggleGroup(record.id) : undefined}>
                <td className="w-1 px-5 py-4">
                    <div className={clsx(
                        "w-1 h-8 rounded-full transition-colors",
                        record.type === 'INCOME' ? "bg-black" : "bg-neutral-800"
                    )} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        {isGroup && (
                            <span className="text-app-text-muted text-xs mr-1 select-none w-3 text-center transition-transform">
                                {isExpanded ? "▼" : "▶"}
                            </span>
                        )}
                        {isOverdue(record.date, record.status) && !isGroup && (
                            <AlertTriangle size={14} className="text-neutral-500" />
                        )}
                        {(isGroup ? record._anyOverdue : isOverdue(record.date, record.status)) && isGroup && (
                            <AlertTriangle size={14} className="text-neutral-500" />
                        )}
                        <span className={clsx("text-sm transition-colors", (isGroup ? record._anyOverdue : isOverdue(record.date, record.status)) ? "text-black font-black" : "text-app-text-main group-hover:text-black")}>
                            {getDateLabel(record.date)}
                        </span>
                    </div>
                </td>
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        {!isGroup && (
                            <div className={clsx(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                record.type === 'INCOME' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            )}>
                                {record.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold text-app-text-main flex items-center gap-2 flex-wrap">
                        {record.description}
                        {isGroup && (
                            <span className="px-2 py-0.5 text-[10px] bg-black/5 dark:bg-white/10 text-black dark:text-white rounded-full font-medium shrink-0 flex items-center gap-1">
                                <Repeat size={10} />
                                {record._children.length} parcelas
                            </span>
                        )}
                        {record.paymentMethod && <span className="text-[10px] px-2 py-0.5 rounded-full bg-app-stroke/50 text-app-text-muted shrink-0 flex items-center gap-1.5 border border-app-stroke" title="Método de Pagamento"><DollarSign size={10} /> {record.paymentMethod}</span>}
                        {record.invoices && record.invoices.length > 0 && (
                            <div className="flex gap-1 items-center">
                                {record.invoices[0].paymentMethod === 'PIX' ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/20 flex items-center gap-1">
                                        <QrCode size={10} /> PIX
                                    </span>
                                ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/20 flex items-center gap-1">
                                        <FileText size={10} /> Boleto
                                    </span>
                                )}
                                <a 
                                    href={record.invoices[0].invoiceUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1 text-app-text-muted hover:text-blue-500 transition-colors"
                                    title="Ver Fatura"
                                >
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        )}
                        {!isGroup && record.isUrgent && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-neutral-800 text-white rounded-full shrink-0 animate-pulse">URGENTE</span>}
                    </p>
                    {record.client && <p className="text-xs text-app-text-muted mt-0.5 max-w-[200px] truncate">Cli: {record.client.name}</p>}
                        </div>
                    </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                        <span className="px-2.5 py-1 bg-app-bg/50 border border-app-stroke rounded-lg text-xs font-medium text-app-text-muted w-fit">{record.category}</span>
                        {record.costCenter && (
                            <span className="px-2 py-0.5 bg-blue-500/5 text-blue-500 text-[10px] font-bold rounded border border-blue-500/20 w-fit uppercase">
                                {record.costCenter}
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-5 py-3 whitespace-nowrap text-center">
                    {isGroup ? (
                        <span className="text-xs font-medium bg-black/5 dark:bg-white/10 text-black dark:text-white px-2.5 py-1 rounded-full border border-black/10 dark:border-white/20 shadow-sm flex items-center gap-1 justify-center w-fit mx-auto">
                            {record._paidCount}/{record._children.length} Pagos
                        </span>
                    ) : (record.isRecurring && record.totalInstallments && record.totalInstallments > 1) ? (
                        <span className="text-xs font-medium bg-black/5 dark:bg-white/10 text-black dark:text-white px-2 py-0.5 rounded-lg border border-black/10 dark:border-white/20 flex items-center gap-1 justify-center w-fit mx-auto">
                            <Repeat size={12} />
                            P. {record.currentInstallment || 1}/{record.totalInstallments}
                        </span>
                    ) : (
                        <span className="text-xs text-app-text-muted">-</span>
                    )}
                </td>
                <td className="px-5 py-4 text-center">
                    {record.notes && !isGroup ? (
                        <button onClick={(e) => { e.stopPropagation(); setActiveNoteRecord(record); }} className="p-1.5 text-black bg-black/5 hover:bg-black/10 rounded-lg transition-colors tooltip relative inline-flex" title="Anotação presente">
                            <MessageSquare size={14} />
                        </button>
                    ) : (
                        <span className="text-app-text-muted/30">-</span>
                    )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                    <span className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit shadow-sm",
                        record.status === 'PAID'
                            ? "bg-black/10 dark:bg-white/20 text-black dark:text-white border border-black/10 dark:border-white/20"
                            : record.status === 'CANCELLED'
                                ? "bg-red-500/10 text-red-600 border border-red-200"
                                : (isGroup ? record._anyOverdue : isOverdue(record.date, record.status))
                                    ? "bg-neutral-800 text-white border border-neutral-700"
                                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                    )}>
                        {record.status === 'PAID' ? <CheckCircle2 size={12} /> : record.status === 'CANCELLED' ? <X size={12} /> : (isGroup ? record._anyOverdue : isOverdue(record.date, record.status)) ? <AlertTriangle size={12} /> : <Hourglass size={12} />}
                        {record.status === 'PAID' ? 'Pago' : record.status === 'CANCELLED' ? 'Estornado' : (isGroup ? record._anyOverdue : isOverdue(record.date, record.status)) ? 'Atrasado' : 'Pendente'}
                    </span>
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                        <span className={clsx("text-sm font-bold", record.type === 'INCOME' ? "text-black dark:text-white" : "text-neutral-500")}>
                            {record.type === 'INCOME' ? '+' : '-'}{formatBRL(record.amount)}
                        </span>
                        {record.netAmount !== undefined && record.netAmount !== null && record.netAmount !== record.amount && (
                            <span className="text-[10px] text-red-500 font-medium leading-none mt-1">Líq: {formatBRL(record.netAmount)}</span>
                        )}
                    </div>
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap">
                    {!isGroup && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {record.status === 'PENDING' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                                    className={clsx(
                                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-sm",
                                        record.type === 'INCOME'
                                            ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-90 border border-black/10 dark:border-white/20"
                                            : "bg-neutral-800 text-white hover:bg-neutral-900 border border-neutral-700"
                                    )}
                                >
                                    {record.type === 'INCOME' ? 'Receber' : 'Pagar'}
                                </button>
                            )}
                            {record.status === 'PENDING' && record.type === 'INCOME' && record.clientId && (
                                <button
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setSelectedClientForInvoice({
                                            id: record.clientId, 
                                            name: record.client?.name || 'Cliente',
                                            amount: record.amount,
                                            financialRecordId: record.id
                                        }); 
                                        setIsInvoiceModalOpen(true); 
                                    }}
                                    className="px-3 py-1.5 bg-black/5 dark:bg-white/10 text-black dark:text-white hover:bg-black/10 border border-black/10 dark:border-white/20 text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1"
                                    title="Gerar Cobrança Asaas (PIX/Boleto)"
                                >
                                    <QrCode size={12} /> Cobrança
                                </button>
                            )}
                            {record.status === 'PAID' && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleGenerateReceipt(record); }}
                                        className="px-2 py-1.5 text-xs font-medium text-app-text-muted hover:text-white bg-app-bg hover:bg-app-stroke rounded-lg transition-colors border border-app-stroke flex items-center gap-1"
                                        title="Gerar Recibo PDF"
                                    >
                                        <FileText size={12} /> Recibo
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                                        className="px-2 py-1.5 text-xs font-medium text-app-text-muted hover:text-white bg-app-bg hover:bg-app-stroke rounded-lg transition-colors border border-app-stroke"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCancel(record.id); }}
                                        className="px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-200"
                                        title="Estornar Lançamento"
                                    >
                                        Estornar
                                    </button>
                                </>
                            )}
                            {deleteConfirm === record.id ? (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleDelete(record.id)} className="px-2 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600">Sim</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1.5 bg-app-stroke text-app-text-muted text-xs font-medium rounded-lg hover:bg-app-stroke/80">Não</button>
                                </div>
                            ) : (
                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(record.id); }} className="p-1.5 text-app-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </td>
            </tr>
            {/* Expanded Children Rows */}
            {isGroup && isExpanded && record._children.map((child: any) => (
                <tr key={child.id} className="border-b border-app-stroke/30 bg-app-bg/50 hover:bg-app-bg transition-colors">
                    <td className="w-1 px-5 py-3 border-l-4 border-l-black/10 dark:border-l-white/10"></td>
                    <td className="px-5 py-4 whitespace-nowrap"><div className="flex items-center gap-2 pl-4">{isOverdue(child.date, child.status) && <AlertTriangle size={12} className="text-red-500" />}<span className={clsx("text-xs", isOverdue(child.date, child.status) ? "text-red-500 font-medium" : "text-app-text-muted")}>{getDateLabel(child.date)}</span></div></td>
                    <td className="px-5 py-4"><p className="text-xs text-app-text-muted flex items-center gap-2">Parcela {child.currentInstallment || '?'}</p></td>
                    <td className="px-5 py-4"><span className="text-xs text-app-text-muted/50">-</span></td>
                    <td className="px-5 py-4 text-center"><span className="text-[10px] font-medium bg-black/5 dark:bg-white/10 text-black dark:text-white px-1.5 py-0.5 rounded border border-black/10 dark:border-white/20">P. {child.currentInstallment || '?'}/{child.totalInstallments}</span></td>
                    <td className="px-5 py-4 text-center"><span className="text-app-text-muted/30">-</span></td>
                    <td className="px-5 py-4 whitespace-nowrap"><span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 w-fit", child.status === 'PAID' ? "bg-black/10 dark:bg-white/20 text-black dark:text-white" : isOverdue(child.date, child.status) ? "bg-neutral-800 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200")}>{child.status === 'PAID' ? <CheckCircle2 size={10} /> : isOverdue(child.date, child.status) ? <AlertTriangle size={10} /> : <Hourglass size={10} />}{child.status === 'PAID' ? 'Pago' : isOverdue(child.date, child.status) ? 'Atraso' : 'Pendente'}</span></td>
                    <td className="px-5 py-4 text-right whitespace-nowrap"><span className={clsx("text-xs", child.type === 'INCOME' ? "text-black dark:text-white" : "text-neutral-500")}>{child.type === 'INCOME' ? '+' : '-'}{formatBRL(child.amount)}</span></td>
                    <td className="px-5 py-4 text-right whitespace-nowrap"><div className="flex items-center justify-end gap-1">{child.status === 'PENDING' && <button onClick={() => handleEdit(child)} className={clsx("px-2 py-0.5 text-[10px] font-medium rounded", child.type === 'INCOME' ? "bg-green-500/10 text-green-400" : "bg-primary/10 text-primary")}>{child.type === 'INCOME' ? 'Receber' : 'Pagar'}</button>}{deleteConfirm === child.id ? (<div className="flex items-center gap-1"><button onClick={() => handleDelete(child.id)} className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded">Sim</button><button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 bg-app-stroke text-app-text-muted text-[10px] rounded">Não</button></div>) : (<button onClick={() => setDeleteConfirm(child.id)} className="p-1 text-app-text-muted hover:text-red-500 rounded transition-colors"><Trash2 size={13} /></button>)}</div></td>
                </tr>
            ))}
        </React.Fragment>
    );
});

const FinancialMobileRow = memo(({
    record, expandedGroups, toggleGroup, handleEdit, handleDelete, deleteConfirm, setDeleteConfirm, isOverdue, getDateLabel, setActiveNoteRecord,
    setSelectedClientForInvoice, setIsInvoiceModalOpen
}: any) => {
    const isGroup = record._isGroupHeader === true;
    const isExpanded = isGroup && expandedGroups.has(record.id);

    return (
        <React.Fragment key={record.id}>
            <div className={clsx("p-4 transition-colors touch-manipulation", isGroup ? "bg-black/5 dark:bg-white/5 active:bg-black/10 dark:active:bg-white/10 border-l-2 border-l-black/20 dark:border-l-white/20" : "hover:bg-app-stroke/10 active:bg-app-stroke/20")} onClick={() => isGroup ? toggleGroup(record.id) : undefined}>
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 mt-0.5 shrink-0">
                        {isGroup && <span className="text-app-text-muted text-sm select-none">{isExpanded ? "▼" : "▶"}</span>}
                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center", record.type === 'INCOME' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400")}>{record.type === 'INCOME' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-app-text-main truncate">{record.description}{isGroup && <span className="text-xs text-app-text-muted ml-1 flex items-center gap-0.5 inline-flex"><Repeat size={10} /> ({record._children.length} parc)</span>}</p>
                            {record.notes && !isGroup && <button onClick={(e) => { e.stopPropagation(); setActiveNoteRecord(record); }} className="p-1 text-black dark:text-white bg-black/5 dark:bg-white/10 rounded-full shrink-0"><MessageSquare size={12} /></button>}
                            {isGroup && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-black/10 dark:bg-white/10 text-black dark:text-white rounded-full shrink-0">{record._paidCount}/{record._children.length}</span>}
                            {record.isUrgent && !isGroup && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-neutral-800 text-white rounded-full shrink-0">URGENTE</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-app-text-muted">
                            <span className={(isGroup ? record._anyOverdue : isOverdue(record.date, record.status)) ? "text-red-500 font-medium" : ""}>{(isGroup ? record._anyOverdue : isOverdue(record.date, record.status)) && "⚠ "}{getDateLabel(record.date)}</span>
                            <span>•</span><span>{record.category}</span>
                            {record.costCenter && <><span className="text-[10px]">•</span><span className="text-blue-500 font-bold uppercase text-[10px]">{record.costCenter}</span></>}
                            {!isGroup && record.isRecurring && record.totalInstallments && record.totalInstallments > 1 && <><span>•</span><span className="text-black dark:text-white">{record.currentInstallment || 1}/{record.totalInstallments}</span></>}
                        </div>
                        {record.client && <p className="text-xs text-app-text-muted mt-1">Cliente: {record.client.name}</p>}
                    </div>
                    <div className="text-right shrink-0">
                        <p className={clsx("text-sm font-bold", record.type === 'INCOME' ? "text-black dark:text-white" : "text-neutral-500")}>
                            {record.type === 'INCOME' ? '+' : '-'}{formatBRL(record.amount)}
                        </p>
                        {record.netAmount !== undefined && record.netAmount !== null && record.netAmount !== record.amount && (
                            <p className="text-[10px] text-red-500 font-medium leading-none mb-1">Líq: {formatBRL(record.netAmount)}</p>
                        )}
                        <span className={clsx("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full", record.status === 'PAID' ? "bg-black/10 dark:bg-white/20 text-black dark:text-white" : (isGroup ? record._anyOverdue : isOverdue(record.date, record.status)) ? "bg-neutral-800 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200")}>
                            {record.status === 'PAID' ? <CheckCircle2 size={10} /> : (isGroup ? record._anyOverdue : isOverdue(record.date, record.status)) ? <AlertTriangle size={10} /> : <Hourglass size={10} />}
                            {record.status === 'PAID' ? 'Pago' : (isGroup ? record._anyOverdue : isOverdue(record.date, record.status)) ? 'Atrasado' : 'Pendente'}
                        </span>
                    </div>
                </div>
                {!isGroup && record.status === 'PENDING' && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-app-stroke/50">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(record); }} className={clsx("flex-1 py-2 text-xs font-medium rounded-lg transition-colors text-center", record.type === 'INCOME' ? "bg-black dark:bg-white text-white dark:text-black" : "bg-neutral-800 text-white")}>{record.type === 'INCOME' ? 'Marcar Recebido' : 'Marcar Pago'}</button>
                        {record.type === 'INCOME' && record.clientId && (
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setSelectedClientForInvoice({
                                        id: record.clientId, 
                                        name: record.client?.name || 'Cliente',
                                        amount: record.amount,
                                        financialRecordId: record.id
                                    }); 
                                    setIsInvoiceModalOpen(true); 
                                }}
                                className="px-3 py-2 bg-black/5 dark:bg-white/10 text-black dark:text-white rounded-lg flex items-center justify-center border border-black/10"
                            >
                                <QrCode size={16} />
                            </button>
                        )}
                        {deleteConfirm === record.id ? (<div className="flex gap-1"><button onClick={() => handleDelete(record.id)} className="px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg">Confirmar</button><button onClick={() => setDeleteConfirm(null)} className="px-3 py-2 bg-app-stroke text-app-text-muted text-xs font-medium rounded-lg">Não</button></div>) : (<button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(record.id); }} className="p-2 text-app-text-muted hover:text-red-500 rounded-lg transition-colors" title="Apagar"><Trash2 size={16} /></button>)}
                    </div>
                )}
                {!isGroup && record.status !== 'PENDING' && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-app-stroke/50">
                        {deleteConfirm === record.id ? (<div className="flex gap-1"><button onClick={() => handleDelete(record.id)} className="px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg">Confirmar</button><button onClick={() => setDeleteConfirm(null)} className="px-3 py-2 bg-app-stroke text-app-text-muted text-xs font-medium rounded-lg">Cancelar</button></div>) : (<button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(record.id); }} className="p-2 text-app-text-muted hover:text-red-500 rounded-lg transition-colors flex items-center gap-1.5 text-xs" title="Apagar"><Trash2 size={14} /> Apagar</button>)}
                    </div>
                )}
            </div>
            {isGroup && isExpanded && (
                <div className="bg-app-bg/50 px-3 py-2 border-t border-app-stroke/30">
                    <div className="pl-4 border-l-2 border-blue-500/30 space-y-2 py-1">
                        {record._children.map((child: any) => (
                            <div key={child.id} className="flex justify-between items-center py-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-px bg-blue-500/30 inline-block" />
                                    {isOverdue(child.date, child.status) && <AlertTriangle size={10} className="text-red-500" />}
                                    <span className={clsx("text-xs", isOverdue(child.date, child.status) ? "text-red-500 font-medium" : "text-app-text-muted")}>{getDateLabel(child.date)}</span>
                                    <span className="text-[10px] text-app-text-muted">P. {child.currentInstallment || '?'}/{child.totalInstallments}</span>
                                    <span className={clsx("px-1.5 py-0.5 text-[9px] font-medium rounded-full flex items-center gap-1", child.status === 'PAID' ? "bg-black/10 text-black" : isOverdue(child.date, child.status) ? "bg-neutral-800 text-white" : "bg-neutral-400/10 text-neutral-500")}>
                                        {child.status === 'PAID' ? <CheckCircle2 size={10} /> : isOverdue(child.date, child.status) ? <AlertTriangle size={10} /> : <Hourglass size={10} />}
                                        {child.status === 'PAID' ? 'Pago' : isOverdue(child.date, child.status) ? 'Atrasado' : 'Pend'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={clsx("text-xs font-semibold", child.type === 'INCOME' ? "text-black" : "text-neutral-500")}>{child.type === 'INCOME' ? '+' : '-'}{formatBRL(child.amount)}</span>
                                    {child.status === 'PENDING' && <button onClick={(e) => { e.stopPropagation(); handleEdit(child); }} className={clsx("px-2 py-0.5 text-[10px] font-medium rounded", child.type === 'INCOME' ? "bg-black/10 text-black" : "bg-neutral-800/10 text-neutral-800")}>{child.type === 'INCOME' ? 'Receber' : 'Pagar'}</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </React.Fragment>
    );
});
