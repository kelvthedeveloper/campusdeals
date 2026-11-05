import { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps {
    children: ReactNode;
    className?: string;
    hoverable?: boolean;
}

export default function Card({ children, className, hoverable = false }: CardProps) {
    return (
        <div className={cn(
            'bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300',
            hoverable && 'hover:shadow-md hover:border-slate-300',
            className
        )}>
            {children}
        </div>
    );
}
