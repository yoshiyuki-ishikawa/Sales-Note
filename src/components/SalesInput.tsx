"use client";

import { useState } from "react";
import { Calendar, CircleCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesInputProps {
    onSave: (data: { date: string; amount: number; memo: string }) => Promise<void>;
}

export function SalesInput({ onSave }: SalesInputProps) {
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        setIsSubmitting(true);
        // Mimic quick save
        await onSave({ date, amount: Number(amount), memo });

        setIsSubmitting(false);
        setIsSuccess(true);
        setAmount("");
        setMemo("");

        // Reset success state after 2s
        setTimeout(() => setIsSuccess(false), 2000);
    };

    return (
        <div className="w-full max-w-md p-6 bg-card rounded-3xl shadow-sm border border-border/50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Input - Size matters for speed */}
                <div className="space-y-2">
                    <label htmlFor="amount" className="text-sm font-medium text-muted-foreground block text-center">
                        売上金額
                    </label>
                    <div className="relative flex items-center justify-center">
                        <span className="text-3xl font-bold text-muted-foreground absolute left-4">¥</span>
                        <input
                            id="amount"
                            type="number"
                            inputMode="numeric"
                            pattern="\d*"
                            placeholder="0"
                            required
                            className="w-full bg-secondary/30 text-center text-4xl font-bold py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted/20"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>

                {/* Date & Memo Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">日付</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                            <input
                                type="date"
                                required
                                className="w-full pl-9 pr-3 py-2 bg-secondary/30 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">メモ (任意)</label>
                        <input
                            type="text"
                            placeholder="ランチ, A社など"
                            className="w-full px-3 py-2 bg-secondary/30 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                        />
                    </div>
                </div>

                {/* Action Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || !amount}
                    className={cn(
                        "w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98]",
                        isSuccess
                            ? "bg-green-500 hover:bg-green-600 shadow-green-500/20"
                            : "bg-primary hover:bg-primary/90",
                        !amount && "opacity-50 cursor-not-allowed shadow-none"
                    )}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : isSuccess ? (
                        <span className="flex items-center justify-center gap-2">
                            <CircleCheck className="h-6 w-6" />
                            保存しました
                        </span>
                    ) : (
                        "記録する"
                    )}
                </button>
            </form>
        </div>
    );
}
