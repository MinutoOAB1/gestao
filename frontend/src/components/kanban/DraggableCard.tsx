import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, MessageSquare, Calendar, AlertTriangle, CheckCircle, MoreVertical } from 'lucide-react';
import { Process } from '../../types/kanban';
import { AREA_COLORS, formatDeadline, formatRelativeDate } from '../../utils/kanban';

export const DraggableCard = memo(function DraggableCard({ process, onOpenModal }: { process: Process; onOpenModal: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: process.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms ease',
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const isCompleted = process.kanbanColumn === 'concluido';
    const deadline = formatDeadline(process.deadline);
    const checklists = process.checklists || [];
    const totalItems = checklists.reduce((a, c) => a + c.items.length, 0);
    const completedItems = checklists.reduce((a, c) => a + c.items.filter(i => i.completed).length, 0);
    const commentCount = process._count?.comments || 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700/60 transition-all hover:shadow-lg ${isCompleted ? 'opacity-60' : ''} group`}
        >
            <div
                className="p-4"
                {...attributes}
                {...listeners}
                style={{ cursor: 'grab', touchAction: 'none' }}
            >
                {/* Title row with three-dot menu */}
                <div className="flex items-start justify-between gap-2">
                    <h4
                        className={`text-sm font-bold leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-1 ${isCompleted
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-gray-800 dark:text-gray-100'
                            }`}
                        onClick={(e) => { e.stopPropagation(); onOpenModal(process.id); }}
                    >
                        {process.title.toUpperCase()}
                    </h4>
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenModal(process.id); }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded transition-colors shrink-0 touch-manipulation"
                    >
                        <MoreVertical size={16} />
                    </button>
                </div>

                {/* Client name and Area */}
                <div className="flex items-center gap-2 mt-1.5">
                    {process.area && (() => {
                        const areaStyle = AREA_COLORS[process.area as keyof typeof AREA_COLORS];
                        return (
                            <span className={`shrink-0 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${areaStyle ? `${areaStyle.bg} ${areaStyle.text}` : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                {process.area}
                            </span>
                        );
                    })()}
                    {process.client && (
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                            {process.client.name.toUpperCase()}
                        </p>
                    )}
                </div>

                {/* Description snippet */}
                {process.description && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                        {process.description}
                    </p>
                )}

                {/* Tags (labels) */}
                {process.labels && process.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                        {process.labels.map(label => (
                            <span
                                key={label.id}
                                className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: label.color }}
                            >
                                {label.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Indicators row (compact) */}
                <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                    {/* Deadline badge */}
                    {deadline.text && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${deadline.isUrgent
                            ? 'bg-neutral-800 text-white animate-pulse'
                            : deadline.isTomorrow
                                ? 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                                : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                            }`}>
                            {deadline.isUrgent ? <AlertTriangle size={11} /> : <Calendar size={11} />}
                            {deadline.text}
                        </span>
                    )}

                    {/* Checklist progress */}
                    {totalItems > 0 && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${completedItems === totalItems ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                            <CheckSquare size={11} />
                            {completedItems}/{totalItems}
                        </span>
                    )}

                    {/* Comments count */}
                    {commentCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
                            <MessageSquare size={11} />
                            {commentCount}
                        </span>
                    )}

                    {isCompleted && <CheckCircle size={12} className="text-black dark:text-white ml-auto" />}
                </div>

                {/* Progress Bar (checklist) */}
                {totalItems > 0 && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-400 font-medium">Progresso</span>
                            <span className={`text-[10px] font-bold ${completedItems === totalItems ? 'text-green-500' : 'text-gray-400'}`}>{Math.round((completedItems / totalItems) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${completedItems === totalItems ? 'bg-black dark:bg-white' : 'bg-neutral-400'}`}
                                style={{ width: `${(completedItems / totalItems) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer: client avatar + modification date */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                        {process.client && (
                            <div className="w-5 h-5 rounded-full bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center shrink-0">
                                <span className="text-white dark:text-black font-bold text-[8px]">{process.client.name?.charAt(0)?.toUpperCase()}</span>
                            </div>
                        )}
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {formatRelativeDate(process.updatedAt || process.createdAt)}
                        </p>
                    </div>
                    {isCompleted && <CheckCircle size={12} className="text-black dark:text-white" />}
                </div>
            </div>
        </div>
    );
});
