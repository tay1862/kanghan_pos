"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, ToggleLeft, ToggleRight } from "lucide-react";

interface Table { id: string; number: number | null; customName: string | null; status: string; isActive: boolean; }

export default function AdminTablesPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/${slug}/admin/tables`);
    if (res.status === 401) { router.push(`/${slug}/login`); return; }
    const data = await res.json();
    setTables(data.tables || []);
    setLoading(false);
  }, [slug, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try { const u = JSON.parse(stored); if (u.role !== "ADMIN") { router.push(`/${slug}/tables`); return; } } catch { router.push(`/${slug}/login`); return; }
    load();
  }, [slug, load, router]);

  async function addTable() {
    setAdding(true);
    const res = await fetch(`/api/${slug}/admin/tables`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: parseInt(newNumber) }) });
    if (res.ok) { setShowAdd(false); setNewNumber(""); await load(); }
    else { const d = await res.json(); alert(d.error); }
    setAdding(false);
  }

  async function toggleTable(table: Table) {
    await fetch(`/api/${slug}/admin/tables`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: table.id, isActive: !table.isActive }) });
    await load();
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/${slug}/admin`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1 font-bold text-white">ຈັດການໂຕ໊ະ ({tables.length} ໂຕ໊ະ)</div>
        <button onClick={() => setShowAdd(true)} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> ເພີ່ມ</button>
      </header>
      <div className="p-4 grid grid-cols-4 gap-3">
        {tables.map((t) => (
          <div key={t.id} className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center ${t.isActive ? "bg-gray-800 border-gray-700" : "bg-gray-900 border-gray-800 opacity-50"}`}>
            <div className="text-white font-bold text-lg">{t.number || t.customName}</div>
            <div className={`text-xs mt-1 ${t.status === "AVAILABLE" ? "text-green-400" : "text-red-400"}`}>{t.status === "AVAILABLE" ? "ວ່າງ" : "ຈອງ"}</div>
            <button onClick={() => toggleTable(t)} className="mt-2 text-gray-400 hover:text-white">
              {t.isActive ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} />}
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4">ເພີ່ມໂຕ໊ະ</h2>
            <input type="number" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4" placeholder="ເລກໂຕ໊ະ" />
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-gray-700 rounded-xl py-3 text-white">ຍົກເລີກ</button>
              <button onClick={addTable} disabled={!newNumber || adding} className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-xl py-3 text-white font-semibold disabled:opacity-50">ເພີ່ມ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
