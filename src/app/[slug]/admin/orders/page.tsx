"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { formatCurrency, getTableLabel } from "@/lib/utils";

interface OrderItem { id: string; quantity: number; unitPrice: number; notes: string | null; status: string; menuItem: { name: string }; voidLog?: { reason: string } | null; }
interface OrderRound { id: string; roundNumber: number; items: OrderItem[]; }
interface Payment { method: string; subtotal: number; discountType: string; discountValue: number; serviceChargeAmount: number; total: number; cashReceived: number | null; changeAmount: number | null; paidAt: string; }
interface Order {
  id: string;
  status: string;
  guestCount: number;
  createdAt: string;
  table: { number: number | null; customName: string | null };
  creator: { name: string };
  payment: Payment | null;
  rounds: OrderRound[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PAID: { label: "ຊຳລະແລ້ວ", color: "text-green-400 bg-green-900/30" },
  OPEN: { label: "ເປີດຢູ່", color: "text-yellow-400 bg-yellow-900/30" },
  CHECKOUT_REQUESTED: { label: "ລໍຊຳລະ", color: "text-amber-400 bg-amber-900/30" },
  VOIDED: { label: "ຍົກເລີກ", color: "text-gray-400 bg-gray-800" },
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PAID");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    const res = await fetch(`/api/${slug}/admin/orders?status=${statusFilter}&page=${p}&limit=20`);
    if (res.status === 401) { router.push(`/${slug}/login`); return; }
    const data = await res.json();
    setOrders(data.orders || []);
    setTotal(data.total || 0);
    setPage(p);
    setLoading(false);
  }, [slug, statusFilter, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try { const u = JSON.parse(stored); if (u.role !== "ADMIN") { router.push(`/${slug}/tables`); return; } } catch { router.push(`/${slug}/login`); return; }
    load(1);
  }, [slug, load, router]);

  function getOrderTotal(order: Order) {
    if (order.payment) return order.payment.total;
    const items = order.rounds.flatMap((r) => r.items).filter((i) => i.status !== "VOIDED");
    return items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  }

  function getItemCount(order: Order) {
    return order.rounds.flatMap((r) => r.items).filter((i) => i.status !== "VOIDED").length;
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/${slug}/admin`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="font-bold text-white">ປະຫວັດບິນ</div>
          <div className="text-xs text-gray-400">{total} ລາຍການ</div>
        </div>
        <button onClick={() => load(1)} className="p-2 text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </header>

      {/* Status filter */}
      <div className="flex border-b border-gray-800 bg-gray-900">
        {Object.entries(STATUS_MAP).map(([key, { label }]) => (
          <button key={key} onClick={() => setStatusFilter(key)} className={`flex-1 py-3 text-xs font-semibold transition-all ${statusFilter === key ? "text-amber-400 border-b-2 border-amber-400" : "text-gray-500"}`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>
      ) : orders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">ບໍ່ມີລາຍການ</div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const orderTotal = getOrderTotal(order);
            const itemCount = getItemCount(order);
            return (
              <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {/* Header row */}
                <button onClick={() => setExpandedId(isExpanded ? null : order.id)} className="w-full p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-all">
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white">{getTableLabel(order.table)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_MAP[order.status]?.color}`}>{STATUS_MAP[order.status]?.label}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleString("lo-LA", { dateStyle: "short", timeStyle: "short" })} · {order.creator.name} · {order.guestCount} ຄົນ · {itemCount} ລາຍການ
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold">{formatCurrency(orderTotal)}</div>
                    {order.payment?.method && <div className="text-xs text-gray-500">{order.payment.method === "CASH" ? "ເງິນສົດ" : "QR"}</div>}
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-800 px-4 pb-4">
                    {order.rounds.map((round) => (
                      <div key={round.id} className="mt-3">
                        <div className="text-xs text-gray-600 font-semibold mb-1">ຮອບທີ {round.roundNumber}</div>
                        {round.items.map((item) => (
                          <div key={item.id} className={`flex justify-between items-start py-1 border-b border-gray-800/50 text-sm ${item.status === "VOIDED" ? "opacity-40 line-through" : ""}`}>
                            <div>
                              <span className="text-white">{item.menuItem.name}</span>
                              <span className="text-gray-500"> ×{item.quantity}</span>
                              {item.notes && <div className="text-xs text-gray-500 italic">{item.notes}</div>}
                              {item.voidLog && <div className="text-xs text-red-400">({item.voidLog.reason})</div>}
                            </div>
                            <span className="text-amber-400 ml-4">{formatCurrency(item.unitPrice * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {order.payment && (
                      <div className="mt-4 bg-gray-800 rounded-xl p-3 space-y-1">
                        <div className="flex justify-between text-sm text-gray-400"><span>ລວມ</span><span>{formatCurrency(order.payment.subtotal)}</span></div>
                        {order.payment.discountType !== "NONE" && order.payment.discountValue > 0 && (
                          <div className="flex justify-between text-sm text-red-400"><span>ສ່ວນຫຼຸດ</span><span>-{formatCurrency(order.payment.subtotal - order.payment.total + order.payment.serviceChargeAmount)}</span></div>
                        )}
                        {order.payment.serviceChargeAmount > 0 && <div className="flex justify-between text-sm text-gray-400"><span>Service charge</span><span>{formatCurrency(order.payment.serviceChargeAmount)}</span></div>}
                        <div className="flex justify-between font-bold text-white border-t border-gray-700 pt-1"><span>ທັງໝົດ</span><span className="text-amber-400">{formatCurrency(order.payment.total)}</span></div>
                        {order.payment.cashReceived && <div className="flex justify-between text-sm text-gray-400"><span>ຮັບ</span><span>{formatCurrency(order.payment.cashReceived)}</span></div>}
                        {order.payment.changeAmount != null && order.payment.changeAmount > 0 && <div className="flex justify-between text-sm text-green-400"><span>ທອນ</span><span>{formatCurrency(order.payment.changeAmount)}</span></div>}
                        <div className="text-xs text-gray-500 pt-1">ຊຳລະ: {new Date(order.payment.paidAt).toLocaleString("lo-LA", { dateStyle: "short", timeStyle: "short" })}</div>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setPrintOrder(order)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl transition-all">
                        <Receipt size={14} /> ພິມໃບບິນ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => load(page - 1)} disabled={page <= 1} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm disabled:opacity-40">ກ່ອນ</button>
              <span className="px-4 py-2 text-gray-400 text-sm">{page} / {totalPages}</span>
              <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm disabled:opacity-40">ຖັດໄປ</button>
            </div>
          )}
        </div>
      )}

      {/* Print receipt modal */}
      {printOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPrintOrder(null)}>
          <div className="bg-white text-gray-900 rounded-2xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="font-bold text-lg">ຮ້ານຄ້ວ້ານຄານ</div>
              <div className="text-sm text-gray-500">{getTableLabel(printOrder.table)} · {printOrder.guestCount} ຄົນ</div>
              <div className="text-xs text-gray-400">{new Date(printOrder.createdAt).toLocaleString("lo-LA", { dateStyle: "short", timeStyle: "short" })}</div>
            </div>
            <div className="border-t border-dashed border-gray-300 my-3" />
            {printOrder.rounds.flatMap((r) => r.items).filter((i) => i.status !== "VOIDED").map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-0.5">
                <span>{item.menuItem.name} ×{item.quantity}</span>
                <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-300 my-3" />
            {printOrder.payment && (
              <>
                <div className="flex justify-between text-sm"><span>ລວມ</span><span>{formatCurrency(printOrder.payment.subtotal)}</span></div>
                {printOrder.payment.serviceChargeAmount > 0 && <div className="flex justify-between text-sm"><span>Service</span><span>{formatCurrency(printOrder.payment.serviceChargeAmount)}</span></div>}
                <div className="flex justify-between font-bold text-base mt-1"><span>ທັງໝົດ</span><span>{formatCurrency(printOrder.payment.total)}</span></div>
                {printOrder.payment.cashReceived && <div className="flex justify-between text-sm text-gray-500"><span>ຮັບ</span><span>{formatCurrency(printOrder.payment.cashReceived)}</span></div>}
                {printOrder.payment.changeAmount != null && printOrder.payment.changeAmount > 0 && <div className="flex justify-between text-sm text-gray-500"><span>ທອນ</span><span>{formatCurrency(printOrder.payment.changeAmount)}</span></div>}
              </>
            )}
            <div className="border-t border-dashed border-gray-300 my-3" />
            <div className="text-center text-sm text-gray-400">ຂອບໃຈທີ່ໃຊ້ບໍລິການ</div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPrintOrder(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-xl py-2 text-sm">ປິດ</button>
              <button onClick={() => window.print()} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2 text-sm">ພິມ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
