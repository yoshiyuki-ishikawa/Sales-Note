import React from 'react';

type StatusBarProps = {
    lastBackupTime?: string;
};

export function StatusBar({ lastBackupTime }: StatusBarProps) {
    return (
        <footer className="w-full bg-muted/30 border-t border-border py-1 px-4 flex justify-between items-center text-[10px] text-muted-foreground select-none">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium">Stored Locally (SQLite)</span>
            </div>
            <div>
                {lastBackupTime ? `Last Backup: ${lastBackupTime}` : 'Simulated Backup Running...'}
            </div>
        </footer>
    );
}
