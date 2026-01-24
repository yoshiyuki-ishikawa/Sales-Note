import { Sale } from "./types";

export function downloadSalesAsCsv(sales: Sale[]) {
    // 1. Sort by timestamp (descending: newest first)
    const sorted = [...sales].sort((a, b) => b.timestamp - a.timestamp);

    // 2. Generate Header
    const header = "日付,時刻,金額,メモ,ID\n";

    // 3. Generate Rows
    const rows = sorted.map(s => {
        const d = new Date(s.timestamp);
        const timeStr = d.toLocaleTimeString("ja-JP", { hour: '2-digit', minute: '2-digit' });

        // Escape memo field (wrap in quotes if it contains comma or newline)
        let safeMemo = s.memo;
        if (safeMemo.includes(',') || safeMemo.includes('\n') || safeMemo.includes('"')) {
            safeMemo = `"${safeMemo.replace(/"/g, '""')}"`;
        }

        return `${s.date},${timeStr},${s.amount},${safeMemo},${s.id}`;
    }).join("\n");

    // 4. Create Blob with BOM (Byte Order Mark) for Excel compatibility
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, header + rows], { type: "text/csv" });

    // 5. Trigger Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    a.download = `sales_note_${y}${m}${d}_${h}${min}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
