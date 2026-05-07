import { Column } from '../types/kanban';

export const COLUMN_STYLES = [
    { bg: 'bg-green-50 dark:bg-green-950/20', headerBg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800/40', accent: 'text-green-600 dark:text-green-400', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400' },
    { bg: 'bg-blue-50 dark:bg-blue-950/20', headerBg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800/40', accent: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400' },
    { bg: 'bg-red-50 dark:bg-red-950/20', headerBg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800/40', accent: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400' },
    { bg: 'bg-amber-50 dark:bg-amber-950/20', headerBg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800/40', accent: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400' },
    { bg: 'bg-emerald-50 dark:bg-emerald-950/20', headerBg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800/40', accent: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400' },
    { bg: 'bg-indigo-50 dark:bg-indigo-950/20', headerBg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-200 dark:border-indigo-800/40', accent: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-400' },
    { bg: 'bg-white dark:bg-slate-900', headerBg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', accent: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
];

export const COLUMN_COLORS = COLUMN_STYLES.map(s => s.bg + ' ' + s.border);

export const DEFAULT_COLUMNS: Column[] = [
    { id: 'novo', title: 'Prospecção', color: COLUMN_COLORS[0] },
    { id: 'analise', title: 'Em Atendimento', color: COLUMN_COLORS[1] },
    { id: 'peticao', title: 'Petição', color: COLUMN_COLORS[2] },
    { id: 'audiencia', title: 'Audiência', color: COLUMN_COLORS[3] },
    { id: 'concluido', title: 'Concluídos', color: COLUMN_COLORS[4] },
];

export const AREA_COLORS: Record<string, { bg: string; text: string }> = {
    'Cível': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    'Civil': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    'Trabalhista': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    'Penal': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    'Criminal': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
    'Previdenciário': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400' },
    'Tributário': { bg: 'bg-gray-100 dark:bg-slate-700', text: 'text-gray-700 dark:text-gray-300' },
    'Família': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
    'Contratual': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
};

export function formatDeadline(deadline?: string): { text: string; isUrgent: boolean; isTomorrow: boolean } {
    if (!deadline) return { text: '', isUrgent: false, isTomorrow: false };
    const date = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(date);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Atrasado', isUrgent: true, isTomorrow: false };
    if (diffDays === 0) return { text: 'Hoje', isUrgent: true, isTomorrow: false };
    if (diffDays === 1) return { text: 'Amanhã', isUrgent: false, isTomorrow: true };
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return { text: `${date.getDate()} ${months[date.getMonth()]}`, isUrgent: false, isTomorrow: false };
}

export function formatRelativeDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Modificado hoje';
    if (diffDays === 1) return 'Modificado ontem';
    return `Modificado em ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}
