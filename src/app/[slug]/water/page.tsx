"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { RefreshCw, LogOut } from "lucide-react";

interface KDSItem { roundId: string; roundNumber: number; createdAt: string; tableLabel: string; items: Array<{ id: string; menuItem: { name: string }; quantity: number; notes: string | null; status: string; }>; }
interface User { name: string; }
const STATUS_NEXT: Record<string, string> = { PENDING: "COOKING", COOKING: "DONE", DONE: "SERVED" };
const STATUS_LABELS: Record<string, string> = { PENDING: "ລໍຖ້າ", COOKING: "ກຳລັງທຳ", DONE: "ສຳເລັດ", SERVED: "ເສີລ໌ແລ້ວ" };
const STATUS_COLORS: Record<string, string> = { PENDING: "bg-yellow-600", COOKING: "bg-orange-600", DONE: "bg-green-600", SERVED: "bg-blue-600" };

export default function WaterPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [items, setItems] = useState<KDSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const loadItems = useCallback(async () => {
    const res = await fetch(`/api/${slug}/kds/water`);
    if (res.status === 401) { router.push(`/${slug}/login`); return; }
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, [slug, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try { setUser(JSON.parse(stored)); } catch { router.push(`/${slug}/login`); return; }
    loadItems();
    const interval = setInterval(loadItems, 10000);
    return () => clearInterval(interval);
  }, [slug, loadItems, router]);

  async function updateStatus(itemId: string, currentStatus: string) {
    const nextStatus = STATUS_NEXT[currentStatus];
    if (!nextStatus) return;
    await fetch(`/api/${slug}/order-items/${itemId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    await loadItems();
  }

  async function markAllDone(round: KDSItem) {
    const actionable = round.items.filter((i) => i.status === "PENDING" || i.status === "COOKING");
    await Promise.all(actionable.map((i) => fetch(`/api/${slug}/order-items/${i.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: STATUS_NEXT[i.status] }) })));
    await loadItems();
  }

  async function logout() {
    await fetch(`/api/${slug}/auth/logout`, { method: "POST" });
    sessionStorage.removeItem("pos_user");
    router.push(`/${slug}/login`);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-bold text-amber-400 text-lg">ນ້ຳ — KDS</div>
          <div className="text-xs text-gray-400">{user?.name}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadItems} className="p-2 text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400"><LogOut size={18} /></button>
        </div>
      </header>
      {loading ? <div className="flex-1 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div> : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500"><div className="text-6xl mb-4">✅</div><div>ບໍ່ມີລາຍການ</div></div>
      ) : (
        <div className="flex-1 p-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((round) => (
            <div key={round.roundId} className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div><div className="font-bold text-white text-lg">{round.tableLabel}</div><div className="text-xs text-gray-400">ຮອບທີ {round.roundNumber}</div></div>
                {round.items.some((i) => i.status === "PENDING" || i.status === "COOKING") && (
                  <button onClick={() => markAllDone(round)} className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold active:scale-95 transition-all">ທຳທັງໝົດ</button>
                )}
              </div>
              <div className="p-4 space-y-3">
                {round.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <button onClick={() => updateStatus(item.id, item.status)} className={`${STATUS_COLORS[item.status]} text-white text-xs px-3 py-1.5 rounded-lg font-semibold active:scale-95 transition-all min-w-[80px] text-center`}>{STATUS_LABELS[item.status]}</button>
                    <div className="flex-1"><div className="text-white font-medium">{item.menuItem.name} <span className="text-amber-400">×{item.quantity}</span></div>{item.notes && <div className="text-xs text-gray-400">{item.notes}</div>}</div>
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
