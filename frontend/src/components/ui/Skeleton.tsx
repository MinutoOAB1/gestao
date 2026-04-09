import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Skeleton loading placeholder with shimmer effect
 */
export function Skeleton({
    variant = 'text',
    width,
    height,
    animation = 'shimmer',
    className,
    style,
    ...props
}: SkeletonProps) {
    const baseClasses = 'bg-app-stroke/50 relative overflow-hidden';

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-none',
        rounded: 'rounded-xl',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        shimmer: 'skeleton-shimmer',
        none: '',
    };

    return (
        <div
            className={cn(
                baseClasses,
                variantClasses[variant],
                animationClasses[animation],
                className
            )}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                ...style,
            }}
            {...props}
        />
    );
}

/**
 * Skeleton card for client/process lists
 */
export function SkeletonCard() {
    return (
        <div className="bg-app-card rounded-xl border border-app-stroke p-4 space-y-3">
            <div className="flex items-center gap-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
            <div className="space-y-2 pl-16">
                <Skeleton width="70%" height={12} />
                <Skeleton width="50%" height={12} />
            </div>
            <Skeleton variant="rounded" width="100%" height={40} />
        </div>
    );
}

/**
 * Skeleton for stats cards
 */
export function SkeletonStatsCard() {
    return (
        <div className="bg-app-card rounded-xl border border-app-stroke p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-start">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton width={60} height={20} />
            </div>
            <Skeleton width="50%" height={28} />
            <Skeleton width="80%" height={12} />
        </div>
    );
}

/**
 * Skeleton for dashboard quick actions
 */
export function SkeletonQuickActions() {
    return (
        <div className="grid grid-cols-4 gap-2 sm:gap-4 px-1 sm:px-2">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton variant="rounded" width={44} height={44} className="sm:w-14 sm:h-14" />
                    <Skeleton width={40} height={10} />
                </div>
            ))}
        </div>
    );
}

/**
 * Full dashboard skeleton
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton width={200} height={24} />
                    <Skeleton width={150} height={16} />
                </div>
                <Skeleton variant="circular" width={40} height={40} />
            </div>

            {/* Financial Summary */}
            <div className="bg-app-card rounded-2xl border border-app-stroke p-5 space-y-4">
                <div className="flex justify-between">
                    <Skeleton width={120} height={20} />
                    <Skeleton width={80} height={24} />
                </div>
                <Skeleton variant="rounded" width="100%" height={80} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-app-card rounded-xl border border-app-stroke p-3 sm:p-4 text-center space-y-2">
                        <Skeleton width="60%" height={24} className="mx-auto" />
                        <Skeleton width="40%" height={12} className="mx-auto" />
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <SkeletonQuickActions />

            {/* Deadlines */}
            <div className="space-y-3">
                <Skeleton width={120} height={18} />
                {[...Array(3)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    );
}

/**
 * List skeleton for clients/processes
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
