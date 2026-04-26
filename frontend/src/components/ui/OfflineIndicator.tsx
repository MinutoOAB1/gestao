import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Shows a banner when the user goes offline and hides when they reconnect.
 */
export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => {
            setIsOffline(false);
            setShowReconnected(true);
            setTimeout(() => setShowReconnected(false), 3000);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline && !showReconnected) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-xs font-black uppercase tracking-widest transition-all duration-500 shadow-2xl ${
                isOffline
                    ? 'bg-rose-600 text-white'
                    : 'bg-primary text-white'
            }`}
        >
            {isOffline ? (
                <>
                    <WifiOff size={16} />
                    <span>Sem conexão com a internet</span>
                </>
            ) : (
                <>
                    <Wifi size={16} />
                    <span>Conexão restabelecida</span>
                </>
            )}
        </div>
    );
}
