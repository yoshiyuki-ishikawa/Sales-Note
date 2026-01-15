"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, Calendar as CalendarIcon, Download } from "lucide-react";

type Period = "daily" | "monthly";

interface DashboardProps {
    totalAmount: number;
    period: Period;
    onPeriodChange: (period: Period) => void;
    // Enhanced data: value + key (YYYY-MM-DD or YYYY-MM) + name (display)
    data: { name: string; value: number; key: string }[];
    onDayClick?: (key: string) => void;
    onExport?: () => void;
}

export function Dashboard({ totalAmount, period, onPeriodChange, data, onDayClick, onExport }: DashboardProps) {

    return (
        <div className="w-full max-w-md space-y-4 mb-6">
            {/* Header and Toggle */}
            <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground/80">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>売上状況</span>
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="ml-2 p-1.5 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                            aria-label="CSVエクスポート"
                            title="全データをCSVで保存"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                    )}
                </h2>

                <div className="flex bg-secondary/50 p-1 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => onPeriodChange("daily")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            period === "daily"
                                ? "bg-white dark:bg-card text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        今日
                    </button>
                    <button
                        onClick={() => onPeriodChange("monthly")}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            period === "monthly"
                                ? "bg-white dark:bg-card text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        今月
                    </button>
                </div>
            </div>

            {/* Main Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20">
                <div className="relative z-10">
                    <p className="text-blue-100 text-sm font-medium mb-1">
                        {period === "daily" ? "今日の売上" : "今月の売上"}
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tight">
                            ¥ {totalAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Decorative Circles */}
                <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-[-10px] left-[-10px] w-24 h-24 bg-white/5 rounded-full blur-xl" />
            </div>

            {/* Chart Section */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-4 h-48 shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={(state: any) => {
                            // Recharts click on chart background vs bar
                            if (state?.activePayload?.[0]?.payload?.key) {
                                onDayClick?.(state.activePayload[0].payload.key);
                            }
                        }}
                    >
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                            contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                background: "hsl(var(--popover))",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                            }}
                        />
                        <Bar
                            dataKey="value"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 4, 4]}
                            barSize={20}
                            className="fill-primary cursor-pointer transition-all hover:opacity-80 active:opacity-60"
                            isAnimationActive={false}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            onClick={(data: any) => {
                                if (data?.key) {
                                    onDayClick?.(data.key);
                                }
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
