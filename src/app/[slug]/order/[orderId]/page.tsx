"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus, Minus, Send, CreditCard, ArrowRightLeft, Trash2, MessageSquare } from "lucide-react";
import { formatCurrency, getTableLabel } from "@/lib/utils";

interface MenuItem { id: string; name: string; price: number; available: boolean; category: { id: string; name: string; station: string; }; }
interface Category { id: string; name: string; station: string; menuItems: MenuItem[]; }
interface CartItem { menuItemId: string; name: string; price: number; quantity: number; notes: string; }
interface OrderItem { id: string; menuItemId: string; quantity: number; unitPrice: number; notes: string | null; status: string; menuItem: { name: string; category: { station: string; }; }; voidLog?: { reason: string } | null; }
interface OrderRound { id: string; roundNumber: number; createdAt: string; items: OrderItem[]; }
interface Order { id: string; status: string; table: { number: number | null; customName: string | null; }; rounds: OrderRound[]; }
interface User { id: string; name: string; role: string; }

const STATUS_LABELS: Record<string, string> = { PENDING: "ລໍຖ້າ", COOKING: "ກຳລັງທຳ", DONE: "ສຳເລັດ", SERVED: "ເສີລ໌ແລ້ວ", VOIDED: "ຍົກເລີກ" };
const STATUS_COLORS: Record<string, string> = { PENDING: "text-yellow-400 bg-yellow-900/30", COOKING: "text-orange-400 bg-orange-900/30", DONE: "text-green-400 bg-green-900/30", SERVED: "text-blue-400 bg-blue-900/30", VOIDED: "text-gray-500 bg-gray-800 line-through" };

