"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Shift { id: string; openedAt: string; closedAt: string | null; openingCash: number; closingCash: number | null; status: string; opener: { name: string }; notes: string | null; }

export default function AdminShiftsPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [closing, setClosing] = useState(false);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/${slug}/shift/active`);
    if (res.status === 401) { router.push(`/${slug}/login`); return; }
    const data = await res.json();
    setShift(data.shift || null);
    setLoading(false);
  }, [slug, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try { const u = JSON.parse(stored); if (u.role !== "ADMIN") { router.push(`/${slug}/tables`); return; } } catch { router.push(`/${slug}/login`); return; }
    load();
  }, [slug, load, router]);

  async function openShift() {
    setClosing(true);
    const res = await fetch(`/api/${slug}/shift/open`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ openingCash: parseInt(closingCash) || 0 }) });
    if (res.ok) { setClosingCash(""); await load(); }
    else { const d = await res.json(); alert(d.error); }
    setClosing(false);
  }

  async function closeShift() {
    setClosing(true);
    const res = await fetch(`/api/${slug}/shift/close`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ closingCash: parseInt(closingCash) || 0, notes }) });
    if (res.ok) {
      const d = await res.json();
      setSummary(d.summary);
      await load();
    } else {
      const d = await res.json();
      alert(d.error);
    }
    setClosing(false);
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/${slug}/admin`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1 font-bold text-white">ຈັດການກະ</div>
        <button onClick={load} className="text-gray-400 hover:text-white p-2"><RefreshCw size={18} /></button>
      </header>

      <div className="p-4 space-y-4">
        {summary && (
          <div className="bg-green-900/30 border border-green-700 rounded-2xl p-4">
            <div className="text-green-400 font-bold text-lg mb-3">ສະຫຼຸບກະທີ່ປິດ</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">ລາຍໄດ້ສົດ</span><span className="text-white font-bold">{formatCurrency(summary.cashTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">ລາຍໄດ້ QR</span><span className="text-white font-bold">{formatCurrency(summary.qrTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">ເງິນສົດທີ່ຄວນມີ</span><span className="text-white">{formatCurrency(summary.expectedCash)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">ເງິນສົດຈິງ</span><span className="text-white">{formatCurrency(summary.actualCash)}</span></div>
              <div className="flex justify-between border-t border-green-700 pt-2">
                <span className="text-gray-400">ຜົນຕ່າງ</span>
                <span className={`font-bold ${summary.difference >= 0 ? "text-green-400" : "text-red-400"}`}>{summary.difference >= 0 ? "+" : ""}{formatCurrency(summary.difference)}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-400">ຍົກເລີກ</span><span className="text-red-400">{summary.voidCount} ລາຍການ</span></div>
            </div>
          </div>
        )}

        {shift ? (
          <div className="bg-gray-900 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-green-400 font-bold text-lg">ກະ: ເປີດ</div>
                <div className="text-gray-400 text-sm">ເລີ່ມ: {formatDate(shift.openedAt)}</div>
                <div className="text-gray-400 text-sm">ເປີດໂດຍ: {shift.opener.name}</div>
                <div className="text-gray-400 text-sm">ເງິນເລີ່ມ: {formatCurrency(shift.openingCash)}</div>
              </div>
            </div>
            <label className="block text-sm text-gray-400 mb-1">ເງິນສົດຕອນປິດ (ກີບ)</label>
            <input type="number" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-3" placeholder="0" />
            <label className="block text-sm text-gray-400 mb-1">ໝາຍເຫດ</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4 h-20 resize-none text-sm" placeholder="ໝາຍເຫດ (ຖ້າມີ)" />
            <button onClick={closeShift} disabled={closing} className="w-full bg-red-700 hover:bg-red-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50">ປິດກະ</button>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-4">
            <div className="text-red-400 font-bold text-lg mb-4">ກະ: ປິດ</div>
            <label className="block text-sm text-gray-400 mb-1">ເງິນສົດຕອນເລີ່ມ (ກີບ)</label>
            <input type="number" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4" placeholder="0" />
            <button onClick={openShift} disabled={closing} className="w-full bg-green-700 hover:bg-green-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50">ເປີດກະໃໝ່</button>
          </div>
        )}
      </div>
    </div>
  );
}
