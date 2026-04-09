import { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageSquare, X, Search, Hash, Plus, Settings, Send,
    Paperclip, Smile, AtSign, Bold, Italic, List, Link,
    Download, File, Pin, FolderOpen, Trash2, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';

interface Channel {
    id: string;
    name: string;
    type: string;
    processId?: string;
    hasUnread?: boolean;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    channelId?: string;
    recipientId?: string;
    fileName?: string;
    fileUrl?: string;
    fileSize?: string;
    fileType?: string;
    createdAt: string;
    reactions?: string; // JSON string
    isPinned?: boolean;
}

interface Process {
    id: string;
    number: string;
    title: string;
    client?: { name: string } | string;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
}

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

type ChatMode = 'channel' | 'direct';

export default function ChatDrawer({ isOpen, onClose }: ChatDrawerProps) {
    const { user } = useAuth();
    const chat = useChat();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [selectedDMUser, setSelectedDMUser] = useState<TeamMember | null>(null);
    const [chatMode, setChatMode] = useState<ChatMode>('channel');
    const [localMessages, setLocalMessages] = useState<Message[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMentionPicker, setShowMentionPicker] = useState(false);
    const [showNewChannelModal, setShowNewChannelModal] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');

    // Header Tool States
    const [showSearch, setShowSearch] = useState(false);
    const [showFiles, setShowFiles] = useState(false);
    const [showPinned, setShowPinned] = useState(false);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [showProcessPicker, setShowProcessPicker] = useState(false);
    const [showAddCaseModal, setShowAddCaseModal] = useState(false);

    // Processes state
    const [processes, setProcesses] = useState<Process[]>([]);
    const [legalCases, setLegalCases] = useState<any[]>([]);

    useEffect(() => {
        fetchProcesses();
    }, []);

    const fetchProcesses = async () => {
        try {
            const res = await api.get('/processes');
            const loadedProcesses = res.data || [];

            // Map for "Link Process" list
            setProcesses(loadedProcesses);

            // Map for Sidebar "Legal Cases"
            const cases = loadedProcesses.map((p: any) => ({
                id: p.id,
                title: `${p.number} - ${p.title}`,
                hasUnread: false // Default to false as we don't have this data yet
            }));
            setLegalCases(cases);
        } catch (error) {
            console.error("Error fetching processes:", error);
        }
    };

    const notificationSound = useRef<HTMLAudioElement | null>(null);

    // Initialize sound
    useEffect(() => {
        notificationSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Simple beep
    }, []);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const quickEmojis = ['👍', '❤️', '😂', '🎉', '🙏', '👏', '🔥', '✅'];

    // Note: Socket connection is handled automatically by ChatProvider when user is authenticated
    // No need to call chat.connect() here

    // Load channels and team members on open
    useEffect(() => {
        if (isOpen) {
            loadChannels();
            loadTeamMembers();
        }
    }, [isOpen]);

    // Join channel when selected
    useEffect(() => {
        if (selectedChannel && chat.isConnected && chatMode === 'channel') {
            chat.joinChannel(selectedChannel.id);
            loadChannelMessages(selectedChannel.id);
        }
    }, [selectedChannel?.id, chat.isConnected, chatMode]);

    // Load DM messages when user selected
    useEffect(() => {
        if (selectedDMUser && chatMode === 'direct') {
            loadDirectMessages(selectedDMUser.id);
        }
    }, [selectedDMUser?.id, chatMode]);

    // Sync incoming messages from context to local state
    useEffect(() => {
        if (chat.messages.length > 0) {
            const lastMessage = chat.messages[chat.messages.length - 1];
            // Check if this message belongs to current conversation
            if (chatMode === 'channel' && selectedChannel && lastMessage.channelId === selectedChannel.id) {
                setLocalMessages(prev => {
                    if (prev.some(m => m.id === lastMessage.id)) return prev;
                    return [...prev, lastMessage];
                });
                setTimeout(scrollToBottom, 100);
            } else if (chatMode === 'direct' && selectedDMUser) {
                if (lastMessage.senderId === selectedDMUser.id || lastMessage.recipientId === selectedDMUser.id) {
                    setLocalMessages(prev => {
                        if (prev.some(m => m.id === lastMessage.id)) return prev;
                        return [...prev, lastMessage];
                    });
                    setTimeout(scrollToBottom, 100);
                }
            }

            // Play sound on mention
            if (user && lastMessage.content.includes(`@${user.name}`) && lastMessage.senderId !== user.id) {
                notificationSound.current?.play().catch(e => console.error("Error playing sound:", e));
            }
        }
    }, [chat.messages.length]);

    const loadChannels = async () => {
        try {
            const res = await api.get('/chat/channels');
            let loadedChannels = res.data || [];
            if (!loadedChannels.find((c: Channel) => c.name === 'Geral')) {
                try {
                    const generalRes = await api.get('/chat/channels/general/Geral');
                    loadedChannels = [generalRes.data, ...loadedChannels];
                } catch { /* ignore */ }
            }
            if (!loadedChannels.find((c: Channel) => c.name === 'Financeiro')) {
                try {
                    const financeRes = await api.get('/chat/channels/general/Financeiro');
                    loadedChannels = [...loadedChannels, financeRes.data];
                } catch { /* ignore */ }
            }
            setChannels(loadedChannels);
            if (loadedChannels.length > 0 && !selectedChannel) {
                setSelectedChannel(loadedChannels[0]);
            }
        } catch (error) {
            console.error('Error loading channels:', error);
        }
    };

    const loadTeamMembers = async () => {
        try {
            const res = await api.get('/chat/team');
            setTeamMembers(res.data || []);
        } catch (error) {
            console.error('Error loading team:', error);
        }
    };

    const loadChannelMessages = async (channelId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/chat/channels/${channelId}/messages`);
            setLocalMessages((res.data || []).reverse());
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error loading messages:', error);
            setLocalMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const loadDirectMessages = async (otherUserId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/chat/dm/${otherUserId}`);
            setLocalMessages((res.data || []).reverse());
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Error loading DMs:', error);
            setLocalMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = useCallback(() => {
        if (!newMessage.trim() || !chat.isConnected || !user) return;

        if (chatMode === 'channel' && selectedChannel) {
            chat.sendChannelMessage({
                channelId: selectedChannel.id,
                senderId: user.id,
                senderName: user.name,
                senderAvatar: user.avatar || undefined,
                content: newMessage.trim(),
            });
        } else if (chatMode === 'direct' && selectedDMUser) {
            chat.sendDirectMessage({
                senderId: user.id,
                senderName: user.name,
                senderAvatar: user.avatar || undefined,
                recipientId: selectedDMUser.id,
                content: newMessage.trim(),
                tenantId: user.tenantId,
            });
        }
        setNewMessage('');
    }, [newMessage, chat.isConnected, selectedChannel, selectedDMUser, chatMode, user]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTyping = () => {
        if (!chat.isConnected || !user) return;
        chat.sendTyping({
            channelId: chatMode === 'channel' ? selectedChannel?.id : undefined,
            recipientId: chatMode === 'direct' ? selectedDMUser?.id : undefined,
            userId: user.id,
            userName: user.name,
            isTyping: true,
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            chat.sendTyping({
                channelId: chatMode === 'channel' ? selectedChannel?.id : undefined,
                recipientId: chatMode === 'direct' ? selectedDMUser?.id : undefined,
                userId: user.id,
                userName: user.name,
                isTyping: false,
            });
        }, 2000);
    };

    const selectDirectMessage = (member: TeamMember) => {
        setChatMode('direct');
        setSelectedDMUser(member);
        setSelectedChannel(null);
        setLocalMessages([]);
        chat.clearMessages();
    };

    const selectChannel = (channel: Channel) => {
        setChatMode('channel');
        setSelectedChannel(channel);
        setSelectedDMUser(null);
        setLocalMessages([]);
        chat.clearMessages();
        // Reset panels
        setShowSearch(false);
        setShowFiles(false);
        setShowPinned(false);
    };

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        try {
            const res = await api.post('/chat/channels', { name: newChannelName.trim(), type: 'GENERAL' });
            setChannels(prev => [...prev, res.data]);
            setNewChannelName('');
            setShowNewChannelModal(false);
            selectChannel(res.data);
        } catch (error) {
            console.error('Error creating channel:', error);
        }
    };

    const handleDeleteChannel = async (e: React.MouseEvent, channelId: string) => {
        e.stopPropagation();
        if (!window.confirm('Tem certeza que deseja excluir este chat? Todas as mensagens serão perdidas.')) return;

        try {
            await api.delete(`/chat/channels/${channelId}`);
            setChannels(prev => prev.filter(c => c.id !== channelId));
            if (selectedChannel?.id === channelId) {
                setSelectedChannel(null);
                setLocalMessages([]);
            }
        } catch (error) {
            console.error('Error deleting channel:', error);
            alert('Erro ao excluir chat. Verifique suas permissões.');
        }
    };

    const handleSelectProcess = async (process: Process) => {
        // 1. Check if channel exists for this process
        let channel = channels.find(c => c.processId === process.id);

        // 2. If not, create it
        if (!channel) {
            try {
                const clientName = typeof process.client === 'object' ? process.client?.name : process.client;
                const channelName = `${process.number} - ${clientName || 'Cliente'}`; // Use number + client for better ID

                const res = await api.post('/chat/channels', {
                    name: channelName,
                    type: 'PROCESS',
                    processId: process.id
                });
                channel = res.data;
                setChannels(prev => [...prev, channel!]);
            } catch (error) {
                console.error('Error creating process channel:', error);
                // Optionally try to find by name match or show error
                return;
            }
        }

        // 3. Select the channel
        if (channel) {
            selectChannel(channel);
            setShowAddCaseModal(false);
        }
    };

    const formatText = (format: 'bold' | 'italic' | 'list') => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = newMessage.substring(start, end);
        let formattedText = '';
        switch (format) {
            case 'bold': formattedText = `**${selectedText}**`; break;
            case 'italic': formattedText = `_${selectedText}_`; break;
            case 'list': formattedText = `\n- ${selectedText}`; break;
        }
        setNewMessage(prev => prev.substring(0, start) + formattedText + prev.substring(end));
    };

    const addEmoji = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const addMention = (member: TeamMember) => {
        setNewMessage(prev => {
            const words = prev.split(' ');
            const lastWord = words.pop() || '';
            if (lastWord.startsWith('@')) {
                return [...words, `@${member.name} `].join(' ');
            }
            return prev + `@${member.name} `;
        });
        setShowMentionPicker(false);
        // Focus back logic if needed, but usually maintained by React
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) textarea.focus();
    };

    const addProcessLink = (process: Process) => {
        const clientName = typeof process.client === 'object' ? process.client?.name : process.client;
        setNewMessage(prev => prev + `Processo: ${process.number} (${clientName || 'Cliente'}) `);
        setShowProcessPicker(false);
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textarea) textarea.focus();
    };

    const handlePinMessage = (messageId: string) => {
        if (selectedChannel) {
            chat.togglePin(messageId, selectedChannel.id);
        }
    };

    const handleFileAttach = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Reset input so the same file can be re-selected
        e.target.value = '';

        // Validate file size (25MB max)
        if (file.size > 25 * 1024 * 1024) {
            alert('O arquivo é muito grande. O tamanho máximo é 25MB.');
            return;
        }

        try {
            // Create FormData for upload
            const formData = new FormData();
            formData.append('file', file);

            // Upload file to backend
            const uploadRes = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const { fileName, fileUrl, fileSize, fileType } = uploadRes.data;

            // Send message with file attachment via socket
            if (chatMode === 'channel' && selectedChannel) {
                chat.sendChannelMessage({
                    channelId: selectedChannel.id,
                    senderId: user.id,
                    senderName: user.name,
                    senderAvatar: user.avatar || undefined,
                    content: `📎 Arquivo compartilhado: ${fileName}`,
                    fileName,
                    fileUrl,
                    fileSize,
                    fileType,
                });
            } else if (chatMode === 'direct' && selectedDMUser) {
                chat.sendDirectMessage({
                    senderId: user.id,
                    senderName: user.name,
                    senderAvatar: user.avatar || undefined,
                    recipientId: selectedDMUser.id,
                    content: `📎 Arquivo compartilhado: ${fileName}`,
                    tenantId: user.tenantId,
                });
            }
        } catch (error: any) {
            console.error('Erro no upload:', error);
            const errorMessage = error.response?.data?.message || 'Erro ao enviar arquivo. Tente novamente.';
            alert(errorMessage);
        }
    };

    const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formatDateSeparator = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Hoje';
        if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const getOnlineCount = () => teamMembers.filter(m => chat.onlineUsers.includes(m.id)).length;
    const getUserStatus = (userId: string) => chat.onlineUsers.includes(userId) ? 'online' : 'offline';
    const getStatusColor = (status: string) => status === 'online' ? 'bg-green-500' : 'bg-gray-400';
    const currentTypingKey = chatMode === 'channel' ? selectedChannel?.id || '' : `dm_${selectedDMUser?.id || ''}`;
    const currentTyping = chat.typingUsers[currentTypingKey] || [];
    const getChatTitle = () => chatMode === 'direct' && selectedDMUser ? selectedDMUser.name : selectedChannel?.name || 'Selecione um canal';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/30 z-40 lg:hidden" />
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed right-0 top-0 h-full w-full sm:w-[420px] lg:w-[900px] flex flex-col md:flex-row bg-white dark:bg-app-card border-l border-gray-200 dark:border-app-stroke shadow-2xl z-50">

                        {/* Sidebar */}
                        <div className="w-full md:w-80 flex flex-col border-r border-gray-200 dark:border-app-stroke bg-white dark:bg-app-card">
                            <div className="px-5 py-4 border-b border-gray-200 dark:border-app-stroke flex justify-between items-center">
                                <h2 className="text-gray-900 dark:text-white text-xl font-bold">Mensagens</h2>
                                <button onClick={() => setShowNewChannelModal(true)} className="text-gray-500 hover:text-primary transition-colors" title="Novo Canal"><Plus size={20} /></button>
                            </div>
                            {!chat.isConnected && <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-xs flex items-center gap-2"><div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>Conectando...</div>}
                            <div className="px-4 py-3">
                                <div className="flex w-full items-center rounded-lg bg-gray-100 dark:bg-app-bg border border-gray-200 dark:border-app-stroke focus-within:border-primary transition-colors">
                                    <div className="pl-3 text-gray-500"><Search size={18} /></div>
                                    <input className="w-full bg-transparent text-gray-900 dark:text-white text-sm px-3 py-2.5 outline-none placeholder:text-gray-500" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
                                <div className="pt-2">
                                    <div onClick={() => setShowNewChannelModal(true)} className="flex items-center justify-between px-3 py-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                                        <span className="text-xs font-bold uppercase tracking-wider">Canais</span><Plus size={16} />
                                    </div>
                                    {channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((channel) => (
                                        <div key={channel.id} onClick={() => selectChannel(channel)} className={clsx("flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors group", chatMode === 'channel' && selectedChannel?.id === channel.id ? "bg-gray-100 dark:bg-app-bg border-l-2 border-primary shadow-sm" : "hover:bg-gray-50 dark:hover:bg-app-stroke/30 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white")}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Hash size={18} className={chatMode === 'channel' && selectedChannel?.id === channel.id ? "text-primary" : ""} />
                                                <span className={clsx("text-sm font-medium truncate", chatMode === 'channel' && selectedChannel?.id === channel.id ? "text-gray-900 dark:text-white" : "")}>{channel.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {channel.hasUnread && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                                                {user?.role === 'ADMIN' && (
                                                    <button onClick={(e) => handleDeleteChannel(e, channel.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all" title="Excluir Chat">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4">
                                    <div onClick={() => setShowAddCaseModal(true)} className="flex items-center justify-between px-3 py-2 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded-lg">
                                        <span className="text-xs font-bold uppercase tracking-wider">Casos Jurídicos</span><Plus size={16} />
                                    </div>
                                    {legalCases
                                        .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .filter(kase => channels.some(chan => chan.processId === kase.id))
                                        .map((kase) => {
                                            // Check if this case describes the currently selected channel
                                            const isSelected = selectedChannel?.processId === kase.id;
                                            const fullProcess = processes.find(p => p.id === kase.id);
                                            // Fallback if not found (shouldn't happen)
                                            const processToUse = fullProcess || { id: kase.id, number: kase.title.split(' - ')[0], title: kase.title.split(' - ')[1] || '', client: 'Cliente' } as Process;

                                            return (
                                                <div key={kase.id} onClick={() => handleSelectProcess(processToUse)} className={clsx("flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors group", isSelected ? "bg-gray-100 dark:bg-app-bg border-l-2 border-primary shadow-sm" : "hover:bg-gray-50 dark:hover:bg-app-stroke/30 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white")}>
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <FolderOpen size={18} className={isSelected ? "text-primary" : ""} />
                                                        <span className={clsx("text-sm font-medium truncate", isSelected ? "text-gray-900 dark:text-white" : "")}>{kase.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {kase.hasUnread && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                                        {user?.role === 'ADMIN' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    // Find the channel first to delete it
                                                                    const channel = channels.find(c => c.processId === kase.id);
                                                                    if (channel) handleDeleteChannel(e, channel.id);
                                                                }}
                                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                                title="Excluir Chat"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                                <div className="pt-4">
                                    <div className="flex items-center justify-between px-3 py-2 text-gray-500"><span className="text-xs font-bold uppercase tracking-wider">Mensagens Diretas</span></div>
                                    {teamMembers.filter(m => m.id !== user?.id).filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).map((member) => {
                                        const status = getUserStatus(member.id);
                                        const isSelected = chatMode === 'direct' && selectedDMUser?.id === member.id;
                                        return (
                                            <div key={member.id} onClick={() => selectDirectMessage(member)} className={clsx("flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors", isSelected ? "bg-gray-100 dark:bg-app-bg border-l-2 border-primary shadow-sm" : "hover:bg-gray-50 dark:hover:bg-app-stroke/30")}>
                                                <div className="relative shrink-0">{member.avatar ? <div className="w-8 h-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${member.avatar})` }} /> : <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">{member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>}<span className={clsx("absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-app-card rounded-full", getStatusColor(status))} /></div>
                                                <div className="flex flex-col overflow-hidden"><span className="text-sm font-medium truncate text-gray-900 dark:text-white">{member.name}</span><span className="text-gray-500 text-xs truncate">{status === 'online' ? 'Online' : 'Offline'}</span></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="p-3 border-t border-gray-200 dark:border-app-stroke bg-gray-50 dark:bg-app-bg">
                                <div className="flex items-center gap-3 p-2 rounded-lg">
                                    <div className="relative">{user?.avatar ? <div className="w-9 h-9 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${user.avatar})` }} /> : <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">{user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>}<span className={clsx("absolute bottom-0 right-0 w-3 h-3 border-2 border-gray-50 dark:border-app-bg rounded-full", chat.isConnected ? "bg-green-500" : "bg-yellow-500")} /></div>
                                    <div className="flex flex-col"><span className="text-gray-900 dark:text-white text-sm font-bold">Você</span><span className="text-gray-500 text-xs">{chat.isConnected ? 'Online' : 'Conectando...'}</span></div>
                                    <button className="ml-auto text-gray-500 hover:text-gray-700 cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-app-stroke/50 transition-colors" title="Configurações"><Settings size={18} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-app-bg relative">
                            <header className="h-16 border-b border-gray-200 dark:border-app-stroke flex items-center justify-between px-6 bg-white dark:bg-app-card shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    {chatMode === 'direct' && selectedDMUser ? (
                                        <><div className="relative">{selectedDMUser.avatar ? <div className="w-8 h-8 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${selectedDMUser.avatar})` }} /> : <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">{selectedDMUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>}<span className={clsx("absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white", getStatusColor(getUserStatus(selectedDMUser.id)))} /></div><div><h3 className="text-gray-900 dark:text-white font-bold leading-tight">{selectedDMUser.name}</h3><p className="text-gray-500 text-xs">{getUserStatus(selectedDMUser.id) === 'online' ? 'Online' : 'Offline'}</p></div></>
                                    ) : (
                                        <><Hash size={22} className="text-gray-500" /><div><h3 className="text-gray-900 dark:text-white font-bold leading-tight">{getChatTitle()}</h3><p className="text-gray-500 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>{getOnlineCount()} online, {teamMembers.length} total</p></div></>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <button onClick={() => setShowSearch(!showSearch)} className={clsx("p-2 rounded-lg transition-colors", showSearch ? "bg-primary/10 text-primary" : "hover:bg-gray-100 dark:hover:bg-app-stroke/30")} title="Buscar"><Search size={18} /></button>
                                    <button onClick={() => { setShowFiles(!showFiles); setShowPinned(false); }} className={clsx("p-2 rounded-lg transition-colors", showFiles ? "bg-primary/10 text-primary" : "hover:bg-gray-100 dark:hover:bg-app-stroke/30")} title="Arquivos"><FolderOpen size={18} /></button>
                                    <button onClick={() => { setShowPinned(!showPinned); setShowFiles(false); }} className={clsx("p-2 rounded-lg transition-colors", showPinned ? "bg-primary/10 text-primary" : "hover:bg-gray-100 dark:hover:bg-app-stroke/30")} title="Fixados"><Pin size={18} /></button>
                                    <div className="h-6 w-px bg-gray-200 dark:bg-app-stroke mx-1"></div>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded-lg transition-colors hover:text-gray-700"><X size={18} /></button>
                                </div>
                            </header>

                            {/* Message Search Bar */}
                            {showSearch && (
                                <div className="px-6 py-3 bg-white dark:bg-app-card border-b border-gray-200 dark:border-app-stroke animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-app-bg px-3 py-2 rounded-lg">
                                        <Search size={16} className="text-gray-500" />
                                        <input
                                            autoFocus
                                            className="bg-transparent text-sm w-full outline-none text-gray-900 dark:text-white"
                                            placeholder="Filtrar mensagens..."
                                            value={messageSearchQuery}
                                            onChange={(e) => setMessageSearchQuery(e.target.value)}
                                        />
                                        {messageSearchQuery && <button onClick={() => setMessageSearchQuery('')}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-hidden flex relative">
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                                    ) : localMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500"><MessageSquare size={48} className="mb-4 opacity-30" /><p>Nenhuma mensagem ainda</p><p className="text-sm">Seja o primeiro a enviar uma mensagem!</p></div>
                                    ) : (
                                        <>
                                            {localMessages
                                                .filter(m => !messageSearchQuery || m.content.toLowerCase().includes(messageSearchQuery.toLowerCase()))
                                                .map((message, index) => {
                                                    const isMe = message.senderId === user?.id;
                                                    const showDateSeparator = index === 0 || formatDateSeparator(message.createdAt) !== formatDateSeparator(localMessages[index - 1].createdAt);
                                                    return (
                                                        <div key={message.id}>
                                                            {showDateSeparator && <div className="flex items-center justify-center my-2"><span className="bg-white dark:bg-app-card text-gray-500 text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-app-stroke shadow-sm">{formatDateSeparator(message.createdAt)}</span></div>}
                                                            <div className={clsx("flex gap-4 group", isMe && "flex-row-reverse")}>
                                                                <div className="shrink-0 mt-1">{message.senderAvatar ? <div className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200 dark:border-app-stroke" style={{ backgroundImage: `url(${message.senderAvatar})` }} /> : <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">{message.senderName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>}</div>
                                                                <div className={clsx("flex flex-col gap-1 max-w-[80%]", isMe && "items-end")}>
                                                                    <div className={clsx("flex items-baseline gap-2", isMe && "flex-row-reverse")}><span className="text-gray-900 dark:text-white text-sm font-bold">{isMe ? 'Você' : message.senderName}</span><span className="text-gray-500 text-xs">{formatTime(message.createdAt)}</span></div>
                                                                    <div className="group/msg relative">
                                                                        <div className={clsx("p-3 rounded-xl text-sm leading-relaxed shadow-sm", isMe ? "bg-primary text-white rounded-tr-none" : "bg-gray-100 dark:bg-app-card border border-gray-200 dark:border-app-stroke text-gray-900 dark:text-white rounded-tl-none")}>
                                                                            <p>{message.content}</p>
                                                                            {message.isPinned && <Pin size={12} className="absolute -top-1.5 -right-1 bg-yellow-400 text-white p-0.5 rounded-full shadow-sm" />}
                                                                        </div>
                                                                        {/* Reactions display */}
                                                                        {message.reactions && (() => {
                                                                            try {
                                                                                const reactions = JSON.parse(message.reactions);
                                                                                const reactionCount = Object.keys(reactions).length;
                                                                                return reactionCount > 0 ? (
                                                                                    <div className="flex gap-1 mt-1">
                                                                                        {Object.entries(reactions).map(([emoji, users]: [string, any]) => (
                                                                                            <span key={emoji} className="bg-gray-200 dark:bg-gray-700 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                                                                {emoji} <span className="text-gray-600 dark:text-gray-400">{Array.isArray(users) ? users.length : 1}</span>
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : null;
                                                                            } catch { return null; }
                                                                        })()}
                                                                        {/* Action buttons */}
                                                                        <div className={clsx("absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1", isMe ? "-left-16" : "-right-16")}>
                                                                            <button onClick={() => selectedChannel && chat.addReaction(message.id, '❤️', selectedChannel.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Curtir">
                                                                                <Heart size={14} className={clsx(message.reactions?.includes(user?.id || '') ? "text-red-500 fill-current" : "text-gray-400")} />
                                                                            </button>
                                                                            <button onClick={() => handlePinMessage(message.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title={message.isPinned ? "Desafixar" : "Fixar"}>
                                                                                <Pin size={14} className={clsx(message.isPinned ? "text-yellow-500 fill-current" : "text-gray-400")} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    {message.fileName && <div className="flex items-center gap-3 bg-white dark:bg-app-card border border-gray-200 dark:border-app-stroke p-3 rounded-lg mt-1 w-72"><div className="w-10 h-10 bg-red-500/10 rounded flex items-center justify-center shrink-0"><File size={20} className="text-red-500" /></div><div className="flex-1 overflow-hidden"><p className="text-gray-900 dark:text-white text-sm font-medium truncate">{message.fileName}</p><p className="text-gray-500 text-xs">{message.fileSize}</p></div><button className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"><Download size={18} /></button></div>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                    {currentTyping.length > 0 && <div className="flex gap-4 items-end pl-1"><div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-primary opacity-70" /></div><div className="flex gap-1 bg-white dark:bg-app-card px-3 py-2 rounded-full items-center border border-gray-200 dark:border-app-stroke shadow-sm"><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div><div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div></div><span className="text-xs text-gray-500">{currentTyping.join(', ')} está digitando...</span></div>}
                                </div>

                                {/* SIDE PANELS (Files / Pinned) - Overlay */}
                                {(showFiles || showPinned) && (
                                    <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white dark:bg-app-card border-l-2 border-gray-300 dark:border-app-stroke flex flex-col shadow-2xl z-30">
                                        <div className="p-4 border-b-2 border-gray-300 dark:border-app-stroke flex justify-between items-center bg-gray-50 dark:bg-app-bg">
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{showFiles ? 'Arquivos' : 'Mensagens Fixadas'}</h3>
                                            <button onClick={() => { setShowFiles(false); setShowPinned(false); }} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={20} className="text-gray-600 dark:text-gray-400" /></button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white dark:bg-app-bg">
                                            {showFiles && (
                                                localMessages.filter(m => m.fileName).length > 0 ? (
                                                    <div className="space-y-3">
                                                        {localMessages.filter(m => m.fileName).map(m => (
                                                            <div key={m.id} className="p-4 bg-gray-100 dark:bg-app-card rounded-xl border-2 border-gray-200 dark:border-app-stroke shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800"><File size={24} className="text-red-600 dark:text-red-400" /></div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{m.fileName}</p>
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{m.fileSize}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                                                                    <span className="font-medium">{m.senderName}</span>
                                                                    <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-500 mt-10"><File size={48} className="mx-auto mb-3 opacity-40" /><p className="font-medium">Nenhum arquivo compartilhado.</p></div>
                                                )
                                            )}

                                            {showPinned && (
                                                localMessages.filter(m => m.isPinned).length > 0 ? (
                                                    <div className="space-y-3">
                                                        {localMessages.filter(m => m.isPinned).map(m => (
                                                            <div key={m.id} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-sm">
                                                                <div className="flex items-start gap-3 mb-2">
                                                                    <div className="w-8 h-8 rounded-full bg-cover bg-center shrink-0 ring-2 ring-amber-300 dark:ring-amber-600" style={{ backgroundImage: `url(${m.senderAvatar || 'https://ui-avatars.com/api/?name=' + m.senderName})` }} />
                                                                    <div className="flex-1">
                                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{m.senderName}</span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{new Date(m.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3 mb-3 bg-white/50 dark:bg-black/20 p-2 rounded-lg">{m.content}</p>
                                                                <button onClick={() => handlePinMessage(m.id)} className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1 font-semibold"><Pin size={12} className="rotate-45" /> Desafixar</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-gray-500 mt-10">
                                                        <Pin size={32} className="mx-auto mb-2 opacity-30" />
                                                        <p>Nenhuma mensagem fixada.</p>
                                                        <p className="text-xs mt-2 text-gray-400">Clique com o botão direito na mensagem ou use o menu para fixar.</p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 pt-2 bg-gray-50 dark:bg-app-bg">
                                <div className="bg-white dark:bg-app-card border border-gray-200 dark:border-app-stroke rounded-xl focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-md flex flex-col">
                                    <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-app-stroke">
                                        <button onClick={() => formatText('bold')} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded transition-colors" title="Negrito"><Bold size={16} /></button>
                                        <button onClick={() => formatText('italic')} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded transition-colors" title="Itálico"><Italic size={16} /></button>
                                        <button onClick={() => formatText('list')} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded transition-colors" title="Lista"><List size={16} /></button>
                                        <div className="h-4 w-px bg-gray-200 dark:bg-app-stroke mx-1"></div>
                                        <button onClick={() => setShowProcessPicker(!showProcessPicker)} className={clsx("flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors", showProcessPicker ? "bg-primary text-white" : "text-primary bg-primary/10 hover:bg-primary/20")}><Link size={12} />Vincular Processo</button>
                                    </div>
                                    <textarea
                                        className="w-full bg-transparent text-gray-900 dark:text-white p-3 min-h-[60px] max-h-[200px] outline-none resize-none placeholder:text-gray-500 text-sm"
                                        placeholder={chatMode === 'direct' && selectedDMUser ? `Mensagem para ${selectedDMUser.name}...` : `Escreva uma mensagem para #${selectedChannel?.name || 'canal'}...`}
                                        value={newMessage}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setNewMessage(val);
                                            handleTyping();
                                            if (val.endsWith('@') || val.includes('@')) {
                                                const lastWord = val.split(' ').pop();
                                                if (lastWord && lastWord.startsWith('@')) {
                                                    setShowMentionPicker(true);
                                                } else {
                                                    setShowMentionPicker(false);
                                                }
                                            } else {
                                                setShowMentionPicker(false);
                                            }
                                        }}
                                        onKeyDown={handleKeyPress}
                                    />
                                    <div className="flex justify-between items-center p-2 pt-0 mt-auto">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded-lg transition-colors" title="Emoji"><Smile size={18} /></button>
                                            <button onClick={handleFileAttach} className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded-lg transition-colors" title="Anexar Arquivo"><Paperclip size={18} /></button>
                                            <button onClick={() => setShowMentionPicker(!showMentionPicker)} className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded-lg transition-colors" title="Mencionar"><AtSign size={18} /></button>
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                                        </div>
                                        <button onClick={handleSendMessage} className={clsx("p-2.5 rounded-lg transition-all shadow-md active:scale-95", newMessage.trim() && chat.isConnected ? "bg-primary text-white hover:bg-primary-dark shadow-primary/20" : "bg-gray-200 dark:bg-app-stroke text-gray-400 cursor-not-allowed")} disabled={!newMessage.trim() || !chat.isConnected}>
                                            <Send size={18} />
                                        </button>
                                    </div>
                                    
                                    {/* Mention Picker */}
                                    {showMentionPicker && (
                                        <div className="absolute left-4 bottom-[150px] w-64 bg-white dark:bg-app-card border border-gray-200 dark:border-app-stroke rounded-xl shadow-2xl z-20 animate-in slide-in-from-bottom-2">
                                            <div className="p-2 border-b border-gray-200 dark:border-app-stroke"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mencionar Pessoa</span></div>
                                            <div className="max-h-48 overflow-y-auto p-1">
                                                {teamMembers.map(member => (
                                                    <div key={member.id} onClick={() => addMention(member)} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded-lg cursor-pointer transition-colors">
                                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">{member.name.charAt(0)}</div>
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{member.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Emoji Picker Placeholder */}
                                    {showEmojiPicker && (
                                        <div className="absolute left-4 bottom-[150px] bg-white dark:bg-app-card border border-gray-200 dark:border-app-stroke rounded-xl shadow-2xl z-20 p-2 animate-in slide-in-from-bottom-2">
                                            <div className="grid grid-cols-4 gap-1">
                                                {quickEmojis.map(emoji => (
                                                    <button key={emoji} onClick={() => addEmoji(emoji)} className="p-2 hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded text-xl transition-transform hover:scale-125">{emoji}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Process Picker */}
                                    {showProcessPicker && (
                                        <div className="absolute left-4 bottom-[150px] w-72 bg-white dark:bg-app-card border border-gray-200 dark:border-app-stroke rounded-xl shadow-2xl z-20 animate-in slide-in-from-bottom-2">
                                            <div className="p-2 border-b border-gray-200 dark:border-app-stroke flex justify-between items-center"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vincular Processo</span><button onClick={() => setShowProcessPicker(false)}><X size={14} className="text-gray-400" /></button></div>
                                            <div className="max-h-48 overflow-y-auto p-1">
                                                {processes.length === 0 ? <p className="text-[10px] text-gray-400 text-center py-4">Nenhum processo encontrado</p> : processes.map(p => (
                                                    <div key={p.id} onClick={() => addProcessLink(p)} className="flex flex-col p-2 hover:bg-gray-100 dark:hover:bg-app-stroke/30 rounded-lg cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
                                                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.number}</span>
                                                        <span className="text-[10px] text-gray-500 truncate">{p.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 text-center">Use **negrito**, _itálico_ e @menções para formatar.</p>
                            </div>
                        </div>

                        {/* Modals */}
                        {showNewChannelModal && (
                            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-app-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-app-stroke">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Criar Novo Chat</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Nome do Chat</label>
                                            <input autoFocus className="w-full bg-gray-100 dark:bg-app-bg border border-gray-200 dark:border-app-stroke rounded-xl px-4 py-2.5 outline-none focus:border-primary text-gray-900 dark:text-white" placeholder="ex: Casos Complexos" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateChannel()} />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => setShowNewChannelModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-app-stroke rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-app-stroke/30 transition-colors">Cancelar</button>
                                            <button onClick={handleCreateChannel} className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">Criar Chat</button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {showAddCaseModal && (
                            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-app-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-app-stroke">
                                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-900 dark:text-white">Falar sobre um Processo</h3><button onClick={() => setShowAddCaseModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
                                    <p className="text-xs text-gray-500 mb-4">Selecione um processo para criar ou entrar no chat dedicado a ele.</p>
                                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {processes.map(p => (
                                            <div key={p.id} onClick={() => handleSelectProcess(p)} className="flex flex-col p-3 border border-gray-100 dark:border-app-stroke rounded-xl hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-all group">
                                                <div className="flex justify-between items-start"><span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{p.number}</span>{channels.some(c => c.processId === p.id) && <span className="bg-green-100 dark:bg-green-900/30 text-green-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold">CHAT ATIVO</span>}</div>
                                                <span className="text-xs text-gray-500 truncate">{p.title}</span>
                                            </div>
                                        ))}
                                        {processes.length === 0 && <p className="text-center py-10 text-gray-400 italic">Nenhum processo vinculado encontrado.</p>}
                                    </div>
                                </motion.div>
                            </div>
                        )}

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
