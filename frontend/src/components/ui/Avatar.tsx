import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    src?: string;
    alt?: string;
    name?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
    (
        {
            src,
            alt,
            name,
            size = 'md',
            status,
            className,
            ...props
        },
        ref
    ) => {
        const sizes = {
            sm: 'w-8 h-8 text-xs',
            md: 'w-10 h-10 text-sm',
            lg: 'w-12 h-12 text-base',
            xl: 'w-16 h-16 text-lg',
        };

        const statusSizes = {
            sm: 'w-2 h-2',
            md: 'w-2.5 h-2.5',
            lg: 'w-3 h-3',
            xl: 'w-4 h-4',
        };

        const statusColors = {
            online: 'bg-green-500',
            offline: 'bg-gray-400',
            busy: 'bg-red-500',
            away: 'bg-amber-500',
        };

        // Get initials from name
        const getInitials = (name: string) => {
            return name
                .split(' ')
                .map((word) => word.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2);
        };

        // Generate color from name
        const getColorFromName = (name: string) => {
            const colors = [
                'bg-blue-500',
                'bg-green-500',
                'bg-purple-500',
                'bg-amber-500',
                'bg-rose-500',
                'bg-cyan-500',
                'bg-indigo-500',
                'bg-teal-500',
            ];
            const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return colors[index % colors.length];
        };

        return (
            <div
                ref={ref}
                className={clsx(
                    'relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0',
                    sizes[size],
                    className
                )}
                {...props}
            >
                {src ? (
                    <img
                        src={src}
                        alt={alt || name || 'Avatar'}
                        className="w-full h-full object-cover"
                    />
                ) : name ? (
                    <div
                        className={clsx(
                            'w-full h-full flex items-center justify-center text-white font-semibold',
                            getColorFromName(name)
                        )}
                    >
                        {getInitials(name)}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-app-stroke text-app-text-muted">
                        <svg
                            className="w-1/2 h-1/2"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>
                )}
                {status && (
                    <span
                        className={clsx(
                            'absolute bottom-0 right-0 rounded-full border-2 border-app-card',
                            statusSizes[size],
                            statusColors[status]
                        )}
                    />
                )}
            </div>
        );
    }
);

Avatar.displayName = 'Avatar';

export { Avatar };
