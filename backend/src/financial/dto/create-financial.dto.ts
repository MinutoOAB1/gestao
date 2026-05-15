export class CreateFinancialDto {
    type: string; // 'INCOME' | 'EXPENSE'
    category: string;
    categoryId?: string;
    amount: number;
    description: string;
    date?: string; // ISO Date (Expected/Due Date)
    accrualDate?: string; // ISO Date (Competência)
    paymentDate?: string; // ISO Date (Liquidação)
    costCenter?: string; // Centro de Custo
    status?: string; // 'PENDING' | 'PAID' | 'CANCELLED'
    clientId?: string; // Optional Relation

    // Recurring payment fields
    isRecurring?: boolean;
    recurrenceType?: string; // 'UNICA' | 'MENSAL' | 'ANUAL' | 'PERSONALIZADO'
    totalInstallments?: number;
    currentInstallment?: number;
    recurringEndDate?: string; // ISO Date
    parentRecordId?: string; // Link to parent record for installments
    isUrgent?: boolean; // Mark as urgent payment

    // Automatic Fee Splitting
    partnerId?: string;
    partnerPercentage?: number;

    // Additional notes
    notes?: string;

    // Phase 2: Taxes and Retentions
    issAmount?: number;
    irrfAmount?: number;
    pisAmount?: number;
    cofinsAmount?: number;
    netAmount?: number;
}

