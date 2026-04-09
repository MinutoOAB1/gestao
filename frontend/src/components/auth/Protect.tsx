import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

interface ProtectProps {
    roles: string[];
    children: ReactNode;
    fallback?: ReactNode;
}

export function Protect({ roles, children, fallback = null }: ProtectProps) {
    const { user } = useAuth();

    if (!user || !roles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
