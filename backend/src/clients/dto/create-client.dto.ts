export class CreateClientDto {
    name: string;
    email?: string;
    phone?: string;
    document?: string; // CPF/CNPJ
    address?: string;

    // Lead Data (Origem e Contato)
    leadSource?: string;
    referredBy?: string;

    // Fatos e Informações Iniciais
    demandType?: string;
    demandSummary?: string;
    factsDescription?: string;
    urgencyLevel?: string;

    // Dados Pessoais e Adicionais
    rg?: string;
    birthDate?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    occupation?: string;

    // Acompanhamento do Lead
    leadStatus?: string;
    nextAction?: string;
    nextActionDate?: string;
    internalNotes?: string;

    // Status
    status?: string;

    // Tags (for creation)
    tags?: { name: string; color?: string; order?: number }[];

    // Dynamic Fields (JSON)
    customFields?: any;
}
