import { useState, useRef } from 'react';
import { clsx } from 'clsx';
import api from '../../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
}

export default function MentionInput({
    value,
    onChange,
    placeholder = 'Digite aqui... Use @ para mencionar alguém',
    className = '',
    rows = 4
}: MentionInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStart, setMentionStart] = useState(-1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const searchUsers = async (query: string) => {
        if (query.length < 1) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/auth/users/search?q=${encodeURIComponent(query)}`);
            setSuggestions(res.data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const cursor = e.target.selectionStart || 0;
        onChange(text);

        // Find @ symbol before cursor
        const beforeCursor = text.substring(0, cursor);
        const atMatch = beforeCursor.match(/@(\w*)$/);

        if (atMatch) {
            const query = atMatch[1];
            setMentionStart(cursor - query.length - 1);
            setShowSuggestions(true);
            setSelectedIndex(0);
            searchUsers(query);
        } else {
            setShowSuggestions(false);
            setMentionStart(-1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' && showSuggestions) {
            e.preventDefault();
            selectUser(suggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const selectUser = (user: User) => {
        if (mentionStart === -1 || !textareaRef.current) return;

        const cursor = textareaRef.current.selectionStart || 0;
        const beforeMention = value.substring(0, mentionStart);
        const afterCursor = value.substring(cursor);

        // Format: @[Name](userId)
        const mention = `@[${user.name}](${user.id}) `;
        const newValue = beforeMention + mention + afterCursor;

        onChange(newValue);
        setShowSuggestions(false);
        setMentionStart(-1);
        setSuggestions([]);

        // Set cursor after the inserted mention
        setTimeout(() => {
            if (textareaRef.current) {
                const newCursor = beforeMention.length + mention.length;
                textareaRef.current.setSelectionRange(newCursor, newCursor);
                textareaRef.current.focus();
            }
        }, 0);
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'Administrador';
            case 'LAWYER': return 'Advogado';
            case 'PARTNER': return 'Parceiro';
            case 'INTERN': return 'Estagiário';
            default: return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'text-red-400';
            case 'LAWYER': return 'text-blue-400';
            case 'PARTNER': return 'text-purple-400';
            case 'INTERN': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={rows}
                className={clsx(
                    "w-full bg-app-bg border border-app-stroke rounded-lg px-4 py-2.5 text-app-text-main focus:border-primary outline-none transition-colors resize-none",
                    className
                )}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-app-card border border-app-stroke rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                    {loading ? (
                        <div className="p-3 text-center text-app-text-muted text-sm">
                            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="p-3 text-center text-app-text-muted text-sm">
                            Nenhum usuário encontrado
                        </div>
                    ) : (
                        suggestions.map((user, index) => (
                            <div
                                key={user.id}
                                onClick={() => selectUser(user)}
                                className={clsx(
                                    "p-3 cursor-pointer flex items-center gap-3 transition-colors",
                                    index === selectedIndex ? "bg-primary/10" : "hover:bg-app-stroke/20"
                                )}
                            >
                                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-bold text-sm">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-app-text-main truncate">
                                        {user.name}
                                    </p>
                                    <p className={clsx("text-xs", getRoleColor(user.role))}>
                                        {getRoleLabel(user.role)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Helper text */}
            <p className="text-[10px] text-app-text-muted mt-1">
                Use <span className="font-mono bg-app-stroke/30 px-1 rounded">@</span> para mencionar colaboradores
            </p>
        </div>
    );
}

// Utility to render text with clickable mentions
export function renderMentions(text: string) {
    // Split by mention pattern @[Name](userId)
    const parts = text.split(/(@\[[^\]]+\]\([a-f0-9-]+\))/g);

    return parts.map((part, i) => {
        const match = part.match(/@\[([^\]]+)\]\(([a-f0-9-]+)\)/);
        if (match) {
            const name = match[1];
            return (
                <span
                    key={i}
                    className="text-primary font-medium cursor-pointer hover:underline"
                    title={`Ver perfil de ${name}`}
                >
                    @{name}
                </span>
            );
        }
        return part;
    });
}
