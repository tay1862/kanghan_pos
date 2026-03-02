"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

interface Settings { name: string; serviceChargePercent: number; currency: string; logoUrl: string | null; qrImageUrl: string | null; }

export default function AdminSettingsPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", serviceChargePercent: 0, qrImageUrl: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/${slug}/admin/settings`);
    if (res.status === 401) { router.push(`/${slug}/login`); return; }
    const data = await res.json();
    const s = data.settings;
    setSettings(s);
    setForm({ name: s.name || "", serviceChargePercent: s.serviceChargePercent || 0, qrImageUrl: s.qrImageUrl || "" });
    setLoading(false);
  }, [slug, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try { const u = JSON.parse(stored); if (u.role !== "ADMIN") { router.push(`/${slug}/tables`); return; } } catch { router.push(`/${slug}/login`); return; }
    load();
  }, [slug, load, router]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/${slug}/admin/settings`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); await load(); }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/${slug}/admin`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1 font-bold text-white">ຕັ້ງຄ່າຮ້ານ</div>
      </header>
      <div className="p-4 space-y-4">
        <div className="bg-gray-900 rounded-2xl p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">ຊື່ຮ້ານ</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">ຄ່າບໍລິການ (%)</label>
            <input type="number" min={0} max={100} value={form.serviceChargePercent} onChange={(e) => setForm({ ...form, serviceChargePercent: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL ຮູບ QR (ສຳລັບ QR Payment)</label>
            <input value={form.qrImageUrl} onChange={(e) => setForm({ ...form, qrImageUrl: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white" placeholder="https://..." />
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-sm text-gray-400">
            <div className="font-semibold text-gray-300 mb-1">ຂໍ້ມູນຮ້ານ</div>
            <div>Slug: <span className="text-amber-400">{slug}</span></div>
            <div>ສະກຸນເງິນ: {settings?.currency}</div>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          <Save size={18} /> {saved ? "ບັນທຶກແລ້ວ ✓" : saving ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ"}
        </button>
      </div>
    </div>
  );
}
