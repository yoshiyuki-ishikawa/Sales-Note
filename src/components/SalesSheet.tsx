"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Edit2, Check, Clock, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Sale = {
    id: string;
    date: string;
    amount: number;
    memo: string;
    timestamp: number;
};

interface SalesSheetProps {
    isOpen: boolean;
    date: string | null;
    items: Sale[]; // Filtered items for this day
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Sale>) => void;
    onDelete: (id: string) => void;
}

export function SalesSheet({ isOpen, date, items, onClose, onUpdate, onDelete }: SalesSheetProps) {
    const [editingId, setEditingId] = useState<string | null>(null);

    // Reset edit state when sheet closes or date changes
    useEffect(() => {
        if (!isOpen) setEditingId(null);
    }, [isOpen, date]);

    if (!isOpen || !date) return null;

    // Format Date: "YYYY-MM-DD" -> "MM/DD (Day)"
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short"
    });

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={cn(
                    "fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[80vh] flex flex-col safe-area-bottom",
                    isOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Daily Total
                        </p>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-xl font-bold">{formattedDate}</h3>
                            <span className="text-xl font-bold text-primary">¥ {total.toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-colors"
                        aria-label="閉じる"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto p-4 space-y-3 pb-8">
                    {items.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            記録はありません
                        </div>
                    ) : (
                        items
                            .sort((a, b) => b.timestamp - a.timestamp) // Newest first
                            .map((item) => (
                                <div key={item.id}>
                                    {editingId === item.id ? (
                                        <EditForm
                                            item={item}
                                            onSave={(updates) => {
                                                onUpdate(item.id, updates);
                                                setEditingId(null);
                                            }}
                                            onCancel={() => setEditingId(null)}
                                        />
                                    ) : (
                                        <div
                                            className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-transparent hover:border-border/50 transition-all group"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(item.timestamp).toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex items-baseline justify-between pr-4">
                                                    <span className="font-medium text-foreground/80 truncate max-w-[120px]">
                                                        {item.memo || "（メモなし）"}
                                                    </span>
                                                    <span className="text-lg font-bold">
                                                        ¥ {item.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions: Primary=Delete, Secondary=Edit */}
                                            <div className="flex items-center gap-1 pl-2 border-l border-border/50">
                                                <button
                                                    onClick={() => setEditingId(item.id)}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                                                    aria-label="編集"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm("この記録を削除しますか？")) {
                                                            onDelete(item.id);
                                                        }
                                                    }}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                                                    aria-label="削除"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                    )}
                </div>
            </div>
        </>
    );
}

function EditForm({ item, onSave, onCancel }: { item: Sale, onSave: (u: Partial<Sale>) => void, onCancel: () => void }) {
    const [amount, setAmount] = useState(item.amount.toString());
    const [memo, setMemo] = useState(item.memo);

    return (
        <div className="p-4 bg-background border-2 border-primary/20 rounded-2xl space-y-3 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground ml-1">金額</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 bg-secondary/50 rounded-xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground ml-1">メモ</label>
                    <input
                        type="text"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        className="w-full p-2 bg-secondary/50 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary rounded-xl transition-colors"
                >
                    キャンセル
                </button>
                <button
                    onClick={() => onSave({ amount: Number(amount), memo })}
                    className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Check className="h-4 w-4" />
                    保存
                </button>
            </div>
        </div>
    );
}
