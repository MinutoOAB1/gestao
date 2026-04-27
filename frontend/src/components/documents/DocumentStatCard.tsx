import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    subtext: string;
    color: string;
    delay?: number;
}

export const DocumentStatCard: React.FC<StatCardProps> = ({ 
    icon: Icon, 
    label, 
    value, 
    subtext, 
    color, 
    delay = 0 
}) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="bg-app-card border border-app-stroke rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 hover:shadow-lg transition-all group"
    >
        <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", color)}>
            <Icon size={24} className="text-white drop-shadow-sm" />
        </div>
        <div>
            <p className="text-app-text-muted text-xs font-medium uppercase tracking-wider mb-0.5">{label}</p>
            <h3 className="text-xl font-black text-app-text-main tracking-tight">{value}</h3>
            <p className="text-[10px] text-app-text-label mt-0.5 font-medium">{subtext}</p>
        </div>
    </motion.div>
);
