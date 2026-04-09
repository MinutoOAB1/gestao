import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

interface PrefetchLinkProps extends LinkProps {
    children: ReactNode;
    prefetchDelay?: number;
}

// Cache to avoid prefetching the same route multiple times
const prefetchedRoutes = new Set<string>();

/**
 * Link component that prefetches route data on hover/focus
 * Improves perceived navigation speed
 */
export function PrefetchLink({
    to,
    children,
    prefetchDelay = 100,
    onMouseEnter,
    onFocus,
    ...props
}: PrefetchLinkProps) {

    const prefetch = useCallback(() => {
        const path = typeof to === 'string' ? to : to.pathname || '';

        if (prefetchedRoutes.has(path)) return;

        // Mark as prefetched
        prefetchedRoutes.add(path);

        // Preload the route by creating a hidden link prefetch
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = path;
        document.head.appendChild(link);

        // For SPA, we can also warm the router cache by pre-navigating
        // This triggers any lazy-loaded components to start loading
        const prefetchTimer = setTimeout(() => {
            // Create a hidden iframe or use the router's preload if available
            // For now, we just mark it as prefetched
        }, prefetchDelay);

        return () => clearTimeout(prefetchTimer);
    }, [to, prefetchDelay]);

    const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            prefetch();
            onMouseEnter?.(e);
        },
        [prefetch, onMouseEnter]
    );

    const handleFocus = useCallback(
        (e: React.FocusEvent<HTMLAnchorElement>) => {
            prefetch();
            onFocus?.(e);
        },
        [prefetch, onFocus]
    );

    return (
        <Link
            to={to}
            onMouseEnter={handleMouseEnter}
            onFocus={handleFocus}
            {...props}
        >
            {children}
        </Link>
    );
}

export default PrefetchLink;
