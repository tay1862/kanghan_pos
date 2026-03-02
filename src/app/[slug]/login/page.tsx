"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Delete } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function doLogin(inputPin: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/${slug}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: inputPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ຜິດພາດ");
        setPin("");
        setLoading(false);
        return;
      }
      const user = data.user;
      sessionStorage.setItem("pos_user", JSON.stringify(user));
      const roleRoutes: Record<string, string> = {
        ADMIN: `/${slug}/tables`,
        SERVER: `/${slug}/tables`,
        KITCHEN: `/${slug}/kitchen`,
        CAFE: `/${slug}/cafe`,
        WATER: `/${slug}/water`,
      };
      router.push(roleRoutes[user.role] || `/${slug}/tables`);
    } catch {
      setError("ບໍ່ສາມາດເຊື່ອມຕໍ່ໄດ້");
      setPin("");
      setLoading(false);
    }
  }

  async function handleKey(key: string) {
    setError("");
    if (key === "DEL") { setPin((p) => p.slice(0, -1)); return; }
    if (key === "CLR") { setPin(""); return; }
    const newPin = pin + key;
    setPin(newPin);
    if (newPin.length >= 4) await doLogin(newPin);
  }

  const keys = ["1","2","3","4","5","6","7","8","9","CLR","0","DEL"];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-amber-400 mb-1">ຮ້ານຄ້ວ້ານຄານ</div>
          <div className="text-gray-400 text-sm">ໃສ່ PIN ເພື່ອເຂົ້າລະບົບ</div>
        </div>
        <div className="flex justify-center gap-3 mb-6">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${i < pin.length ? "bg-amber-400 border-amber-400" : "border-gray-600 bg-transparent"}`} />
          ))}
        </div>
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm text-center rounded-lg p-3 mb-4">{error}</div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              disabled={loading}
              className={`h-16 rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-95 flex items-center justify-center ${key === "CLR" ? "bg-gray-700 hover:bg-gray-600 text-gray-300 text-base" : key === "DEL" ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-800 hover:bg-gray-700 text-white"} ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {key === "DEL" ? <Delete size={20} /> : key}
            </button>
          ))}
        </div>
        {loading && <div className="text-center text-amber-400 mt-6 text-sm animate-pulse">ກຳລັງເຂົ້າລະບົບ...</div>}
      </div>
    </div>
  );
}
