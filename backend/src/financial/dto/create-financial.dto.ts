export class CreateFinancialDto {
    type: string; // 'INCOME' | 'EXPENSE'
    category: string;
    amount: number;
    description: string;
    date?: string; // ISO Date
    status?: string; // 'PENDING' | 'PAID'
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
}
