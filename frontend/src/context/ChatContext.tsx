import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    channelId?: string;
    recipientId?: string;
    createdAt: string;
    fileName?: string;
    fileUrl?: string;
    fileSize?: string;
    fileType?: string;
    replyToId?: string;
    reactions?: string;
    isPinned?: boolean;
}

interface ChatUser {
    id: string;
    name: string;
    avatar?: string | null;
    tenantId: string;
}

interface ChatContextType {
    isConnected: boolean;
    onlineUsers: string[];
    messages: Message[];
    typingUsers: { [key: string]: string[] };
    connect: (user: ChatUser) => void;
    disconnect: () => void;
    joinChannel: (channelId: string) => void;
    leaveChannel: (channelId: string) => void;
    sendChannelMessage: (data: { channelId: string; senderId: string; senderName: string; senderAvatar?: string; content: string; fileName?: string; fileUrl?: string; fileSize?: string; fileType?: string }) => void;
    sendDirectMessage: (data: { senderId: string; senderName: string; senderAvatar?: string; recipientId: string; content: string; tenantId: string }) => void;
    sendTyping: (data: { channelId?: string; recipientId?: string; userId: string; userName: string; isTyping: boolean }) => void;
    togglePin: (messageId: string, channelId: string) => void;
    addReaction: (messageId: string, emoji: string, channelId: string) => void;
    clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<{ [key: string]: string[] }>({});

    // Initialize connection
    useEffect(() => {
        console.log('[ChatContext] User state changed:', user?.id, user?.name);
        if (!user) {
            console.log('[ChatContext] User is null, disconnecting socket');
            socketService.disconnect();
            return;
        }

        console.log('[ChatContext] Ensuring connection for user:', user.id);
        // Connect
        socketService.connect({
            id: user.id, // Ensure id is mapped to user.id
            name: user.name,
            avatar: user.avatar,
            tenantId: user.tenantId
        });


        // Current state
        setIsConnected(socketService.isConnected());

        // Listeners for Context State
        const onConnectionChange = (connected: boolean) => setIsConnected(connected);

        const onOnlineUsers = (users: { userId: string }[]) => {
            setOnlineUsers(users.map(u => u.userId));
        };
        const onUserOnline = ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => [...new Set([...prev, userId])]);
        };
        const onUserOffline = ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => prev.filter(id => id !== userId));
        };
        const onNewMessage = (message: Message) => {
            console.log('[ChatContext] New message:', message.id);
            setMessages(prev => [...prev, message]);
        };
        const onNewDirectMessage = (message: Message) => {
            setMessages(prev => [...prev, message]);
        };

        const onUserTyping = ({ channelId, userName, isTyping }: { channelId: string; userId: string; userName: string; isTyping: boolean }) => {
            setTypingUsers(prev => {
                const typing = prev[channelId] || [];
                if (isTyping) {
                    return { ...prev, [channelId]: [...new Set([...typing, userName])] };
                } else {
                    return { ...prev, [channelId]: typing.filter(n => n !== userName) };
                }
            });
        };

        const onUserTypingDirect = (_data: { userId: string; userName: string; isTyping: boolean }) => {
            // Logic for DM typing if needed, keeping simple for now
        };

        // Subscribe
        socketService.on('connectionChange', onConnectionChange);
        socketService.on('onlineUsers', onOnlineUsers);
        socketService.on('userOnline', onUserOnline);
        socketService.on('userOffline', onUserOffline);
        socketService.on('newMessage', onNewMessage);
        socketService.on('newDirectMessage', onNewDirectMessage);
        socketService.on('userTyping', onUserTyping);
        socketService.on('userTypingDirect', onUserTypingDirect);

        // Listener for message reactions
        const onMessageReaction = ({ messageId, reactions }: { messageId: string; reactions: string }) => {
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, reactions } : m
            ));
        };
        socketService.on('messageReaction', onMessageReaction);

        // Cleanup subscriptions
        return () => {
            socketService.off('connectionChange', onConnectionChange);
            socketService.off('onlineUsers', onOnlineUsers);
            socketService.off('userOnline', onUserOnline);
            socketService.off('userOffline', onUserOffline);
            socketService.off('newMessage', onNewMessage);
            socketService.off('newDirectMessage', onNewDirectMessage);
            socketService.off('userTyping', onUserTyping);
            socketService.off('userTypingDirect', onUserTypingDirect);
            socketService.off('messageReaction', onMessageReaction);
        };
    }, [user?.id]); // Only re-run if user changes

    const connect = useCallback((user: ChatUser) => {
        socketService.connect(user);
    }, []);

    const disconnect = useCallback(() => {
        socketService.disconnect();
    }, []);

    const joinChannel = useCallback((channelId: string) => {
        const socket = socketService.getSocket();
        if (socket?.connected) {
            socket.emit('joinChannel', { channelId });
        }
    }, []);

    const leaveChannel = useCallback((channelId: string) => {
        const socket = socketService.getSocket();
        if (socket?.connected) {
            socket.emit('leaveChannel', { channelId });
        }
    }, []);

    const sendChannelMessage = useCallback((data: any) => {
        const socket = socketService.getSocket();
        if (socket?.connected) {
            socket.emit('sendMessage', data);
        }
    }, []);

    const sendDirectMessage = useCallback((data: any) => {
        const socket = socketService.getSocket();
        if (socket?.connected) {
            socket.emit('sendDirectMessage', data);
        }
    }, []);

    const sendTyping = useCallback((data: any) => {
        const socket = socketService.getSocket();
        if (socket?.connected) {
            socket.emit(data.channelId ? 'typing' : 'typingDirect', data);
        }
    }, []);

    const togglePin = useCallback((messageId: string, channelId: string) => {
        const socket = socketService.getSocket();
        if (socket?.connected) {
            socket.emit('togglePin', { messageId, channelId });
        }
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const addReaction = useCallback((messageId: string, emoji: string, channelId: string) => {
        const socket = socketService.getSocket();
        if (socket?.connected && user) {
            socket.emit('addReaction', { messageId, userId: user.id, emoji, channelId });
        }
    }, [user]);

    return (
        <ChatContext.Provider value={{
            isConnected,
            onlineUsers,
            messages,
            typingUsers,
            connect,
            disconnect,
            joinChannel,
            leaveChannel,
            sendChannelMessage,
            sendDirectMessage,
            sendTyping,
            togglePin,
            addReaction,
            clearMessages
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
