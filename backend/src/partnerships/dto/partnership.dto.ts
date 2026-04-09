export class CreatePartnershipDto {
    name: string;
    initials: string;
    type: string;
    percentage?: number;
    fixedAmount?: number;
    color?: string;
    email?: string;
    phone?: string;
    notes?: string;
}

export class UpdatePartnershipDto {
    name?: string;
    initials?: string;
    type?: string;
    percentage?: number;
    fixedAmount?: number;
    color?: string;
    email?: string;
    phone?: string;
    notes?: string;
    active?: boolean;
}

export class CreatePartnershipTransactionDto {
    partnerId: string;
    amount: number;
    description?: string;
    dueDate?: string;
    financialRecordId?: string;
}

export class UpdatePartnershipTransactionDto {
    amount?: number;
    description?: string;
    status?: string;
    dueDate?: string;
    paidDate?: string;
}
