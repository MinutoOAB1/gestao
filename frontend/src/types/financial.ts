export interface FinancialRecord {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    description: string;
    date: string;
    status: string;
    processRef?: string;
    partnerId?: string;
    clientId?: string;
    client?: { id: string; name: string };
    // Recurring payment fields
    isRecurring?: boolean;
    recurrenceType?: string;
    totalInstallments?: number;
    currentInstallment?: number;
    parentRecordId?: string | null;
    isUrgent?: boolean;
    notes?: string;
    paymentMethod?: string;
}

export interface Partner {
    id: string;
    name: string;
    initials: string;
    type: string;
    percentage: number | null;
    fixedAmount: number | null;
    pendingAmount: number;
    color: string;
    email?: string;
    phone?: string;
    notes?: string;
}

export interface FinancialStats {
    balance: number;
    pendingIncome: number;
    pendingIncomeCount: number;
    receivedPercent: number;
    pendingExpense: number;
    dueTodayCount: number;
    dueTodayAmount: number;
    totalRepasses?: number;
}

export interface ProcessItem {
    id: string;
    number: string;
    title: string;
    status: string;
}

export interface ClientItem {
    id: string;
    name: string;
    email?: string;
}

export interface NewTransaction {
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: string;
    description: string;
    date: string;
    status: string;
    recurrence: 'UNICA' | 'MENSAL' | 'ANUAL' | 'PERSONALIZADO';
    installments: number; // Number of installments for recurring payments
    urgent: boolean;
    notes: string;
    linkTo: string;
    accrualDate?: string;
    paymentDate?: string;
    costCenter?: string;
    partnerId?: string;
    partnerPercentage?: number;
}

export interface NewPartner {
    name: string;
    initials: string;
    type: string;
    percentage: string;
    fixedAmount: string;
    color: string;
    email: string;
    phone: string;
    notes: string;
}

export const INCOME_CATEGORIES = [
    'Honorários Contratuais', 
    'Honorários Sucumbenciais', 
    'Consultoria', 
    'Parecer Jurídico', 
    'Custas Reembolsadas', 
    'Acordo Judicial', 
    'Outros'
];

export const EXPENSE_CATEGORY_LIST = [
    'Pessoal / Salários', 
    'Custas Processuais', 
    'Infraestrutura / Aluguel', 
    'Marketing / Softwares', 
    'Impostos', 
    'Token / Assinatura Digital', 
    'Viagens / Deslocamento', 
    'Outros'
];

export const PARTNER_TYPES = [
    'TRABALHISTA', 'CÍVEL', 'TRIBUTÁRIO', 'CRIMINAL', 
    'PREVIDENCIÁRIO', 'FAMÍLIA', 'MARKETING', 'ADMINISTRATIVO', 'OUTROS'
];

export const PARTNER_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
];
