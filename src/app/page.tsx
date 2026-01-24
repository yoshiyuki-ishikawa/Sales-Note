"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Dashboard } from "@/components/Dashboard";
import { SalesInput } from "@/components/SalesInput";
import { SalesSheet } from "@/components/SalesSheet";
import { StatusBar } from "@/components/StatusBar";
import { Toast } from "@/components/Toast";
import { downloadSalesAsCsv } from "@/lib/export";
import { Sale } from "@/lib/types";
import { salesRepository } from "@/lib/repositories/salesRepository";

type Period = "daily" | "monthly";

export default function Home() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<Period>("daily");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<{ msg: string; show: boolean; type: 'success' | 'error' }>({ msg: '', show: false, type: 'success' });
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, show: true, type });
  };

  // Load from SQLite
  useEffect(() => {
    const loadData = async () => {
      try {
        // 5秒のタイムアウトを設定
        const timeoutPromise = new Promise<Sale[]>((_, reject) =>
          setTimeout(() => reject(new Error("Loading timeout")), 5000)
        );

        const data = await Promise.race([
          salesRepository.getAll(),
          timeoutPromise
        ]);

        setSales(data);
      } catch (e) {
        console.error("Failed to load data", e);
        setError("データの読み込みに失敗しました。");
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const handleSave = async (data: { date: string; amount: number; memo: string }) => {
    const safeId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    const newSale: Sale = {
      id: safeId,
      ...data,
      timestamp: Date.now(),
    };

    try {
      const backupTime = await salesRepository.save(newSale);
      setLastBackupTime(backupTime);
      const latest = await salesRepository.getAll();
      startTransition(() => {
        setSales(latest);
      });
      showToast("保存完了 (Saved & Backed up)");
    } catch (e) {
      console.error("Failed to save", e);
      showToast("保存に失敗しました", "error");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Sale>) => {
    const current = sales.find(s => s.id === id);
    if (!current) return;

    const updatedSale = { ...current, ...updates };

    try {
      const backupTime = await salesRepository.update(updatedSale);
      setLastBackupTime(backupTime);
      const latest = await salesRepository.getAll();
      startTransition(() => {
        setSales(latest);
      });
      showToast("更新完了");
    } catch (e) {
      console.error("Failed to update", e);
      showToast("更新に失敗しました", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const backupTime = await salesRepository.delete(id);
      setLastBackupTime(backupTime);
      const latest = await salesRepository.getAll();
      startTransition(() => {
        setSales(latest);
      });
      showToast("削除完了");
    } catch (e) {
      console.error("Failed to delete", e);
      showToast("削除に失敗しました", "error");
    }
  };

  // ... (DayClick and Aggregation logic unchanged) ...
  const handleDayClick = (key: string) => {
    if (key.length >= 10) {
      setSelectedDate(key);
    }
  };

  // Aggregation Logic
  const { totalAmount, graphData } = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDate = today.toISOString().split("T")[0];

    if (period === "daily") {
      // Total: Today's sales
      const todaysSales = sales.filter((s) => s.date === currentDate);
      const total = todaysSales.reduce((sum, s) => sum + s.amount, 0);

      // Graph: Last 7 days
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];

        const value = sales
          .filter((s) => s.date === dateStr)
          .reduce((sum, s) => sum + s.amount, 0);

        data.push({
          name: d.toLocaleDateString("ja-JP", { weekday: "short" }),
          value,
          key: dateStr // Key for click event
        });
      }

      return { totalAmount: total, graphData: data };

    } else {
      // Total: This Month's sales
      const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
      const monthsSales = sales.filter((s) => s.date.startsWith(monthPrefix));
      const total = monthsSales.reduce((sum, s) => sum + s.amount, 0);

      // Graph: Last 6 months
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const key = `${y}-${m}`;

        const value = sales
          .filter((s) => s.date.startsWith(key))
          .reduce((sum, s) => sum + s.amount, 0);

        data.push({
          name: `${d.getMonth() + 1}月`,
          value,
          key: key
        });
      }

      return { totalAmount: total, graphData: data };
    }
  }, [sales, period]);

  // Filter items for the sheet
  const sheetItems = useMemo(() => {
    if (!selectedDate) return [];
    return sales.filter(s => s.date === selectedDate);
  }, [sales, selectedDate]);

  const handleExport = () => {
    if (sales.length === 0) return;
    if (confirm("全データをCSV形式でダウンロードしますか？")) {
      downloadSalesAsCsv(sales);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 px-4 text-center">
        <div className="text-destructive text-4xl mb-2">⚠️</div>
        <p className="text-destructive font-bold text-lg">{error}</p>
        <p className="text-muted-foreground text-sm">
          データベースの読み込みに時間がかかっているか、エラーが発生しました。
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="w-full max-w-lg min-h-screen px-4 py-8 flex flex-col gap-6 relative mx-auto">

      {/* App Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sales Note</h1>
        <p className="text-sm text-muted-foreground">
          日々の売上を、誰でも簡単に記録できます
        </p>
      </header>

      {/* Dashboard Section */}
      <Dashboard
        totalAmount={totalAmount}
        period={period}
        onPeriodChange={setPeriod}
        data={graphData}
        onDayClick={handleDayClick}
        onExport={handleExport}
      />

      {/* Separator / Visual Break */}
      <div className="flex items-center gap-4 py-2">
        <div className="h-px bg-border flex-1" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Input</span>
        <div className="h-px bg-border flex-1" />
      </div>

      {/* Input Section */}
      <SalesInput onSave={handleSave} />

      {/* App Footer (Status Bar) */}
      <div className="mt-auto" />
      <StatusBar lastBackupTime={lastBackupTime} />

      {/* Toast */}
      <Toast
        message={toast.msg}
        isVisible={toast.show}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
        type={toast.type}
      />

      {/* Detail Sheet */}
      <SalesSheet
        isOpen={!!selectedDate}
        date={selectedDate}
        items={sheetItems}
        onClose={() => setSelectedDate(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </main>
  );
}
