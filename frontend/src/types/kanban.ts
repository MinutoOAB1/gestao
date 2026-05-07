export interface Label {
    id: string;
    name: string;
    color: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface Checklist {
    id: string;
    title: string;
    items: ChecklistItem[];
}

export interface Process {
    id: string;
    number: string;
    title: string;
    description?: string;
    area?: string;
    status: string;
    value?: number;
    court?: string;
    clientId?: string;
    deadline?: string;
    assignedTo?: string;
    kanbanColumn: string;
    kanbanOrder: number;
    createdAt: string;
    updatedAt?: string;
    client?: { id: string; name: string; email?: string };
    labels?: Label[];
    checklists?: Checklist[];
    _count?: { comments: number };
}

export interface Column {
    id: string;
    title: string;
    color?: string;
    wipLimit?: number;
}
