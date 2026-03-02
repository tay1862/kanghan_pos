"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Summary { totalRevenue: number; cashRevenue: number; qrRevenue: number; orderCount: number; }
interface DaySale { date: string; total: number; }
interface TopItem { menuItemId: string; name: string; totalQty: number; }

export default function AdminReportsPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [period, setPeriod] = useState("today");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DaySale[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/${slug}/admin/reports?period=${period}`);
    if (res.status === 401) { router.push(`/${slug}/login`); return; }
    const data = await res.json();
    setSummary(data.summary);
    setDaily(data.dailySales || []);
    setTopItems(data.topItems || []);
    setLoading(false);
  }, [slug, period, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try { const u = JSON.parse(stored); if (u.role !== "ADMIN") { router.push(`/${slug}/tables`); return; } } catch { router.push(`/${slug}/login`); return; }
    load();
  }, [slug, load, router]);

  const periodLabels: Record<string, string> = { today: "ມື້ນີ້", week: "7 ວັນ", month: "ເດືອນນີ້" };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/${slug}/admin`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1 font-bold text-white">ລາຍງານ</div>
      </header>

      <div className="p-4">
        <div className="flex gap-2 mb-4">
          {Object.entries(periodLabels).map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)} className={`flex-1 py-2 rounded-xl text-sm font-semibold ${period === v ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400"}`}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">ກຳລັງໂຫລດ...</div>
        ) : summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{formatCurrency(summary.totalRevenue)}</div>
                <div className="text-xs text-gray-400 mt-1">ລາຍໄດ້ທັງໝົດ</div>
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{summary.orderCount}</div>
                <div className="text-xs text-gray-400 mt-1">ຈຳນວນໂຕ໊ະ</div>
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 text-center">
                <div className="text-xl font-bold text-green-400">{formatCurrency(summary.cashRevenue)}</div>
                <div className="text-xs text-gray-400 mt-1">ເງິນສົດ</div>
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 text-center">
                <div className="text-xl font-bold text-blue-400">{formatCurrency(summary.qrRevenue)}</div>
                <div className="text-xs text-gray-400 mt-1">QR</div>
              </div>
            </div>

            {daily.length > 1 && (() => {
              const maxVal = Math.max(...daily.map((d) => d.total), 1);
              return (
                <div className="bg-gray-900 rounded-2xl p-4">
                  <div className="text-sm text-gray-400 font-semibold mb-4">ກຣາຟລາຍໄດ້ປະຈຳວັນ</div>
                  <div className="flex items-end gap-1.5 h-28">
                    {daily.map((d) => {
                      const pct = Math.max((d.total / maxVal) * 100, 2);
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                          <div className="text-xs text-amber-400 font-semibold truncate w-full text-center" style={{ fontSize: "9px" }}>
                            {d.total >= 1000000 ? `${(d.total/1000000).toFixed(1)}M` : d.total >= 1000 ? `${(d.total/1000).toFixed(0)}K` : d.total}
                          </div>
                          <div className="w-full bg-amber-500 rounded-t-sm transition-all" style={{ height: `${pct}%` }} />
                          <div className="text-gray-500 truncate w-full text-center" style={{ fontSize: "9px" }}>
                            {d.date.slice(5)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {daily.length > 0 && (
              <div className="bg-gray-900 rounded-2xl p-4">
                <div className="text-sm text-gray-400 font-semibold mb-3">ລາຍໄດ້ປະຈຳວັນ</div>
                {daily.map((d) => (
                  <div key={d.date} className="flex justify-between py-2 border-b border-gray-800 text-sm last:border-0">
                    <span className="text-gray-300">{d.date}</span>
                    <span className="text-amber-400 font-semibold">{formatCurrency(d.total)}</span>
                  </div>
                ))}
              </div>
            )}

            {topItems.length > 0 && (() => {
              const maxQty = Math.max(...topItems.map((i) => i.totalQty), 1);
              return (
                <div className="bg-gray-900 rounded-2xl p-4">
                  <div className="text-sm text-gray-400 font-semibold mb-3">ເມນູຂາຍດີ</div>
                  {topItems.map((item, i) => {
                    const pct = (item.totalQty / maxQty) * 100;
                    return (
                      <div key={item.menuItemId} className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                          <div className="flex-1 text-white text-sm truncate">{item.name}</div>
                          <div className="text-amber-400 text-sm font-semibold">{item.totalQty} ອັນ</div>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {summary.totalRevenue === 0 && <div className="text-center text-gray-500 py-8">ຍັງບໍ່ມີຂໍ້ມູນ</div>}
          </div>
        )}
      </div>
    </div>
  );
}