export default function OrderPage() {
  const router = useRouter();
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<"menu" | "orders">("menu");
  const [voidItem, setVoidItem] = useState<OrderItem | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [transferMode, setTransferMode] = useState(false);
  const [allTables, setAllTables] = useState<Array<{ id: string; number: number | null; customName: string | null; status: string }>>([]);

  const loadOrder = useCallback(async () => {
    const res = await fetch(`/api/${slug}/orders/${orderId}`);
    if (!res.ok) { router.push(`/${slug}/tables`); return; }
    const data = await res.json();
    setOrder(data.order);
  }, [slug, orderId, router]);

  const loadMenu = useCallback(async () => {
    const res = await fetch(`/api/${slug}/admin/menu`);
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories || []);
      if (data.categories?.length > 0) setSelectedCat(data.categories[0].id);
    }
  }, [slug]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try { setUser(JSON.parse(stored)); } catch { router.push(`/${slug}/login`); return; }
    Promise.all([loadOrder(), loadMenu()]).finally(() => setLoading(false));
  }, [slug, orderId, loadOrder, loadMenu, router]);

  function addToCart(item: MenuItem) {
    if (!item.available) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, notes: "" }];
    });
  }

  function updateQty(menuItemId: string, delta: number) {
    setCart((prev) => {
      const updated = prev.map((c) => c.menuItemId === menuItemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c);
      return updated.filter((c) => c.quantity > 0);
    });
  }

  async function sendOrder() {
    if (cart.length === 0) return;
    setSending(true);
    const res = await fetch(`/api/${slug}/orders/${orderId}/rounds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });
    if (res.ok) { setCart([]); await loadOrder(); setTab("orders"); }
    else { const d = await res.json(); alert(d.error); }
    setSending(false);
  }

  async function requestCheckout() {
    const res = await fetch(`/api/${slug}/orders/${orderId}/request-checkout`, { method: "POST" });
    if (res.ok) { await loadOrder(); if (user?.role === "ADMIN") router.push(`/${slug}/checkout/${orderId}`); else router.push(`/${slug}/tables`); }
  }

  async function doVoid() {
    if (!voidItem || !voidReason.trim()) return;
    const res = await fetch(`/api/${slug}/order-items/${voidItem.id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: voidReason }),
    });
    if (res.ok) { setVoidItem(null); setVoidReason(""); await loadOrder(); }
    else { const d = await res.json(); alert(d.error); }
  }

  async function loadTablesForTransfer() {
    const res = await fetch(`/api/${slug}/tables`);
    if (res.ok) { const d = await res.json(); setAllTables((d.tables || []).filter((t: { status: string }) => t.status === "AVAILABLE")); }
    setTransferMode(true);
  }

  async function doTransfer(toTableId: string) {
    const res = await fetch(`/api/${slug}/tables/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, toTableId }),
    });
    if (res.ok) { setTransferMode(false); await loadOrder(); }
  }

  const allItems = order?.rounds.flatMap((r) => r.items) || [];
  const activeItems = allItems.filter((i) => i.status !== "VOIDED");
  const subtotal = activeItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const currentCat = categories.find((c) => c.id === selectedCat);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.push(`/${slug}/tables`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="font-bold text-white">{order ? getTableLabel(order.table) : "..."}</div>
          <div className="text-xs text-gray-400">{order?.rounds.length || 0} ຮອບ · {activeItems.length} ລາຍການ</div>
        </div>
        {user?.role === "ADMIN" && order?.status !== "PAID" && (
          <button onClick={loadTablesForTransfer} className="p-2 text-gray-400 hover:text-amber-400"><ArrowRightLeft size={18} /></button>
        )}
        {order?.status === "OPEN" && (
          <button onClick={requestCheckout} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1">
            <CreditCard size={16} /> ຊຳລະ
          </button>
        )}
        {order?.status === "CHECKOUT_REQUESTED" && user?.role === "ADMIN" && (
          <button onClick={() => router.push(`/${slug}/checkout/${orderId}`)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1">
            <CreditCard size={16} /> ຈ່າຍ
          </button>
        )}
      </header>

      {/* Tab switch */}
      <div className="flex bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <button onClick={() => setTab("menu")} className={`flex-1 py-3 text-sm font-semibold ${tab === "menu" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-400"}`}>ເມນູ {cart.length > 0 && <span className="ml-1 bg-amber-600 text-white text-xs rounded-full px-1.5">{cart.reduce((s,c)=>s+c.quantity,0)}</span>}</button>
        <button onClick={() => setTab("orders")} className={`flex-1 py-3 text-sm font-semibold ${tab === "orders" ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-400"}`}>ລາຍການ ({activeItems.length})</button>
      </div>

      {tab === "menu" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Category list */}
          <div className="w-24 bg-gray-900 flex flex-col overflow-y-auto border-r border-gray-800">
            {categories.map((c) => (
              <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`py-3 px-2 text-xs text-center border-b border-gray-800 ${selectedCat === c.id ? "bg-amber-900/50 text-amber-400" : "text-gray-400"}`}>{c.name}</button>
            ))}
          </div>
          {/* Menu items */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
            {currentCat?.menuItems.filter((m) => m.available).map((item) => {
              const inCart = cart.find((c) => c.menuItemId === item.id);
              return (
                <button key={item.id} onClick={() => addToCart(item)} className="bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-left active:scale-95 transition-all relative">
                  <div className="text-white text-sm font-medium leading-tight mb-1">{item.name}</div>
                  <div className="text-amber-400 text-sm font-bold">{formatCurrency(item.price)}</div>
                  {inCart && <div className="absolute top-2 right-2 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{inCart.quantity}</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="flex-1 overflow-y-auto p-4">
          {order?.rounds.length === 0 && <div className="text-center text-gray-500 py-12">ຍັງບໍ່ມີລາຍການ</div>}
          {order?.rounds.map((round) => (
            <div key={round.id} className="mb-4">
              <div className="text-xs text-gray-500 mb-2 font-semibold">ຮອບທີ {round.roundNumber}</div>
              {round.items.map((item) => (
                <div key={item.id} className={`flex items-center gap-3 py-2 border-b border-gray-800 ${item.status === "VOIDED" ? "opacity-50" : ""}`}>
                  <div className="flex-1">
                    <div className="text-white text-sm">{item.menuItem.name} ×{item.quantity}</div>
                    {item.notes && <div className="text-xs text-gray-400 flex items-center gap-1"><MessageSquare size={10} /> {item.notes}</div>}
                    {item.voidLog && <div className="text-xs text-red-400">ຍົກເລີກ: {item.voidLog.reason}</div>}
                  </div>
                  <div className="text-amber-400 text-sm">{formatCurrency(item.unitPrice * item.quantity)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                  {user?.role === "ADMIN" && item.status !== "VOIDED" && item.status !== "SERVED" && (
                    <button onClick={() => setVoidItem(item)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          ))}
          {activeItems.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 mt-4">
              <div className="flex justify-between text-white font-bold">
                <span>ລວມ</span>
                <span className="text-amber-400">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cart footer */}
      {tab === "menu" && cart.length > 0 && (
        <div className="bg-gray-900 border-t border-gray-800 p-4 flex-shrink-0">
          <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
            {cart.map((c) => (
              <div key={c.menuItemId} className="bg-gray-800 rounded-xl p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 text-sm text-white font-medium">{c.name}</div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(c.menuItemId, -1)} className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center"><Minus size={14} /></button>
                    <span className="w-6 text-center text-white text-sm font-bold">{c.quantity}</span>
                    <button onClick={() => updateQty(c.menuItemId, 1)} className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center"><Plus size={14} /></button>
                  </div>
                  <div className="text-amber-400 text-sm font-semibold w-20 text-right">{formatCurrency(c.price * c.quantity)}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={12} className="text-gray-500 flex-shrink-0" />
                  <input value={c.notes} onChange={(e) => setCart((prev) => prev.map((x) => x.menuItemId === c.menuItemId ? { ...x, notes: e.target.value } : x))} className="flex-1 bg-gray-700 border-0 rounded-lg px-2 py-1 text-xs text-gray-300 placeholder-gray-600 outline-none" placeholder="ໝາຍເຫດ (ເຊັ່ນ: ເຜັດໜ້ອຍ, ບໍ່ຮ້ອນ)" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-white font-bold">{formatCurrency(cartTotal)}</div>
            <button onClick={sendOrder} disabled={sending} className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50">
              <Send size={16} /> ສົ່ງ {order?.rounds.length ? `(ຮອບ ${(order.rounds.length || 0) + 1})` : "(ຮອບ 1)"}
            </button>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-1">ຍົກເລີກລາຍການ</h2>
            <p className="text-gray-400 text-sm mb-4">{voidItem.menuItem.name} ×{voidItem.quantity}</p>
            <textarea value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-4 text-sm h-20 resize-none" placeholder="ເຫດຜົນ..." />
            <div className="flex gap-3">
              <button onClick={() => { setVoidItem(null); setVoidReason(""); }} className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-xl py-3 text-white">ຍົກເລີກ</button>
              <button onClick={doVoid} disabled={!voidReason.trim()} className="flex-1 bg-red-700 hover:bg-red-600 rounded-xl py-3 text-white font-semibold disabled:opacity-50">ຢືນຢັນ</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferMode && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4">ຍ້າຍໂຕ໊ະ</h2>
            {allTables.length === 0 && <p className="text-gray-400 text-sm mb-4">ບໍ່ມີໂຕ໊ະວ່າງ</p>}
            <div className="grid grid-cols-3 gap-2 mb-4 max-h-60 overflow-y-auto">
              {allTables.map((t) => (
                <button key={t.id} onClick={() => doTransfer(t.id)} className="bg-green-900/40 border border-green-700 rounded-xl py-3 text-white text-sm font-semibold">{getTableLabel(t)}</button>
              ))}
            </div>
            <button onClick={() => setTransferMode(false)} className="w-full bg-gray-700 hover:bg-gray-600 rounded-xl py-3 text-white">ຍົກເລີກ</button>
          </div>
        </div>
      )}
    </div>
  );
}
