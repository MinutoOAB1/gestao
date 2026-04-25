import { useState, useEffect } from 'react';
import { Plus, Pin, Trash2, ChevronDown, ChevronUp, StickyNote } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../services/api';
import Modal from '../ui/Modal';
import MentionInput, { renderMentions } from '../ui/MentionInput';

interface ProcessNote {
    id: string;
    content: string;
    color: string;
    isPinned: boolean;
    createdBy?: string;
    createdAt: string;
}

const NOTE_COLORS = [
    { key: 'yellow', bg: 'bg-white dark:bg-white/10', border: 'border-neutral-200 dark:border-white/20', ring: 'ring-black' },
    { key: 'blue', bg: 'bg-neutral-50 dark:bg-neutral-800/50', border: 'border-neutral-200 dark:border-neutral-700', ring: 'ring-neutral-400' },
    { key: 'green', bg: 'bg-neutral-100 dark:bg-neutral-800', border: 'border-neutral-300 dark:border-neutral-600', ring: 'ring-neutral-500' },
    { key: 'pink', bg: 'bg-neutral-200 dark:bg-neutral-700', border: 'border-neutral-400 dark:border-neutral-500', ring: 'ring-neutral-600' },
    { key: 'purple', bg: 'bg-black dark:bg-neutral-900', border: 'border-neutral-800 dark:border-white/10', ring: 'ring-neutral-900' },
];

interface StickyNotesProps {
    processId: string;
}

export default function StickyNotes({ processId }: StickyNotesProps) {
    const [notes, setNotes] = useState<ProcessNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newNote, setNewNote] = useState({
        content: '',
        color: 'yellow',
    });

    useEffect(() => {
        fetchNotes();
    }, [processId]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/process-notes/process/${processId}`);
            setNotes(res.data || []);
        } catch (error) {
            console.error('Erro ao buscar notas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newNote.content.trim()) {
            alert('Preencha o conteúdo da nota');
            return;
        }

        setSaving(true);
        try {
            await api.post(`/process-notes/${processId}`, newNote);
            setShowModal(false);
            setNewNote({ content: '', color: 'yellow' });
            fetchNotes();
        } catch (error) {
            console.error('Erro ao criar nota:', error);
            alert('Erro ao criar nota');
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePin = async (note: ProcessNote) => {
        try {
            await api.put(`/process-notes/${note.id}`, { isPinned: !note.isPinned });
            fetchNotes();
        } catch (error) {
            console.error('Erro ao fixar nota:', error);
        }
    };

    const handleDelete = async (noteId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta nota?')) return;

        try {
            await api.delete(`/process-notes/${noteId}`);
            fetchNotes();
        } catch (error) {
            console.error('Erro ao excluir nota:', error);
        }
    };

    const getColorInfo = (color: string) => {
        return NOTE_COLORS.find(c => c.key === color) || NOTE_COLORS[0];
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="bg-app-card border border-app-stroke rounded-2xl overflow-hidden">
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-app-stroke/10 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <h2 className="text-sm font-bold text-app-text-main flex items-center gap-2">
                    <StickyNote size={16} className="text-black" />
                    Anotações Rápidas
                    <span className="text-xs font-normal text-app-text-muted">
                        ({notes.length})
                    </span>
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                        className="p-1.5 bg-black/5 text-black rounded-lg hover:bg-black/10 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                    {expanded ? <ChevronUp size={16} className="text-app-text-muted" /> : <ChevronDown size={16} className="text-app-text-muted" />}
                </div>
            </div>

            {/* Notes Grid */}
            {expanded && (
                <div className="p-4 pt-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full" />
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-8 text-app-text-muted">
                            <StickyNote size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Nenhuma anotação.</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="mt-3 text-black font-bold text-sm hover:underline"
                            >
                                + Adicionar primeira nota
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {notes.map((note) => {
                                const colorInfo = getColorInfo(note.color);
                                return (
                                    <div
                                        key={note.id}
                                        className={clsx(
                                            "p-3 rounded-lg border-l-4 shadow-sm relative group transition-all",
                                            colorInfo.bg,
                                            colorInfo.border,
                                            note.isPinned && "ring-2 " + colorInfo.ring
                                        )}
                                    >
                                        {/* Actions */}
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleTogglePin(note)}
                                                className={clsx(
                                                    "p-1 rounded transition-colors",
                                                    note.isPinned ? "text-black bg-white/50" : "text-gray-500 hover:text-black"
                                                )}
                                                title={note.isPinned ? "Desafixar" : "Fixar"}
                                            >
                                                <Pin size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="p-1 rounded text-gray-500 hover:text-red-500 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>

                                        {/* Content - render mentions as clickable */}
                                        <p className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200 pr-12">
                                            {renderMentions(note.content)}
                                        </p>
                                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{formatDate(note.createdAt)}</span>
                                            {note.createdBy && <span>{note.createdBy}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Add Note Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Nova Anotação"
                footer={
                    <>
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-app-text-main hover:bg-app-stroke/30 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-black text-white hover:opacity-90 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Cor</label>
                        <div className="flex gap-2">
                            {NOTE_COLORS.map(color => (
                                <button
                                    key={color.key}
                                    onClick={() => setNewNote({ ...newNote, color: color.key })}
                                    className={clsx(
                                        "w-8 h-8 rounded-full transition-all",
                                        color.bg,
                                        newNote.color === color.key ? "ring-2 ring-offset-2 " + color.ring : "hover:scale-110"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app-text-muted mb-2">Conteúdo *</label>
                        <MentionInput
                            value={newNote.content}
                            onChange={(value) => setNewNote({ ...newNote, content: value })}
                            placeholder="Escreva sua nota... Use @nome para mencionar alguém"
                            rows={4}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
