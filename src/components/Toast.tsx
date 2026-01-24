import React, { useEffect, useState } from 'react';

type ToastProps = {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    type?: 'success' | 'error';
};

export function Toast({ message, isVisible, onClose, type = 'success' }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`fixed bottom-10 right-4 px-4 py-2 rounded-md shadow-lg text-xs font-medium animate-in fade-in slide-in-from-bottom-2 ${type === 'success' ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'
            }`}>
            {message}
        </div>
    );
}
