export class CreateAgendaDto {
    title: string;
    description?: string;
    start: string; // ISO Date
    end: string;   // ISO Date
    type: string;  // TASK, MEETING, DEADLINE, HEARING, OTHER
    color?: string;
    completed?: boolean;
    status?: string;  // ATIVO, SUSPENSO, FINALIZADO
    priority?: string;  // LOW, MEDIUM, HIGH, URGENT
    location?: string;  // Meeting location
    reminderMinutes?: number; // Reminder: 30, 60, 120 minutes before
    processId?: string; // Link to a process
    processNumber?: string;
    clientId?: string;  // Link to a client
    clientName?: string;
    assigneeIds?: string[]; // User IDs to assign this event to
}
