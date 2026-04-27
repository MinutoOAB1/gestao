import React, { useState } from 'react';
import { FileText, Lock, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { DocumentActionsMenu } from './DocumentActionsMenu';

export type KanbanStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface FileItem {
    id: string;
    name: string;
    type: string;
    size: string;
    url?: string;
    folderId?: string;
    createdAt: string;
    kanbanStatus: KanbanStatus;
    isLocked: boolean;
    allowedRoles?: string;
    createdBy?: { id: string; name: string; avatar?: string };
}

interface KanbanCardProps {
    file: FileItem;
    onMenuActions: (file: FileItem) => any;
}

export const DocumentKanbanCard: React.FC<KanbanCardProps> = ({ file, onMenuActions }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: file.id });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}
            className={clsx("bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 mb-2 cursor-grab hover:shadow-md transition-all", file.isLocked && "border-amber-500/40")}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {file.type === 'pdf' ? <FileText size={16} className="text-red-500" /> : <FileText size={16} className="text-blue-500" />}
                    {file.isLocked && <Lock size={12} className="text-amber-500" />}
                </div>
                <div onPointerDown={e => e.stopPropagation()}>
                    <DocumentActionsMenu {...onMenuActions(file)} isLocked={file.isLocked} />
                </div>
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2">{file.name}</h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{file.size}</p>
            {file.createdBy && <p className="text-[9px] text-gray-400 mt-1">por {file.createdBy.name}</p>}
        </div>
    );
};

interface KanbanColumnProps {
    id: string;
    title: string;
    files: FileItem[];
    onMenuActions: (file: FileItem) => any;
    onTitleChange?: (id: string, title: string) => void;
}

export const DocumentKanbanColumn: React.FC<KanbanColumnProps> = ({ 
    id, 
    title, 
    files, 
    onMenuActions, 
    onTitleChange 
}) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(title);

    const handleSave = () => {
        if (onTitleChange && editTitle.trim()) onTitleChange(id, editTitle.trim());
        setIsEditing(false);
    };

    return (
        <div ref={setNodeRef} className={clsx("flex-1 min-w-[180px] md:min-w-[220px] bg-gray-100 dark:bg-slate-800/50 rounded-xl p-2 md:p-3 flex flex-col", isOver && "ring-2 ring-primary")}>
            <div className="flex justify-between items-center mb-2 md:mb-3">
                {isEditing ? (
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus
                        className="text-xs font-bold uppercase bg-white dark:bg-slate-700 border border-primary rounded px-1 py-0.5 w-full max-w-[100px]" />
                ) : (
                    <span onDoubleClick={() => setIsEditing(true)} className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase cursor-pointer hover:text-primary" title="Duplo clique para editar">{title}</span>
                )}
                <span className="bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 dark:text-gray-300 shrink-0">{files.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[50vh] md:max-h-none">
                {files.map(file => <DocumentKanbanCard key={file.id} file={file} onMenuActions={onMenuActions} />)}
                {files.length === 0 && <p className="text-center text-gray-400 text-xs py-4">Arraste aqui</p>}
            </div>
        </div>
    );
};
