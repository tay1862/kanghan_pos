"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MenuItem { id: string; name: string; price: number; available: boolean; sortOrder: number; }
interface Category { id: string; name: string; station: string; active: boolean; menuItems: MenuItem[]; }

const STATION_LABELS: Record<string, string> = { KITCHEN: "ຄົວ", CAFE: "ກາເຟ", WATER: "ນ້ຳ" };

export default function AdminMenuPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [formCat, setFormCat] = useState({ name: "", station: "KITCHEN" });
  const [formItem, setFormItem] = useState({ name: "", price: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/${slug}/admin/menu`);
    if (res.status === 401) { router.push(`/${slug}/login`); return; }
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  }, [slug, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try { const u = JSON.parse(stored); if (u.role !== "ADMIN") { router.push(`/${slug}/tables`); return; } } catch { router.push(`/${slug}/login`); return; }
    load();
  }, [slug, load, router]);

  async function addCategory() {
    const res = await fetch(`/api/${slug}/admin/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formCat) });
    if (res.ok) { setShowAddCat(false); setFormCat({ name: "", station: "KITCHEN" }); await load(); }
  }

  async function addItem(categoryId: string) {
    const res = await fetch(`/api/${slug}/admin/menu-items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formItem.name, price: parseInt(formItem.price), categoryId }) });
    if (res.ok) { setShowAddItem(null); setFormItem({ name: "", price: "" }); await load(); }
  }

  async function updateItem(item: MenuItem) {
    const res = await fetch(`/api/${slug}/admin/menu-items/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formItem.name || item.name, price: parseInt(formItem.price) || item.price }) });
    if (res.ok) { setEditItem(null); setFormItem({ name: "", price: "" }); await load(); }
  }

  async function toggleAvail(itemId: string, available: boolean) {
    await fetch(`/api/${slug}/menu-items/${itemId}/availability`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ available: !available }) });
    await load();
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/${slug}/admin`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1 font-bold text-white">ຈັດການເມນູ</div>
        <button onClick={() => setShowAddCat(true)} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> ໝວດໝູ່</button>
      </header>

      <div className="p-4 space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">{cat.name}</span>
                <span className="ml-2 text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">{STATION_LABELS[cat.station]}</span>
              </div>
              <button onClick={() => { setShowAddItem(cat.id); setFormItem({ name: "", price: "" }); }} className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1"><Plus size={12} /> ເພີ່ມ</button>
            </div>
            <div className="divide-y divide-gray-800">
              {cat.menuItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${item.available ? "text-white" : "text-gray-500 line-through"}`}>{item.name}</div>
                    <div className="text-amber-400 text-sm">{formatCurrency(item.price)}</div>
                  </div>
                  <button onClick={() => toggleAvail(item.id, item.available)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${item.available ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                    {item.available ? "ມີ" : "ໝົດ"}
                  </button>
                  <button onClick={() => { setEditItem(item); setFormItem({ name: item.name, price: String(item.price) }); }} className="text-gray-400 hover:text-white p-1"><Pencil size={14} /></button>
                </div>
              ))}
              {cat.menuItems.length === 0 && <div className="px-4 py-3 text-gray-600 text-sm">ຍັງບໍ່ມີເມນູ</div>}
            </div>
          </div>
        ))}
      </div>

      {showAddCat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4">ເພີ່ມໝວດໝູ່</h2>
            <input value={formCat.name} onChange={(e) => setFormCat({ ...formCat, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-3" placeholder="ຊື່ໝວດໝູ່" />
            <select value={formCat.station} onChange={(e) => setFormCat({ ...formCat, station: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4">
              <option value="KITCHEN">ຄົວ</option><option value="CAFE">ກາເຟ</option><option value="WATER">ນ້ຳ</option>
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowAddCat(false)} className="flex-1 bg-gray-700 rounded-xl py-3 text-white">ຍົກເລີກ</button>
              <button onClick={addCategory} disabled={!formCat.name} className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-xl py-3 text-white font-semibold disabled:opacity-50">ເພີ່ມ</button>
            </div>
          </div>
        </div>
      )}

      {showAddItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4">ເພີ່ມເມນູ</h2>
            <input value={formItem.name} onChange={(e) => setFormItem({ ...formItem, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-3" placeholder="ຊື່ເມນູ" />
            <input type="number" value={formItem.price} onChange={(e) => setFormItem({ ...formItem, price: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4" placeholder="ລາຄາ (ກີບ)" />
            <div className="flex gap-3">
              <button onClick={() => setShowAddItem(null)} className="flex-1 bg-gray-700 rounded-xl py-3 text-white">ຍົກເລີກ</button>
              <button onClick={() => addItem(showAddItem)} disabled={!formItem.name || !formItem.price} className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-xl py-3 text-white font-semibold disabled:opacity-50">ເພີ່ມ</button>
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4">ແກ້ໄຂເມນູ</h2>
            <input value={formItem.name} onChange={(e) => setFormItem({ ...formItem, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-3" placeholder="ຊື່ເມນູ" />
            <input type="number" value={formItem.price} onChange={(e) => setFormItem({ ...formItem, price: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4" placeholder="ລາຄາ (ກີບ)" />
            <div className="flex gap-3">
              <button onClick={() => setEditItem(null)} className="flex-1 bg-gray-700 rounded-xl py-3 text-white">ຍົກເລີກ</button>
              <button onClick={() => updateItem(editItem)} className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-xl py-3 text-white font-semibold">ບັນທຶກ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
