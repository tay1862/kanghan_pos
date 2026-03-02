"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { RefreshCw, LogOut } from "lucide-react";

interface KDSItem { roundId: string; orderId: string; roundNumber: number; createdAt: string; tableLabel: string; items: Array<{ id: string; menuItem: { name: string }; quantity: number; notes: string | null; status: string; }>; }
interface User { name: string; role: string; }

const STATUS_NEXT: Record<string, string> = { PENDING: "COOKING", COOKING: "DONE", DONE: "SERVED" };
const STATUS_LABELS: Record<string, string> = { PENDING: "ລໍຖ້າ", COOKING: "ກຳລັງທຳ", DONE: "ສຳເລັດ", SERVED: "ເສີລ໌ແລ້ວ" };
const STATUS_COLORS: Record<string, string> = { PENDING: "bg-yellow-600", COOKING: "bg-orange-600", DONE: "bg-green-600", SERVED: "bg-blue-600" };

function KDSPage({ station }: { station: string }) {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [items, setItems] = useState<KDSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState<User | null>(() => { try { const s = sessionStorage.getItem("pos_user"); return s ? JSON.parse(s) : null; } catch { return null; } });

  const stationLabel: Record<string, string> = { kitchen: "ຄົວ", cafe: "ກາເຟ", water: "ນ້ຳ" };

  const loadItems = useCallback(async () => {
    const res = await fetch(`/api/${slug}/kds/${station}`);
    if (res.status === 401) { router.push(`/${slug}/login`); return; }
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, [slug, station, router]);

  useEffect(() => {
    if (!user) { router.push(`/${slug}/login`); return; }
    loadItems();
    const interval = setInterval(loadItems, 10000);
    return () => clearInterval(interval);
  }, [slug, loadItems, router, user]);

  async function updateStatus(itemId: string, currentStatus: string) {
    const nextStatus = STATUS_NEXT[currentStatus];
    if (!nextStatus) return;
    await fetch(`/api/${slug}/order-items/${itemId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadItems();
  }

  async function markAllDone(round: KDSItem) {
    const actionable = round.items.filter((i) => i.status === "PENDING" || i.status === "COOKING");
    const targetStatus = actionable.every((i) => i.status === "COOKING") ? "DONE" : "COOKING";
    await Promise.all(
      actionable
        .filter((i) => STATUS_NEXT[i.status] === targetStatus || (targetStatus === "DONE" && i.status === "COOKING"))
        .map((i) => fetch(`/api/${slug}/order-items/${i.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: STATUS_NEXT[i.status] }) }))
    );
    await loadItems();
  }

  async function logout() {
    await fetch(`/api/${slug}/auth/logout`, { method: "POST" });
    sessionStorage.removeItem("pos_user");
    router.push(`/${slug}/login`);
  }

  const pendingCount = items.reduce((s, r) => s + r.items.filter((i) => i.status === "PENDING").length, 0);
  const cookingCount = items.reduce((s, r) => s + r.items.filter((i) => i.status === "COOKING").length, 0);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-bold text-amber-400 text-lg">{stationLabel[station] || station} — KDS</div>
          <div className="text-xs text-gray-400">{user?.name} · ລໍຖ້າ: <span className="text-yellow-400 font-bold">{pendingCount}</span> · ກຳລັງທຳ: <span className="text-orange-400 font-bold">{cookingCount}</span></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadItems} className="p-2 text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400"><LogOut size={18} /></button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <div className="text-6xl mb-4">✅</div>
          <div className="text-lg">ບໍ່ມີລາຍການທີ່ຕ້ອງທຳ</div>
        </div>
      ) : (
        <div className="flex-1 p-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((round) => (
            <div key={round.roundId} className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-lg">{round.tableLabel}</div>
                  <div className="text-xs text-gray-400">ຮອບທີ {round.roundNumber} · {new Date(round.createdAt).toLocaleTimeString("lo-LA", { timeStyle: "short" })}</div>
                </div>
                <div className="flex items-center gap-2">
                  {round.items.some((i) => i.status === "PENDING" || i.status === "COOKING") && (
                    <button onClick={() => markAllDone(round)} className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold active:scale-95 transition-all">
                      {round.items.every((i) => i.status === "COOKING") ? "ທຳແລ້ວທັງໝົດ" : "ທຳທັງໝົດ"}
                    </button>
                  )}
                  <div className="bg-gray-700 rounded-full px-3 py-1 text-sm text-white font-bold">{round.items.length}</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {round.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <button onClick={() => updateStatus(item.id, item.status)} className={`${STATUS_COLORS[item.status]} text-white text-xs px-3 py-1.5 rounded-lg font-semibold active:scale-95 transition-all min-w-[80px] text-center`}>
                      {STATUS_LABELS[item.status]}
                    </button>
                    <div className="flex-1">
                      <div className="text-white font-medium">{item.menuItem.name} <span className="text-amber-400">×{item.quantity}</span></div>
                      {item.notes && <div className="text-xs text-gray-400">{item.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KitchenPage() { return <KDSPage station="kitchen" />; }
