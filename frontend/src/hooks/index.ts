// Custom Hooks - Central Export
// Import hooks from here instead of individual files

export { useProcesses } from './useProcesses';
export type {
    Process,
    ProcessFilters,
    CreateProcessData,
    UpdateProcessData
} from './useProcesses';

export { useClients } from './useClients';
export type {
    Client,
    ClientFilters,
    CreateClientData,
    UpdateClientData
} from './useClients';

export { useFinancial } from './useFinancial';
export type {
    FinancialRecord,
    FinancialFilters,
    CreateFinancialData,
    UpdateFinancialData
} from './useFinancial';

export { useTemplates } from './useTemplates';
export type {
    Template,
    TemplateFilters,
    CreateTemplateData,
    UpdateTemplateData
} from './useTemplates';

export { useDocuments } from './useDocuments';
export type {
    Document,
    Folder,
    DocumentFilters
} from './useDocuments';
