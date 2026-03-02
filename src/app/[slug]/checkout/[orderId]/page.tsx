"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Banknote, QrCode } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CheckoutSummary { subtotal: number; serviceChargePercent: number; serviceChargeAmount: number; total: number; tableLabel: string; items: Array<{ id: string; menuItem: { name: string }; quantity: number; unitPrice: number; }>; }

export default function CheckoutPage() {
  const router = useRouter();
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<"CASH" | "QR">("CASH");
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENT" | "FIXED">("NONE");
  const [discountValue, setDiscountValue] = useState(0);
  const [cashReceived, setCashReceived] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [receiptData, setReceiptData] = useState<Record<string, unknown> | null>(null);

  const loadSummary = useCallback(async () => {
    const res = await fetch(`/api/${slug}/orders/${orderId}/checkout-summary`);
    if (!res.ok) { router.push(`/${slug}/tables`); return; }
    const data = await res.json();
    setSummary(data.summary);
    setLoading(false);
  }, [slug, orderId, router]);

  useEffect(() => {
    const stored = sessionStorage.getItem("pos_user");
    if (!stored) { router.push(`/${slug}/login`); return; }
    try {
      const u = JSON.parse(stored);
      if (u.role !== "ADMIN") { router.push(`/${slug}/tables`); return; }
    } catch { router.push(`/${slug}/login`); return; }
    loadSummary();
  }, [slug, orderId, loadSummary, router]);

  function calcDiscount() {
    if (!summary) return 0;
    if (discountType === "PERCENT") return Math.round(summary.subtotal * discountValue / 100);
    if (discountType === "FIXED") return discountValue;
    return 0;
  }

  function calcTotal() {
    if (!summary) return 0;
    return Math.max(0, summary.subtotal + summary.serviceChargeAmount - calcDiscount());
  }

  async function doPay() {
    if (!summary) return;
    const total = calcTotal();
    if (method === "CASH" && (!cashReceived || parseInt(cashReceived) < total)) {
      alert("ຍອດຮັບຕ່ຳກວ່າຍອດລວມ"); return;
    }
    setPaying(true);
    const res = await fetch(`/api/${slug}/orders/${orderId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, discountType, discountValue, cashReceived: method === "CASH" ? parseInt(cashReceived) : null }),
    });
    if (res.ok) {
      const data = await res.json();
      setPaid(true);
      setReceiptData(data.receiptData);
    } else {
      const d = await res.json();
      alert(d.error);
    }
    setPaying(false);
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">ກຳລັງໂຫລດ...</div>;

  if (paid && receiptData) {
    const rd = receiptData as { tableLabel: string; subtotal: number; serviceChargeAmount: number; discountAmount: number; total: number; method: string; cashReceived: number | null; changeAmount: number | null; };
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">✅</div>
            <div className="text-2xl font-bold text-green-400">ຊຳລະສຳເລັດ</div>
            <div className="text-gray-400 text-sm mt-1">{rd.tableLabel}</div>
          </div>
          <div className="space-y-2 text-sm border-t border-gray-700 pt-4">
            <div className="flex justify-between text-gray-300"><span>ລວມກ່ອນສ່ວນລຸດ</span><span>{formatCurrency(rd.subtotal)}</span></div>
            {rd.serviceChargeAmount > 0 && <div className="flex justify-between text-gray-300"><span>ຄ່າບໍລິການ</span><span>{formatCurrency(rd.serviceChargeAmount)}</span></div>}
            {rd.discountAmount > 0 && <div className="flex justify-between text-green-400"><span>ສ່ວນລຸດ</span><span>-{formatCurrency(rd.discountAmount as number)}</span></div>}
            <div className="flex justify-between text-white font-bold text-lg border-t border-gray-700 pt-2 mt-2"><span>ລວມທັງໝົດ</span><span className="text-amber-400">{formatCurrency(rd.total)}</span></div>
            {rd.method === "CASH" && rd.cashReceived && (
              <>
                <div className="flex justify-between text-gray-300"><span>ຮັບເງິນ</span><span>{formatCurrency(rd.cashReceived)}</span></div>
                <div className="flex justify-between text-green-400 font-semibold"><span>ທອນ</span><span>{formatCurrency(rd.changeAmount || 0)}</span></div>
              </>
            )}
          </div>
          <button onClick={() => router.push(`/${slug}/tables`)} className="w-full mt-6 bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-3 font-semibold">ກັບໄປໜ້າໂຕ໊ະ</button>
        </div>
      </div>
    );
  }

  const total = calcTotal();
  const discount = calcDiscount();
  const change = method === "CASH" && cashReceived ? parseInt(cashReceived) - total : 0;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`/${slug}/order/${orderId}`)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="font-bold text-white">ຊຳລະເງິນ</div>
          <div className="text-xs text-gray-400">{summary?.tableLabel}</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Items summary */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="text-sm text-gray-400 mb-3 font-semibold">ລາຍການ</div>
          {summary?.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-800">
              <span className="text-gray-300">{item.menuItem.name} ×{item.quantity}</span>
              <span className="text-white">{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between text-white font-semibold mt-3">
            <span>ລວມ</span><span>{formatCurrency(summary?.subtotal || 0)}</span>
          </div>
          {(summary?.serviceChargeAmount || 0) > 0 && (
            <div className="flex justify-between text-gray-300 text-sm mt-1">
              <span>ຄ່າບໍລິການ ({summary?.serviceChargePercent}%)</span>
              <span>{formatCurrency(summary?.serviceChargeAmount || 0)}</span>
            </div>
          )}
        </div>

        {/* Discount */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="text-sm text-gray-400 mb-3 font-semibold">ສ່ວນລຸດ</div>
          <div className="flex gap-2 mb-3">
            {(["NONE", "PERCENT", "FIXED"] as const).map((t) => (
              <button key={t} onClick={() => setDiscountType(t)} className={`flex-1 py-2 rounded-xl text-sm font-semibold ${discountType === t ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                {t === "NONE" ? "ບໍ່ມີ" : t === "PERCENT" ? "%" : "ກີບ"}
              </button>
            ))}
          </div>
          {discountType !== "NONE" && (
            <input type="number" value={discountValue || ""} onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white" placeholder={discountType === "PERCENT" ? "%" : "ກີບ"} />
          )}
          {discount > 0 && <div className="text-green-400 text-sm mt-2">ສ່ວນລຸດ: -{formatCurrency(discount)}</div>}
        </div>

        {/* Payment method */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="text-sm text-gray-400 mb-3 font-semibold">ວິທີຊຳລະ</div>
          <div className="flex gap-3 mb-4">
            <button onClick={() => setMethod("CASH")} className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 font-semibold ${method === "CASH" ? "bg-green-800 border-2 border-green-500 text-green-300" : "bg-gray-800 text-gray-400"}`}>
              <Banknote size={24} /> ເງິນສົດ
            </button>
            <button onClick={() => setMethod("QR")} className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 font-semibold ${method === "QR" ? "bg-blue-800 border-2 border-blue-500 text-blue-300" : "bg-gray-800 text-gray-400"}`}>
              <QrCode size={24} /> QR
            </button>
          </div>
          {method === "CASH" && (
            <div>
              <label className="text-sm text-gray-400 mb-2 block">ເງິນທີ່ຮັບ (ກີບ)</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[50000, 100000, 200000, 500000].map((amt) => (
                  <button key={amt} onClick={() => setCashReceived(String(amt))} className={`py-2.5 rounded-xl text-sm font-bold transition-all ${cashReceived === String(amt) ? "bg-amber-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{amt >= 1000 ? `${amt/1000}K` : amt}</button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[total, Math.ceil(total/50000)*50000, Math.ceil(total/100000)*100000].filter((v,i,a)=>v>0&&a.indexOf(v)===i&&v!==total||i===0).slice(0,3).map((amt, i) => (
                  <button key={i} onClick={() => setCashReceived(String(amt))} className={`py-2.5 rounded-xl text-xs font-bold transition-all ${cashReceived === String(amt) ? "bg-green-700 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>{i===0?"ຈຳນວນ":formatCurrency(amt)}</button>
                ))}
              </div>
              <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-lg" placeholder="ໃສ່ຈຳນວນ..." />
              {cashReceived && change >= 0 && <div className="text-green-400 font-bold text-lg mt-2">ທອນ: {formatCurrency(change)}</div>}
              {cashReceived && change < 0 && <div className="text-red-400 text-sm mt-2">ເງິນບໍ່ພຽງພໍ</div>}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="bg-amber-900/30 border border-amber-700 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-white text-lg font-bold">ລວມທັງໝົດ</span>
            <span className="text-amber-400 text-2xl font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <button onClick={doPay} disabled={paying || (method === "CASH" && (!cashReceived || parseInt(cashReceived) < total))} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-2xl py-4 text-lg font-bold disabled:opacity-50">
          {paying ? "ກຳລັງຊຳລະ..." : `ຢືນຢັນຊຳລະ ${formatCurrency(total)}`}
        </button>
      </div>
    </div>
  );
}
