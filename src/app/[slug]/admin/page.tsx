"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, UtensilsCrossed, Users, LayoutGrid, Settings, BarChart3, Clock, History } from "lucide-react";

interface User { name: string; role: string; }

export default function AdminPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try {
      const u = JSON.parse(stored);
      if (u.role !== "ADMIN") { router.push(`/${slug}/tables`); return; }
      setUser(u);
    } catch { router.push(`/${slug}/login`); }
  }, [slug, router]);

  const menuItems = [
    { icon: UtensilsCrossed, label: "ຈັດການເມນູ", desc: "ເພີ່ມ/ແກ້ໄຂ/ລຶບ ໝວດໝູ່ ແລະ ເມນູ", path: `/${slug}/admin/menu`, color: "text-amber-400" },
    { icon: Users, label: "ຈັດການຜູ້ໃຊ້", desc: "ເພີ່ມ/ແກ້ໄຂ ພະນັກງານ ແລະ PIN", path: `/${slug}/admin/users`, color: "text-blue-400" },
    { icon: LayoutGrid, label: "ຈັດການໂຕ໊ະ", desc: "ເພີ່ມ/ລຶບໂຕ໊ະ", path: `/${slug}/admin/tables`, color: "text-green-400" },
    { icon: Clock, label: "ຈັດການກະ", desc: "ເປີດ/ປິດກະ, ເບິ່ງລາຍງານກະ", path: `/${slug}/admin/shifts`, color: "text-purple-400" },
    { icon: History, label: "ປະຫວັດບິນ", desc: "ດູບິນທີ່ຊຳລະແລ້ວ, ພິມໃຫ້ຄືນ", path: `/${slug}/admin/orders`, color: "text-cyan-400" },
    { icon: BarChart3, label: "ລາຍງານ", desc: "ລາຍໄດ້ ແລະ ສະຖິຕິ", path: `/${slug}/admin/reports`, color: "text-pink-400" },
    { icon: Settings, label: "ຕັ້ງຄ່າຮ້ານ", desc: "ຊື່ຮ້ານ, ຄ່າບໍລິການ, QR", path: `/${slug}/admin/settings`, color: "text-gray-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/${slug}/tables`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div>
          <div className="font-bold text-white">ໜ້າ Admin</div>
          <div className="text-xs text-gray-400">{user?.name}</div>
        </div>
      </header>
      <div className="p-4 grid grid-cols-2 gap-3">
        {menuItems.map((item) => (
          <button key={item.path} onClick={() => router.push(item.path)} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-4 text-left transition-all active:scale-95">
            <item.icon size={28} className={`${item.color} mb-2`} />
            <div className="text-white font-semibold text-sm">{item.label}</div>
            <div className="text-gray-500 text-xs mt-1">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
