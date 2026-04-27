import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Eye, Download, Unlock, Lock, Shield, History, Trash2 } from 'lucide-react';

interface DocumentActionsMenuProps {
    onPreview: () => void;
    onDownload: () => void;
    onDelete: () => void;
    onAudit: () => void;
    onLock: () => void;
    isLocked: boolean;
    onPermissions: () => void;
}

export const DocumentActionsMenu: React.FC<DocumentActionsMenuProps> = ({ 
    onPreview, 
    onDownload, 
    onDelete, 
    onAudit, 
    onLock, 
    isLocked, 
    onPermissions 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="text-app-text-label hover:text-app-text-main p-1.5 rounded-lg hover:bg-app-stroke/50 transition-colors"
            >
                <MoreVertical size={16} />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-8 z-[100] w-56 bg-app-card border border-app-stroke rounded-xl shadow-2xl py-1 animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => { onPreview(); setIsOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-app-text-main hover:bg-app-stroke/30 transition-colors">
                        <Eye size={14} className="text-primary" /> Visualizar
                    </button>
                    <button onClick={() => { onDownload(); setIsOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-app-text-main hover:bg-app-stroke/30 transition-colors">
                        <Download size={14} className="text-green-500" /> Baixar
                    </button>
                    <button onClick={() => { onLock(); setIsOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-app-text-main hover:bg-app-stroke/30 transition-colors">
                        {isLocked ? <Unlock size={14} className="text-amber-500" /> : <Lock size={14} className="text-amber-500" />}
                        {isLocked ? 'Desbloquear' : 'Bloquear Edição'}
                    </button>
                    <button onClick={() => { onPermissions(); setIsOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-app-text-main hover:bg-app-stroke/30 transition-colors">
                        <Shield size={14} className="text-indigo-500" /> Permissões
                    </button>
                    <button onClick={() => { onAudit(); setIsOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-app-text-main hover:bg-app-stroke/30 transition-colors">
                        <History size={14} className="text-blue-400" /> Auditoria
                    </button>
                    <hr className="my-1 border-app-stroke" />
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} /> Excluir
                    </button>
                </div>
            )}
        </div>
    );
};
