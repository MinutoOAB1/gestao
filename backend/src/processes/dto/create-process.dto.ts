export class CreateProcessDto {
    number: string;
    title: string;
    description?: string;
    status?: string;
    court?: string;
    area?: string;
    value?: number;
    clientId?: string;
    deadline?: string; // ISO date string
    assignedTo?: string; // Responsável
    kanbanColumn?: string;
    kanbanOrder?: number;
}
