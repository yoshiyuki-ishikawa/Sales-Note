"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Dashboard } from "@/components/Dashboard";
import { SalesInput } from "@/components/SalesInput";
import { SalesSheet } from "@/components/SalesSheet";
import { downloadSalesAsCsv } from "@/lib/export";

type Sale = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  memo: string;
  timestamp: number;
};

type Period = "daily" | "monthly";

export default function Home() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<Period>("daily");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("sales_note_data");
    if (saved) {
      try {
        setSales(JSON.parse(saved));
        console.log("Loaded sales:", JSON.parse(saved).length);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sales_note_data", JSON.stringify(sales));
    }
  }, [sales, isLoaded]);

  const handleSave = async (data: { date: string; amount: number; memo: string }) => {
    // Generate ID without crypto.randomUUID for better mobile compatibility
    const safeId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    const newSale: Sale = {
      id: safeId,
      ...data,
      timestamp: Date.now(),
    };

    // Use transition to prioritize Input UI response over Dashboard update
    startTransition(() => {
      setSales((prev) => [newSale, ...prev]);
    });
  };

  const handleUpdate = (id: string, updates: Partial<Sale>) => {
    startTransition(() => {
      setSales((prev) => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    });
  };

  const handleDelete = (id: string) => {
    startTransition(() => {
      setSales((prev) => prev.filter(s => s.id !== id));
    });
  };

  const handleDayClick = (key: string) => {
    // If period is monthly, key is "YYYY-MM". We can't show daily sheet easily from monthly view?
    // Spec says "Day Detail". 
    // If monthly view, clicking a bar (month) -> maybe nothing for now, or expand?
    // Let's support only Daily view details for now, or ensure key is YYYY-MM-DD.
    // In monthly view, key is YYYY-MM. 
    // Let's only open sheet if looking at daily view or if key is full date.
    if (key.length >= 10) { // Simple check for YYYY-MM-DD
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

      {/* Spacer to push footer to bottom */}
      <div className="mt-auto" />

      {/* App Footer */}
      <footer className="py-6 text-center space-y-2 opacity-80">
        <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
          <span>🔒</span>
          <span>データはこのブラウザ内に保存されます</span>
        </p>
        <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
          <span>📥</span>
          <span>CSVでいつでもダウンロードできます</span>
        </p>
      </footer>

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
