"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Pencil, UserCheck, UserX } from "lucide-react";

interface User { id: string; name: string; role: string; active: boolean; }

const ROLE_LABELS: Record<string, string> = { ADMIN: "Admin", SERVER: "ພະນັກງານ", KITCHEN: "ຄົວ", CAFE: "ກາເຟ", WATER: "ນ້ຳ" };
const ROLE_COLORS: Record<string, string> = { ADMIN: "text-red-400 bg-red-900/30", SERVER: "text-blue-400 bg-blue-900/30", KITCHEN: "text-orange-400 bg-orange-900/30", CAFE: "text-amber-400 bg-amber-900/30", WATER: "text-cyan-400 bg-cyan-900/30" };

export default function AdminUsersPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", pin: "", role: "SERVER" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/${slug}/admin/users`);
    if (res.status === 401) { router.push(`/${slug}/login`); return; }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, [slug, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try { const u = JSON.parse(stored); if (u.role !== "ADMIN") { router.push(`/${slug}/tables`); return; } } catch { router.push(`/${slug}/login`); return; }
    load();
  }, [slug, load, router]);

  async function addUser() {
    const res = await fetch(`/api/${slug}/admin/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowAdd(false); setForm({ name: "", pin: "", role: "SERVER" }); await load(); }
    else { const d = await res.json(); alert(d.error); }
  }

  async function updateUser() {
    if (!editUser) return;
    const body: Record<string, unknown> = {};
    if (form.name) body.name = form.name;
    if (form.pin) body.pin = form.pin;
    if (form.role) body.role = form.role;
    const res = await fetch(`/api/${slug}/admin/users/${editUser.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setEditUser(null); setForm({ name: "", pin: "", role: "SERVER" }); await load(); }
    else { const d = await res.json(); alert(d.error); }
  }

  async function toggleActive(user: User) {
    await fetch(`/api/${slug}/admin/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !user.active }) });
    await load();
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>;

  const formModal = (title: string, onSave: () => void, onClose: () => void) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-3" placeholder="ຊື່" />
        <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-3" placeholder="PIN (4-6 ຕົວ)" type="password" maxLength={6} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4">
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-700 rounded-xl py-3 text-white">ຍົກເລີກ</button>
          <button onClick={onSave} className="flex-1 bg-amber-600 hover:bg-amber-500 rounded-xl py-3 text-white font-semibold">ບັນທຶກ</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/${slug}/admin`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1 font-bold text-white">ຈັດການຜູ້ໃຊ້</div>
        <button onClick={() => { setShowAdd(true); setForm({ name: "", pin: "", role: "SERVER" }); }} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"><Plus size={14} /> ເພີ່ມ</button>
      </header>
      <div className="p-4 space-y-3">
        {users.map((u) => (
          <div key={u.id} className={`bg-gray-900 rounded-xl p-4 flex items-center gap-3 ${!u.active ? "opacity-50" : ""}`}>
            <div className="flex-1">
              <div className="text-white font-semibold">{u.name}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
            </div>
            <button onClick={() => toggleActive(u)} className="p-2 text-gray-400 hover:text-white">{u.active ? <UserCheck size={18} className="text-green-400" /> : <UserX size={18} className="text-red-400" />}</button>
            <button onClick={() => { setEditUser(u); setForm({ name: u.name, pin: "", role: u.role }); }} className="p-2 text-gray-400 hover:text-white"><Pencil size={16} /></button>
          </div>
        ))}
      </div>
      {showAdd && formModal("ເພີ່ມຜູ້ໃຊ້", addUser, () => setShowAdd(false))}
      {editUser && formModal("ແກ້ໄຂຜູ້ໃຊ້", updateUser, () => setEditUser(null))}
    </div>
  );
}
