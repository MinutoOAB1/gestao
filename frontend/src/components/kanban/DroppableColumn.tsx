import React, { useState, memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Save, X, Trash2, Plus } from 'lucide-react';
import { Column, Process } from '../../types/kanban';
import { COLUMN_STYLES } from '../../utils/kanban';
import { DraggableCard } from './DraggableCard';
import { Protect } from '../auth/Protect';

export const DroppableColumn = memo(function DroppableColumn({
    column,
    processes,
    columnIndex,
    onEditColumn,
    onDeleteColumn,
    onAddCard,
    onOpenModal,
    onGenerateStrategy,
}: {
    column: Column;
    processes: Process[];
    columnIndex: number;
    onEditColumn: (id: string, title: string) => void;
    onDeleteColumn: (id: string) => void;
    onAddCard: (columnId: string) => void;
    onOpenModal: (id: string) => void;
    onGenerateStrategy: (process: Process) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(column.title);

    const { setNodeRef, isOver } = useDroppable({ id: column.id });

    const handleSave = () => {
        const trimmedTitle = editTitle.trim();
        if (!trimmedTitle) {
            setEditTitle(column.title || 'Nova Coluna');
            setIsEditing(false);
            return;
        }
        onEditColumn(column.id, trimmedTitle);
        setIsEditing(false);
    };

    const isOverWip = column.wipLimit && processes.length > column.wipLimit;
    const style = COLUMN_STYLES[columnIndex % COLUMN_STYLES.length];

    return (
        <div className="flex flex-col w-[85vw] sm:w-[320px] shrink-0 group/column">
            {/* Column Header */}
            <div className={`flex flex-col mb-0 rounded-t-2xl border-x border-t ${style.border} ${style.headerBg} relative overflow-hidden transition-all duration-300`}>
                {/* Top accent line */}
                <div className={`h-1 w-full ${style.dot} opacity-80`} />
                
                <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="text-sm font-black bg-white dark:bg-slate-800 px-2 py-1 rounded border-2 border-blue-500 outline-none w-32 text-gray-900 dark:text-white shadow-sm"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                />
                                <button onClick={handleSave} className="p-1 bg-black dark:bg-white text-white dark:text-black rounded transition-colors"><Save size={14} /></button>
                                <button onClick={() => setIsEditing(false)} className="p-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 rounded hover:bg-neutral-300 transition-colors"><X size={14} /></button>
                            </div>
                        ) : (
                            <>
                                <h3
                                    className="text-[13px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                                    onClick={() => setIsEditing(true)}
                                    title="Duplo clique para editar"
                                >
                                    {column.title || 'Sem título'}
                                </h3>
                                <div className={`w-1.5 h-1.5 rounded-full ${style.dot} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm border ${style.badge} border-white/20 dark:border-black/10`}>
                            {processes.length}
                        </span>
                        
                        <div className="flex items-center">
                            {!['novo', 'concluido'].includes(column.id) && (
                                <Protect roles={['ADMIN', 'LAWYER']}>
                                    <button
                                        onClick={() => onDeleteColumn(column.id)}
                                        className="text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover/column:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Excluir coluna"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </Protect>
                            )}
                        </div>
                    </div>
                </div>
                
                {isOverWip && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 animate-pulse" />
                )}
            </div>

            {/* Cards container */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto flex flex-col gap-3 px-3 py-3 rounded-b-2xl border transition-all duration-200 ${isOver
                    ? 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                    : isOverWip
                        ? 'border-neutral-800 dark:border-neutral-200 bg-neutral-100 dark:bg-neutral-900'
                        : `${style.border} ${style.bg}`
                    }`}
                style={{ minHeight: 160 }}
            >
                <SortableContext items={processes.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {processes.map((process) => (
                        <DraggableCard 
                            key={process.id} 
                            process={process} 
                            onOpenModal={onOpenModal} 
                            onGenerateStrategy={onGenerateStrategy} 
                        />
                    ))}
                </SortableContext>

                {processes.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm py-10">
                        Arraste processos aqui
                    </div>
                )}
            </div>

            {/* Add card button */}
            <button
                onClick={() => onAddCard(column.id)}
                className="flex items-center justify-center gap-2 py-2 mt-2 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 text-neutral-400 hover:text-black dark:hover:text-white text-sm font-medium transition-all touch-manipulation min-h-[40px] mb-0"
            >
                <Plus size={16} />
                Adicionar
            </button>
        </div>
    );
});
