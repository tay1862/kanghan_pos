"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, LogOut, Settings, RefreshCw, Users } from "lucide-react";
import { getTableLabel } from "@/lib/utils";

interface Table {
  id: string;
  number: number | null;
  customName: string | null;
  status: string;
  activeOrderId: string | null;
  activeOrderStatus: string | null;
}
interface Shift { id: string; openingCash: number; openedAt: string; opener: { name: string }; }
interface User { id: string; name: string; role: string; restaurantSlug: string; }

export default function TablesPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [tables, setTables] = useState<Table[]>([]);
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [user] = useState<User | null>(() => { try { const s = sessionStorage.getItem("pos_user"); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [showOpenTable, setShowOpenTable] = useState(false);
  const [customName, setCustomName] = useState("");
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [openingCash, setOpeningCash] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmTable, setConfirmTable] = useState<Table | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [customGuestCount, setCustomGuestCount] = useState(2);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [tablesRes, shiftRes] = await Promise.all([
      fetch(`/api/${slug}/tables`),
      fetch(`/api/${slug}/shift/active`),
    ]);
    if (tablesRes.status === 401) { router.push(`/${slug}/login`); return; }
    const tablesData = await tablesRes.json();
    const shiftData = await shiftRes.json();
    setTables(tablesData.tables || []);
    setShift(shiftData.shift || null);
    if (!silent) setLoading(false);
  }, [slug, router]);

  useEffect(() => {
    if (!user) { router.push(`/${slug}/login`); return; }
    loadData();
    const poll = setInterval(() => loadData(true), 30000);
    return () => clearInterval(poll);
  }, [slug, loadData, router, user]);

  async function openShift() {
    setActionLoading(true);
    const res = await fetch(`/api/${slug}/shift/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingCash: parseInt(openingCash) || 0 }),
    });
    if (res.ok) { setShowOpenShift(false); setOpeningCash(""); await loadData(); }
    setActionLoading(false);
  }

  function handleTableClick(t: Table) {
    if (t.status !== "AVAILABLE") {
      router.push(`/${slug}/order/${t.activeOrderId}`);
      return;
    }
    if (!shift) { setShowOpenShift(true); return; }
    setGuestCount(2);
    setConfirmTable(t);
  }

  async function confirmOpenTable() {
    if (!confirmTable) return;
    setActionLoading(true);
    const res = await fetch(`/api/${slug}/tables/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: confirmTable.id, guestCount }),
    });
    if (res.ok) {
      const data = await res.json();
      setConfirmTable(null);
      router.push(`/${slug}/order/${data.order.id}`);
    } else {
      const d = await res.json();
      alert(d.error);
    }
    setActionLoading(false);
  }

  async function openCustomTable() {
    if (!shift) { setShowOpenShift(true); return; }
    setActionLoading(true);
    const res = await fetch(`/api/${slug}/tables/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customName, guestCount: customGuestCount }),
    });
    if (res.ok) {
      const data = await res.json();
      setShowOpenTable(false);
      setCustomName("");
      setCustomGuestCount(2);
      router.push(`/${slug}/order/${data.order.id}`);
    }
    setActionLoading(false);
  }

  async function logout() {
    await fetch(`/api/${slug}/auth/logout`, { method: "POST" });
    sessionStorage.removeItem("pos_user");
    router.push(`/${slug}/login`);
  }

  function getTableColor(t: Table) {
    if (t.status === "AVAILABLE") return "bg-green-900/40 border-green-700 hover:bg-green-900/60";
    if (t.activeOrderStatus === "CHECKOUT_REQUESTED") return "bg-amber-900/40 border-amber-600 hover:bg-amber-900/60";
    return "bg-red-900/40 border-red-700 hover:bg-red-900/60";
  }

  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;
  const occupiedCount = tables.filter((t) => t.status !== "AVAILABLE").length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-bold text-amber-400 text-lg">ຮ້ານຄ້ວ້ານຄານ</div>
          {shift ? <div className="text-xs text-green-400">ກະ: ເປີດ · {user?.name}</div> : <div className="text-xs text-red-400">ກະ: ປິດ</div>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => loadData()} className="p-2 text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
          {user?.role === "ADMIN" && <button onClick={() => router.push(`/${slug}/admin`)} className="p-2 text-gray-400 hover:text-white"><Settings size={18} /></button>}
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="px-4 py-3 flex gap-3">
        <div className="flex-1 bg-green-900/30 border border-green-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{availableCount}</div>
          <div className="text-xs text-gray-400">ວ່າງ</div>
        </div>
        <div className="flex-1 bg-red-900/30 border border-red-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{occupiedCount}</div>
          <div className="text-xs text-gray-400">ມີລູກຄ້າ</div>
        </div>
        {!shift && (
          <button onClick={() => setShowOpenShift(true)} className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-xl p-3 text-center text-sm font-semibold text-white">ເປີດກະ</button>
        )}
        {shift && user?.role === "ADMIN" && (
          <button onClick={() => router.push(`/${slug}/admin/shifts`)} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-center text-xs text-gray-300">ຈັດການກະ</button>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>
      ) : (
        <div className="flex-1 p-4 grid grid-cols-4 gap-3 content-start">
          {tables.map((t) => (
            <button key={t.id} onClick={() => handleTableClick(t)} className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-150 active:scale-95 ${getTableColor(t)}`}>
              <div className="text-white font-bold text-lg leading-none">{getTableLabel(t)}</div>
              {t.status !== "AVAILABLE" && <div className={`text-xs mt-1 ${t.activeOrderStatus === "CHECKOUT_REQUESTED" ? "text-amber-300" : "text-red-300"}`}>{t.activeOrderStatus === "CHECKOUT_REQUESTED" ? "ຊຳລະ" : "ມີລູກຄ້າ"}</div>}
            </button>
          ))}
          <button onClick={() => shift ? setShowOpenTable(true) : setShowOpenShift(true)} className="aspect-square rounded-2xl border-2 border-dashed border-gray-700 hover:border-amber-500 flex flex-col items-center justify-center text-gray-500 hover:text-amber-400 transition-all">
            <Plus size={24} /><div className="text-xs mt-1">ໂຕ໊ະໃໝ່</div>
          </button>
        </div>
      )}

      {/* Confirm open table */}
      {confirmTable && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-1">ເປີດ{getTableLabel(confirmTable)}</h2>
            <p className="text-gray-400 text-sm mb-5">ຢືນຢັນເພື່ອເລີ່ມຮັບອໍເດີ</p>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1"><Users size={14} /> ຈຳນວນລູກຄ້າ</label>
            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} onClick={() => setGuestCount(n)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${guestCount === n ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{n}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmTable(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-xl py-3 text-white">ຍົກເລີກ</button>
              <button onClick={confirmOpenTable} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-500 rounded-xl py-3 text-white font-semibold disabled:opacity-50">ເປີດໂຕ໊ະ</button>
            </div>
          </div>
        </div>
      )}

      {/* Open shift */}
      {showOpenShift && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-4">ເປີດກະວຽກ</h2>
            <label className="block text-sm text-gray-400 mb-1">ເງິນສົດຕອນເລີ່ມ (ກີບ)</label>
            <input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4" placeholder="0" />
            <div className="flex gap-3">
              <button onClick={() => setShowOpenShift(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-xl py-3 text-white">ຍົກເລີກ</button>
              <button onClick={openShift} disabled={actionLoading} className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-xl py-3 text-white font-semibold">ເປີດກະ</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom table (VIP etc) */}
      {showOpenTable && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-4">ໂຕ໊ະຊື່ພິເສດ</h2>
            <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-3" placeholder="ເຊັ່ນ: ຫ້ອງ VIP" />
            <label className="block text-sm text-gray-400 mb-2 mt-1 flex items-center gap-1"><Users size={14} /> ຈຳນວນລູກຄ້າ</label>
            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} onClick={() => setCustomGuestCount(n)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${customGuestCount === n ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{n}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOpenTable(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-xl py-3 text-white">ຍົກເລີກ</button>
              <button onClick={openCustomTable} disabled={!customName || actionLoading} className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-xl py-3 text-white font-semibold disabled:opacity-50">ເປີດໂຕ໊ະ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
