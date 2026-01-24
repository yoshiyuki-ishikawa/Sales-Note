import React from 'react';

export function TitleBar() {
    return (
        <div
            data-tauri-drag-region
            className="h-8 w-full bg-background border-b border-border flex items-center justify-center fixed top-0 left-0 z-50 select-none"
        >
            <span className="text-[10px] font-semibold text-muted-foreground pointer-events-none">
                Sales Note
            </span>
        </div>
    );
}
